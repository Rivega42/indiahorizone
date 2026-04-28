import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTO для POST /trips (#150).
 *
 * Только manager / admin (см. controller). Создаётся всегда в статусе `draft`.
 * status workflow → paid → in_progress → completed/cancelled — отдельные
 * endpoints (#160).
 *
 * totalAmount — в копейках/paise (BigInt в БД), для точного матча копеек
 * без float-проблем. NULL допустим: смета формируется итеративно после draft.
 *
 * Валидация `endsAt > startsAt` — на уровне сервиса (нужен парсинг дат).
 * Существование clientId — также сервис (DB-lookup).
 */
export class CreateTripDto {
  @IsUUID(4, { message: 'clientId должен быть UUIDv4' })
  clientId!: string;

  @IsDateString({}, { message: 'startsAt должен быть ISO-date' })
  startsAt!: string;

  @IsDateString({}, { message: 'endsAt должен быть ISO-date' })
  endsAt!: string;

  @IsString()
  @MinLength(2, { message: 'region не может быть пустым' })
  @MaxLength(100)
  region!: string;

  /**
   * Опциональная стартовая смета в копейках. Можно оставить NULL — заполнится
   * позже при формировании предложения (PATCH /trips/:id, #151).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'totalAmount — целое число (копейки)' })
  @Min(0)
  totalAmount?: number;

  /**
   * ISO 4217. Default RUB на уровне БД.
   */
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @MinLength(3)
  currency?: string;
}

export interface CreateTripResponse {
  tripId: string;
}
