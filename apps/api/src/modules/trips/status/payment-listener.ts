/**
 * PaymentReceivedListener — auto-transition draft → paid при finance.payment.received (#160).
 *
 * Когда finance модуль (#202+) опубликует `finance.payment.received` для trip'а
 * со status='draft' → автоматически переходим в 'paid'.
 *
 * Если trip уже в другом status'е (paid/cancelled/etc.) — silent skip.
 *
 * Note: finance модуль ещё не реализован. Этот listener будет no-op до тех пор,
 * пока не появится publisher. После появления — заработает автоматически.
 *
 * Идемпотентность: гарантирована через events-bus consumer-group + processed_events.
 */
import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

import { EventsBusService } from '../../../common/events-bus/events-bus.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TripStatusService } from './trip-status.service';

import type { DomainEvent } from '../../../common/events-bus/types';

interface PaymentReceivedPayload {
  paymentId: string;
  invoiceId: string;
  // Один из этих полей должен ссылаться на Trip (формат TBD когда finance готов):
  tripId?: string;
  amount: number;
  method: string;
}

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class PaymentReceivedListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentReceivedListener.name);
  private subscription: { stop: () => void } | null = null;

  constructor(
    private readonly bus: EventsBusService,
    private readonly status: TripStatusService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.bus.subscribe<PaymentReceivedPayload>(
      'finance.payment.received',
      this.handleEvent.bind(this),
      {
        consumerGroup: 'trips-status-payment',
        consumerName: 'payment-listener-1',
      },
    );
    this.logger.log('payment-listener.started');
  }

  onModuleDestroy(): void {
    this.subscription?.stop();
    this.subscription = null;
  }

  private async handleEvent(event: DomainEvent<PaymentReceivedPayload>): Promise<void> {
    const { tripId } = event.payload;
    if (!tripId) {
      this.logger.debug({ eventId: event.id }, 'payment.no-tripId.skip');
      return;
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true },
    });
    if (!trip) {
      this.logger.warn({ tripId, eventId: event.id }, 'payment.trip-not-found');
      return;
    }
    if (trip.status !== 'draft') {
      this.logger.debug(
        { tripId, currentStatus: trip.status },
        'payment.trip-not-draft.skip',
      );
      return; // already paid / cancelled / etc.
    }

    try {
      await this.status.transition(
        tripId,
        'paid',
        'payment-received',
        SYSTEM_USER_ID,
        `paymentId=${event.payload.paymentId}`,
      );
    } catch (err) {
      this.logger.error({ err, tripId }, 'payment.auto-transition.failed');
      // Не throw — события не критичны для перепроцессинга. Manual fix через
      // PATCH /trips/:id/status если автомат не сработал.
    }
  }
}
