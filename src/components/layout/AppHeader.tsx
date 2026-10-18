import React from 'react';
import { MARKDRAW_VERSION } from '../../core/compiler';
import { MarkDrawDocMeta } from '../../core/documents';
import { DocumentMenu } from '../DocumentMenu';
import { Button } from '@/components/ui/button';
import {
  Keyboard,
  BookOpen,
  Sliders,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle
} from 'lucide-react';

export interface AppHeaderProps {
  activeDoc: MarkDrawDocMeta;
  docs: MarkDrawDocMeta[];
  onSelectDoc: (docId: string) => void;
  onNewDoc: () => void;
  onDuplicateDoc: () => void;
  onRenameDoc: (docId: string, newName: string) => void;
  onDeleteDoc: (docId: string) => void;
  onExportFile: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  canvasPercent: number;
  setCanvasPercent: (pct: number) => void;
  elementCount: number;
  compileDuration: number | null;
  roleCount: number;
  onOpenShortcuts: () => void;
  onOpenLegend: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSelectTemplate?: (template: any) => void;
  onOpenOnboarding?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeDoc,
  docs,
  onSelectDoc,
  onNewDoc,
  onDuplicateDoc,
  onRenameDoc,
  onDeleteDoc,
  onExportFile,
  onImportFile,
  isRightPanelOpen,
  setIsRightPanelOpen,
  canvasPercent,
  setCanvasPercent,
  elementCount,
  compileDuration,
  roleCount,
  onOpenShortcuts,
  onOpenLegend,
  onOpenSettings,
  theme,
  toggleTheme,
  onSelectTemplate,
  onOpenOnboarding
}) => {
  return (
    <header className="h-11 px-3 border-b border-[var(--md-border)] bg-[var(--md-surface)] flex items-center justify-between shrink-0 select-none z-20">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-[5px] bg-[var(--md-text-bold)] text-[var(--md-bg)] text-xs font-bold flex items-center justify-center">
          MD
        </div>
        <span className="text-xs font-bold tracking-tight text-[var(--md-text-bold)]">
          MarkDraw
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[var(--md-surface-raised)] text-[var(--md-text-muted)] border border-[var(--md-border)]">
          v{MARKDRAW_VERSION}
        </span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[var(--color-surface-2)] text-[var(--color-accent)] border border-[var(--color-line-subtle)]"
          title="MarkDraw v5 is powered by the vendor-neutral @excalidraw/excalidraw (MIT) engine"
        >
          Excalidraw (MIT)
        </span>

        {/* Document Menu */}
        <DocumentMenu
          activeDoc={activeDoc}
          docs={docs}
          onSelectDoc={onSelectDoc}
          onNewDoc={onNewDoc}
          onDuplicateDoc={onDuplicateDoc}
          onRenameDoc={onRenameDoc}
          onDeleteDoc={onDeleteDoc}
          onExportFile={onExportFile}
          onImportFile={onImportFile}
          onSelectTemplate={onSelectTemplate}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Layout Presets */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-[var(--md-radius-sm)] bg-[var(--md-bg)] border border-[var(--md-border)]">
          <button
            className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
              !isRightPanelOpen
                ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
            }`}
            onClick={() => setIsRightPanelOpen(false)}
            title="Canvas Fullscreen Focus"
            aria-label="Canvas Fullscreen Focus"
          >
            Canvas Full
          </button>
          <button
            className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
              isRightPanelOpen && Math.round(canvasPercent) === 75
                ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
            }`}
            onClick={() => {
              setIsRightPanelOpen(true);
              setCanvasPercent(75);
            }}
            title="Canvas Focus (75% / 25%)"
            aria-label="Canvas Focus (75% / 25%)"
          >
            Canvas 75%
          </button>
          <button
            className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
              isRightPanelOpen && Math.round(canvasPercent) === 50
                ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
            }`}
            onClick={() => {
              setIsRightPanelOpen(true);
              setCanvasPercent(50);
            }}
            title="Equal Split (50% / 50%)"
            aria-label="Equal Split (50% / 50%)"
          >
            50 / 50
          </button>
          <button
            className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
              isRightPanelOpen && Math.round(canvasPercent) === 35
                ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] shadow-xs'
                : 'text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-accent)]'
            }`}
            onClick={() => {
              setIsRightPanelOpen(true);
              setCanvasPercent(35);
            }}
            title="Focus Code (35% / 65%)"
            aria-label="Focus Code (35% / 65%)"
          >
            Code 65%
          </button>
        </div>

        {/* Header Stats */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--md-text-muted)] px-2">
          <span>Elements: <strong className="text-[var(--md-text-bold)] font-mono">{elementCount}</strong></span>
          {compileDuration !== null && (
            <>
              <span className="text-[var(--md-border)]">|</span>
              <span className="font-mono text-[11px] text-[var(--md-accent)]" title="Compiler Execution Time">
                ⚡ {compileDuration}ms
              </span>
            </>
          )}
          <span className="text-[var(--md-border)]">|</span>
          <span>Roles: <strong className="text-[var(--md-text-bold)] font-mono">{roleCount}</strong></span>
        </div>

        {onOpenOnboarding && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenOnboarding}
            title="MarkDraw Quick Tour & Onboarding"
            aria-label="MarkDraw Quick Tour & Onboarding"
          >
            <HelpCircle size={15} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts (?)"
        >
          <Keyboard size={15} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenLegend}
          title="View Semantic Legend"
          aria-label="View Semantic Legend"
        >
          <BookOpen size={15} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          title="Compiler & Geometry Settings"
          aria-label="Compiler & Geometry Settings"
        >
          <Sliders size={15} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </Button>

        <Button
          variant={isRightPanelOpen ? 'accent' : 'ghost'}
          size="icon"
          onClick={() => setIsRightPanelOpen((prev) => !prev)}
          title={isRightPanelOpen ? 'Collapse Output Panel (Ctrl+J)' : 'Open Output Panel (Ctrl+J)'}
          aria-label={isRightPanelOpen ? 'Collapse Output Panel (Ctrl+J)' : 'Open Output Panel (Ctrl+J)'}
        >
          {isRightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </Button>
      </div>
    </header>
  );
};
