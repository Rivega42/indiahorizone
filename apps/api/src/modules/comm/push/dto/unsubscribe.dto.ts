import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для DELETE /comm/push/subscribe.
 *
 * Один из двух способов идентифицировать subscription:
 * - `subscriptionId` — id из БД (предпочтительно, frontend знает после subscribe)
 * - `endpoint` — W3C endpoint URL (fallback если frontend сохранил только subscription, а id потерял)
 *
 * Если оба заданы — приоритет subscriptionId.
 * Если ничего не задано — 400 Bad Request.
 */
export class UnsubscribePushDto {
  @IsOptional()
  @IsUUID('4')
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  endpoint?: string;
}
