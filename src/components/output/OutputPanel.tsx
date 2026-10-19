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
      className={`h-full flex flex-col bg-[var(--md-surface)] overflow-hidden shrink-0 relative ${
        activeDrag === 'right' ? 'transition-none' : 'transition-[width] duration-200 ease-out'
      } ${isRightPanelOpen ? 'border-l border-[var(--md-border)]' : 'border-l-0 pointer-events-none'}`}
      // v5-token-exception: dynamic panel resize width
      style={{
        width: isRightPanelOpen ? `calc(${100 - canvasPercent}% - 5px)` : '0px',
        minWidth: isRightPanelOpen ? '380px' : '0px'
      }}
    >
      <div className="h-full flex flex-col shrink-0 overflow-hidden w-full min-w-0">
        {/* Output Toolbar: 2 Dedicated Structured Tiers */}
        <div className="shrink-0 select-none bg-[var(--md-surface)] border-b border-[var(--md-border)]">
          {/* Tier 1: View Navigation Tabs (Left) & Format Toggle (Right) */}
          <div className="min-h-9 px-2.5 py-1 border-b border-[var(--md-border)]/50 flex items-center justify-between gap-2 flex-wrap">
            {/* Primary Tabs */}
            <div
              role="tablist"
              aria-label="Output View Modes"
              className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)] shrink-0"
            >
              <button
                role="tab"
                aria-selected={outputTab === 'spec'}
                aria-label="Spec Table view"
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  outputTab === 'spec'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:text-[var(--md-text)]'
                }`}
                onClick={() => setOutputTab('spec')}
              >
                <FileText size={13} />
                <span>Spec Table</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'grid'}
                aria-label="Spatial Grid view"
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  outputTab === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                }`}
                onClick={() => setOutputTab('grid')}
              >
                <LayoutGrid size={13} />
                <span>Spatial Grid</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'ascii'}
                aria-label="ASCII layout view"
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  outputTab === 'ascii'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                }`}
                onClick={() => setOutputTab('ascii')}
              >
                <Terminal size={13} />
                <span>ASCII</span>
              </button>
              <button
                role="tab"
                aria-selected={outputTab === 'json'}
                aria-label="JSON AST view"
                className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  outputTab === 'json'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                }`}
                onClick={() => setOutputTab('json')}
              >
                <Code size={13} />
                <span>JSON AST</span>
              </button>
            </div>

            {/* View Mode Toggle (Preview vs Raw) - only for spec and grid */}
            {(outputTab === 'spec' || outputTab === 'grid') && (
              <div
                role="group"
                aria-label="Display View Mode"
                className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)] shrink-0"
              >
                <button
                  type="button"
                  aria-pressed={outputDisplayMode === 'preview'}
                  className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                    outputDisplayMode === 'preview'
                      ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] shadow-xs font-semibold'
                      : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                  }`}
                  onClick={() => onOutputDisplayModeChange('preview')}
                  title="Formatted Markdown Preview"
                  aria-label="Formatted preview mode"
                >
                  <Eye size={12} className={outputDisplayMode === 'preview' ? 'text-blue-500' : ''} />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  aria-pressed={outputDisplayMode === 'raw'}
                  className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                    outputDisplayMode === 'raw'
                      ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] shadow-xs font-semibold'
                      : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                  }`}
                  onClick={() => onOutputDisplayModeChange('raw')}
                  title="Raw Markdown Syntax"
                  aria-label="Raw Markdown mode"
                >
                  <Code size={12} className={outputDisplayMode === 'raw' ? 'text-blue-500' : ''} />
                  <span>Raw</span>
                </button>
              </div>
            )}
          </div>

          {/* Tier 2: Compilation Target & Export Actions */}
          <div className="min-h-9 px-2.5 py-1 flex items-center justify-between gap-2 flex-wrap bg-[var(--md-surface-raised)]/25">
            {/* Platform Selector & Scope Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-[var(--md-text-muted)] font-medium">
                <span>Profile:</span>
                <select
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  className="h-6 rounded border border-[var(--md-border)] bg-[var(--md-surface)] px-1.5 text-[11px] text-[var(--md-text)] font-medium cursor-pointer hover:border-[var(--md-border-strong)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]"
                  title="Target compilation platform profile (§10)"
                >
                  <option value="web">Web</option>
                  <option value="android-material">Android (M3)</option>
                </select>
              </div>

              <div
                role="group"
                aria-label="Compilation Scope"
                className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)]"
              >
                <button
                  type="button"
                  onClick={() => setCompileScopeMode('all')}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                    compileScopeMode === 'all'
                      ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] font-semibold shadow-xs'
                      : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                  }`}
                  title="Compile all roots on canvas"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCompileScopeMode('selection')}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                    compileScopeMode === 'selection'
                      ? 'bg-[var(--md-surface-raised)] text-[var(--md-text)] font-semibold shadow-xs'
                      : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
                  }`}
                  title="Compile selected subtree only"
                >
                  Selection
                </button>
              </div>

              {/* Coverage Indicator (§11) */}
              {coverage && coverage.total > 0 && (
                <div
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
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
                className="h-6 gap-1 text-[11px] font-medium shrink-0 px-2 cursor-pointer"
                title="Copy lean contract (Directive + Spec Table)"
                aria-label="Copy to Clipboard"
              >
                {copied ? (
                  <>
                    <Check size={11} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant={copiedFull ? 'success' : 'outline'}
                size="sm"
                onClick={onCopyFullContract}
                className="h-6 gap-1 text-[11px] font-medium shrink-0 px-2 cursor-pointer"
                title="Copy full contract with auto-generated canvas legend"
                aria-label="Copy Full Contract"
              >
                {copiedFull ? (
                  <>
                    <Check size={11} />
                    <span>Copied Full</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy Full</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDownload}
                className="h-6 w-6 shrink-0 cursor-pointer text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)]"
                title="Download Source"
                aria-label="Download Source"
              >
                <Download size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* Informational Lints Banner (§11: Clickable Lints) */}
        {compilation.lints && compilation.lints.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            {compilation.lints.map((lint, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLintClick?.(lint)}
                className="w-full text-left flex items-center gap-1.5 hover:underline cursor-pointer focus-visible:outline-none"
                title="Click to locate and select shape on canvas"
              >
                <AlertCircle size={13} className="shrink-0 text-amber-500" />
                <span className="truncate">{lint}</span>
              </button>
            ))}
          </div>
        )}

        {/* Output Viewport */}
        <div className="flex-1 overflow-auto p-3 bg-[var(--md-bg)]">
          {(outputTab === 'spec' || outputTab === 'grid') && outputDisplayMode === 'preview' ? (
            <MarkdownPreview content={activeContent} onSelectShape={onSelectShape} />
          ) : (
            <pre className="text-xs font-mono leading-relaxed text-[var(--md-text)] whitespace-pre-wrap select-text">
              <code>{activeContent}</code>
            </pre>
          )}
        </div>

        {/* Output Footer */}
        <footer className="h-7 px-3 border-t border-[var(--md-border)] bg-[var(--md-surface)] flex items-center justify-between text-[11px] text-[var(--md-text-subtle)] shrink-0 select-none">
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
