import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--md-text-bold)] text-[var(--md-bg)] hover:opacity-90 shadow-sm',
        outline:
          'border border-[var(--md-border)] bg-transparent text-[var(--md-text)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)]',
        secondary:
          'bg-[var(--md-surface-raised)] text-[var(--md-text)] hover:bg-[var(--md-neutral-3)] hover:text-[var(--md-text-bold)] border border-[var(--md-border)]',
        ghost:
          'text-[var(--md-text)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)]',
        accent:
          'bg-[var(--md-accent-subtle)] text-[var(--md-accent)] border border-[var(--md-accent)] font-semibold',
        danger:
          'text-[var(--md-danger)] hover:bg-[var(--md-surface-raised)] hover:text-red-400'
      },
      size: {
        default: 'h-8 px-3 rounded-[6px]',
        sm: 'h-7 px-2 text-xs rounded-[6px]',
        lg: 'h-9 px-4 text-sm rounded-[8px]',
        icon: 'h-7 w-7 rounded-[6px] p-0 flex items-center justify-center',
        'icon-sm': 'h-6 w-6 rounded-[5px] p-0 flex items-center justify-center'
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
