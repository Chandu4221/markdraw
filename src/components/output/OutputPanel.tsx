import React from 'react';
import { CompilationResult } from '../../core/types';
import { MarkdownPreview } from '../MarkdownPreview';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Download,
  Check,
  Code,
  LayoutGrid,
  FileText,
  Terminal,
  AlertCircle,
  Eye
} from 'lucide-react';

export type OutputTab = 'spec' | 'grid' | 'ascii' | 'json';
export type OutputDisplayMode = 'preview' | 'raw';

export interface OutputPanelProps {
  isRightPanelOpen: boolean;
  canvasPercent: number;
  activeDrag: 'right' | null;
  outputTab: OutputTab;
  setOutputTab: (tab: OutputTab) => void;
  outputDisplayMode: OutputDisplayMode;
  onOutputDisplayModeChange: (mode: OutputDisplayMode) => void;
  platformId: string;
  setPlatformId: (platformId: string) => void;
  compileScopeMode: 'all' | 'selection';
  setCompileScopeMode: (scope: 'all' | 'selection') => void;
  compilation: CompilationResult;
  activeContent: string;
  copied: boolean;
  copiedFull: boolean;
  onCopy: () => void;
  onCopyFullContract: () => void;
  onDownload: () => void;
  coverage?: { tagged: number; total: number };
  onLintClick?: (lint: string) => void;
  onSelectShape?: (shapeId: string) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  isRightPanelOpen,
  canvasPercent,
  activeDrag,
  outputTab,
  setOutputTab,
  outputDisplayMode,
  onOutputDisplayModeChange,
  platformId,
  setPlatformId,
  compileScopeMode,
  setCompileScopeMode,
  compilation,
  activeContent,
  copied,
  copiedFull,
  onCopy,
  onCopyFullContract,
  onDownload,
  coverage,
  onLintClick,
  onSelectShape
}) => {
  return (
    <aside
      role="region"
      aria-label="Live Output"
      aria-hidden={!isRightPanelOpen}
      inert={!isRightPanelOpen ? true : undefined}
      onTransitionEnd={() => {
        window.dispatchEvent(new Event('resize'));
      }}
      className={`h-full flex flex-col bg-[var(--color-surface-1)] overflow-hidden shrink-0 relative ${
        activeDrag === 'right' ? 'transition-none' : 'transition-[width] duration-200 ease-out'
      } ${isRightPanelOpen ? 'border-l border-[var(--color-line-subtle)]' : 'border-l-0 pointer-events-none'}`}
      // v5-token-exception: dynamic panel resize width
      style={{
        width: isRightPanelOpen ? `calc(${100 - canvasPercent}% - 5px)` : '0px',
        minWidth: isRightPanelOpen ? '380px' : '0px'
      }}
    >
      <div className="h-full flex flex-col shrink-0 overflow-hidden w-full min-w-0">
        {/* Output Toolbar: 2 Dedicated Structured Tiers */}
        <div className="shrink-0 select-none bg-[var(--color-surface-1)] border-b border-[var(--color-line-subtle)]">
          {/* Tier 1: View Navigation Tabs (Left) & Format Toggle (Right) */}
          <div className="min-h-9 px-2.5 py-1 border-b border-[var(--color-line-subtle)]/50 flex items-center justify-between gap-2 flex-wrap">
            {/* Primary Tabs */}
            <div
              role="tablist"
              aria-label="Output View Modes"
              className="flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-0)] border border-[var(--color-line-subtle)] shrink-0"
            >
              <button
                role="tab"
                aria-selected={outputTab === 'spec'}
                aria-label="Spec Table view"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  outputTab === 'spec'
                    ? 'bg-[var(--color-accent)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]'
                }`}
                onClick={() => setOutputTab('spec')}
              >
                <FileText size={14} />
                <span>Spec Table</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'grid'}
                aria-label="Spatial Grid view"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  outputTab === 'grid'
                    ? 'bg-[var(--color-accent)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                }`}
                onClick={() => setOutputTab('grid')}
              >
                <LayoutGrid size={14} />
                <span>Spatial Grid</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'ascii'}
                aria-label="ASCII layout view"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  outputTab === 'ascii'
                    ? 'bg-[var(--color-accent)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                }`}
                onClick={() => setOutputTab('ascii')}
              >
                <Terminal size={14} />
                <span>ASCII</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'json'}
                aria-label="JSON AST view"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                  outputTab === 'json'
                    ? 'bg-[var(--color-accent)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                }`}
                onClick={() => setOutputTab('json')}
              >
                <Code size={14} />
                <span>JSON AST</span>
              </button>
            </div>

            {/* View Mode Toggle (Preview vs Raw) - only for spec and grid */}
            {(outputTab === 'spec' || outputTab === 'grid') && (
              <div
                role="group"
                aria-label="Display View Mode"
                className="flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-0)] border border-[var(--color-line-subtle)] shrink-0"
              >
                <button
                  type="button"
                  aria-pressed={outputDisplayMode === 'preview'}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                    outputDisplayMode === 'preview'
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] shadow-xs font-semibold'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                  }`}
                  onClick={() => onOutputDisplayModeChange('preview')}
                  title="Formatted Markdown Preview"
                  aria-label="Formatted preview mode"
                >
                  <Eye size={14} className={outputDisplayMode === 'preview' ? 'text-[var(--color-accent)]' : ''} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  aria-pressed={outputDisplayMode === 'raw'}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                    outputDisplayMode === 'raw'
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] shadow-xs font-semibold'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                  }`}
                  onClick={() => onOutputDisplayModeChange('raw')}
                  title="Raw Markdown Syntax"
                  aria-label="Raw Markdown mode"
                >
                  <Code size={14} className={outputDisplayMode === 'raw' ? 'text-[var(--color-accent)]' : ''} />
                  <span>Raw</span>
                </button>
              </div>
            )}
          </div>

          {/* Tier 2: Compilation Target & Export Actions */}
          <div className="min-h-9 px-2.5 py-1.5 flex items-center justify-between gap-2 flex-wrap bg-[var(--color-surface-raised)]/25">
            {/* Platform Selector & Scope Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] font-medium">
                <span>Profile:</span>
                <select
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  className="h-8 rounded border border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] px-2 text-sm text-[var(--color-ink-secondary)] font-medium cursor-pointer hover:border-[var(--color-line-strong)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
                  title="Target compilation platform profile (§10)"
                >
                  <option value="web">Web</option>
                  <option value="android-material">Android (M3)</option>
                </select>
              </div>

              <div
                role="group"
                aria-label="Compilation Scope"
                className="flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-0)] border border-[var(--color-line-subtle)]"
              >
                <button
                  type="button"
                  onClick={() => setCompileScopeMode('all')}
                  className={`px-2 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                    compileScopeMode === 'all'
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] font-semibold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                  }`}
                  title="Compile all roots on canvas"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCompileScopeMode('selection')}
                  className={`px-2 py-1 text-sm font-medium rounded-sm transition-colors cursor-pointer ${
                    compileScopeMode === 'selection'
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] font-semibold shadow-xs'
                      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]'
                  }`}
                  title="Compile selected subtree only"
                >
                  Selection
                </button>
              </div>

              {/* Coverage Indicator (§11) */}
              {coverage && coverage.total > 0 && (
                <div
                  className={`text-sm px-2 py-0.5 rounded transition-colors ${
                    coverage.tagged === coverage.total
                      ? 'text-[var(--color-accent)] font-semibold bg-[var(--color-accent)]/10'
                      : 'text-[var(--color-ink-muted)] font-normal'
                  }`}
                  title={`${coverage.tagged} of ${coverage.total} shapes have semantic annotations`}
                >
                  Tagged {coverage.tagged}/{coverage.total} shapes
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <Button
                variant={copied ? 'success' : 'brand'}
                size="sm"
                onClick={onCopy}
                className="h-8 gap-1.5 text-sm font-medium shrink-0 px-2.5 cursor-pointer"
                title="Copy lean contract (Directive + Spec Table)"
                aria-label="Copy to Clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant={copiedFull ? 'success' : 'outline'}
                size="sm"
                onClick={onCopyFullContract}
                className="h-8 gap-1.5 text-sm font-medium shrink-0 px-2.5 cursor-pointer"
                title="Copy full contract with auto-generated canvas legend"
                aria-label="Copy Full Contract"
              >
                {copiedFull ? (
                  <>
                    <Check size={14} />
                    <span>Copied Full</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Full</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDownload}
                className="h-8 w-8 shrink-0 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink-primary)]"
                title="Download Source"
                aria-label="Download Source"
              >
                <Download size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Informational Lints Banner (§11: Clickable Lints) */}
        {compilation.lints && compilation.lints.length > 0 && (
          <div className="bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/20 px-3 py-2 text-sm text-[var(--color-warning)] space-y-1">
            {compilation.lints.map((lint, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLintClick?.(lint)}
                className="w-full text-left flex items-center gap-1.5 hover:underline cursor-pointer focus-visible:outline-none"
                title="Click to locate and select shape on canvas"
              >
                <AlertCircle size={14} className="shrink-0 text-[var(--color-warning)]" />
                <span className="truncate">{lint}</span>
              </button>
            ))}
          </div>
        )}

        {/* Output Viewport */}
        <div className="flex-1 overflow-auto p-3 bg-[var(--color-surface-0)]">
          {(outputTab === 'spec' || outputTab === 'grid') && outputDisplayMode === 'preview' ? (
            <MarkdownPreview content={activeContent} onSelectShape={onSelectShape} />
          ) : (
            <pre className="text-sm font-mono leading-relaxed text-[var(--color-ink-secondary)] whitespace-pre-wrap select-text">
              <code>{activeContent}</code>
            </pre>
          )}
        </div>

        {/* Output Footer */}
        <footer className="h-8 px-3 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface-1)] flex items-center justify-between text-sm text-[var(--color-ink-muted)] shrink-0 select-none">
          <span>
            {(outputTab === 'spec' || outputTab === 'grid') && outputDisplayMode === 'preview'
              ? 'Formatted Markdown preview. "Copy" always copies pristine raw markdown for LLMs.'
              : 'Semantic layout compiled in real time. Paste directly into LLM prompts.'}
          </span>
        </footer>
      </div>
    </aside>
  );
};
