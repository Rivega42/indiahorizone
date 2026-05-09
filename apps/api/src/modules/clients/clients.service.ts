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

import type { QuizResponse } from './dto/quiz.dto';
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
  async findByUserId(userId: string): Promise<(Client & { profile: ClientProfile | null }) | null> {
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
  async updateProfile(userId: string, patch: UpdateProfilePatch): Promise<ClientProfile> {
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

  /**
   * Получить текущее состояние quiz'а (#B-04).
   *
   * Возвращает структурированные quiz-поля из ClientProfile + completedAt.
   * `allergies` расшифровываются через decryptProfile (это медданные).
   *
   * @returns null если профиль ещё не создан (listener auth.user.registered
   *   не отработал); caller вернёт 404.
   */
  async getQuiz(userId: string): Promise<QuizResponse | null> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { profile: true },
    });
    if (!client?.profile) {
      return null;
    }
    const decrypted = decryptProfile({ ...client.profile }, this.crypto);
    return {
      dietPreferences: decrypted.dietPreferences,
      allergies: decrypted.allergies,
      paceLevel: decrypted.paceLevel,
      hasChildren: decrypted.hasChildren,
      childrenAges: decrypted.childrenAges,
      indiaExperience: decrypted.indiaExperience,
      completedAt: decrypted.quizCompletedAt?.toISOString() ?? null,
    };
  }

  /**
   * PATCH /clients/me/quiz — autosave частично заполненного quiz'а (#B-04).
   *
   * Не ставит completedAt и не публикует event — это draft. Финальный submit
   * через `submitQuiz()`.
   */
  async patchQuiz(userId: string, patch: QuizPatch): Promise<QuizResponse> {
    return this.applyQuizPatch(userId, patch, false);
  }

  /**
   * POST /clients/me/quiz — финальная отправка (#B-04).
   *
   * Помимо записи полей: ставит quizCompletedAt = now, публикует
   * `client.quiz.completed` через outbox для downstream listeners
   * (manager-handoff, NPS-baseline).
   *
   * Идемпотентность: повторный submit перезаписывает значения и обновляет
   * completedAt — событие публикуется каждый раз. Менеджер обрабатывает
   * дубли через correlation в CRM (вне scope этого сервиса).
   */
  async submitQuiz(userId: string, patch: QuizPatch): Promise<QuizResponse> {
    return this.applyQuizPatch(userId, patch, true);
  }

  private async applyQuizPatch(
    userId: string,
    patch: QuizPatch,
    finalize: boolean,
  ): Promise<QuizResponse> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true, profile: { select: { id: true } } },
    });
    if (!client) {
      throw new NotFoundException(`Client not found for userId=${userId}`);
    }

    const { allergies, ...rest } = patch;
    const encryptedAllergies =
      allergies === undefined
        ? {}
        : { allergies: allergies === null ? null : this.crypto.encrypt(allergies) };

    const data: Prisma.ClientProfileUpdateInput = {
      ...rest,
      ...encryptedAllergies,
      ...(finalize ? { quizCompletedAt: new Date() } : {}),
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
              ...rest,
              ...encryptedAllergies,
              ...(finalize ? { quizCompletedAt: new Date() } : {}),
            },
          });

      if (finalize) {
        await this.outbox.add(tx, {
          type: 'client.quiz.completed',
          schemaVersion: 1,
          actor: { type: 'user', id: userId },
          payload: {
            userId,
            clientId: client.id,
            indiaExperience: result.indiaExperience,
            hasChildren: result.hasChildren,
            paceLevel: result.paceLevel,
          },
        });
      }

      return result;
    });

    const decrypted = decryptProfile({ ...updated }, this.crypto);
    return {
      dietPreferences: decrypted.dietPreferences,
      allergies: decrypted.allergies,
      paceLevel: decrypted.paceLevel,
      hasChildren: decrypted.hasChildren,
      childrenAges: decrypted.childrenAges,
      indiaExperience: decrypted.indiaExperience,
      completedAt: decrypted.quizCompletedAt?.toISOString() ?? null,
    };
  }
}

/**
 * Тип для применения quiz patch'а в ClientsService. Соответствует QuizPatchDto,
 * но без декораторов class-validator — это уже валидированный input.
 */
export interface QuizPatch {
  dietPreferences?: string[];
  allergies?: string | null;
  paceLevel?: 'slow' | 'medium' | 'fast' | null;
  hasChildren?: boolean | null;
  childrenAges?: number[];
  indiaExperience?: 'never' | 'been_once' | 'multiple' | null;
}
