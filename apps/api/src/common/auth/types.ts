import type { UserRole } from '@prisma/client';

/**
 * Структура аутентифицированного пользователя, attached к req.user
 * после JwtAuthGuard. Содержит только то, что было в JWT-claims —
 * без лишних DB-lookup'ов.
 */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
