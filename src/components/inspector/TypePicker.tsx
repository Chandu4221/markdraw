import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import {
  TYPE_LIST,
  TypeCategory,
  searchTypes
} from '../../annotation/roles';
import { getTypeIcon } from '../../annotation/typeIcons';
import { PlatformProfile } from '../../annotation/profiles/types';
import { cn } from '@/lib/utils';

export interface TypePickerProps {
  currentType: string | null;
  onSelectType: (type: string | null) => void;
  platformProfile?: PlatformProfile | null;
  disabled?: boolean;
  className?: string;
  defaultOpen?: boolean;
}

const CATEGORY_ORDER: Array<{ key: TypeCategory; label: string }> = [
  { key: 'structure', label: 'Structure' },
  { key: 'content', label: 'Content' },
  { key: 'interaction', label: 'Interaction' },
  { key: 'navigation', label: 'Navigation' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'platform', label: 'Platform' }
];

export const TypePicker: React.FC<TypePickerProps> = ({
  currentType,
  onSelectType,
  platformProfile,
  disabled = false,
  className,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    structure: true,
    content: true
  });

  const matchingTypes = useMemo(() => {
    return searchTypes(searchQuery, platformProfile);
  }, [searchQuery, platformProfile]);

  const CurrentIcon = currentType ? getTypeIcon(currentType) : null;

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const handleSelect = (t: string | null) => {
    onSelectType(t);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] select-none">
          Type
        </label>
        {currentType && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="text-sm font-medium text-[var(--color-danger)] hover:underline cursor-pointer select-none"
            aria-label="Clear Type"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        role="combobox"
        aria-label="Type Selection"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-9 px-3 flex items-center justify-between rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-left text-sm text-[var(--color-ink-primary)] hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors cursor-pointer select-none',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {CurrentIcon ? (
            <CurrentIcon size={16} className="text-[var(--color-accent)] shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full border border-dashed border-[var(--color-ink-muted)] shrink-0" />
          )}
          <span className="truncate capitalize font-medium">
            {currentType ? currentType : 'Select Type...'}
          </span>
        </div>
        <ChevronDown size={14} className="text-[var(--color-ink-muted)] shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose Type"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] shadow-xl overflow-hidden text-sm flex flex-col max-h-80 select-none"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] flex items-center gap-2 shrink-0">
            <Search size={14} className="text-[var(--color-ink-muted)] shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Groups / Search Results */}
          <div className="overflow-y-auto p-1 divide-y divide-[var(--color-line-subtle)]">
            {searchQuery ? (
              matchingTypes.length === 0 ? (
                <div className="p-3 text-center text-sm text-[var(--color-ink-muted)]">
                  No matching types found.
                </div>
              ) : (
                <div className="p-1 space-y-0.5">
                  {matchingTypes.map((def) => {
                    const Icon = getTypeIcon(def.name);
                    const isSelected = currentType === def.name;
                    const platformName = platformProfile?.roleAliases?.[def.name];
                    return (
                      <button
                        key={def.name}
                        type="button"
                        onClick={() => handleSelect(def.name)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-sm text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-[var(--color-accent)] text-white font-semibold'
                            : 'text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon size={16} className="shrink-0" />
                          <span className="capitalize">{def.name}</span>
                          {platformName && (
                            <span className="text-sm opacity-75">
                              ({platformName})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              CATEGORY_ORDER.map(({ key, label }) => {
                const typesInCat = TYPE_LIST.filter((def) => {
                  if (def.category !== key) return false;
                  if (def.category === 'platform' && !platformProfile?.extraRoles?.[def.name]) {
                    return false;
                  }
                  return true;
                });
                if (typesInCat.length === 0) return null;

                const isExpanded = Boolean(expandedCategories[key]);

                return (
                  <div key={key} className="py-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between px-2 py-1 text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] cursor-pointer"
                    >
                      <span>{label}</span>
                      <ChevronDown
                        size={12}
                        className={cn('transition-transform', !isExpanded && '-rotate-90')}
                      />
                    </button>
                    {isExpanded && (
                      <div className="mt-1 space-y-0.5">
                        {typesInCat.map((def) => {
                          const Icon = getTypeIcon(def.name);
                          const isSelected = currentType === def.name;
                          const platformName = platformProfile?.roleAliases?.[def.name];
                          return (
                            <button
                              key={def.name}
                              type="button"
                              onClick={() => handleSelect(def.name)}
                              className={cn(
                                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-sm text-left transition-colors cursor-pointer',
                                isSelected
                                  ? 'bg-[var(--color-accent)] text-white font-semibold'
                                  : 'text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Icon size={16} className="shrink-0" />
                                <span className="capitalize">{def.name}</span>
                                {platformName && (
                                  <span className="text-sm opacity-75">
                                    ({platformName})
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
