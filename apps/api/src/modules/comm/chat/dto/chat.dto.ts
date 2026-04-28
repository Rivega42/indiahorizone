import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import type { ChatMessage, ChatThread } from '@prisma/client';

/**
 * POST /chat/threads/:id/messages
 *
 * Idempotency-Key обязателен на этом endpoint'е (см. controller). Содержание тела:
 */
export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: 'Сообщение не может быть пустым' })
  @MaxLength(4000, { message: 'Сообщение слишком длинное (max 4000)' })
  body!: string;

  /** Опциональные media-attachments (UUID MediaAsset; модели появятся в #173) */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Максимум 10 attachments на сообщение' })
  @IsUUID(4, { each: true })
  attachments?: string[];
}

/**
 * GET /chat/threads/:id/messages query params
 */
export class ListMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  /**
   * Opaque base64 cursor от предыдущей страницы (`{createdAt, id}`).
   * Для первой загрузки — не передаём; service вернёт самые свежие.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}

export interface ListThreadsResponse {
  items: ChatThread[];
}

export interface ListMessagesResponse {
  items: ChatMessage[];
  /** null если страница последняя */
  nextCursor: string | null;
}
