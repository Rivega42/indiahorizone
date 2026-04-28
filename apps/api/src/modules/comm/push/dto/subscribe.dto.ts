import { PushPlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * W3C Push Subscription keys — формат от browser.pushManager.subscribe().
 * Frontend передаёт subscription.toJSON().keys (см. apps/web/lib/push/subscribe.ts).
 *
 * - `p256dh`: base64url-кодированный public key, всегда 87 символов
 * - `auth`: base64url-кодированный auth secret, всегда 22 символа
 *
 * Для native (ios_native/android_native) keys = null — auth там делается
 * через серверный certificate / service-account.
 */
export class WebPushKeysDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'p256dh должен быть base64url' })
  @MinLength(80)
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'auth должен быть base64url' })
  @MinLength(20)
  @MaxLength(255)
  auth!: string;
}

export class SubscribePushDto {
  @IsEnum(PushPlatform)
  platform!: PushPlatform;

  /**
   * Web Push: длинный URL от browser.pushManager (FCM/APNs/Mozilla autopush).
   * Native: device token строкой.
   */
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  endpoint!: string;

  /**
   * Только для platform='web'. Native — keys=undefined.
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys?: WebPushKeysDto;

  /**
   * Опционально: human-readable метка устройства, detected фронтендом из
   * User-Agent (например "iOS Safari", "Chrome Desktop"). Для UI личного
   * кабинета — список устройств с push.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}
