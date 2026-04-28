import { TripStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * PATCH /trips/:id/status — manual переход (#160).
 *
 * `to` обязателен. `reason` опционален — если не задан, в payload event'а
 * пишется 'manual'. Для cancelled — рекомендуется указать осознанный reason.
 */
export class TransitionStatusDto {
  @IsEnum(TripStatus, {
    message: 'to — draft|paid|in_progress|completed|cancelled',
  })
  to!: TripStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export interface TransitionResponse {
  tripId: string;
  from: TripStatus;
  to: TripStatus;
  transitionedAt: Date;
}
