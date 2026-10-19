import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[4px] border px-2 py-0.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--md-accent-ring)]',
  {
    variants: {
      variant: {
        default:
          'border-[var(--md-border)] bg-[var(--md-surface-raised)] text-[var(--md-text)]',
        secondary:
          'border-transparent bg-[var(--md-surface)] text-[var(--md-text-muted)]',
        outline: 'border-[var(--md-border)] text-[var(--md-text-muted)]',
        accent:
          'border-[var(--md-accent)] bg-[var(--md-accent-subtle)] text-[var(--md-accent)] font-semibold'
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
