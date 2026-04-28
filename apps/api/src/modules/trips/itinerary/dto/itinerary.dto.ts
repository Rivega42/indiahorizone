import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import type { DayPlan, Itinerary } from '@prisma/client';

/**
 * Один день в маршруте при PATCH /trips/:id/itinerary (#151).
 *
 * items — JSONB-массив плана дня. Структуру не валидируем в DTO (свободный
 * JSON, разные дни — разные структуры). Validation глубокая — на уровне
 * UI и шаблонов в админке (EPIC 13).
 */
export class DayPlanInputDto {
  @IsInt()
  @Min(1)
  dayNumber!: number;

  /** ISO date 'YYYY-MM-DD' либо ISO datetime — Prisma приведёт к Date. */
  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(500)
  summary!: string;

  /** Свободный массив плана дня. */
  @IsArray()
  items!: unknown[];
}

/**
 * PATCH /trips/:id/itinerary — создаёт новую draft-version.
 * Полная замена days (не diff — caller присылает финальный массив, сервер
 * сравнивает и компонует diff на publish step).
 */
export class UpsertItineraryDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Itinerary должен иметь хотя бы один день' })
  @ValidateNested({ each: true })
  @Type(() => DayPlanInputDto)
  days!: DayPlanInputDto[];
}

export interface ItineraryWithDays extends Itinerary {
  days: DayPlan[];
}

export interface CreateVersionResponse {
  itineraryId: string;
  version: number;
  daysCount: number;
}

export interface PublishResponse {
  itineraryId: string;
  version: number;
  publishedAt: Date;
  diff: {
    addedDays: number[];
    removedDays: number[];
    changedDays: number[];
    /** Был ли previously published itinerary. false = первая публикация. */
    hadPrevious: boolean;
  };
}
