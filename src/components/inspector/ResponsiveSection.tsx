import React from 'react';
import { Smartphone } from 'lucide-react';
import { MarkDrawMeta, RoleResponsive } from '../../annotation/types';

export interface ResponsiveSectionProps {
  firstMeta: MarkDrawMeta | null;
  hasResponsiveRoot: boolean;
  onUpdateResponsive: (patch: Partial<RoleResponsive> | null) => void;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
}

export const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  firstMeta,
  hasResponsiveRoot,
  onUpdateResponsive,
  isSimulating = false,
  onToggleSimulate
}) => {
  const currentResponsive = firstMeta?.responsive;

  return (
    <div className="space-y-1.5 pt-1 border-t border-[var(--color-line-subtle)]">
      <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] flex items-center gap-1 cursor-pointer">
        <Smartphone size={14} className="text-[var(--color-ink-muted)]" />
        <span>Responsive</span>
      </label>

      {hasResponsiveRoot ? (
        <div className="space-y-2">
          {/* Mobile visibility */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-ink-muted)] w-16 shrink-0">Mobile:</span>
            <select
              value={currentResponsive?.smVisible || 'visible'}
              onChange={(e) => {
                const val = e.target.value as RoleResponsive['smVisible'];
                onUpdateResponsive(val === 'visible' && !currentResponsive?.primary && !currentResponsive?.smFullWidth ? null : { smVisible: val });
              }}
              className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] px-2 text-sm text-[var(--color-ink-primary)] hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors cursor-pointer"
            >
              <option value="visible">Visible on Mobile</option>
              <option value="hidden">Hidden on Mobile</option>
              <option value="collapse:drawer">Collapse to Drawer</option>
              <option value="collapse:bottom-bar">Collapse to Bottom Bar</option>
              <option value="collapse:hamburger">Collapse to Hamburger</option>
            </select>
          </div>

          {/* Tablet reflow */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-ink-muted)] w-16 shrink-0">Tablet:</span>
            <select
              value={currentResponsive?.tablet || 'maintain'}
              onChange={(e) => {
                const val = e.target.value as RoleResponsive['tablet'];
                onUpdateResponsive({ tablet: val });
              }}
              className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] px-2 text-sm text-[var(--color-ink-primary)] hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors cursor-pointer"
            >
              <option value="maintain">Maintain Layout</option>
              <option value="stack">Stack Vertically</option>
              <option value="2-col">2 Columns</option>
            </select>
          </div>

          {/* Quick flags */}
          <div className="flex items-center gap-3 pt-0.5">
            <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(currentResponsive?.primary)}
                onChange={(e) => onUpdateResponsive({ primary: e.target.checked })}
                className="rounded border-[var(--color-line-subtle)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span>Primary</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(currentResponsive?.smFullWidth)}
                onChange={(e) => onUpdateResponsive({ smFullWidth: e.target.checked })}
                className="rounded border-[var(--color-line-subtle)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span>Full Width (Mobile)</span>
            </label>
          </div>
          {/* Simulate Responsive Toggle */}
          {onToggleSimulate && (
            <div className="flex items-center justify-between pt-1.5 border-t border-[var(--color-line-subtle)]">
              <span className="text-sm font-medium text-[var(--color-ink-primary)]">
                Simulate responsive
              </span>
              <button
                type="button"
                onClick={onToggleSimulate}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSimulating ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-3)]'
                }`}
                role="switch"
                aria-checked={isSimulating}
                aria-label="Simulate responsive layout"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isSimulating ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-[var(--color-ink-muted)] italic py-1">
          Enable Responsive on the root page first.
        </div>
      )}
    </div>
  );
};
