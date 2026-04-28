import { useId } from 'react';

import { Input, type InputProps } from './input';
import { Label } from './label';
import { cn } from '../../lib/utils';

interface FieldProps extends Omit<InputProps, 'id'> {
  label: string;
  /** Helper-текст под полем (если нет ошибки). */
  helper?: string;
  /** Сообщение ошибки. Если задано — показывается вместо helper. */
  error?: string;
  /** Маркер обязательного поля. */
  required?: boolean;
}

/**
 * Composite поле формы: Label + Input + helper/error.
 *
 * Use:
 *   <Field label="Email" type="email" required helper="Только корпоративный" />
 *   <Field label="Пароль" type="password" error="Слишком короткий" />
 */
export function Field({
  label,
  helper,
  error,
  required,
  className,
  ...inputProps
}: FieldProps): React.ReactElement {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const messageId = hasError ? errorId : helper ? helperId : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} required={required ?? false}>
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={messageId}
        aria-required={required ? true : undefined}
        {...inputProps}
      />
      {hasError ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
