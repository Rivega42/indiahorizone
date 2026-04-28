/**
 * EmergencyContactsService — CRUD контактов экстренной связи (#144).
 *
 * Гарантии:
 * - Шифруем name + phone (ПДн третьих лиц) через CryptoService.
 * - Перед save проверяем активный Consent типа `emergency_contacts` со scope.allowed=true.
 *   Без него — 403 (152-ФЗ ст. 9 § granular consent, см. docs/LEGAL/CONSENTS/EMERGENCY_CONTACTS.md).
 * - Максимум 2 контакта на client (primary + secondary) — DB unique constraint;
 *   upsert по (clientId, priority) — повторный POST с тем же priority обновляет
 *   существующий вместо ошибки duplicate.
 * - Публикуем `clients.emergency_contact.added` в outbox при первом save'е.
 */
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CryptoService } from '../../../common/crypto/crypto.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

import type { EmergencyContact, EmergencyContactPriority, Prisma } from '@prisma/client';

export interface EmergencyContactDecrypted extends Omit<EmergencyContact, 'name' | 'phone'> {
  name: string;
  phone: string;
}

interface UpsertInput {
  name: string;
  phone: string;
  relation: string;
  language: string;
  priority: EmergencyContactPriority;
}

@Injectable()
export class EmergencyContactsService {
  private readonly logger = new Logger(EmergencyContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly outbox: OutboxService,
  ) {}

  async list(userId: string): Promise<EmergencyContactDecrypted[]> {
    const client = await this.findClientId(userId);
    const contacts = await this.prisma.emergencyContact.findMany({
      where: { clientId: client.id },
      orderBy: { priority: 'asc' }, // primary раньше secondary
    });
    return contacts.map((c) => this.decrypt(c));
  }

  /**
   * Upsert по (clientId, priority): создаёт или обновляет контакт указанного
   * приоритета. Повторный POST primary — обновит, не сломается на duplicate.
   *
   * Публикует событие только при CREATE. UPDATE — без события (при необходимости
   * отдельный issue с `clients.emergency_contact.updated`).
   */
  async upsert(userId: string, input: UpsertInput): Promise<EmergencyContactDecrypted> {
    const client = await this.findClientId(userId);
    await this.assertConsent(client.id);

    const encryptedName = this.crypto.encrypt(input.name);
    const encryptedPhone = this.crypto.encrypt(input.phone);

    const existing = await this.prisma.emergencyContact.findUnique({
      where: { clientId_priority: { clientId: client.id, priority: input.priority } },
      select: { id: true },
    });

    const data: Prisma.EmergencyContactUpdateInput = {
      name: encryptedName,
      phone: encryptedPhone,
      relation: input.relation,
      language: input.language,
    };

    if (existing) {
      const updated = await this.prisma.emergencyContact.update({
        where: { id: existing.id },
        data,
      });
      this.logger.log(
        { userId, contactId: updated.id, priority: input.priority, action: 'update' },
        'emergency-contact.upsert',
      );
      return this.decrypt(updated);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const result = await tx.emergencyContact.create({
        data: {
          clientId: client.id,
          ...data,
          priority: input.priority,
        } as Prisma.EmergencyContactUncheckedCreateInput,
      });

      await this.outbox.add(tx, {
        type: 'clients.emergency_contact.added',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          clientId: client.id,
          contactId: result.id,
          priority: input.priority,
          // ПДн (name/phone) НЕ публикуем в payload — privacy by default
        },
      });

      return result;
    });

    this.logger.log(
      { userId, contactId: created.id, priority: input.priority, action: 'create' },
      'emergency-contact.added',
    );
    return this.decrypt(created);
  }

  async remove(userId: string, contactId: string): Promise<void> {
    const client = await this.findClientId(userId);
    const result = await this.prisma.emergencyContact.deleteMany({
      where: { id: contactId, clientId: client.id },
    });
    if (result.count === 0) {
      throw new NotFoundException('Контакт не найден');
    }
    this.logger.log({ userId, contactId, action: 'delete' }, 'emergency-contact.removed');
  }

  private async findClientId(userId: string): Promise<{ id: string }> {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) {
      // Race condition: register прошёл, но listener ещё не отработал.
      throw new NotFoundException('Client profile not yet provisioned');
    }
    return client;
  }

  /**
   * Проверка наличия активного консента emergency_contacts со scope.allowed=true.
   * Без него — 403 (152-ФЗ требует явного согласия на обработку контактов
   * третьих лиц, документация в docs/LEGAL/CONSENTS/EMERGENCY_CONTACTS.md).
   */
  private async assertConsent(clientId: string): Promise<void> {
    const consent = await this.prisma.consent.findFirst({
      where: {
        clientId,
        type: 'emergency_contacts',
        revokedAt: null,
      },
      select: { scope: true },
    });

    const allowed =
      consent != null &&
      typeof consent.scope === 'object' &&
      consent.scope !== null &&
      !Array.isArray(consent.scope) &&
      (consent.scope as Record<string, unknown>)['allowed'] === true;

    if (!allowed) {
      throw new ForbiddenException(
        'Требуется активное согласие на обработку контактов экстренной связи',
      );
    }
  }

  private decrypt(c: EmergencyContact): EmergencyContactDecrypted {
    return {
      ...c,
      name: this.crypto.tryDecrypt(c.name) ?? c.name,
      phone: this.crypto.tryDecrypt(c.phone) ?? c.phone,
    };
  }
}
