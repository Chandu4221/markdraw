import React from 'react';
import { Sliders, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { CompilationOptions } from '../../core/types';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface CompilerSettingsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  options?: Required<CompilationOptions>;
  onUpdateOption: (key: keyof CompilationOptions, value: unknown) => void;
  onResetOptions: () => void;
}

export const CompilerSettingsSection: React.FC<CompilerSettingsSectionProps> = ({
  isOpen,
  onToggle,
  options,
  onUpdateOption,
  onResetOptions
}) => {
  if (!options) return null;

  return (
    <div className="border-t border-[var(--md-line-subtle)]">
      <button
        type="button"
        id="accordion-header-settings"
        onClick={onToggle}
        className="w-full h-8 px-3 flex items-center justify-between text-left hover:bg-[var(--md-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] focus-visible:ring-inset transition-colors cursor-pointer select-none group"
        aria-expanded={isOpen}
        aria-controls="accordion-panel-settings"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders size={14} className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] shrink-0 transition-colors" />
          <span className="text-sm font-semibold tracking-wider uppercase text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors whitespace-nowrap shrink-0">
            Compiler & Settings
          </span>
          <span className="px-1.5 py-0.5 text-sm font-mono font-medium text-[var(--md-accent)] bg-[var(--md-surface-2)] border border-[var(--md-line-subtle)] rounded shrink-0 truncate max-w-24">
            {options.platform || 'web'}
          </span>
        </div>
        <div className="text-[var(--md-ink-muted)] group-hover:text-[var(--md-ink-primary)] transition-colors shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {isOpen && (
        <div
          id="accordion-panel-settings"
          role="region"
          aria-labelledby="accordion-header-settings"
          className="p-3 pt-2 space-y-3 bg-[var(--md-surface-1)]"
        >
          {/* Platform Profile */}
          <div className="space-y-1">
            <label
              htmlFor="settings-platform-profile"
              className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] block cursor-pointer"
            >
              Platform Profile (§11)
            </label>
            <select
              id="settings-platform-profile"
              aria-label="Platform Profile"
              value={options.platform || 'web'}
              onChange={(e) => onUpdateOption('platform', e.target.value)}
              className="w-full h-8 px-2.5 rounded-[var(--md-radius-sm)] border border-[var(--md-line-subtle)] bg-[var(--md-surface-2)] text-sm text-[var(--md-ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] cursor-pointer"
            >
              <option value="web">Web (Semantic HTML & CSS)</option>
              <option value="android-material">Android (Material 3 Directives)</option>
            </select>
          </div>

          {/* Containment Threshold */}
          <div className="space-y-1 pt-1.5 border-t border-[var(--md-line-subtle)]">
            <div className="flex items-center justify-between">
              <label
                htmlFor="threshold-slider-input"
                className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer"
              >
                Containment (A.3)
              </label>
              <span className="text-sm font-mono font-bold text-[var(--md-accent)]" aria-live="polite">
                {Math.round((options.containmentThreshold ?? 0.85) * 100)}%
              </span>
            </div>

            <div className="pt-1">
              <input
                id="threshold-slider-input"
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                aria-label="Containment Threshold"
                aria-describedby="containment-helptext"
                aria-valuemin={0.5}
                aria-valuemax={1.0}
                aria-valuenow={options.containmentThreshold ?? 0.85}
                aria-valuetext={`${Math.round((options.containmentThreshold ?? 0.85) * 100)} percent`}
                value={options.containmentThreshold ?? 0.85}
                onChange={(e) => onUpdateOption('containmentThreshold', parseFloat(e.target.value))}
                className="w-full accent-[var(--md-accent)] cursor-pointer h-1.5 bg-[var(--md-line-subtle)] rounded-lg"
              />
            </div>
            <div id="containment-helptext" className="text-sm text-[var(--md-ink-muted)] leading-normal">
              Minimum AABB overlap required to infer parent-child hierarchy.
            </div>
          </div>

          {/* Tolerances */}
          <div className="space-y-1 pt-1.5 border-t border-[var(--md-line-subtle)]">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] block">
              Tolerances (A.5)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="tolerance-width-bucket" className="text-sm text-[var(--md-ink-muted)] block cursor-pointer">
                  Width Bucket (±%)
                </label>
                <Input
                  id="tolerance-width-bucket"
                  type="number"
                  min="0"
                  max="10"
                  value={options.sizeBucketTolerance ?? 2}
                  onChange={(e) => onUpdateOption('sizeBucketTolerance', parseInt(e.target.value, 10) || 0)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="tolerance-alignment" className="text-sm text-[var(--md-ink-muted)] block cursor-pointer">
                  Alignment (±%)
                </label>
                <Input
                  id="tolerance-alignment"
                  type="number"
                  min="0"
                  max="10"
                  value={options.alignTolerance ?? 3}
                  onChange={(e) => onUpdateOption('alignTolerance', parseInt(e.target.value, 10) || 0)}
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1.5 border-t border-[var(--md-line-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="inspector-legend-switch" className="text-sm font-medium text-[var(--md-ink-primary)] block cursor-pointer select-none">
                  Include Semantic Legend
                </label>
                <span className="text-sm text-[var(--md-ink-muted)] block">
                  Append bracket-tag spec reference
                </span>
              </div>
              <Switch
                id="inspector-legend-switch"
                checked={options.includeLegend ?? false}
                onCheckedChange={(checked) => onUpdateOption('includeLegend', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="inspector-timestamp-switch" className="text-sm font-medium text-[var(--md-ink-primary)] block cursor-pointer select-none">
                  Include Timestamp
                </label>
                <span className="text-sm text-[var(--md-ink-muted)] block">
                  Append compile date (non-deterministic)
                </span>
              </div>
              <Switch
                id="inspector-timestamp-switch"
                checked={options.includeTimestamp ?? false}
                onCheckedChange={(checked) => onUpdateOption('includeTimestamp', checked)}
              />
            </div>
          </div>

          {/* Document Header Note */}
          <div className="space-y-1 pt-1.5 border-t border-[var(--md-line-subtle)]">
            <label htmlFor="inspector-page-note" className="text-sm font-semibold uppercase tracking-wider text-[var(--md-ink-muted)] cursor-pointer">
              Document Header Note
            </label>
            <Input
              id="inspector-page-note"
              type="text"
              value={options.pageNote || ''}
              onChange={(e) => onUpdateOption('pageNote', e.target.value || '')}
              placeholder="e.g. Design review v1..."
              className="h-8 text-sm font-sans"
            />
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-[var(--md-line-subtle)] flex justify-end">
            <button
              type="button"
              onClick={onResetOptions}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--md-ink-muted)] hover:text-[var(--md-ink-primary)] hover:bg-[var(--md-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent)] rounded-[var(--md-radius-sm)] transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="shrink-0" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
