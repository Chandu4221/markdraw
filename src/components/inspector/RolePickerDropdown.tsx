import React, { useState, useMemo } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import {
  RoleName,
  RoleCategory,
  RoleDefinition,
  searchRoles
} from '../../annotation/roles';
import { Input } from '@/components/ui/input';

export interface RolePickerDropdownProps {
  currentRole?: string | null;
  roleDef?: RoleDefinition | null;
  suggestedRole: RoleName | null;
  onAssignRole: (role: RoleName | null) => void;
}

export const RolePickerDropdown: React.FC<RolePickerDropdownProps> = ({
  currentRole,
  roleDef,
  suggestedRole,
  onAssignRole
}) => {
  const [roleSearch, setRoleSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredGroupedRoles = useMemo(() => {
    const matched = searchRoles(roleSearch);
    const groups: Record<RoleCategory, typeof matched> = {
      structure: [],
      content: [],
      interaction: [],
      navigation: [],
      feedback: [],
      utility: []
    };
    matched.forEach((r) => {
      if (groups[r.category]) {
        groups[r.category].push(r);
      }
    });
    return groups;
  }, [roleSearch]);

  const handleSelectRole = (role: RoleName | null) => {
    onAssignRole(role);
    setIsOpen(false);
    setRoleSearch('');
  };

  return (
    <div className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
          Role
        </label>
        {currentRole && (
          <button
            type="button"
            onClick={() => handleSelectRole(null)}
            className="text-[11px] font-medium text-red-500 hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] hover:border-[var(--md-line-strong)] text-left text-xs text-[var(--md-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] transition-colors cursor-pointer"
      >
        <span className="truncate">
          {currentRole ? (
            <span className="font-semibold text-[var(--md-ink-primary)]">
              {currentRole}{' '}
              <span className="font-normal text-[var(--md-ink-muted)]">
                ({roleDef?.category})
              </span>
            </span>
          ) : (
            <span className="text-[var(--md-ink-muted)] italic">
              Assign a semantic role...
            </span>
          )}
        </span>
        <ChevronDown size={13} className="text-[var(--md-ink-muted)] shrink-0 ml-1" />
      </button>

      {/* Role Picker Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[var(--md-radius-md)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-1)] shadow-xl p-1.5 space-y-1 max-h-64 overflow-y-auto">
          <Input
            type="text"
            placeholder="Search 31 roles or aliases..."
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            className="h-7 text-xs mb-1"
            autoFocus
          />

          {Object.entries(filteredGroupedRoles).map(([cat, roles]) => {
            if (roles.length === 0) return null;
            return (
              <div key={cat} className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-ink-muted)] px-2 pt-1.5">
                  {cat}
                </div>
                {roles.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleSelectRole(r.name)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-left rounded-[var(--md-radius-sm)] text-xs transition-colors cursor-pointer ${
                      currentRole === r.name
                        ? 'bg-[var(--md-accent)] text-white font-semibold'
                        : 'hover:bg-[var(--md-surface-2)] text-[var(--md-ink-primary)]'
                    }`}
                  >
                    <span>{r.name}</span>
                    {r.aliases.length > 0 && (
                      <span className={`text-[10px] truncate max-w-[100px] ${currentRole === r.name ? 'text-white/80' : 'text-[var(--md-ink-muted)]'}`}>
                        {r.aliases.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestions */}
      {!currentRole && suggestedRole && (
        <div className="space-y-1 pt-1">
          <div className="text-[11px] font-semibold text-[var(--md-ink-muted)] flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500 shrink-0" />
            <span>Suggested Role</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectRole(suggestedRole)}
            className="px-2.5 py-1 text-xs font-semibold rounded-[var(--md-radius-sm)] border border-blue-500/40 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
          >
            +{suggestedRole}
          </button>
        </div>
      )}
    </div>
  );
};
