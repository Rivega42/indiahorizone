/**
 * ClientsService — бизнес-логика модуля clients.
 *
 * Ответственность:
 * - Создание Client + пустого ClientProfile при регистрации (#138)
 * - Чтение/обновление профиля (#140, #141 — следующие issues)
 * - ПДн encryption через CryptoService (#139)
 *
 * Cross-module rule: userId — soft-reference, без FK на таблицу users.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  decryptClientWithProfile,
  decryptProfile,
  encryptProfile,
  type EncryptableProfileInput,
} from './lib/profile-encryption';
import { CryptoService } from '../../common/crypto/crypto.service';
import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { Client, ClientProfile, Prisma } from '@prisma/client';

/**
 * Поля профиля, которые можно обновлять через PATCH /clients/me.
 * - ПДн (firstName/lastName/dateOfBirth/phone) — шифруются перед записью.
 * - non-ПДн (citizenship/telegramHandle/preferences) — пишутся в открытом виде.
 *
 * Patch-семантика: omitted поле = нет изменений; явный null = очистить.
 */
export type UpdateProfilePatch = EncryptableProfileInput & {
  citizenship?: string | null;
  telegramHandle?: string | null;
  preferences?: Prisma.InputJsonValue;
};


@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Создать пустой Client + ClientProfile для только что зарегистрированного userId.
   *
   * Идемпотентен: если Client с таким userId уже существует — пропускаем.
   * Это важно для at-least-once delivery от EventsBus.
   *
   * При создании ПДн поля null — encrypt не вызываем.
   */
  async provisionForUser(userId: string): Promise<void> {
    const existing = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      this.logger.warn({ userId }, 'clients.provision.skipped: client already exists');
      return;
    }

    const client = await this.prisma.client.create({
      data: {
        userId,
        profile: {
          create: {
            // Пустой профиль — заполняется клиентом позже (#140)
            preferences: {},
          },
        },
      },
      select: { id: true },
    });

    this.logger.log({ userId, clientId: client.id }, 'clients.provision.done');
  }

  /**
   * Найти Client с расшифрованным profile. Возвращает null если не найден.
   * Используется в #140 (`GET /clients/me`).
   */
  async findByUserId(
    userId: string,
  ): Promise<(Client & { profile: ClientProfile | null }) | null> {
    const result = await this.prisma.client.findUnique({
      where: { userId },
      include: { profile: true },
    });
    return decryptClientWithProfile(result, this.crypto);
  }

  /**
   * Обновить профиль клиента. Используется в #140 (`PATCH /clients/me`).
   *
   * Логика:
   * 1. Найти Client + Profile по userId.
   * 2. Зашифровать ПДн поля через encryptProfile().
   * 3. Update profile в транзакции + публикация `clients.profile.updated`
   *    через outbox (changedFields = только реально присутствующие в patch).
   * 4. Расшифровать результат для возврата.
   *
   * Patch-семантика: omitted = no change; явный null = очистить значение.
   * Subscriber'ы события (CRM, finance — будущие) видят только список ИМЁН
   * изменённых полей, не значения ПДн (privacy by default).
   */
  async updateProfile(
    userId: string,
    patch: UpdateProfilePatch,
  ): Promise<ClientProfile> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true, profile: { select: { id: true } } },
    });

    if (!client) {
      throw new NotFoundException(`Client not found for userId=${userId}`);
    }

    const changedFields = Object.keys(patch).filter(
      (k) => (patch as Record<string, unknown>)[k] !== undefined,
    );

    if (changedFields.length === 0) {
      // Идемпотентный no-op: пустой patch не должен публиковать событие.
      // Возвращаем текущее состояние (или 204 в контроллере — тут возвращаем профиль).
      const current = await this.prisma.clientProfile.findUnique({
        where: { clientId: client.id },
      });
      if (!current) {
        throw new NotFoundException(`Profile not found for clientId=${client.id}`);
      }
      return decryptProfile(current, this.crypto);
    }

    const { citizenship, telegramHandle, preferences, ...encryptable } = patch;
    const encrypted = encryptProfile(encryptable, this.crypto);

    const data: Prisma.ClientProfileUpdateInput = {
      ...encrypted,
      ...(citizenship !== undefined ? { citizenship } : {}),
      ...(telegramHandle !== undefined ? { telegramHandle } : {}),
      ...(preferences !== undefined ? { preferences } : {}),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = client.profile
        ? await tx.clientProfile.update({
            where: { id: client.profile.id },
            data,
          })
        : await tx.clientProfile.create({
            data: {
              clientId: client.id,
              ...encrypted,
              ...(citizenship !== undefined ? { citizenship } : {}),
              ...(telegramHandle !== undefined ? { telegramHandle } : {}),
              ...(preferences !== undefined ? { preferences } : {}),
            },
          });

      await this.outbox.add(tx, {
        type: 'clients.profile.updated',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          clientId: client.id,
          changedFields,
        },
      });

      return result;
    });

    return decryptProfile(updated, this.crypto);
  }
}
