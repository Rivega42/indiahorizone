import { randomUUID } from 'node:crypto';

import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';

import { IdempotencyService } from './idempotency.service';
import {
  type DomainEvent,
  type EventHandler,
  STREAM_DEFAULT,
  STREAM_SOS_PRIORITY,
  type SubscribeOptions,
  streamForEventType,
} from './types';
import { RedisService } from '../redis/redis.service';

/**
 * EventsBusService — обёртка над Redis Streams для domain events.
 *
 * Соответствует docs/ARCH/EVENTS.md.
 *
 * Принципы:
 * - publish() — добавляет событие в stream (XADD). Используется из outbox-relay (#119),
 *   а не напрямую из бизнес-логики.
 * - subscribe() — регистрирует обработчик. Запускает background-loop (XREADGROUP).
 *   Idempotency на стороне subscriber'а — через processed_events таблицу (#120).
 *
 * Не реализовано в этом slice (придёт позже):
 * - DLQ для failed events (#119/#120 расширения)
 * - Retry policy beyond Redis defaults
 * - Event replay из offset
 *
 * SOS-events идут в отдельный stream events.sos.priority — гарантия SLA.
 */
@Injectable()
export class EventsBusService implements OnModuleDestroy {
  private readonly logger = new Logger(EventsBusService.name);
  private readonly subscriptions = new Set<{ stop: () => void }>();

  constructor(
    private readonly redis: RedisService,
    private readonly idempotency: IdempotencyService,
  ) {}

  onModuleDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.stop();
    }
    this.subscriptions.clear();
  }

  /**
   * Опубликовать событие.
   *
   * Envelope id и occurredAt генерируются здесь, если не переданы. Однако
   * для outbox-pattern (#119) рекомендуется пердавать заранее сгенерированный
   * id (UUIDv4) на этапе записи в outbox — чтобы re-publish был идемпотентен.
   */
  async publish<T>(
    event: Omit<DomainEvent<T>, 'id' | 'occurredAt'> & {
      id?: string;
      occurredAt?: string;
    },
  ): Promise<string> {
    const fullEvent: DomainEvent<T> = {
      id: event.id ?? randomUUID(),
      occurredAt: event.occurredAt ?? new Date().toISOString(),
      type: event.type,
      schemaVersion: event.schemaVersion,
      correlationId: event.correlationId,
      causationId: event.causationId,
      actor: event.actor,
      payload: event.payload,
    };

    const stream = streamForEventType(fullEvent.type);
    const fields = ['data', JSON.stringify(fullEvent)];

    const messageId = await this.redis.getClient().xadd(stream, '*', ...fields);

    this.logger.debug(
      { eventId: fullEvent.id, type: fullEvent.type, stream, messageId },
      'event.published',
    );

    return messageId ?? '';
  }

  /**
   * Подписаться на события определённого типа.
   *
   * Запускает background-loop с XREADGROUP. Возвращает функцию остановки.
   *
   * Idempotency обеспечивается **на стороне handler'а** — через
   * processed_events таблицу (см. issue #120). Этот метод гарантирует
   * at-least-once доставку.
   */
  subscribe<T>(
    eventType: string,
    handler: EventHandler<T>,
    options: SubscribeOptions,
  ): { stop: () => void } {
    const stream = streamForEventType(eventType);
    const blockMs = options.blockMs ?? 5000;
    const count = options.count ?? 10;

    let active = true;

    void this.ensureGroup(stream, options.consumerGroup);

    void (async () => {
      this.logger.log(
        { stream, group: options.consumerGroup, consumer: options.consumerName, eventType },
        'subscribe.start',
      );

      while (active) {
        try {
          const result = (await this.redis
            .getSubscriber()

            .xreadgroup(
              'GROUP',
              options.consumerGroup,
              options.consumerName,
              'COUNT',
              count,
              'BLOCK',
              blockMs,
              'STREAMS',
              stream,
              '>',
            )) as [string, [string, string[]][]][] | null;

          if (!result) {
            continue;
          }

          for (const [, messages] of result) {
            for (const [messageId, fields] of messages) {
              await this.handleMessage(
                stream,
                options.consumerGroup,
                messageId,
                fields,
                eventType,
                handler,
              );
            }
          }
        } catch (error) {
          this.logger.error({ err: error, stream }, 'subscribe.loop.error');
          // Тонкая задержка перед повтором, чтобы не спамить логи при rolling Redis
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    })();

    const sub = {
      stop: (): void => {
        active = false;
        this.subscriptions.delete(sub);
      },
    };

    this.subscriptions.add(sub);
    return sub;
  }

  /**
   * Создаёт consumer group в stream'е, если её ещё нет.
   * MKSTREAM создаёт сам stream при отсутствии.
   */
  private async ensureGroup(stream: string, group: string): Promise<void> {
    try {
      await this.redis.getClient().xgroup('CREATE', stream, group, '0', 'MKSTREAM');
      this.logger.log({ stream, group }, 'consumer-group.created');
    } catch (error) {
      // BUSYGROUP — группа уже существует, это ок
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('BUSYGROUP')) {
        this.logger.warn({ err: error, stream, group }, 'consumer-group.create.failed');
      }
    }
  }

  private async handleMessage<T>(
    stream: string,
    group: string,
    messageId: string,
    fields: string[],
    eventType: string,
    handler: EventHandler<T>,
  ): Promise<void> {
    // fields формата ['data', '<json>']
    const dataIndex = fields.indexOf('data');
    if (dataIndex < 0 || !fields[dataIndex + 1]) {
      this.logger.warn({ messageId }, 'event.malformed');
      await this.redis.getClient().xack(stream, group, messageId);
      return;
    }

    const raw = fields[dataIndex + 1]!;
    let event: DomainEvent<T>;
    try {
      event = JSON.parse(raw) as DomainEvent<T>;
    } catch (error) {
      this.logger.error({ err: error, messageId }, 'event.parse.failed');
      await this.redis.getClient().xack(stream, group, messageId);
      return;
    }

    // Filter — обрабатываем только запрошенный тип (или wildcard '*')
    if (eventType !== '*' && event.type !== eventType) {
      // Не наш тип — ack и идём дальше. Без ack будет копиться pending.
      await this.redis.getClient().xack(stream, group, messageId);
      return;
    }

    // Idempotency-check: если consumer уже обработал это event.id — пропускаем,
    // только ack'аем (чтобы убрать из pending). Защита от at-least-once duplicates.
    if (await this.idempotency.isProcessed(event.id, group)) {
      await this.redis.getClient().xack(stream, group, messageId);
      this.logger.debug(
        { eventId: event.id, type: event.type, group },
        'event.skipped.already-processed',
      );
      return;
    }

    try {
      await handler(event);
      await this.idempotency.markProcessed(event.id, group);
      await this.redis.getClient().xack(stream, group, messageId);
      this.logger.debug({ eventId: event.id, type: event.type, group }, 'event.handled');
    } catch (error) {
      this.logger.error(
        { err: error, eventId: event.id, type: event.type, group },
        'event.handler.failed',
      );
      // Не ack'аем — событие останется в pending list, будет переобработано.
      // markProcessed НЕ вызываем — иначе при retry handler пропустится с ошибкой ниже.
    }
  }

  /**
   * Доступные streams (для observability и admin).
   */
  static getStreams(): readonly string[] {
    return [STREAM_DEFAULT, STREAM_SOS_PRIORITY] as const;
  }
}
