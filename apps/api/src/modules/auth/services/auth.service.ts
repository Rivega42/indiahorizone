import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { PasswordService } from './password.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

import type { RegisterDto, RegisterResponse } from '../dto/register.dto';

/**
 * AuthService — register/login/2FA/refresh бизнес-логика.
 * В этом slice реализован только register (#127). Login (#128), refresh (#129),
 * logout (#130), 2FA (#132/#133) — следующие issues.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly password: PasswordService,
  ) {}

  /**
   * Регистрация нового пользователя.
   *
   * Шаги:
   * 1. Проверка zxcvbn-силы пароля (фейлим если score < 2)
   * 2. Транзакция:
   *    - Поиск user по email — если есть → 409 Conflict
   *    - argon2id-хеш пароля
   *    - INSERT users
   *    - outbox.add('auth.user.registered') — в той же транзакции
   * 3. Возврат RegisterResponse (БЕЗ password_hash)
   *
   * 'admin' и 'finance' роли через публичную регистрацию ИГНОРИРУЮТСЯ —
   * сводятся к 'client'. Эти роли только через ручное продвижение через
   * admin-endpoint в фазе 4 (или миграцией).
   *
   * Rate-limit (5 попыток / 15 мин на IP) — на уровне @nestjs/throttler
   * декоратора в контроллере (#221 настройка).
   */
  async register(dto: RegisterDto, ipAddress?: string): Promise<RegisterResponse> {
    // 1. Проверка силы пароля
    const strength = this.password.checkStrength(dto.password, [dto.email]);
    if (!strength.ok) {
      throw new UnprocessableEntityException({
        message: 'Пароль слишком слабый',
        warning: strength.warning,
        suggestions: strength.suggestions,
      });
    }

    // 2. Подавляем admin/finance в публичной регистрации
    const role = this.sanitizeRole(dto.role);

    const passwordHash = await this.password.hash(dto.password);

    // 3. Транзакция: проверка уникальности + insert + outbox
    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Email уже зарегистрирован');
      }

      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role,
          status: UserStatus.active,
        },
        select: { id: true, email: true, role: true, createdAt: true },
      });

      // Событие публикуется через outbox в той же транзакции.
      // Subscribers:
      // - clients-svc → создаст пустой Client (#138)
      // - comm-svc → welcome email (#162)
      await this.outbox.add(tx, {
        type: 'auth.user.registered',
        schemaVersion: 1,
        actor: { type: 'user', id: created.id },
        payload: {
          userId: created.id,
          email: created.email,
          role: created.role,
          source: ipAddress ? `ip:${ipAddress}` : 'unknown',
        },
      });

      return created;
    });

    this.logger.log({ userId: user.id, role: user.role }, 'auth.user.registered');

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Подавляет admin/finance роли в публичной регистрации.
   * Возможные значения сужены до client, guide, manager, concierge.
   * Для guide/manager/concierge тоже надо иметь invite-flow в фазе 4 —
   * пока разрешаем, но это TODO.
   */
  private sanitizeRole(role?: UserRole): UserRole {
    if (!role) return UserRole.client;
    if (role === UserRole.admin || role === UserRole.finance) {
      this.logger.warn({ requestedRole: role }, 'role.elevation.blocked');
      return UserRole.client;
    }
    return role;
  }
}
