/**
 * ClientsController — endpoints профиля клиента.
 *
 * - GET   /clients/me — текущий профиль (с расшифровкой ПДн)
 * - PATCH /clients/me — обновить поля профиля (publishes clients.profile.updated)
 *
 * Доступ: только role=client (admin/concierge/manager — отдельные admin-endpoints
 * в EPIC 13). RBAC через JwtAuthGuard + @Roles('client').
 *
 * Issue: #140 [M5.C.3]
 */
import { Body, Controller, Get, NotFoundException, Patch } from '@nestjs/common';

import { ClientsService, type UpdateProfilePatch } from './clients.service';
import { UpdateClientProfileDto } from './dto/update-profile.dto';
import { CurrentUser, Roles } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';
import type { Client, ClientProfile } from '@prisma/client';

@Controller('clients')
@Roles('client')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get('me')
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Client & { profile: ClientProfile | null }> {
    const client = await this.clients.findByUserId(user.id);
    if (!client) {
      // Edge case: register прошёл, но listener ещё не отработал.
      // 404 → клиент должен retry'нуть через секунду.
      throw new NotFoundException('Client profile not yet provisioned');
    }
    return client;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateClientProfileDto,
  ): Promise<ClientProfile> {
    return this.clients.updateProfile(user.id, dto as UpdateProfilePatch);
  }
}
