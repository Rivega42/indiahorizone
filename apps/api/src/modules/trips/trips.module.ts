/**
 * TripsModule — управление поездками клиентов.
 *
 * #149 — Prisma модели (Trip, Itinerary, DayPlan, Booking)
 * #150 — POST /trips (manager/admin only)
 * #151+ — editor versioning, status transitions, bookings nesting
 */
import { Module } from '@nestjs/common';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
