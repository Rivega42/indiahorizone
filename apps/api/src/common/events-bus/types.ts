/**
 * Domain Event envelope.
 * Соответствует docs/ARCH/EVENTS.md § Формат события.
 */

export type EventActorType = 'user' | 'system' | 'gateway';

export interface EventActor {
  type: EventActorType;
  id?: string;
  role?: string;
}

export interface DomainEvent<TPayload = unknown> {
  /** UUID v4, генерируется при публикации. Используется для идемпотентности. */
  id: string;

  /** Тип в формате `<service>.<entity>.<verb>`, например `auth.user.registered`. */
  type: string;

  /** Версия схемы payload. Старт с 1, инкрементировать при breaking change. */
  schemaVersion: number;

  /** ISO 8601 UTC. */
  occurredAt: string;

  /** Для трейсинга через цепочку запросов. */
  correlationId?: string;

  /** ID события, которое его вызвало. */
  causationId?: string;

  actor: EventActor;

  payload: TPayload;
}

export type EventHandler<TPayload = unknown> = (event: DomainEvent<TPayload>) => Promise<void>;

/**
 * Опции для подписки на события.
 */
export interface SubscribeOptions {
  /** Имя consumer group в Redis Streams. Один consumer-group = один subscriber. */
  consumerGroup: string;

  /** Имя consumer внутри группы. Если несколько инстансов api — у каждого свой. */
  consumerName: string;

  /** Как часто читать из stream (block, мс). По умолчанию 5000. */
  blockMs?: number;

  /** Сколько событий за один read. По умолчанию 10. */
  count?: number;
}

/**
 * Имя Redis-stream'а для категорий событий.
 * SOS идёт в отдельный stream events.sos.priority — гарантия SLA реакции.
 * Все остальные события — в events.default.
 */
export const STREAM_DEFAULT = 'events.default';
export const STREAM_SOS_PRIORITY = 'events.sos.priority';

export function streamForEventType(eventType: string): string {
  return eventType.startsWith('sos.') ? STREAM_SOS_PRIORITY : STREAM_DEFAULT;
}
