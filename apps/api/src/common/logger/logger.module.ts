/**
 * LoggerModule — JSON-структурированный pino-логгер с correlation-id (#124).
 *
 * Замещает default NestJS Logger (console.log-style). Все логи — JSON в stdout,
 * собираются Docker → Grafana Loki / ELK / Cloudwatch (любой stdout-aggregator).
 *
 * Correlation-id:
 * - Middleware читает заголовок X-Correlation-Id
 * - Если нет — генерирует UUIDv4
 * - Прокидывает в `req.id`, который nestjs-pino автоматически добавляет в каждый log-line
 * - При ответе клиенту шлём header X-Correlation-Id обратно (для трейсинга на стороне frontend)
 *
 * PII redact:
 * - password, passwordHash, token, refreshToken, secret, twoFaSecret, codeHash
 * - Authorization header (содержит JWT)
 * - body клиента в request log (может содержать ПДн / 152-ФЗ-чувствительные поля)
 *
 * Pretty-print в DEV, JSON в PROD:
 * - NODE_ENV=production → чистый JSON в stdout (machine-parseable)
 * - иначе → pino-pretty (читаемые цвета в локальной разработке)
 */
import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import type { IncomingMessage, ServerResponse } from 'node:http';

const CORRELATION_HEADER = 'x-correlation-id';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            // genReqId — извлекаем X-Correlation-Id или генерируем UUIDv4.
            // pino-http добавит этот id в каждый log-line запроса как `req.id`.
            genReqId: (req: IncomingMessage, res: ServerResponse): string => {
              const incoming = req.headers[CORRELATION_HEADER];
              const id =
                typeof incoming === 'string' && incoming.length > 0 && incoming.length < 200
                  ? incoming
                  : randomUUID();
              // Возвращаем header клиенту для трейсинга на frontend
              res.setHeader('X-Correlation-Id', id);
              return id;
            },

            // Redact — вырезаем чувствительные поля ПЕРЕД сериализацией.
            // Поддерживается dot-path синтаксис.
            redact: {
              paths: [
                // Auth-related
                '*.password',
                '*.passwordHash',
                '*.password_hash',
                '*.token',
                '*.refreshToken',
                '*.refresh_token',
                '*.refreshTokenHash',
                '*.accessToken',
                '*.access_token',
                '*.secret',
                '*.twoFaSecret',
                '*.two_fa_secret',
                '*.codeHash',
                '*.code_hash',
                '*.tokenHash',
                '*.token_hash',
                // PII fields (ClientProfile encrypted, но обычно лог
                // не должен видеть raw — на всякий случай redact)
                '*.firstName',
                '*.lastName',
                '*.first_name',
                '*.last_name',
                '*.passport',
                '*.dateOfBirth',
                '*.date_of_birth',
                '*.phone',
                // HTTP headers
                'req.headers.authorization',
                'req.headers["authorization"]',
                'req.headers.cookie',
                // Request body — может содержать ПДн / пароли
                'req.body',
                'req.body.*',
                // Response body слишком большая — не log'аем тело
                'res.body',
              ],
              censor: '[REDACTED]',
              remove: false,
            },

            // Pretty в dev, JSON в prod
            ...(isProd
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      colorize: true,
                      translateTime: 'HH:MM:ss.l',
                      ignore: 'pid,hostname',
                    },
                  },
                }),

            // Стандартные поля
            base: {
              service: 'api',
              env: config.get<string>('NODE_ENV', 'development'),
            },

            // Custom serializer для request — компактный, без шума
            serializers: {
              req(req: IncomingMessage & { url?: string; method?: string }) {
                return {
                  id: (req as unknown as { id?: string }).id,
                  method: req.method,
                  url: req.url,
                  remoteAddress: (req as unknown as { remoteAddress?: string })
                    .remoteAddress,
                };
              },
              res(res: ServerResponse & { statusCode?: number }) {
                return { statusCode: res.statusCode };
              },
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
