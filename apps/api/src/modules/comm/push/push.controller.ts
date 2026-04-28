/**
 * PushController — endpoints для управления push-subscription'ами (#163).
 *
 * - POST /comm/push/subscribe — подписать текущее устройство user'а.
 *   Frontend (#356) вызывает после browser.pushManager.subscribe().
 *
 * Будущее (V2):
 * - DELETE /comm/push/subscribe — отписать с этого устройства
 * - GET /comm/push/subscriptions — список устройств user'а (для UI)
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SubscribePushDto } from './dto/subscribe.dto';
import { PushService } from './push.service';
import { CurrentUser } from '../../../common/auth/decorators';

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
}
