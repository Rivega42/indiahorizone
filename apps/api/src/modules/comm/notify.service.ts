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

import {
  EMAIL_PROVIDER,
  type EmailProvider,
} from './providers/email.provider';
import { TemplateService } from './template.service';
import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { NotificationChannel } from '@prisma/client';

export interface SendInput {
  channel: NotificationChannel;
  to: string;
  templateId: string;
  data: Record<string, unknown>;
  /** Опционально: связать notification с user'ом (transactional context) */
  userId?: string;
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly templates: TemplateService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
  ) {}

  async send(input: SendInput): Promise<{ notificationId: string }> {
    if (input.channel !== 'email') {
      throw new NotFoundException(
        `Channel "${input.channel}" пока не реализован (#163/#164/#165)`,
      );
    }
    if (!this.templates.exists(input.templateId)) {
      throw new NotFoundException(`Template "${input.templateId}" не найден`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        channel: input.channel,
        recipient: input.to,
        templateId: input.templateId,
        payload: input.data as object,
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
}
