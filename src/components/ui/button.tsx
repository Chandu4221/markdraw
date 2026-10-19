import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-ink-primary)] text-[var(--color-surface-0)] hover:bg-[var(--color-surface-4)] hover:text-[var(--color-surface-0)] shadow-sm font-semibold',
        outline:
          'border border-[var(--color-line-subtle)] bg-transparent text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-primary)] hover:border-[var(--color-line-strong)]',
        secondary:
          'bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-ink-primary)] border border-[var(--color-line-subtle)] hover:border-[var(--color-line-strong)] font-medium',
        ghost:
          'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-primary)]',
        accent:
          'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)] font-semibold hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)]',
        brand:
          'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs border border-[var(--color-line-subtle)] font-medium',
        primary:
          'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs font-medium',
        success:
          'bg-[var(--color-success)] hover:opacity-90 text-white shadow-xs font-medium',
        danger:
          'text-[var(--color-danger)] bg-transparent hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-danger)]'
      },
      size: {
        default: 'h-8 px-3 rounded-md',
        sm: 'h-7 px-2.5 text-sm rounded-md',
        lg: 'h-9 px-4 text-base rounded-lg',
        icon: 'h-7 w-7 rounded-md p-0 flex items-center justify-center',
        'icon-sm': 'h-7 w-7 rounded-md p-0 flex items-center justify-center'
      }
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
