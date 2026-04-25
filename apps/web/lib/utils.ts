import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет Tailwind-классы с дедупликацией conflicting utilities.
 * Используется в shadcn/ui-компонентах.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
