import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Download,
  Upload,
  Check,
  FileText,
  Sparkles
} from 'lucide-react';
import { MarkDrawDocMeta } from '../core/documents';
import { STARTER_TEMPLATES, StarterTemplate } from '../canvas/templates/starterTemplates';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface DocumentMenuProps {
  activeDoc: MarkDrawDocMeta;
  docs: MarkDrawDocMeta[];
  onSelectDoc: (docId: string) => void;
  onNewDoc: () => void;
  onDuplicateDoc: () => void;
  onRenameDoc: (docId: string, newName: string) => void;
  onDeleteDoc: (docId: string) => void;
  onExportFile: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTemplate?: (template: StarterTemplate) => void;
}

export const DocumentMenu: React.FC<DocumentMenuProps> = ({
  activeDoc,
  docs,
  onSelectDoc,
  onNewDoc,
  onDuplicateDoc,
  onRenameDoc,
  onDeleteDoc,
  onExportFile,
  onImportFile,
  onSelectTemplate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeDoc.name);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditName(activeDoc.name);
  }, [activeDoc.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCommitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== activeDoc.name) {
      onRenameDoc(activeDoc.id, trimmed);
    } else {
      setEditName(activeDoc.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditName(activeDoc.name);
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          className="h-8 w-48 text-sm font-medium"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleCommitRename}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-8 items-center gap-1.5 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2.5 text-sm font-medium text-[var(--md-text)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text-bold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring)] transition-colors cursor-pointer select-none"
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              setIsEditing(true);
            }}
            title="Click to switch/manage documents · Double-click to rename"
            aria-label="Click to switch or manage documents, double-click to rename"
          >
            <FileText size={15} className="text-[var(--md-text-muted)]" />
            <span className="max-w-36 truncate text-sm">{activeDoc.name}</span>
            <ChevronDown size={14} className="text-[var(--md-text-muted)] opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 p-1.5">
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              onNewDoc();
            }}
          >
            <Plus size={13} />
            <span>New Document</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              onDuplicateDoc();
            }}
          >
            <Copy size={13} />
            <span>Duplicate Document</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              setIsEditing(true);
            }}
          >
            <Edit2 size={13} />
            <span>Rename Document</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              onExportFile();
            }}
          >
            <Download size={13} />
            <span>Export File (.markdraw.json)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              fileInputRef.current?.click();
            }}
          >
            <Upload size={13} />
            <span>Import File (.markdraw.json)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>
            Starter Templates (§11)
          </DropdownMenuLabel>

          {STARTER_TEMPLATES.map((tpl) => (
            <DropdownMenuItem
              key={tpl.id}
              className="flex flex-col items-start gap-0.5 cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                onSelectTemplate?.(tpl);
              }}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                <Sparkles size={14} className="text-[var(--color-accent)]" />
                <span>{tpl.name}</span>
              </div>
              <span className="text-sm text-[var(--color-ink-muted)]">
                {tpl.description}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>
            Documents ({docs.length})
          </DropdownMenuLabel>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {docs.map((doc) => {
              const isActive = doc.id === activeDoc.id;
              return (
                <div
                  key={doc.id}
                  className={`group flex items-center justify-between rounded-[var(--md-radius-sm)] px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[var(--md-surface-raised)] text-[var(--md-text-bold)] font-medium'
                      : 'text-[var(--md-text)] hover:bg-[var(--md-surface-raised)]'
                  }`}
                  onClick={() => {
                    if (!isActive) {
                      onSelectDoc(doc.id);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{doc.name}</span>
                    <span className="text-sm text-[var(--md-text-subtle)]">
                      {formatDate(doc.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center shrink-0">
                    {isActive ? (
                      <Check size={15} className="text-[var(--md-accent)]" />
                    ) : docs.length > 1 ? (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--md-text-subtle)] hover:text-[var(--md-danger)] hover:bg-[var(--md-surface-raised)] rounded focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--md-danger)] transition-all cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${doc.name}"? This cannot be undone.`)) {
                            onDeleteDoc(doc.id);
                          }
                        }}
                        title="Delete document"
                        aria-label={`Delete document ${doc.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.markdraw.json"
        // v5-token-exception: hidden file input
        style={{ display: 'none' }}
        onChange={onImportFile}
      />
    </div>
  );
};
