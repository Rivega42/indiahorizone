/**
 * CommModule — comm-svc base + email (#162).
 *
 * Provides:
 * - NotifyService — единая точка отправки нотификаций
 * - TemplateService — Handlebars-рендер шаблонов
 * - EmailProvider — switchable: SmtpEmailProvider если SMTP_HOST задан,
 *   LogEmailProvider иначе (dev fallback)
 *
 * Listeners:
 * - WelcomeEmailListener — auth.user.registered → welcome email
 *   (см. welcome.listener.ts; через subscribe в onModuleInit)
 *
 * Будущее (отдельные issues):
 * - #163 push (FCM/APNs)
 * - #164 SMS (Twilio + российский провайдер)
 * - #165 Telegram bot
 * - #166 notification preferences
 * - #134 password reset (использует NotifyService)
 * - #136 suspicious-session alert (использует NotifyService)
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotifyService } from './notify.service';
import { EMAIL_PROVIDER, type EmailProvider } from './providers/email.provider';
import { LogEmailProvider } from './providers/log-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { TemplateService } from './template.service';
import { WelcomeEmailListener } from './listeners/welcome.listener';
import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, EventsBusModule, ConfigModule],
  providers: [
    NotifyService,
    TemplateService,
    LogEmailProvider,
    SmtpEmailProvider,
    {
      // Switchable provider: SMTP в проде если SMTP_HOST задан, иначе log-stub.
      // Это позволяет dev-окружениям без SMTP-credentials всё равно проходить
      // тесты и smoke-проверки (NotifyService.send() работает, просто пишет в логи).
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, SmtpEmailProvider, LogEmailProvider],
      useFactory: (
        config: ConfigService,
        smtp: SmtpEmailProvider,
        log: LogEmailProvider,
      ): EmailProvider => {
        const host = config.get<string>('SMTP_HOST');
        return host ? smtp : log;
      },
    },
    WelcomeEmailListener,
  ],
  exports: [NotifyService],
})
export class CommModule {}
