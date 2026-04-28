/**
 * ChatService — REST-сервис для чатов (#169).
 *
 * Endpoint'ы (см. controller):
 * - GET  /chat/threads
 * - GET  /chat/threads/:id/messages?cursor
 * - POST /chat/threads/:id/messages (Idempotency-Key required)
 * - POST /chat/threads/:id/read
 *
 * Access control: user должен быть в participants thread'а. Иначе 403/404.
 *
 * Idempotency-Key (HTTP header) на POST messages: Redis-backed, TTL 24h.
 * Повторный POST с тем же ключом возвращает тот же response — защита от
 * double-send при flaky network на mobile.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

import type {
  ListMessagesQueryDto,
  ListMessagesResponse,
  ListThreadsResponse,
  SendMessageDto,
} from './dto/chat.dto';
import type { ChatMessage } from '@prisma/client';

const IDEMPOTENCY_TTL_SEC = 24 * 60 * 60; // 24h

interface MessageCursor {
  createdAt: string;
  id: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly redis: RedisService,
  ) {}

  async listThreads(userId: string): Promise<ListThreadsResponse> {
    // PostgreSQL UUID[] @> ARRAY[userId] — содержит ли participants нашего user'а
    const items = await this.prisma.chatThread.findMany({
      where: {
        participants: { has: userId },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return { items };
  }

  async listMessages(
    userId: string,
    threadId: string,
    query: ListMessagesQueryDto,
  ): Promise<ListMessagesResponse> {
    await this.assertThreadAccess(userId, threadId);

    const limit = query.limit ?? 50;
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;

    const items = await this.prisma.chatMessage.findMany({
      where: {
        threadId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                {
                  AND: [{ createdAt: new Date(cursor.createdAt) }, { id: { lt: cursor.id } }],
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = page[page.length - 1]!;
      nextCursor = this.encodeCursor({
        createdAt: last.createdAt.toISOString(),
        id: last.id,
      });
    }

    return { items: page, nextCursor };
  }

  /**
   * Send message с Idempotency-Key защитой от double-send.
   * Если ключ уже использован — возвращаем ранее созданное сообщение
   * (по сохранённому id в Redis).
   */
  async sendMessage(
    userId: string,
    threadId: string,
    dto: SendMessageDto,
    idempotencyKey: string,
  ): Promise<ChatMessage> {
    await this.assertThreadAccess(userId, threadId);

    const idempKey = this.idempotencyKey(userId, threadId, idempotencyKey);

    const cached = await this.redis.getClient().get(idempKey);
    if (cached) {
      const messageId = cached;
      const existing = await this.prisma.chatMessage.findUnique({
        where: { id: messageId },
      });
      if (existing) {
        this.logger.debug({ idempotencyKey, messageId }, 'chat.message.idempotent-replay');
        return existing;
      }
      // Cache pointer есть, но message исчез — стейл cache. Пишем новое.
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          threadId,
          fromUserId: userId,
          body: dto.body,
          attachments: dto.attachments ?? [],
          // readBy default '{}' (никто не прочитал, включая отправителя — он сам
          // ставит read mark когда возвращается в чат)
        },
      });

      // Тач thread.updatedAt чтобы он всплыл в /chat/threads.
      await tx.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      await this.outbox.add(tx, {
        type: 'comm.chat.message_sent',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          threadId,
          messageId: created.id,
          fromUserId: userId,
          // body НЕ публикуем в outbox — может содержать ПДн
          hasAttachments: (dto.attachments?.length ?? 0) > 0,
        },
      });

      return created;
    });

    // Сохраняем idempotency mapping → message.id
    await this.redis.getClient().set(idempKey, message.id, 'EX', IDEMPOTENCY_TTL_SEC);

    return message;
  }

  /**
   * Mark all unread messages in thread as read by user. Атомарный update
   * через jsonb_set по каждому message — но проще просто обновить через update
   * с merge object (Prisma).
   *
   * V1: bulk-update — на всех messages thread'а where readBy ?| array[userId] is false
   * проставить readBy[userId] = now. PostgreSQL JSONB || merge.
   */
  async markRead(userId: string, threadId: string): Promise<{ updated: number }> {
    await this.assertThreadAccess(userId, threadId);

    const now = new Date().toISOString();

    // Raw SQL для атомарного JSONB merge: read_by = read_by || jsonb_build_object($userId, $now)
    // на всех сообщениях thread'а где user'а ещё нет в read_by.
    const result = await this.prisma.$executeRaw`
      UPDATE "chat_messages"
      SET "read_by" = "read_by" || jsonb_build_object(${userId}::text, ${now}::text)
      WHERE "thread_id" = ${threadId}::uuid
        AND NOT ("read_by" ? ${userId}::text)
        AND "from_user_id" <> ${userId}::uuid
    `;

    return { updated: Number(result) };
  }

  // ─── helpers ───

  private async assertThreadAccess(userId: string, threadId: string): Promise<void> {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { participants: true },
    });
    if (!thread) {
      throw new NotFoundException('Thread не найден');
    }
    if (!thread.participants.includes(userId)) {
      // 403 (а не 404) — user знает что thread существует, но он не участник.
      // С 404 атакующий не различал бы существующие threads, но для UX чата
      // 403 корректнее (UI может показать «вас удалили из чата»).
      throw new ForbiddenException('Нет доступа к этому чату');
    }
  }

  private idempotencyKey(userId: string, threadId: string, key: string): string {
    return `chat-idem:${userId}:${threadId}:${key}`;
  }

  private encodeCursor(cursor: MessageCursor): string {
    return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
  }

  private decodeCursor(raw: string): MessageCursor {
    try {
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as Partial<MessageCursor>;
      if (
        typeof parsed.createdAt !== 'string' ||
        typeof parsed.id !== 'string' ||
        Number.isNaN(Date.parse(parsed.createdAt))
      ) {
        throw new Error('invalid cursor');
      }
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException('Невалидный cursor');
    }
  }
}
