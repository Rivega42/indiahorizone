/**
 * Telegram Bot API client — отправка нотификации о новом lead'е в чат
 * Roman/Шивам.
 *
 * Конфиг: TELEGRAM_BOT_TOKEN + TELEGRAM_LEADS_CHAT_ID в .env.
 * Если не заданы — сервис логирует warning и не падает (lead всё равно
 * сохраняется в БД).
 *
 * Issue: #297 [12.4]
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface NotifyLeadPayload {
  source: string;
  name: string; // plaintext (после расшифровки в LeadsService)
  contactType: string;
  contact: string; // plaintext
  comment?: string | null;
  ipHashShort?: string; // короткий sha256-prefix для тех. идентификации
  createdAtIso: string;
}

@Injectable()
export class TelegramClient {
  private readonly logger = new Logger(TelegramClient.name);
  private readonly botToken: string | undefined;
  private readonly chatId: string | undefined;

  constructor(config: ConfigService) {
    this.botToken = config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = config.get<string>('TELEGRAM_LEADS_CHAT_ID');

    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN или TELEGRAM_LEADS_CHAT_ID не заданы — нотификации Lead'ов отключены. " +
          "Lead'ы продолжают сохраняться в БД.",
      );
    }
  }

  /**
   * Отправляет нотификацию о новом lead'е. НЕ блокирует caller'а на ошибках —
   * лог + return. Lead уже в БД, нотификация — bonus, не критично.
   */
  async notifyNewLead(payload: NotifyLeadPayload): Promise<void> {
    if (!this.botToken || !this.chatId) return;

    const text = this.formatMessage(payload);

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error({ status: res.status, body }, 'telegram.sendMessage failed');
      }
    } catch (err) {
      this.logger.error({ err }, 'telegram.sendMessage error');
    }
  }

  private formatMessage(p: NotifyLeadPayload): string {
    const escape = (s: string): string =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const lines = [
      `🆕 <b>Новая заявка</b>`,
      ``,
      `📌 Источник: <code>${escape(p.source)}</code>`,
      `👤 Имя: <b>${escape(p.name)}</b>`,
      `📞 ${escape(p.contactType)}: <code>${escape(p.contact)}</code>`,
    ];

    if (p.comment != null && p.comment.trim().length > 0) {
      lines.push(`💬 Комментарий: ${escape(p.comment)}`);
    }

    lines.push(``);
    lines.push(`🕐 ${escape(p.createdAtIso)}`);
    if (p.ipHashShort != null) {
      lines.push(`🔍 ip-hash: <code>${escape(p.ipHashShort)}</code>`);
    }

    return lines.join('\n');
  }
}
