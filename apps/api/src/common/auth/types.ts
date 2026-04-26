import type { UserRole } from '@prisma/client';

/**
 * Структура аутентифицированного пользователя, attached к req.user
 * после JwtAuthGuard. Содержит только то, что было в JWT-claims —
 * без лишних DB-lookup'ов.
 */
export interface AuthenticatedUser {
  id: string;
  /** sessionId из JWT-claim. Используется для /auth/logout и audit. */
  sessionId: string;
  role: UserRole;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
