import React from 'react';
import { RotateCcw, Sliders } from 'lucide-react';
import { CompilationOptions } from '../core/types';
import { useRenderMode, setRenderMode, RenderMode } from '../core/renderMode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: Required<CompilationOptions>;
  onChange: (options: Required<CompilationOptions>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChange
}) => {
  const renderMode = useRenderMode();

  const handleReset = () => {
    onChange({
      containmentThreshold: 0.85,
      rowClusterThreshold: 16,
      gridBandThreshold: 32,
      sizeBucketTolerance: 2,
      alignTolerance: 3,
      includeTimestamp: false,
      includeLegend: false,
      pageNote: options.pageNote || '',
      platform: options.platform ?? 'web',
      scope: options.scope ?? null,
      units: options.units ?? []
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="h-12 px-4 border-b border-[var(--md-border)] flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[var(--md-accent)]" />
            <DialogTitle className="text-sm font-semibold text-[var(--md-text-bold)]">
              Compiler Settings
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Tune spatial containment, tolerances, and output settings
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Containment Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-medium text-[var(--md-text)]">
                Containment Threshold
              </label>
              <span className="font-mono text-[var(--md-text-muted)]">
                {Math.round(options.containmentThreshold * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-text-subtle)] leading-normal">
              Minimum AABB overlap required to infer parent-child hierarchy.
            </p>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={options.containmentThreshold}
              onChange={(e) =>
                onChange({
                  ...options,
                  containmentThreshold: parseFloat(e.target.value)
                })
              }
              className="w-full accent-[var(--md-accent)] cursor-pointer"
            />
          </div>

          {/* Size Bucket Tolerance (A.5) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-medium text-[var(--md-text)]">
                Size Bucket Tolerance (±%)
              </label>
              <span className="font-mono text-[var(--md-text-muted)]">
                ±{options.sizeBucketTolerance ?? 2}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-text-subtle)] leading-normal">
              Snapping tolerance for width buckets (e.g. 48–52% snaps to 50%).
            </p>
            <Input
              type="number"
              min="0"
              max="10"
              value={options.sizeBucketTolerance ?? 2}
              onChange={(e) =>
                onChange({
                  ...options,
                  sizeBucketTolerance: parseInt(e.target.value, 10) || 0
                })
              }
              className="h-7 w-20 text-xs font-mono"
            />
          </div>

          {/* Align Tolerance (A.5) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-medium text-[var(--md-text)]">
                Alignment Tolerance (±%)
              </label>
              <span className="font-mono text-[var(--md-text-muted)]">
                ±{options.alignTolerance ?? 3}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--md-text-subtle)] leading-normal">
              Center-alignment tolerance within parent container.
            </p>
            <Input
              type="number"
              min="0"
              max="10"
              value={options.alignTolerance ?? 3}
              onChange={(e) =>
                onChange({
                  ...options,
                  alignTolerance: parseInt(e.target.value, 10) || 0
                })
              }
              className="h-7 w-20 text-xs font-mono"
            />
          </div>

          {/* Output Toggles */}
          <div className="pt-2 border-t border-[var(--md-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[var(--md-text)]">
                  Include Semantic Legend
                </div>
                <div className="text-[11px] text-[var(--md-text-subtle)]">
                  Appends bracket-tag documentation to markdown output
                </div>
              </div>
              <Switch
                checked={options.includeLegend}
                onCheckedChange={(checked) =>
                  onChange({ ...options, includeLegend: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[var(--md-text)]">
                  Include Timestamp
                </div>
                <div className="text-[11px] text-[var(--md-text-subtle)]">
                  Disabled by default for byte-for-byte determinism
                </div>
              </div>
              <Switch
                checked={options.includeTimestamp}
                onCheckedChange={(checked) =>
                  onChange({ ...options, includeTimestamp: checked })
                }
              />
            </div>

            {/* Canvas Render Mode */}
            <div className="pt-2 border-t border-[var(--md-border)] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-[var(--md-text)]">
                  Canvas Render Mode
                </label>
                <select
                  value={renderMode}
                  onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                  aria-label="Canvas Render Mode"
                  className="h-7 px-2 text-xs rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-bg)] text-[var(--md-text)] font-sans focus:outline-none focus:border-[var(--md-accent)] cursor-pointer"
                >
                  <option value="skeleton">Skeleton (glyphs & empty boxes)</option>
                  <option value="annotated">Annotated (ghost text & patterns)</option>
                  <option value="realistic">Realistic (annotated + hints & chrome)</option>
                </select>
              </div>
              <p className="text-[11px] text-[var(--md-text-subtle)] leading-normal">
                Controls visual fidelity on canvas. Markdown export remains 100% byte-identical across all modes.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="h-12 px-4 border-t border-[var(--md-border)] flex items-center justify-between sm:justify-between bg-[var(--md-surface)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-[var(--md-text-muted)]"
          >
            <RotateCcw size={12} />
            <span>Reset Defaults</span>
          </Button>

          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
