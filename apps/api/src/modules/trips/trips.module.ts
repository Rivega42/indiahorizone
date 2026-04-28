/**
 * TripsModule — управление поездками клиентов.
 *
 * #149 — Prisma модели (Trip, Itinerary, DayPlan, Booking)
 * #150 — POST /trips (manager/admin only)
 * #151 — itinerary versioning + publish + GET (manager/admin → draft, all roles → read latest published)
 * #160 — TripStatus state machine + PATCH /trips/:id/status + listener finance.payment.received
 * #361 — GET /trips/me + GET /trips/:id (client/manager/admin)
 */
import { Module } from '@nestjs/common';

import { ItineraryController } from './itinerary/itinerary.controller';
import { ItineraryService } from './itinerary/itinerary.service';
import { PaymentReceivedListener } from './status/payment-listener';
import { TripStatusScheduler } from './status/trip-status.scheduler';
import { TripStatusService } from './status/trip-status.service';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { EventsBusModule } from '../../common/events-bus/events-bus.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, EventsBusModule],
  controllers: [TripsController, ItineraryController],
  providers: [
    TripsService,
    ItineraryService,
    TripStatusService,
    PaymentReceivedListener,
    TripStatusScheduler,
  ],
  exports: [TripsService, ItineraryService, TripStatusService],
})
export class TripsModule {}
