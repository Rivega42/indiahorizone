import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshDto {
  @IsString()
  @MinLength(40, { message: 'Невалидный refresh-токен' })
  @MaxLength(256, { message: 'Невалидный refresh-токен' })
  refreshToken!: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
