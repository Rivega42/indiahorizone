/**
 * ItineraryController — версионированный маршрут поездки (#151).
 *
 * PATCH  /trips/:id/itinerary          — manager/admin: создать/обновить draft
 * POST   /trips/:id/itinerary/publish  — manager/admin: опубликовать draft
 * GET    /trips/:id/itinerary          — client (own) + manager+ : last published
 *
 * RBAC routing — частично через @Roles, частично service.assertReadAccess
 * (для GET где разные роли видят разное).
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  type CreateVersionResponse,
  type ItineraryWithDays,
  type PublishResponse,
  UpsertItineraryDto,
} from './dto/itinerary.dto';
import { ItineraryService } from './itinerary.service';
import { CurrentUser, Roles } from '../../../common/auth/decorators';

import type { AuthenticatedUser } from '../../../common/auth/types';

@Controller('trips')
export class ItineraryController {
  constructor(private readonly itinerary: ItineraryService) {}

  @Patch(':id/itinerary')
  @HttpCode(HttpStatus.OK)
  @Roles('manager', 'admin')
  async upsertDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) tripId: string,
    @Body() dto: UpsertItineraryDto,
  ): Promise<CreateVersionResponse> {
    return this.itinerary.upsertDraft(tripId, user.id, dto.days);
  }

  @Post(':id/itinerary/publish')
  @HttpCode(HttpStatus.OK)
  @Roles('manager', 'admin')
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ): Promise<PublishResponse> {
    return this.itinerary.publishLatest(tripId, user.id);
  }

  @Get(':id/itinerary')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ): Promise<ItineraryWithDays> {
    return this.itinerary.getLatestPublished(tripId, user.id, user.role);
  }
}
