import React from 'react';
import { Box } from 'lucide-react';
import { CanvasShape } from '../../canvas/port/CanvasShape';
import { TypePicker } from './TypePicker';
import { PlatformProfile } from '../../annotation/profiles/types';
import { parseMarkDrawMeta } from '../../annotation/shapeMeta';

export interface ModeTaggedMultiProps {
  shapes: CanvasShape[];
  onBulkSelectType: (type: string | null) => void;
  onSaveUnitGesture: () => void;
  platformProfile?: PlatformProfile | null;
}

export const ModeTaggedMulti: React.FC<ModeTaggedMultiProps> = ({
  shapes,
  onBulkSelectType,
  onSaveUnitGesture,
  platformProfile
}) => {
  const types = shapes.map((s) => parseMarkDrawMeta(s).type);
  const commonType = types.every((t) => t === types[0]) ? types[0] || null : null;

  return (
    <div className="p-3 space-y-4 font-sans select-none" data-testid="mode-tagged-multi">
      {/* 1. Bulk Type Picker */}
      <TypePicker
        currentType={commonType}
        onSelectType={onBulkSelectType}
        platformProfile={platformProfile}
      />

      {/* 2. Save as Unit Button Only (§3.1) */}
      <div className="pt-2 border-t border-[var(--color-line-subtle)]">
        <button
          type="button"
          onClick={onSaveUnitGesture}
          className="w-full h-9 flex items-center justify-center gap-2 px-3 text-sm font-semibold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] shadow-xs"
        >
          <Box size={16} className="shrink-0" />
          <span>Save as unit</span>
        </button>
      </div>
    </div>
  );
};
