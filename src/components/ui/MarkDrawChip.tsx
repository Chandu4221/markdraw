import React from 'react';
import { RoleName, RoleCategory, ROLE_DEFINITIONS } from '../../annotation/roles';

export type ChipVariant = 'role' | 'unit' | 'untagged' | 'lint';

export interface MarkDrawChipProps {
  variant?: ChipVariant;
  role?: string | null;
  category?: RoleCategory;
  label?: string;
  size?: 'sm' | 'md';
  clickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
}

const CATEGORY_COLOR_STYLES: Record<
  RoleCategory,
  { bg: string; text: string; border: string }
> = {
  structure: {
    bg: 'bg-[var(--md-role-structure-bg)]',
    text: 'text-[var(--md-role-structure)]',
    border: 'border-[var(--md-role-structure)]/30'
  },
  content: {
    bg: 'bg-[var(--md-role-content-bg)]',
    text: 'text-[var(--md-role-content)]',
    border: 'border-[var(--md-role-content)]/30'
  },
  interaction: {
    bg: 'bg-[var(--md-role-interaction-bg)]',
    text: 'text-[var(--md-role-interaction)]',
    border: 'border-[var(--md-role-interaction)]/30'
  },
  navigation: {
    bg: 'bg-[var(--md-role-nav-bg)]',
    text: 'text-[var(--md-role-nav)]',
    border: 'border-[var(--md-role-nav)]/30'
  },
  feedback: {
    bg: 'bg-[var(--md-role-feedback-bg)]',
    text: 'text-[var(--md-role-feedback)]',
    border: 'border-[var(--md-role-feedback)]/30'
  },
  utility: {
    bg: 'bg-[var(--md-role-utility-bg)]',
    text: 'text-[var(--md-role-utility)]',
    border: 'border-[var(--md-role-utility)]/30'
  },
  platform: {
    bg: 'bg-[var(--md-role-platform-bg)]',
    text: 'text-[var(--md-role-platform)]',
    border: 'border-[var(--md-role-platform)]/30'
  }
};

export const MarkDrawChip: React.FC<MarkDrawChipProps> = ({
  variant = 'role',
  role,
  category: propCategory,
  label,
  size = 'sm',
  clickable = false,
  onClick,
  className = '',
  title
}) => {
  const displayLabel = label ?? role ?? (variant === 'untagged' ? 'untagged' : '');

  const resolvedCategory: RoleCategory =
    propCategory ||
    (role && (ROLE_DEFINITIONS[role as RoleName]?.category as RoleCategory)) ||
    'interaction';

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-sm leading-tight'
      : 'px-2.5 py-1 text-sm leading-normal';

  let variantClasses = '';
  if (variant === 'role') {
    const catStyle = CATEGORY_COLOR_STYLES[resolvedCategory] || CATEGORY_COLOR_STYLES.interaction;
    variantClasses = `${catStyle.bg} ${catStyle.text} border ${catStyle.border}`;
  } else if (variant === 'unit') {
    variantClasses =
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-mono font-bold';
  } else if (variant === 'untagged') {
    variantClasses =
      'bg-[var(--md-untagged-chip-bg)] text-[var(--md-untagged-chip-text)] border border-dashed border-[var(--md-line-subtle)]';
  } else if (variant === 'lint') {
    variantClasses =
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
  }

  const interactiveClasses = clickable
    ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none'
    : 'select-none';

  return (
    <span
      className={`inline-flex items-center rounded font-sans font-medium ${sizeClasses} ${variantClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      title={title}
    >
      {variant === 'unit' ? `[#${displayLabel}]` : displayLabel}
    </span>
  );
};
