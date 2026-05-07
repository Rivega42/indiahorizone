/**
 * SessionsController — управление активными сессиями (#A-05).
 *
 * - GET    /auth/sessions      — список активных + пометка current
 * - DELETE /auth/sessions/:id  — завершить конкретную (не текущую)
 *
 * Доступ: любая authenticated роль через глобальный JwtAuthGuard.
 * RBAC через service: пользователь видит/завершает только свои сессии.
 *
 * Для logout текущей — POST /auth/logout.
 * Для logout всех — POST /auth/logout-all.
 */
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { type SessionResponse, SessionsService } from './sessions.service';
import { CurrentUser } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';

@Controller('auth/sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<{ items: SessionResponse[] }> {
    const items = await this.sessions.list(user.id, user.sessionId);
    return { items };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.sessions.revoke(user.id, id, user.sessionId);
  }
}
