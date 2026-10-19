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
    bg: 'bg-[var(--color-role-structure-bg)]',
    text: 'text-[var(--color-role-structure)]',
    border: 'border-[var(--color-role-structure)]/30'
  },
  content: {
    bg: 'bg-[var(--color-role-content-bg)]',
    text: 'text-[var(--color-role-content)]',
    border: 'border-[var(--color-role-content)]/30'
  },
  interaction: {
    bg: 'bg-[var(--color-role-interaction-bg)]',
    text: 'text-[var(--color-role-interaction)]',
    border: 'border-[var(--color-role-interaction)]/30'
  },
  navigation: {
    bg: 'bg-[var(--color-role-nav-bg)]',
    text: 'text-[var(--color-role-nav)]',
    border: 'border-[var(--color-role-nav)]/30'
  },
  feedback: {
    bg: 'bg-[var(--color-role-feedback-bg)]',
    text: 'text-[var(--color-role-feedback)]',
    border: 'border-[var(--color-role-feedback)]/30'
  },
  utility: {
    bg: 'bg-[var(--color-role-utility-bg)]',
    text: 'text-[var(--color-role-utility)]',
    border: 'border-[var(--color-role-utility)]/30'
  },
  platform: {
    bg: 'bg-[var(--color-role-platform-bg)]',
    text: 'text-[var(--color-role-platform)]',
    border: 'border-[var(--color-role-platform)]/30'
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
      'bg-[var(--color-type-structure)]/15 text-[var(--color-type-structure)] border border-[var(--color-type-structure)]/30 font-mono font-bold';
  } else if (variant === 'untagged') {
    variantClasses =
      'bg-[var(--color-untagged-chip-bg)] text-[var(--color-untagged-chip-text)] border border-dashed border-[var(--color-line-subtle)]';
  } else if (variant === 'lint') {
    variantClasses =
      'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30';
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
