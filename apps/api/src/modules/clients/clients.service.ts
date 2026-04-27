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
import { Injectable, Logger } from '@nestjs/common';

import {
  decryptClientWithProfile,
  decryptProfile,
  encryptProfile,
  type EncryptableProfileInput,
} from './lib/profile-encryption';
import { CryptoService } from '../../common/crypto/crypto.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { Client, ClientProfile } from '@prisma/client';


@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
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
   * Обновить ПДн поля профиля. Используется в #140 (`PATCH /clients/me`).
   *
   * Логика:
   * 1. Найти Client + Profile по userId.
   * 2. Зашифровать переданные поля через encryptProfile().
   * 3. Update profile.
   * 4. Расшифровать результат для возврата.
   *
   * @throws ClientNotFoundError если у user нет Client (race-condition после
   *   register'а — listener ещё не отработал; caller должен сделать retry или
   *   provisionForUser явно).
   */
  async updateProfile(
    userId: string,
    patch: EncryptableProfileInput & {
      citizenship?: string | null;
      telegramHandle?: string | null;
    },
  ): Promise<ClientProfile> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true, profile: { select: { id: true } } },
    });

    if (!client) {
      throw new Error(`Client not found for userId=${userId}`);
    }

    if (!client.profile) {
      // ClientProfile должен быть создан в provisionForUser. Если его нет —
      // создаём сейчас (defensive).
      const encrypted = encryptProfile(patch, this.crypto);
      const created = await this.prisma.clientProfile.create({
        data: {
          clientId: client.id,
          ...encrypted,
        },
      });
      return decryptProfile(created, this.crypto);
    }

    // Разделяем шифруемые и не-шифруемые поля
    const { citizenship, telegramHandle, ...encryptable } = patch;
    const encrypted = encryptProfile(encryptable, this.crypto);

    const updated = await this.prisma.clientProfile.update({
      where: { id: client.profile.id },
      data: {
        ...encrypted,
        ...(citizenship !== undefined ? { citizenship } : {}),
        ...(telegramHandle !== undefined ? { telegramHandle } : {}),
      },
    });

    return decryptProfile(updated, this.crypto);
  }
}
