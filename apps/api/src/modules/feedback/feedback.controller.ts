/**
 * FeedbackController — endpoints daily feedback (#188).
 *
 * POST /feedback                — клиент пишет (Idempotency-Key required)
 * GET  /trips/:id/feedbacks     — feedback'и поездки (RBAC по ролям)
 *
 * RBAC granularity:
 * - POST: только client (owner trip'а)
 * - GET: client (own) + concierge + manager + admin + finance
 *
 * Глобальный JwtAuthGuard уже требует валидный JWT. Доступ per-trip
 * проверяется на уровне service'а через assertClientOwnsTrip / assertReadAccess.
 *
 * @Roles НЕ ставим — service сам routes доступ через UserRole. Это позволяет
 * client'у писать только свои feedback'и, но другим ролям — читать чужие.
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
} from '@nestjs/common';

import { CreateFeedbackDto, type ListFeedbacksResponse } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';
import { CurrentUser } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';
import type { Feedback } from '@prisma/client';

@Controller()
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeedbackDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<Feedback> {
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key обязателен для POST /feedback');
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new BadRequestException('Idempotency-Key должен быть 8-128 символов');
    }
    return this.feedback.create(user.id, dto, idempotencyKey);
  }

  @Get('trips/:id/feedbacks')
  async listByTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ): Promise<ListFeedbacksResponse> {
    const items = await this.feedback.listByTrip(user.id, user.role, tripId);
    return { items };
  }
}
