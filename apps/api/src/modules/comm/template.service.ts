/**
 * TemplateService — Handlebars-рендер шаблонов писем (#162).
 *
 * Шаблоны лежат в apps/api/src/modules/comm/templates/<id>/{subject,body}.hbs.
 * При onModuleInit пред-компилируются (быстрый рендер на send'е).
 *
 * Соглашения:
 * - subject.hbs   — одна строка, без переносов
 * - body.hbs      — HTML email body
 * - Имя шаблона = имя директории (например 'welcome', 'password-reset')
 *
 * Подстановка переменных через стандартный Handlebars `{{name}}`. HTML-escape
 * по умолчанию для всех значений → защита от XSS-injection в email-body.
 *
 * Helpers (доступны во всех шаблонах):
 * - {{tFmt date "DD.MM.YYYY"}} — будут добавлены при необходимости (пока нет).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import Handlebars from 'handlebars';

interface CompiledTemplate {
  subject: HandlebarsTemplateDelegate;
  body: HandlebarsTemplateDelegate;
}

export interface RenderedTemplate {
  subject: string;
  body: string;
}

const TEMPLATES_DIR = join(__dirname, 'templates');

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger = new Logger(TemplateService.name);
  private readonly compiled = new Map<string, CompiledTemplate>();

  onModuleInit(): void {
    try {
      const dirs = readdirSync(TEMPLATES_DIR).filter((entry) => {
        const path = join(TEMPLATES_DIR, entry);
        return statSync(path).isDirectory();
      });

      for (const id of dirs) {
        const subjectPath = join(TEMPLATES_DIR, id, 'subject.hbs');
        const bodyPath = join(TEMPLATES_DIR, id, 'body.hbs');
        try {
          const subjectSrc = readFileSync(subjectPath, 'utf8').trim();
          const bodySrc = readFileSync(bodyPath, 'utf8');
          this.compiled.set(id, {
            subject: Handlebars.compile(subjectSrc, { noEscape: false }),
            body: Handlebars.compile(bodySrc, { noEscape: false }),
          });
          this.logger.debug({ templateId: id }, 'template.compiled');
        } catch (err) {
          this.logger.warn(
            { err, templateId: id, subjectPath, bodyPath },
            'template.compile.failed',
          );
        }
      }

      this.logger.log({ count: this.compiled.size }, 'templates.loaded');
    } catch (err) {
      this.logger.warn({ err, dir: TEMPLATES_DIR }, 'templates.dir.missing');
    }
  }

  /**
   * Рендерит шаблон с переданными data. Throws NotFoundException если шаблон
   * отсутствует (caller обязан проверить templateId до вызова).
   */
  render(templateId: string, data: Record<string, unknown>): RenderedTemplate {
    const tpl = this.compiled.get(templateId);
    if (!tpl) {
      throw new NotFoundException(`Email template не найден: ${templateId}`);
    }
    return {
      subject: tpl.subject(data),
      body: tpl.body(data),
    };
  }

  exists(templateId: string): boolean {
    return this.compiled.has(templateId);
  }
}
