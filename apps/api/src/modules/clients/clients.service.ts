/**
 * ClientsService — бизнес-логика модуля clients.
 *
 * Ответственность:
 * - Создание Client + пустого ClientProfile при регистрации (#138)
 * - Чтение/обновление профиля (#140, #141 — следующие issues)
 *
 * Cross-module rule: userId — soft-reference, без FK на таблицу users.
 */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать пустой Client + ClientProfile для только что зарегистрированного userId.
   *
   * Идемпотентен: если Client с таким userId уже существует — пропускаем.
   * Это важно для at-least-once delivery от EventsBus.
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
   * Найти Client по userId. Возвращает null если не найден.
   * Используется для проверки существования и в #140 (/clients/me).
   */
  async findByUserId(userId: string) {
    return this.prisma.client.findUnique({
      where: { userId },
      include: { profile: true },
    });
  }
}
