/**
 * SmtpEmailProvider — production email через SMTP relay (#162).
 *
 * Использует nodemailer с настройками из env:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
 *   EMAIL_FROM (например 'IndiaHorizone <noreply@indiahorizone.ru>')
 *
 * Рекомендуемые SMTP-relays для русскоязычной аудитории:
 * - Yandex 360 для бизнеса (smtp.yandex.ru:465 SSL) — лучшая deliverability в RU
 * - Mailgun (smtp.mailgun.org:587 STARTTLS)
 * - Postmark (smtp.postmarkapp.com:587)
 *
 * DKIM: настраивается на стороне SMTP-relay через DNS-записи (CNAME / TXT)
 * домена indiahorizone.ru. Inline DKIM (через ключ в env) можно добавить
 * параметром `dkim:` у createTransport если потребуется в будущем.
 *
 * Pool: nodemailer создаёт connection pool при `pool: true` — несколько
 * email-ов через одно SMTP-соединение, быстрее.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Transporter, createTransport } from 'nodemailer';

import {
  type EmailMessage,
  type EmailProvider,
  type EmailSendResult,
} from './email.provider';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (!host) {
      // Defensive: должен использоваться LogEmailProvider если SMTP_HOST не задан.
      // comm.module.ts выбирает реализацию — сюда не должны попасть без host.
      throw new Error('SMTP_HOST не задан — провайдер не должен инициализироваться');
    }

    const port = Number(config.get<string>('SMTP_PORT', '587'));
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');

    this.transporter = createTransport({
      host,
      port,
      // 465 = implicit TLS, 587/25 = STARTTLS upgrade.
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.fromAddress = config.get<string>(
      'EMAIL_FROM',
      'IndiaHorizone <noreply@indiahorizone.ru>',
    );

    this.logger.log({ host, port, from: this.fromAddress }, 'smtp.transport.created');
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to: message.to,
      subject: message.subject,
      html: message.html,
      // Plain-text fallback генерируется nodemailer'ом из html, если не указан.
      // Лучше так чем без plain-text (anti-spam системы понижают рейтинг).
    });

    return { messageId: info.messageId };
  }
}
