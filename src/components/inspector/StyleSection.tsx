import React from 'react';
import { Palette, ChevronDown, ChevronRight } from 'lucide-react';

interface StyleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  styles?: Record<string, unknown> | null;
}

export const StyleSection: React.FC<StyleSectionProps> = ({
  isOpen,
  onToggle,
  styles: _styles
}) => {
  return (
    <div className="border-t border-[var(--md-line-subtle)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-2)] transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <Palette size={14} className="text-[var(--md-accent)]" />
          <span>Visual Styles</span>
        </span>
        <span className="text-[var(--md-ink-muted)] shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="p-2 border-t border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] text-xs text-[var(--color-ink-muted)]">
          <span>Styles managed via canvas tool settings</span>
        </div>
      )}
    </div>
  );
};
