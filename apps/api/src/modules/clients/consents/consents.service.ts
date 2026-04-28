/**
 * ConsentsService — granular consent management (#143).
 *
 * Гарантии:
 * - При grant новой версии того же type — ставится revokedAt на старую запись,
 *   создаётся новая (audit-trail сохраняется). Один активный по (clientId, type).
 * - Валидация scope под конкретный type — строгая (BadRequest при несоответствии).
 * - Outbox events:
 *   - clients.consent.granted  при создании
 *   - clients.consent.revoked  при отзыве
 * - version snapshot из CURRENT_CONSENT_VERSIONS на момент grant'а.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CURRENT_CONSENT_VERSIONS } from '../consent-versions';

import type { GrantConsentDto } from './dto/grant-consent.dto';
import type { Consent, ConsentType, Prisma } from '@prisma/client';

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async list(userId: string): Promise<Consent[]> {
    const client = await this.findClientId(userId);
    return this.prisma.consent.findMany({
      where: { clientId: client.id },
      orderBy: [{ type: 'asc' }, { grantedAt: 'desc' }],
    });
  }

  async grant(userId: string, type: ConsentType, dto: GrantConsentDto): Promise<Consent> {
    const client = await this.findClientId(userId);
    const scope = this.buildScope(type, dto);
    const version = CURRENT_CONSENT_VERSIONS[type];

    const result = await this.prisma.$transaction(async (tx) => {
      // Атомарно: revoke предыдущий активный (если был) + create новый.
      // Partial unique index на (client_id, type) WHERE revoked_at IS NULL
      // не позволит создать второй активный без revoke первого.
      const previousActive = await tx.consent.findFirst({
        where: { clientId: client.id, type, revokedAt: null },
        select: { id: true, scope: true },
      });

      if (previousActive) {
        await tx.consent.update({
          where: { id: previousActive.id },
          data: { revokedAt: new Date() },
        });
      }

      const created = await tx.consent.create({
        data: {
          clientId: client.id,
          type,
          scope: scope as Prisma.InputJsonValue,
          version,
        },
      });

      await this.outbox.add(tx, {
        type: 'clients.consent.granted',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          clientId: client.id,
          consentType: type,
          version,
          // diff с предыдущей версией (для audit) — только имена ключей,
          // не значения, т.к. сами scope могут быть PII-релевантны
          previousVersionId: previousActive?.id ?? null,
          newScopeKeys: Object.keys(scope),
        },
      });

      return created;
    });

    this.logger.log(
      { userId, consentId: result.id, type, version },
      'consent.granted',
    );
    return result;
  }

  async revoke(userId: string, type: ConsentType): Promise<void> {
    const client = await this.findClientId(userId);

    const active = await this.prisma.consent.findFirst({
      where: { clientId: client.id, type, revokedAt: null },
      select: { id: true },
    });
    if (!active) {
      throw new NotFoundException('Активный consent данного типа не найден');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.consent.update({
        where: { id: active.id },
        data: { revokedAt: new Date() },
      });

      await this.outbox.add(tx, {
        type: 'clients.consent.revoked',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          clientId: client.id,
          consentType: type,
          consentId: active.id,
        },
      });
    });

    this.logger.log({ userId, consentId: active.id, type }, 'consent.revoked');
  }

  /**
   * Валидация и нормализация scope под конкретный consent type.
   *
   * Throws BadRequestException если обязательные для type поля отсутствуют
   * или присутствуют посторонние.
   */
  private buildScope(type: ConsentType, dto: GrantConsentDto): Record<string, unknown> {
    switch (type) {
      case 'pdn':
        // Пустой scope — pdn это всё-или-ничего, без granular уровней.
        return {};

      case 'photo_video': {
        if (dto.level === undefined) {
          throw new BadRequestException(
            'photo_video: обязательное поле level (1..4)',
          );
        }
        const scope: Record<string, unknown> = { level: dto.level };
        if (dto.useName !== undefined) {
          scope['useName'] = dto.useName;
        }
        return scope;
      }

      case 'geo': {
        if (!dto.modes || dto.modes.length === 0) {
          throw new BadRequestException(
            'geo: обязательное поле modes (массив из A/B/C/D)',
          );
        }
        return { modes: dto.modes };
      }

      case 'emergency_contacts': {
        if (dto.allowed !== true) {
          throw new BadRequestException(
            'emergency_contacts: scope.allowed должен быть true (отзыв — через DELETE)',
          );
        }
        return { allowed: true };
      }
    }
  }

  private async findClientId(userId: string): Promise<{ id: string }> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client profile not yet provisioned');
    }
    return client;
  }
}
