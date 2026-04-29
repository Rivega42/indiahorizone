/**
 * NotifyService — единая точка отправки нотификаций (#162).
 *
 * Поток:
 * 1. Создаём Notification record (status=pending).
 * 2. Render template (subject + body) через TemplateService.
 * 3. Provider.send() — для email = SmtpEmailProvider или LogEmailProvider.
 * 4. Update status (sent/failed) + outbox event:
 *    - comm.message.sent — успешная отправка
 *    - comm.message.failed — permanent fail (не для retry, а для алертов)
 *
 * Failure handling:
 * - throw на ошибке провайдера → caller (например auth-listener) увидит
 *   не-критичный fail в логах. Email-fail не должен ломать business-flow
 *   (например, register прошёл — даже если welcome email не ушёл).
 * - Retry mechanism — НЕ в этом V1. Будущее: scheduled-job для pending
 *   старше 5 минут с exponential backoff.
 *
 * V1 ограничения:
 * - Только email channel поддерживается. Push/SMS/Telegram — в #163/#164/#165.
 * - Templates только email/welcome. Расширяется добавлением директорий.
 */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { NotificationPreferencesService } from './preferences/preferences.service';
import { EMAIL_PROVIDER, type EmailProvider } from './providers/email.provider';
import { PushService } from './push/push.service';
import { TemplateService } from './template.service';
import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { NotificationCategory, NotificationChannel, Prisma } from '@prisma/client';

export interface SendInput {
  channel: NotificationChannel;
  to: string;
  templateId: string;
  data: Record<string, unknown>;
  /** Опционально: связать notification с user'ом (transactional context) */
  userId?: string;
  /**
   * Категория для проверки user.preferences.channels[email]. SOS обходит
   * проверку (protected). Если не задан — preferences не проверяются (legacy).
   *
   * Welcome / password-reset / suspicious-login — это `system` (нельзя отключить).
   * Marketing email — `marketing` (152-ФЗ ст. 18: opt-in, по умолчанию выключен).
   */
  category?: NotificationCategory;
}

/**
 * Push payload — короткое уведомление в браузер/устройство.
 *
 * `title` + `body` — отображается в нотификации.
 * `url` — куда вести при клике (default '/').
 * `tag` — для группировки (один tag → одна notification, не стек). Удобно для
 * сценариев типа «обновился статус trip» — каждый trip имеет свой tag, новая
 * push заменяет старую вместо стека.
 *
 * `category` — для проверки user.preferences.channels[push]. SOS обходит
 * проверку (protected). Если не задан — preferences не проверяются (only для
 * legacy callers; новые callers ОБЯЗАНЫ указывать category).
 *
 * `urgency` — `'normal'` (default) | `'high'` для action-required SOS.
 */
export interface SendPushInput {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  category?: NotificationCategory;
  urgency?: 'normal' | 'high';
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly templates: TemplateService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
    private readonly push: PushService,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  async send(input: SendInput): Promise<{ notificationId: string; skipped?: boolean }> {
    if (input.channel !== 'email') {
      throw new NotFoundException(
        `Channel "${input.channel}" в .send() не поддерживается. Для push используйте .sendPush(); для sms/telegram — отдельные методы (#164/#165)`,
      );
    }
    if (!this.templates.exists(input.templateId)) {
      throw new NotFoundException(`Template "${input.templateId}" не найден`);
    }

    // Preferences check (#166): respect user.preferences.channels[email] для category.
    // SOS — protected. Если category не задан или userId не задан — preferences
    // не проверяются (legacy callers / sender to non-user email).
    if (input.userId !== undefined && input.category !== undefined) {
      const allowed = await this.preferences.shouldNotify(input.userId, input.category, 'email');
      if (!allowed) {
        this.logger.log(
          { userId: input.userId, category: input.category, templateId: input.templateId },
          'comm.email.skipped.preferences',
        );
        // Создаём Notification record для трассировки.
        const skipped = await this.prisma.notification.create({
          data: {
            channel: input.channel,
            recipient: input.to,
            templateId: input.templateId,
            payload: input.data as Prisma.InputJsonValue,
            status: 'failed',
            failedAt: new Date(),
            errorMessage: `blocked by user preferences (category=${input.category})`,
            userId: input.userId,
          },
          select: { id: true },
        });
        return { notificationId: skipped.id, skipped: true };
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        channel: input.channel,
        recipient: input.to,
        templateId: input.templateId,
        payload: input.data as Prisma.InputJsonValue,
        status: 'pending',
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
      },
      select: { id: true },
    });

    const rendered = this.templates.render(input.templateId, input.data);

    try {
      const result = await this.emailProvider.send({
        to: input.to,
        subject: rendered.subject,
        html: rendered.body,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.notification.update({
          where: { id: notification.id },
          data: { status: 'sent', sentAt: new Date() },
        });

        await this.outbox.add(tx, {
          type: 'comm.message.sent',
          schemaVersion: 1,
          actor: { type: 'system' },
          payload: {
            notificationId: notification.id,
            channel: input.channel,
            templateId: input.templateId,
            // recipient НЕ публикуем — может быть ПДн (email/phone)
            providerMessageId: result.messageId,
            ...(input.userId !== undefined ? { userId: input.userId } : {}),
          },
        });
      });

      this.logger.log(
        { notificationId: notification.id, templateId: input.templateId },
        'comm.message.sent',
      );
      return { notificationId: notification.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await this.prisma.$transaction(async (tx) => {
        await tx.notification.update({
          where: { id: notification.id },
          data: { status: 'failed', failedAt: new Date(), errorMessage },
        });

        await this.outbox.add(tx, {
          type: 'comm.message.failed',
          schemaVersion: 1,
          actor: { type: 'system' },
          payload: {
            notificationId: notification.id,
            channel: input.channel,
            templateId: input.templateId,
            errorMessage,
            ...(input.userId !== undefined ? { userId: input.userId } : {}),
          },
        });
      });

      this.logger.error(
        { err, notificationId: notification.id, templateId: input.templateId },
        'comm.message.failed',
      );
      // Re-throw чтобы caller знал. Но: caller (например auth-listener)
      // должен ОБРАБОТАТЬ ошибку и не падать — email-fail не критичен для
      // основного business flow.
      throw err;
    }
  }

  /**
   * Отправить push на ВСЕ активные устройства user'а.
   *
   * Создаёт ОДНУ Notification запись (агрегат "интент уведомить"), независимо
   * от того сколько device-subscription'ов было затронуто. Детализация
   * delivery/expired счётчиков — в логах PushService.sendToUser + outbox-event
   * comm.message.sent.
   *
   * Returns sent/failed/expired counters — caller может решить что делать
   * (например, если sent=0 → ескалировать через email).
   *
   * Best-effort: не throw'ит на отдельных device failures. Throw только при
   * полном сбое DB (не должен возникать).
   */
  async sendPush(input: SendPushInput): Promise<{
    notificationId: string;
    sent: number;
    failed: number;
    expired: number;
    skipped: boolean;
  }> {
    // Preferences check (#166): respect user.preferences.channels.push для категории.
    // SOS — protected, всегда true. Для legacy callers без category — пропускаем
    // проверку (skipped=false по дефолту, push идёт).
    if (input.category) {
      const allowed = await this.preferences.shouldNotify(input.userId, input.category, 'push');
      if (!allowed) {
        this.logger.log(
          { userId: input.userId, category: input.category },
          'comm.push.skipped.preferences',
        );
        // Создаём Notification для трассировки, но в статусе 'failed' с явным reason.
        // Это даёт founder'ам аналитику «сколько отправок blocked'нуто preferences».
        const skipped = await this.prisma.notification.create({
          data: {
            channel: 'push',
            recipient: input.userId,
            templateId: 'push:inline',
            payload: {
              title: input.title,
              body: input.body,
              ...(input.url !== undefined ? { url: input.url } : {}),
              ...(input.tag !== undefined ? { tag: input.tag } : {}),
            },
            status: 'failed',
            failedAt: new Date(),
            errorMessage: `blocked by user preferences (category=${input.category})`,
            userId: input.userId,
          },
          select: { id: true },
        });
        return { notificationId: skipped.id, sent: 0, failed: 0, expired: 0, skipped: true };
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        channel: 'push',
        // recipient у push — это userId (не email/phone). Для аналитики достаточно.
        recipient: input.userId,
        templateId: 'push:inline', // нет template-системы для push в V1 — title/body передаются inline
        payload: {
          title: input.title,
          body: input.body,
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.tag !== undefined ? { tag: input.tag } : {}),
        },
        status: 'pending',
        userId: input.userId,
      },
      select: { id: true },
    });

    const result = await this.push.sendToUser(input.userId, {
      title: input.title,
      body: input.body,
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.tag !== undefined ? { tag: input.tag } : {}),
      ...(input.urgency !== undefined ? { urgency: input.urgency } : {}),
    });

    // Status: sent если хоть один device получил, failed если все провалились
    // (вкл. expired). pending → для случая sent=0+failed=0+expired=0 (нет subs).
    const finalStatus =
      result.sent > 0 ? 'sent' : result.failed + result.expired > 0 ? 'failed' : 'pending';

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.update({
        where: { id: notification.id },
        data: {
          status: finalStatus,
          ...(finalStatus === 'sent' ? { sentAt: new Date() } : {}),
          ...(finalStatus === 'failed' ? { failedAt: new Date() } : {}),
        },
      });

      if (finalStatus === 'sent') {
        await this.outbox.add(tx, {
          type: 'comm.message.sent',
          schemaVersion: 1,
          actor: { type: 'system' },
          payload: {
            notificationId: notification.id,
            channel: 'push',
            templateId: 'push:inline',
            // recipient НЕ публикуем (privacy)
            providerMessageId: `push:${result.sent}/${result.sent + result.failed + result.expired}`,
            userId: input.userId,
          },
        });
      } else if (finalStatus === 'failed') {
        await this.outbox.add(tx, {
          type: 'comm.message.failed',
          schemaVersion: 1,
          actor: { type: 'system' },
          payload: {
            notificationId: notification.id,
            channel: 'push',
            templateId: 'push:inline',
            errorMessage: `failed=${result.failed}, expired=${result.expired}`,
            userId: input.userId,
          },
        });
      }
    });

    this.logger.log(
      { notificationId: notification.id, userId: input.userId, ...result, status: finalStatus },
      finalStatus === 'sent' ? 'comm.push.sent' : 'comm.push.no-devices-or-failed',
    );

    return { notificationId: notification.id, ...result, skipped: false };
  }
}
