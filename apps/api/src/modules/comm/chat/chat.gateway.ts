/**
 * ChatGateway — Socket.IO WebSocket для realtime чата (#168).
 *
 * Path: `/ws/chat`. Аутентификация через JWT в `auth.token` socket.handshake.
 *
 * Events (server → client):
 * - `message:new`     — новое сообщение в thread'е (broadcast в room `thread:<id>`)
 * - `message:read`    — кто-то прочитал сообщение (`{userId, threadId}`)
 * - `typing:start`    — кто-то начал печатать (broadcast в room)
 * - `typing:stop`     — перестал
 *
 * Events (client → server):
 * - `thread:join`     — подписка на room thread'а (с access-check)
 * - `thread:leave`    — отписка
 * - `typing:start` / `typing:stop` — клиент сообщает о наборе текста
 *
 * Emit `message:new` идёт из ChatService (REST send) — gateway подписывается
 * на outbox event `comm.chat.message_sent` через events-bus и broadcast'ит
 * подключённым клиентам в room.
 *
 * Multi-instance: Redis Streams adapter (Socket.IO official) синхронизирует
 * broadcast'ы между api-инстансами в фазе 4. В фазе 3 (один контейнер) —
 * adapter тоже работает корректно, ничего не ломает.
 */
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { EventsBusService } from '../../../common/events-bus/events-bus.service';
import { RedisService } from '../../../common/redis/redis.service';
import { JwtTokenService } from '../../auth/services/jwt.service';

import type { DomainEvent } from '../../../common/events-bus/types';

interface ChatMessageSentPayload {
  threadId: string;
  messageId: string;
  fromUserId: string;
  hasAttachments: boolean;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

const ROOM_PREFIX = 'thread:';

@Injectable()
@WebSocketGateway({
  path: '/ws/chat',
  cors: {
    // CORS — ограничиваем по env'у (dev=2.56.241.126:3010, prod=indiahorizone.ru).
    // Без origin'ов соединение откажется.
    origin: process.env['CHAT_WS_ORIGINS']?.split(',') ?? [
      'http://2.56.241.126:3010',
      'http://localhost:3000',
      'http://localhost:3010',
    ],
    credentials: true,
  },
  // serveClient=false — не отдаём официальный socket.io.js клиент, экономим RAM
  serveClient: false,
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ChatGateway.name);
  private busSubscription: { stop: () => void } | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtTokenService,
    private readonly redis: RedisService,
    private readonly bus: EventsBusService,
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
  ) {}

  /**
   * Wire Redis adapter + subscribe на comm.chat.message_sent.
   */
  async onModuleInit(): Promise<void> {
    // Redis adapter — для multi-instance broadcast (фаза 4 готовность).
    // pubClient/subClient — отдельные ioredis-соединения (Socket.IO требует именно так).
    const pubClient = this.redis.getClient().duplicate();
    const subClient = this.redis.getClient().duplicate();
    await Promise.all([pubClient.ping(), subClient.ping()]); // sanity-check
    this.server.adapter(createAdapter(pubClient, subClient));
    this.logger.log('chat-gateway.redis-adapter.attached');

    // Подписка на outbox-event: при send (через REST или будущие пути) →
    // broadcast в room thread'а всем подключённым клиентам.
    this.busSubscription = this.bus.subscribe<ChatMessageSentPayload>(
      'comm.chat.message_sent',
      this.handleMessageSent.bind(this),
      {
        consumerGroup: 'chat-gateway',
        consumerName: 'gateway-1',
      },
    );
    this.logger.log('chat-gateway.bus-subscription.started');
  }

  onModuleDestroy(): void {
    this.busSubscription?.stop();
    this.busSubscription = null;
  }

  /**
   * При connect: валидируем JWT из handshake.auth.token.
   * Если невалидный → disconnect.
   */
  handleConnection(client: AuthenticatedSocket): void {
    const token =
      typeof client.handshake.auth?.['token'] === 'string'
        ? client.handshake.auth['token']
        : undefined;

    if (!token) {
      this.logger.warn({ socketId: client.id }, 'chat.ws.connect.no-token');
      client.disconnect(true);
      return;
    }

    const payload = this.jwt.verifyAccess(token);
    if (!payload) {
      this.logger.warn({ socketId: client.id }, 'chat.ws.connect.invalid-token');
      client.disconnect(true);
      return;
    }

    client.userId = payload.sub;
    client.userRole = payload.role;
    this.logger.debug({ socketId: client.id, userId: client.userId }, 'chat.ws.connected');
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.debug({ socketId: client.id, userId: client.userId }, 'chat.ws.disconnected');
  }

  /**
   * thread:join — клиент подписывается на room thread'а.
   * Перед join проверяем что user участник thread'а (через ChatService).
   */
  @SubscribeMessage('thread:join')
  async onThreadJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { threadId: string },
  ): Promise<{ ok: boolean; error?: string }> {
    if (!client.userId) {
      return { ok: false, error: 'not-authenticated' };
    }
    if (!body?.threadId || typeof body.threadId !== 'string') {
      return { ok: false, error: 'invalid-threadId' };
    }

    try {
      // Reuse access-check из ChatService через listMessages limit:1 — самое
      // дешёвое, что не trigger'ит лишних DB-операций.
      // При невалидном thread'е или not-participant — выбросит 403/404.
      await this.chat.listMessages(client.userId, body.threadId, { limit: 1 });
    } catch {
      return { ok: false, error: 'forbidden' };
    }

    await client.join(this.roomFor(body.threadId));
    this.logger.debug(
      { socketId: client.id, userId: client.userId, threadId: body.threadId },
      'chat.ws.thread.joined',
    );
    return { ok: true };
  }

  @SubscribeMessage('thread:leave')
  async onThreadLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { threadId: string },
  ): Promise<{ ok: boolean }> {
    if (!body?.threadId || typeof body.threadId !== 'string') {
      return { ok: false };
    }
    await client.leave(this.roomFor(body.threadId));
    return { ok: true };
  }

  /**
   * typing:start — клиент сообщает что начал печатать. Broadcast в room
   * (всем КРОМЕ отправителя).
   */
  @SubscribeMessage('typing:start')
  onTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { threadId: string },
  ): void {
    if (!client.userId || !body?.threadId) return;
    client
      .to(this.roomFor(body.threadId))
      .emit('typing:start', { userId: client.userId, threadId: body.threadId });
  }

  @SubscribeMessage('typing:stop')
  onTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { threadId: string },
  ): void {
    if (!client.userId || !body?.threadId) return;
    client
      .to(this.roomFor(body.threadId))
      .emit('typing:stop', { userId: client.userId, threadId: body.threadId });
  }

  /**
   * Bus-listener: новое сообщение через REST-send → broadcast всем в room.
   */
  private handleMessageSent(event: DomainEvent<ChatMessageSentPayload>): Promise<void> {
    const { threadId, messageId, fromUserId } = event.payload;
    this.server.to(this.roomFor(threadId)).emit('message:new', { threadId, messageId, fromUserId });
    return Promise.resolve();
  }

  private roomFor(threadId: string): string {
    return `${ROOM_PREFIX}${threadId}`;
  }
}
