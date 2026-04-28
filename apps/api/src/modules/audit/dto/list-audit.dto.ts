import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import type { AuditEvent } from '@prisma/client';

/**
 * Query DTO для GET /audit (#219).
 *
 * Все фильтры опциональные. Cursor-based pagination (opaque base64).
 */
export class ListAuditQueryDto {
  /**
   * Точный type или префикс (для prefix-search). Без wildcard'ов.
   * Сервис делает: точный match если без точки в конце, prefix-match если type ends with `.`
   * Пример: `auth.user.registered` (точный), `auth.` (все auth.*).
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9._-]+$/, { message: 'type — только lowercase, точки/подчёркивания/дефисы' })
  type?: string;

  /** actor.id (UUID юзера/системы) */
  @IsOptional()
  @IsUUID(4)
  actorId?: string;

  /** actor.type — user/system/gateway */
  @IsOptional()
  @IsIn(['user', 'system', 'gateway'])
  actorType?: 'user' | 'system' | 'gateway';

  /** Нижняя граница occurredAt (ISO date) */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Верхняя граница occurredAt (ISO date) */
  @IsOptional()
  @IsDateString()
  to?: string;

  /**
   * Page size (default 50, max 200).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  /**
   * Opaque base64-encoded `{recordedAt, eventId}` от предыдущей страницы.
   * Получается из response.nextCursor.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}

export interface ListAuditResponse {
  items: AuditEvent[];
  /** null если страница последняя */
  nextCursor: string | null;
}
