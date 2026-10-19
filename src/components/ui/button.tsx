import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--md-text-bold)] text-[var(--md-bg)] hover:bg-[var(--md-neutral-7)] hover:text-[var(--md-neutral-0)] shadow-sm font-semibold',
        outline:
          'border border-[var(--md-border)] bg-transparent text-[var(--md-text)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] hover:border-[var(--md-border-strong)]',
        secondary:
          'bg-[var(--md-surface-raised)] text-[var(--md-text)] hover:bg-[var(--md-neutral-3)] hover:text-[var(--md-text-bold)] border border-[var(--md-border)] hover:border-[var(--md-border-strong)] font-medium',
        ghost:
          'text-[var(--md-text)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)]',
        accent:
          'bg-[var(--md-accent-subtle)] text-[var(--md-accent)] border border-[var(--md-accent)] font-semibold hover:bg-[var(--md-accent)] hover:text-white hover:border-[var(--md-accent)]',
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
