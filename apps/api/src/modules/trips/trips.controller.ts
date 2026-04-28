/**
 * TripsController — endpoints управления поездками.
 *
 * - POST /trips — создание Trip менеджером/админом (#150)
 *
 * Будущее: PATCH/DELETE/list, bookings nested — отдельные issues.
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { CreateTripDto, type CreateTripResponse } from './dto/create-trip.dto';
import { TripsService } from './trips.service';
import { CurrentUser, Roles } from '../../common/auth/decorators';

import type { AuthenticatedUser } from '../../common/auth/types';

@Controller('trips')
@Roles('manager', 'admin')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
}
