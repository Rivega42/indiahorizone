/**
 * TripsController — endpoints управления поездками.
 *
 * - POST /trips      — создание Trip менеджером/админом (#150)
 * - GET  /trips/me   — список trip'ов с RBAC (#361)
 * - GET  /trips/:id  — детали trip (#361)
 *
 * Note: PATCH /trips/:id/itinerary и связанные — в ItineraryController (#151).
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { CreateTripDto, type CreateTripResponse } from './dto/create-trip.dto';
import { TripsService } from './trips.service';
import { CurrentUser, Roles } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';
import type { Trip } from '@prisma/client';

@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  /**
   * POST /trips — создание trip'а. Только manager / admin.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTripDto,
  ): Promise<CreateTripResponse> {
    const totalAmount = dto.totalAmount !== undefined ? BigInt(dto.totalAmount) : undefined;
    return this.trips.createTrip({
      clientId: dto.clientId,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      region: dto.region,
      ...(totalAmount !== undefined ? { totalAmount } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      createdBy: user.id,
    });
  }

  /**
   * GET /trips/me — список trip'ов с фильтром по role:
   * - client → only own
   * - manager → only created-by-self
   * - admin/concierge/finance → все (top 100)
   */
  @Get('me')
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ items: Trip[] }> {
    const items = await this.trips.listForUser(user.id, user.role);
    return { items };
  }

  /**
   * GET /trips/:id — детали одной trip с RBAC.
   * Возвращает Trip + bookingsCount + hasPublishedItinerary.
   */
  @Get(':id')
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) tripId: string,
  ): Promise<{
    trip: Trip;
    bookingsCount: number;
    hasPublishedItinerary: boolean;
  }> {
    return this.trips.findById(user.id, user.role, tripId);
  }
}
