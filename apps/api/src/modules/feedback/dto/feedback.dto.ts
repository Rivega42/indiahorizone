import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { FeedbackMood, FeedbackType } from '@prisma/client';

import type { Feedback } from '@prisma/client';

/**
 * POST /feedback (#188).
 *
 * Idempotency-Key header обязателен (см. controller). Body:
 */
export class CreateFeedbackDto {
  @IsUUID(4, { message: 'tripId должен быть UUIDv4' })
  tripId!: string;

  @IsInt()
  @Min(1)
  @Max(365, { message: 'dayNumber 1-365 (длинные poездки exotic)' })
  dayNumber!: number;

  @IsEnum(FeedbackType, { message: 'type — text или circle' })
  type!: FeedbackType;

  @IsString()
  @MinLength(1, { message: 'body не может быть пустым' })
  @MaxLength(4000)
  body!: string;

  @IsEnum(FeedbackMood, {
    message: 'mood — bad | neutral | ok | good | excellent',
  })
  mood!: FeedbackMood;

  /**
   * Для type=circle — UUID MediaAsset (#173 будущий).
   * Сейчас валидируется только формат, существование asset'а не проверяется.
   */
  @IsOptional()
  @IsUUID(4, { message: 'mediaId должен быть UUIDv4' })
  mediaId?: string;
}

export interface ListFeedbacksResponse {
  items: Feedback[];
}
