/**
 * EmailProvider — общий интерфейс для всех email-транспортов (#162).
 *
 * Реализации:
 * - LogEmailProvider — dev/test stub. Логирует и возвращает success.
 * - SmtpEmailProvider — production. nodemailer с SMTP relay (Yandex/Mailgun/etc.)
 *
 * Выбор реализации в comm.module.ts по env (SMTP_HOST задан → smtp; иначе log).
 *
 * DKIM: при использовании SMTP relay (Mailgun, Postmark, Yandex.Mail Business)
 * подпись DKIM делается на их стороне — доменная аутентификация настраивается
 * через DNS-записи провайдера. Inline DKIM (через приватный ключ в env) можно
 * добавить позже опцией `dkim` у nodemailer.createTransport — но для V1
 * relay-side подпись проще и надёжнее.
 */

export interface EmailMessage {
  to: string;
  /** Subject отрендеренный из шаблона. */
  subject: string;
  /** HTML-body. Plain-text fallback генерируется автоматом из HTML. */
  html: string;
}

export interface EmailSendResult {
  /** ID сообщения от провайдера (для трейсинга в логах SMTP relay). */
  messageId: string;
}

export const EMAIL_PROVIDER = Symbol('EmailProvider');

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
