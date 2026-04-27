/**
 * LeadsService — обработка заявок с tour landing.
 *
 * 1. Валидация consent (boolean true — server-side check, защита от обхода фронта).
 * 2. Rate-limit по ipHash через Redis (5/мин).
 * 3. Шифрование ПДн (name, contact, comment) через CryptoService (#139).
 * 4. Запись в БД + async notify в Telegram (не блокирует ответ).
 *
 * Issue: #297 [12.4]
 */
import { createHash } from 'node:crypto';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import { TelegramClient } from './telegram.client';
import { CryptoService } from '../../common/crypto/crypto.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

import type { CreateLeadDto } from './dto/create-lead.dto';
import type { Lead } from '@prisma/client';


const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 60;

interface CreateLeadInput {
  dto: CreateLeadDto;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
    private readonly telegram: TelegramClient,
  ) {}

  async create(input: CreateLeadInput): Promise<{ id: string }> {
    const { dto, ip, userAgent } = input;

    if (dto.consent !== true) {
      throw new BadRequestException(
        'Согласие на обработку персональных данных обязательно (152-ФЗ).',
      );
    }

    this.validateContactByType(dto.contactType, dto.contact);

    const ipHash = ip != null && ip.length > 0 ? this.hashIp(ip) : null;
    if (ipHash != null) {
      await this.checkRateLimit(ipHash);
    }

    const created = await this.prisma.lead.create({
      data: {
        source: dto.source,
        name: this.crypto.encrypt(dto.name.trim()),
        contactType: dto.contactType,
        contact: this.crypto.encrypt(dto.contact.trim()),
        comment:
          dto.comment != null && dto.comment.trim().length > 0
            ? this.crypto.encrypt(dto.comment.trim())
            : null,
        consentTextVersion: dto.consentTextVersion,
        ipHash,
        userAgent: userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });

    this.logger.log(
      {
        leadId: created.id,
        source: dto.source,
        contactType: dto.contactType,
        ipHashShort: ipHash?.slice(0, 8),
      },
      'leads.create.ok',
    );

    // Async notify — не блокируем ответ. Если telegram упадёт — lead уже в БД.
    const notify: Parameters<TelegramClient['notifyNewLead']>[0] = {
      source: dto.source,
      name: dto.name.trim(),
      contactType: dto.contactType,
      contact: dto.contact.trim(),
      comment: dto.comment?.trim() ?? null,
      createdAtIso: created.createdAt.toISOString(),
    };
    if (ipHash != null) notify.ipHashShort = ipHash.slice(0, 8);
    void this.telegram.notifyNewLead(notify);

    return { id: created.id };
  }

  // ────────────────────────── helpers

  /**
   * Лёгкая валидация контакта по типу. Полная — клиент-side через zod;
   * на сервере достаточно sanity-check, чтобы отсечь явный спам.
   */
  private validateContactByType(
    type: 'phone' | 'telegram' | 'email',
    contact: string,
  ): void {
    const trimmed = contact.trim();
    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        throw new BadRequestException('Некорректный email.');
      }
    } else if (type === 'phone') {
      // Допускаем + ( ) - пробел и цифры; минимум 7 цифр
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 20) {
        throw new BadRequestException('Некорректный телефон.');
      }
    } else if (type === 'telegram') {
      // @username — латиница/цифры/_, 4–32 символа
      if (!/^@?[A-Za-z0-9_]{4,32}$/.test(trimmed)) {
        throw new BadRequestException('Некорректный Telegram username.');
      }
    }
  }

  /**
   * Rate-limit: 5 заявок / минуту с одного IP. Используем Redis INCR + EXPIRE.
   * Превышение → 429.
   */
  private async checkRateLimit(ipHash: string): Promise<void> {
    const key = `lead:rl:${ipHash}`;
    const client = this.redis.getClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, RATE_LIMIT_WINDOW_SEC);
    }
    if (count > RATE_LIMIT_MAX) {
      this.logger.warn({ ipHashShort: ipHash.slice(0, 8), count }, 'leads.rate_limit.hit');
      throw new HttpException(
        'Слишком много заявок с этого устройства. Попробуйте через минуту.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }

  /** Public — для дальнейших admin-list endpoints (EPIC 14). */
  async getById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({ where: { id } });
  }
}
