import React from 'react';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { TypePicker } from './TypePicker';
import { parseMarkDrawMeta } from '../../annotation/shapeMeta';
import { PlatformProfile } from '../../annotation/profiles/types';

export interface ModeUntaggedProps {
  shape: CanvasShape;
  onSelectType: (type: string | null) => void;
  onUpdateName: (name: string) => void;
  platformProfile?: PlatformProfile | null;
}

export const ModeUntagged: React.FC<ModeUntaggedProps> = ({
  shape,
  onSelectType,
  onUpdateName,
  platformProfile
}) => {
  const meta = parseMarkDrawMeta(shape);
  const currentName = shape.name || meta.props?.label || '';

  return (
    <div
      className="p-3 space-y-4 font-sans select-none"
      data-testid="mode-untagged"
    >
      {/* 1. Type Picker */}
      <TypePicker
        currentType={meta.type || null}
        onSelectType={onSelectType}
        platformProfile={platformProfile}
      />

      {/* 2. Name input (optional) */}
      <div className="space-y-1">
        <label
          htmlFor="mode-untagged-name-input"
          className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block select-none cursor-pointer"
        >
          Name
        </label>
        <input
          id="mode-untagged-name-input"
          type="text"
          value={currentName}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder='e.g. "Hero Banner", "Submit Button"...'
          className="w-full h-9 px-3 rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors select-text"
        />
      </div>
    </div>
  );
};
