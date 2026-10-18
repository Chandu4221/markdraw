import React from 'react';
import { Box, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { UnitDefinition } from '../../annotation/units';
import { RoleName } from '../../annotation/roles';

interface UnitSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  units: UnitDefinition[];
  onStampUnit: (unit: UnitDefinition) => void;
  onDeleteUnit: (id: string, e: React.MouseEvent) => void;
  showSaveDialog: boolean;
  onCloseSaveDialog: () => void;
  onSaveUnit: () => void;
  newUnitName: string;
  onNewUnitNameChange: (name: string) => void;
  newUnitBaseRole: RoleName;
  onNewUnitBaseRoleChange: (role: RoleName) => void;
}

export const UnitSection: React.FC<UnitSectionProps> = ({
  isOpen,
  onToggle,
  units,
  onStampUnit,
  onDeleteUnit,
  showSaveDialog,
  onCloseSaveDialog,
  onSaveUnit,
  newUnitName,
  onNewUnitNameChange,
  newUnitBaseRole,
  onNewUnitBaseRoleChange
}) => {
  return (
    <div className="border-t border-[var(--md-line-subtle)]">
      <button
        type="button"
        id="accordion-header-units"
        onClick={onToggle}
        className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Box size={13} className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] shrink-0 transition-colors" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors whitespace-nowrap shrink-0">
            Custom Units
          </span>
          {units.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-[var(--md-ink-muted)] bg-[var(--md-surface-2)] border border-[var(--md-line-subtle)] rounded shrink-0">
              {units.length}
            </span>
          )}
        </div>
        <div className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors shrink-0">
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 pt-2 space-y-2 bg-[var(--md-surface-1)]">
          {units.length === 0 ? (
            <div className="text-[11px] text-[var(--md-ink-muted)] italic py-1 leading-normal">
              Multi-select shapes on canvas to save them as reusable units.
            </div>
          ) : (
            <div className="space-y-1">
              {units.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] hover:bg-[var(--md-surface-3)] transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-[var(--md-ink-primary)] truncate">{u.name}</div>
                    <div className="text-[10px] text-[var(--md-ink-muted)] font-mono">
                      Base: {u.baseRole} • {u.memberRoles?.length || 0} items
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onStampUnit(u)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-[var(--md-radius-sm)] bg-purple-600 text-white hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors cursor-pointer"
                    >
                      Stamp
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDeleteUnit(u.id, e)}
                      className="p-1 rounded text-[var(--md-ink-muted)] hover:text-red-500 hover:bg-[var(--md-surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Unit Dialog */}
      {showSaveDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            className="w-80 rounded-xl border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--md-line-subtle)] pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--md-ink-primary)]">
                <Box size={14} className="text-purple-500" />
                <span>Save as Custom Unit</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--md-ink-muted)] uppercase tracking-wider block">
                Unit Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Follow Card, Pricing Tier"
                value={newUnitName}
                onChange={(e) => onNewUnitNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveUnit();
                  if (e.key === 'Escape') onCloseSaveDialog();
                }}
                className="w-full h-8 px-2.5 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] text-xs text-[var(--md-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--md-ink-muted)] uppercase tracking-wider block">
                Base Spec Role
              </label>
              <select
                value={newUnitBaseRole}
                onChange={(e) => onNewUnitBaseRoleChange(e.target.value as RoleName)}
                className="w-full h-8 px-2 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] text-xs text-[var(--md-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] cursor-pointer"
              >
                <option value="card">Card (Container)</option>
                <option value="section">Section</option>
                <option value="navbar">Navbar</option>
                <option value="dialog">Dialog / Modal</option>
                <option value="group">Group (Generic)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-line-subtle)]">
              <button
                type="button"
                onClick={onCloseSaveDialog}
                className="px-3 py-1.5 text-xs text-[var(--md-ink-muted)] hover:text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-2)] rounded-[var(--md-radius-sm)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveUnit}
                disabled={!newUnitName.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-[var(--md-radius-sm)] bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Save Unit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
