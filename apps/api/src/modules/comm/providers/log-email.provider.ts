/**
 * LogEmailProvider — dev/test stub email-провайдера (#162).
 *
 * Не отправляет email-ы реально. Только логирует subject + recipient + первые
 * 200 символов HTML. Используется когда SMTP_HOST не задан в env (типично dev
 * без credentials и CI-тесты).
 *
 * Возвращает синтетический messageId с timestamp'ом, чтобы caller имел
 * стабильный ID в логах.
 */
import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import {
  type EmailMessage,
  type EmailProvider,
  type EmailSendResult,
} from './email.provider';

@Injectable()
export class LogEmailProvider implements EmailProvider {
  private readonly logger = new Logger(LogEmailProvider.name);

  send(message: EmailMessage): Promise<EmailSendResult> {
    const messageId = `log-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const preview = message.html.slice(0, 200).replace(/\s+/g, ' ');
    this.logger.log(
      {
        to: message.to,
        subject: message.subject,
        htmlPreview: preview,
        messageId,
      },
      'email.send.stub',
    );
    return Promise.resolve({ messageId });
  }
}
