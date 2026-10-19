import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-8 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 py-1 text-sm text-[var(--md-text)] placeholder:text-[var(--md-text-subtle)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)] focus-visible:border-[var(--md-accent)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
