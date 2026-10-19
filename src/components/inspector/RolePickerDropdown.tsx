import React, { useState, useMemo } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import {
  RoleName,
  RoleCategory,
  RoleDefinition,
  searchRoles
} from '../../annotation/roles';
import { getProfile } from '../../annotation/profileLoader';
import { useCompilationOptions } from '../../core/CompilationOptionsContext';
import { Input } from '@/components/ui/input';

export interface RolePickerDropdownProps {
  currentRole?: string | null;
  roleDef?: RoleDefinition | null;
  suggestedRole: RoleName | null;
  onAssignRole: (role: RoleName | null) => void;
  platformId?: string;
}

export const RolePickerDropdown: React.FC<RolePickerDropdownProps> = ({
  currentRole,
  roleDef,
  suggestedRole,
  onAssignRole,
  platformId
}) => {
  const [roleSearch, setRoleSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const compilationCtx = useCompilationOptions();
  const effectivePlatformId =
    platformId ??
    compilationCtx?.options?.platformId ??
    compilationCtx?.options?.platform ??
    'web';

  const profile = useMemo(() => {
    try {
      return getProfile(effectivePlatformId);
    } catch {
      return undefined;
    }
  }, [effectivePlatformId]);

  const filteredGroupedRoles = useMemo(() => {
    const matched = searchRoles(roleSearch, profile);
    const groups: Record<RoleCategory, typeof matched> = {
      structure: [],
      content: [],
      interaction: [],
      navigation: [],
      feedback: [],
      utility: [],
      platform: []
    };
    matched.forEach((r) => {
      if (groups[r.category]) {
        groups[r.category].push(r);
      }
    });
    return groups;
  }, [roleSearch, profile]);

  const handleSelectRole = (role: RoleName | null) => {
    onAssignRole(role);
    setIsOpen(false);
    setRoleSearch('');
  };

  return (
    <div className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] cursor-pointer">
          Role
        </label>
        {currentRole && (
          <button
            type="button"
            aria-label="Clear semantic role"
            onClick={() => handleSelectRole(null)}
            className="text-sm font-medium text-[var(--color-danger)] hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        role="combobox"
        aria-label="Semantic role selection"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-8 px-2.5 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-line-strong)] text-left text-sm text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors cursor-pointer"
      >
        <span className="truncate">
          {currentRole ? (
            (() => {
              const displayLabel = profile?.roleAliases?.[currentRole] ?? currentRole;
              return (
                <span className="font-semibold text-[var(--color-ink-primary)]">
                  {displayLabel}{' '}
                  <span className="font-normal text-[var(--color-ink-muted)]">
                    ({displayLabel !== currentRole ? currentRole : roleDef?.category})
                  </span>
                </span>
              );
            })()
          ) : (
            <span className="text-[var(--color-ink-muted)] italic">
              Assign a semantic role...
            </span>
          )}
        </span>
        <ChevronDown size={14} className="text-[var(--color-ink-muted)] shrink-0 ml-1" />
      </button>

      {/* Role Picker Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[var(--radius-md)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] shadow-xl p-1.5 space-y-1 max-h-64 overflow-y-auto">
          <Input
            type="text"
            aria-label="Search semantic roles"
            placeholder={
              profile && profile.id !== 'web'
                ? `Search ${profile.displayName} roles...`
                : 'Search roles or aliases...'
            }
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            className="h-8 text-sm mb-1"
            autoFocus
          />

          {Object.entries(filteredGroupedRoles).map(([cat, roles]) => {
            if (roles.length === 0) return null;
            return (
              <div key={cat} className="space-y-0.5">
                <div className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-muted)] px-2 pt-1.5">
                  {cat === 'platform' ? 'Platform roles' : cat}
                </div>
                {roles.map((r) => {
                  const displayLabel = profile?.roleAliases?.[r.name] ?? r.name;
                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => handleSelectRole(r.name)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-left rounded-[var(--radius-sm)] text-sm transition-colors cursor-pointer ${
                        currentRole === r.name
                          ? 'bg-[var(--color-accent)] text-white font-semibold'
                          : 'hover:bg-[var(--color-surface-2)] text-[var(--color-ink-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{displayLabel}</span>
                        {displayLabel !== r.name && (
                          <span
                            className={`text-sm ${
                              currentRole === r.name
                                ? 'text-white/80'
                                : 'text-[var(--color-ink-muted)]'
                            }`}
                          >
                            ({r.name})
                          </span>
                        )}
                      </div>
                      {r.aliases.length > 0 && (
                        <span
                          className={`text-sm truncate max-w-24 ${
                            currentRole === r.name
                              ? 'text-white/80'
                              : 'text-[var(--color-ink-muted)]'
                          }`}
                        >
                          {r.aliases.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestions */}
      {!currentRole && suggestedRole && (
        <div className="space-y-1 pt-1">
          <div className="text-sm font-semibold text-[var(--color-ink-muted)] flex items-center gap-1">
            <Sparkles size={14} className="text-[var(--color-warning)] shrink-0" />
            <span>Suggested Role</span>
          </div>
          <button
            type="button"
            aria-label={`Assign suggested role ${suggestedRole}`}
            onClick={() => handleSelectRole(suggestedRole)}
            className="px-2.5 py-1 text-sm font-semibold rounded-[var(--radius-sm)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer"
          >
            +{suggestedRole}
          </button>
        </div>
      )}
    </div>
  );
};
