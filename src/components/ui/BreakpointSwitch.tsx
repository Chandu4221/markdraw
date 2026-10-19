import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Breakpoint = 1200 | 768 | 375;

export interface BreakpointSwitchProps {
  value: Breakpoint;
  onChange: (value: Breakpoint) => void;
  disabled?: boolean;
  className?: string;
}

const BREAKPOINTS: Array<{
  value: Breakpoint;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { value: 1200, label: 'Desktop 1200', icon: Monitor },
  { value: 768, label: '768', icon: Tablet },
  { value: 375, label: '375', icon: Smartphone }
];

export const BreakpointSwitch: React.FC<BreakpointSwitchProps> = ({
  value,
  onChange,
  disabled = false,
  className
}) => {
  return (
    <div
      role="group"
      aria-label="Responsive Breakpoint Selection"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] text-sm',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {BREAKPOINTS.map((bp) => {
        const Icon = bp.icon;
        const isSelected = value === bp.value;
        return (
          <button
            key={bp.value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onChange(bp.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              isSelected
                ? 'bg-[var(--color-accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span>{bp.label}</span>
          </button>
        );
      })}
    </div>
  );
};
