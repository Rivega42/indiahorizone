import { NotificationCategory, NotificationChannel } from '@prisma/client';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';

/**
 * PATCH /comm/preferences/:category — частичное обновление предпочтений
 * для конкретной категории.
 */
export class UpdatePreferenceDto {
  /** Полная замена массива каналов. Чтобы выключить все — пустой массив. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  /** Глобальный on/off для категории. SOS — service не принимает false. */
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export interface PreferenceItem {
  category: NotificationCategory;
  channels: NotificationChannel[];
  enabled: boolean;
  /** true если row реально есть в БД (custom user preference);
   *  false — возвращаем default. */
  isCustom: boolean;
}

export interface ListPreferencesResponse {
  items: PreferenceItem[];
}
