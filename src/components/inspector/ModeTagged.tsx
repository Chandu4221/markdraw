import React, { useState } from 'react';
import { Smartphone, Zap, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { TypePicker } from './TypePicker';
import { BreakpointSwitch, Breakpoint } from '../ui/BreakpointSwitch';
import { PlatformProfile } from '../../annotation/profiles/types';
import { parseMarkDrawMeta, MarkDrawMeta, getShapeMeta, findRootShape } from '../../annotation/shapeMeta';
import { TYPE_DEFINITIONS, isAllowedTypeFlag, TypeName } from '../../annotation/roles';
import { cn } from '@/lib/utils';

export interface ModeTaggedProps {
  shape: CanvasShape;
  allShapes: CanvasShape[];
  onSelectType: (type: string | null) => void;
  onUpdateName: (name: string) => void;
  onUpdateMeta: (patch: Partial<MarkDrawMeta>) => void;
  onUpdateRootMeta?: (patch: Partial<MarkDrawMeta>) => void;
  platformProfile?: PlatformProfile | null;
  breakpoint?: Breakpoint;
  onBreakpointChange?: (bp: Breakpoint) => void;
  initialOpenRow?: string | null;
}

export const ModeTagged: React.FC<ModeTaggedProps> = ({
  shape,
  allShapes,
  onSelectType,
  onUpdateName,
  onUpdateMeta,
  onUpdateRootMeta,
  platformProfile,
  breakpoint = 1200,
  onBreakpointChange,
  initialOpenRow = null
}) => {
  const meta = parseMarkDrawMeta(shape);
  const currentType = meta.type || null;
  const currentName = shape.name || meta.props?.label || '';

  // Accordion state: one open at a time, ALL CLOSED by default (§3.1, §3.3)
  const [openRow, setOpenRow] = useState<'responsive' | 'behavior' | 'advanced' | null>(
    (initialOpenRow as any) || null
  );

  const toggleRow = (row: 'responsive' | 'behavior' | 'advanced') => {
    setOpenRow((prev) => (prev === row ? null : row));
  };

  // Find root shape of the selected shape
  const rootShape = React.useMemo(() => {
    return findRootShape(shape, allShapes);
  }, [shape, allShapes]);

  const rootMeta = parseMarkDrawMeta(rootShape);
  const currentPlatform = rootMeta.platform || platformProfile?.id || 'web';
  const handlePlatformChange = (newPlat: string) => {
    if (shape.id === rootShape.id) {
      onUpdateMeta({ platform: newPlat });
    } else if (onUpdateRootMeta) {
      onUpdateRootMeta({ platform: newPlat });
    }
  };

  const isRootResponsiveActive =
    (rootMeta.type === 'page' || rootShape.kind === 'frame') &&
    Boolean(rootMeta.flags?.includes('responsive'));

  // Allowed flags for current Type
  const allowedFlags = React.useMemo(() => {
    if (!currentType || !(currentType in TYPE_DEFINITIONS)) return [];
    return TYPE_DEFINITIONS[currentType as TypeName]?.flags || [];
  }, [currentType]);

  const activeFlags = React.useMemo(() => {
    return (meta.flags || []).filter((f) => isAllowedTypeFlag(currentType || '', f));
  }, [meta.flags, currentType]);

  // Handle Type Change (§3.3): clears flags not on new Type allow-list, keeps Name, keeps responsive props
  const handleTypeChange = (newType: string | null) => {
    if (!newType) {
      onSelectType(null);
      return;
    }
    const filteredFlags = (meta.flags || []).filter((f) => isAllowedTypeFlag(newType, f));
    onUpdateMeta({ type: newType, role: newType, flags: filteredFlags, props: { ...meta.props } });
  };

  const handleToggleFlag = (flag: string) => {
    const current = meta.flags || [];
    const exists = current.includes(flag);
    const updated = exists ? current.filter((f) => f !== flag) : [...current, flag];
    onUpdateMeta({ flags: updated });
  };

  const handleParentOverrideChange = (parentOverride: string | null) => {
    onUpdateMeta({ parentOverride, parentId: parentOverride });
  };
  const handleStyleNoteChange = (styleNote: string) => {
    onUpdateMeta({ props: { ...meta.props, styleNote: styleNote || undefined } });
  };

  // Candidate parent shapes for override (≤4 frames per §1.2.2)
  const candidateParents = React.useMemo(() => {
    return allShapes.filter((s) => {
      if (s.id === shape.id) return false;
      if (s.kind === 'frame') return true;
      const m = getShapeMeta(s);
      return (
        m?.type === 'page' ||
        m?.type === 'section' ||
        m?.type === 'card' ||
        m?.type === 'group'
      );
    }).slice(0, 4);
  }, [allShapes, shape.id]);

  return (
    <div className="p-3 space-y-4 font-sans select-none" data-testid="mode-tagged">
      {/* 1. Type Row */}
      <TypePicker
        currentType={currentType}
        onSelectType={handleTypeChange}
        platformProfile={platformProfile}
      />

      {/* 2. Name Row */}
      <div className="space-y-1">
        <label htmlFor="mode-tagged-name-input" className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block select-none cursor-pointer">
          Name
        </label>
        <input
          id="mode-tagged-name-input"
          type="text"
          value={currentName}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder='e.g. "Hero Banner", "Submit Button"...'
          className="w-full h-9 px-3 rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors select-text"
        />
      </div>

      {/* 3. Three Icon Rows (§3.3) */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--color-line-subtle)]">
        {/* Row 1: Responsive (Smartphone) */}
        <div className="rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleRow('responsive')}
            aria-expanded={openRow === 'responsive'}
            className="w-full h-9 px-3 flex items-center justify-between text-sm font-medium text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-[var(--color-accent)] shrink-0" />
              <span>Responsive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-ink-muted)] bg-[var(--color-surface-1)] border border-[var(--color-line-subtle)]">
                {isRootResponsiveActive ? `${breakpoint}` : 'Off'}
              </span>
              <ChevronDown size={14} className={cn('text-[var(--color-ink-muted)] transition-transform', openRow === 'responsive' && 'rotate-180')} />
            </div>
          </button>
          {openRow === 'responsive' && (
            <div className="p-3 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] space-y-2">
              {isRootResponsiveActive ? (
                <div className="space-y-2">
                  <div className="text-sm text-[var(--color-ink-secondary)]">Breakpoint Viewport:</div>
                  <BreakpointSwitch value={breakpoint} onChange={(bp) => onBreakpointChange?.(bp)} />
                </div>
              ) : (
                <div className="text-sm text-[var(--color-ink-muted)] italic">
                  Turn on Responsive on the page first.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Behavior (Zap) — Hidden entirely if no flag allow-list (§3.3) */}
        {allowedFlags.length > 0 && (
          <div className="rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleRow('behavior')}
              aria-expanded={openRow === 'behavior'}
              className="w-full h-9 px-3 flex items-center justify-between text-sm font-medium text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[var(--color-accent)] shrink-0" />
                <span>Behavior</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFlags.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-accent)] bg-[var(--color-surface-1)] border border-[var(--color-line-subtle)] font-semibold">
                    {activeFlags.length} active
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={cn(
                    'text-[var(--color-ink-muted)] transition-transform',
                    openRow === 'behavior' && 'rotate-180'
                  )}
                />
              </div>
            </button>
            {openRow === 'behavior' && (
              <div className="p-3 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface-1)]">
                <div className="flex flex-wrap gap-1.5">
                  {allowedFlags.map((flag) => {
                    const isActive = (meta.flags || []).includes(flag);
                    return (
                      <button
                        key={flag}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleToggleFlag(flag)}
                        className={cn(
                          'px-2.5 py-1 text-sm font-medium rounded-full border transition-colors cursor-pointer select-none',
                          isActive ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] font-semibold shadow-xs' : 'bg-[var(--color-surface-2)] text-[var(--color-ink-muted)] border-[var(--color-line-subtle)] hover:text-[var(--color-ink-primary)]'
                        )}
                      >
                        {flag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 3: Advanced (SlidersHorizontal) */}
        <div className="rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleRow('advanced')}
            aria-expanded={openRow === 'advanced'}
            className="w-full h-9 px-3 flex items-center justify-between text-sm font-medium text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--color-accent)] shrink-0" />
              <span>Advanced</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-ink-muted)] bg-[var(--color-surface-1)] border border-[var(--color-line-subtle)]">
                {meta.parentId ? 'Custom' : 'Auto'}
              </span>
              <ChevronDown size={14} className={cn('text-[var(--color-ink-muted)] transition-transform', openRow === 'advanced' && 'rotate-180')} />
            </div>
          </button>
          {openRow === 'advanced' && (
            <div className="p-3 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] space-y-3">
              {/* Parent segmented control: Auto + enclosing frames (≤4) (§1.2.2) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block select-none">
                  Parent
                </label>
                <div
                  role="group"
                  aria-label="Parent Selection"
                  className="flex flex-wrap items-center gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] rounded-md"
                >
                  <button
                    type="button"
                    aria-pressed={!meta.parentOverride && !meta.parentId}
                    onClick={() => handleParentOverrideChange(null)}
                    className={cn(
                      'px-2.5 py-1 text-sm font-medium rounded transition-colors cursor-pointer select-none',
                      !meta.parentOverride && !meta.parentId
                        ? 'bg-[var(--color-accent)] text-white shadow-xs font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                    )}
                  >
                    Auto
                  </button>
                  {candidateParents.map((p) => {
                    const pMeta = parseMarkDrawMeta(p);
                    const label = p.name || pMeta.props?.label || `${pMeta.type || p.kind} (#${p.id.slice(0, 5)})`;
                    const isSelected = (meta.parentOverride || meta.parentId) === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleParentOverrideChange(p.id)}
                        className={cn(
                          'px-2.5 py-1 text-sm font-medium rounded transition-colors cursor-pointer select-none truncate max-w-28',
                          isSelected
                            ? 'bg-[var(--color-accent)] text-white shadow-xs font-semibold'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                        )}
                        title={label}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Automatic — from your frames & groups
                </p>
              </div>

              {/* Platform segmented control: Web | Android (per-root) (§1.2.3, §2.2) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block select-none">
                  Platform
                </label>
                <div
                  role="group"
                  aria-label="Platform Selection"
                  className="flex flex-wrap items-center gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)] rounded-md"
                >
                  <button
                    type="button"
                    aria-pressed={currentPlatform === 'web'}
                    onClick={() => handlePlatformChange('web')}
                    className={cn(
                      'px-2.5 py-1 text-sm font-medium rounded transition-colors cursor-pointer select-none',
                      currentPlatform === 'web'
                        ? 'bg-[var(--color-accent)] text-white shadow-xs font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                    )}
                  >
                    Web
                  </button>
                  <button
                    type="button"
                    aria-pressed={currentPlatform === 'android-material' || currentPlatform === 'android'}
                    onClick={() => handlePlatformChange('android-material')}
                    className={cn(
                      'px-2.5 py-1 text-sm font-medium rounded transition-colors cursor-pointer select-none',
                      currentPlatform === 'android-material' || currentPlatform === 'android'
                        ? 'bg-[var(--color-accent)] text-white shadow-xs font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-3)]'
                    )}
                  >
                    Android
                  </button>
                </div>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Target platform profile for this view
                </p>
              </div>

              {/* Style Note field (§3.3, §3.5) */}
              <div className="space-y-1">
                <label
                  htmlFor="mode-tagged-style-note"
                  className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block select-none"
                >
                  Style Note
                </label>
                <input
                  id="mode-tagged-style-note"
                  type="text"
                  placeholder="Visual styling notes or design tokens..."
                  value={meta.props?.styleNote || ''}
                  onChange={(e) => handleStyleNoteChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors select-text"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
