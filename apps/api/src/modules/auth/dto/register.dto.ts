import { UserRole } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';


/**
 * DTO для POST /auth/register.
 *
 * Минимальная валидация на уровне DTO:
 * - email: валидный формат + lowercased
 * - password: минимум 12 символов; полная zxcvbn-проверка — в AuthService
 *   (там доступен сложный score-check, который не помещается в декораторе)
 * - role (опционально): только если admin продвигает другого user'а — для
 *   публичной регистрации игнорируется на уровне сервиса (default=client).
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254, { message: 'Email слишком длинный' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль должен быть не менее 12 символов' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  password!: string;

  @IsOptional()
  @Type(() => String)
  @IsEnum(UserRole, { message: 'Недопустимая роль' })
  role?: UserRole;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  role: UserRole;
}
