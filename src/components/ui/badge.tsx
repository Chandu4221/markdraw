import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)]',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-[var(--color-ink-primary)]',
        secondary:
          'border-transparent bg-[var(--color-surface-1)] text-[var(--color-ink-muted)]',
        outline: 'border-[var(--color-line-subtle)] text-[var(--color-ink-muted)]',
        accent:
          'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
