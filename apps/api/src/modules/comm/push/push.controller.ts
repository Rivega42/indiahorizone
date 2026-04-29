/**
 * PushController — endpoints для управления push-subscription'ами (#163).
 *
 * - POST   /comm/push/subscribe        — подписать устройство (см. #356 frontend flow)
 * - DELETE /comm/push/subscribe        — отписать с устройства (по id или endpoint)
 * - GET    /comm/push/subscriptions    — список активных устройств user'а (для UI «ваши устройства»)
 *
 * Все три endpoint'а требуют auth — push-подписка привязана к user'у через JWT.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { SubscribePushDto } from './dto/subscribe.dto';
import { UnsubscribePushDto } from './dto/unsubscribe.dto';
import { PushService } from './push.service';
import { CurrentUser } from '../../../common/auth/decorators';

import type { PushSubscriptionListItemDto } from './dto/list-subscriptions.dto';
import type { AuthenticatedUser } from '../../../common/auth/types';

@Controller('comm/push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribePushDto,
  ): Promise<{ subscriptionId: string }> {
    return this.push.subscribe({
      userId: user.id,
      platform: dto.platform,
      endpoint: dto.endpoint,
      ...(dto.keys?.p256dh !== undefined ? { p256dh: dto.keys.p256dh } : {}),
      ...(dto.keys?.auth !== undefined ? { auth: dto.keys.auth } : {}),
      ...(dto.deviceLabel !== undefined ? { deviceLabel: dto.deviceLabel } : {}),
    });
  }

  /**
   * DELETE /comm/push/subscribe — отписать subscription текущего user'а.
   * Body: либо `{subscriptionId}` либо `{endpoint}`. Если оба — приоритет id.
   *
   * Idempotent: если уже soft-deleted или не существует у этого user'а — 204 (no-op).
   */
  @Delete('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnsubscribePushDto,
  ): Promise<void> {
    if (!dto.subscriptionId && !dto.endpoint) {
      throw new BadRequestException('Нужен subscriptionId или endpoint');
    }
    if (dto.subscriptionId) {
      await this.push.unsubscribeById(user.id, dto.subscriptionId);
      return;
    }
    if (dto.endpoint) {
      await this.push.unsubscribeByEndpoint(user.id, dto.endpoint);
    }
  }

  /**
   * GET /comm/push/subscriptions — список активных subscription'ов user'а.
   * Privacy: НЕ возвращаем endpoint / keys — только id, platform, deviceLabel, timestamps.
   */
  @Get('subscriptions')
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ items: PushSubscriptionListItemDto[] }> {
    const subs = await this.push.listForUser(user.id);
    return {
      items: subs.map((s) => ({
        id: s.id,
        platform: s.platform,
        deviceLabel: s.deviceLabel,
        lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }
}
