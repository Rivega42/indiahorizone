/**
 * ChatController — REST endpoints для чатов (#169).
 *
 * GET    /chat/threads
 * GET    /chat/threads/:id/messages?limit=&cursor=
 * POST   /chat/threads/:id/messages   (Idempotency-Key: required)
 * POST   /chat/threads/:id/read
 *
 * Доступ: любая authenticated роль (RBAC проверяется на уровне thread'а
 * через participants). Без @Roles — глобальный JwtAuthGuard требует только
 * валидный JWT.
 *
 * Idempotency-Key (POST /messages): obligatory header. Защита от double-send
 * на flaky mobile network. Storage в Redis 24h.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { ChatService } from './chat.service';
import {
  ListMessagesQueryDto,
  type ListMessagesResponse,
  type ListThreadsResponse,
  SendMessageDto,
} from './dto/chat.dto';
import { CurrentUser } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';
import type { ChatMessage } from '@prisma/client';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  async listThreads(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ListThreadsResponse> {
    return this.chat.listThreads(user.id);
  }

  @Get('threads/:id/messages')
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<ListMessagesResponse> {
    return this.chat.listMessages(user.id, id, query);
  }

  @Post('threads/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SendMessageDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ChatMessage> {
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Header Idempotency-Key обязателен для POST chat/threads/:id/messages',
      );
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new BadRequestException('Idempotency-Key должен быть 8-128 символов');
    }
    return this.chat.sendMessage(user.id, id, dto, idempotencyKey);
  }

  @Post('threads/:id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ updated: number }> {
    return this.chat.markRead(user.id, id);
  }
}
