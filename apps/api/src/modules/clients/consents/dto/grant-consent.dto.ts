import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import type { ConsentType } from '@prisma/client';

/**
 * Granular consent request body. Поля опциональные на DTO-уровне; service
 * валидирует обязательность под конкретный `type` (URL-param):
 *
 * - pdn:                все поля пропускаются (scope = {})
 * - photo_video:        level: 1..4 (req), useName?: boolean
 * - geo:                modes: ('A'|'B'|'C'|'D')[] (req, 1-4 items)
 * - emergency_contacts: allowed: true (req)
 */
export class GrantConsentDto {
  /** photo_video: 1=личный альбом, 2=внутреннее, 3=сайт, 4=соцсети */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  level?: number;

  /** photo_video: разрешить указывать имя при публикации */
  @IsOptional()
  @IsBoolean()
  useName?: boolean;

  /** geo: A=SOS, B=tracking, C=geofence, D=analytics */
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsIn(['A', 'B', 'C', 'D'], { each: true })
  modes?: ('A' | 'B' | 'C' | 'D')[];

  /** emergency_contacts: явное согласие на хранение контактов третьих лиц */
  @IsOptional()
  @IsBoolean()
  allowed?: boolean;
}

/**
 * Public DTO ответа — GET /clients/me/consents и результат POST/DELETE.
 */
export interface ConsentResponse {
  id: string;
  type: ConsentType;
  scope: Record<string, unknown>;
  version: string;
  grantedAt: Date;
  revokedAt: Date | null;
}
