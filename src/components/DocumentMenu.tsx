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
  FileText
} from 'lucide-react';
import { MarkDrawDocMeta } from '../core/documents';
import styles from './DocumentMenu.module.css';

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
  onImportFile
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

  return (
    <div className={styles.docMenuWrapper}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className={styles.inlineRenameInput}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleCommitRename}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          className={`${styles.docTitleBtn} ${isOpen ? styles.docTitleBtnOpen : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title="Click for document menu · Double-click to rename"
        >
          <FileText size={14} strokeWidth={1.5} />
          <span className={styles.docNameText}>{activeDoc.name}</span>
          <ChevronDown size={13} strokeWidth={1.5} />
        </button>
      )}

      {isOpen && (
        <>
          <div className={styles.dropdownOverlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdownPanel}>
            <div className={styles.actionsSection}>
              <button
                className={styles.menuActionBtn}
                onClick={() => {
                  setIsOpen(false);
                  onNewDoc();
                }}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>New Document</span>
              </button>

              <button
                className={styles.menuActionBtn}
                onClick={() => {
                  setIsOpen(false);
                  onDuplicateDoc();
                }}
              >
                <Copy size={14} strokeWidth={1.5} />
                <span>Duplicate Document</span>
              </button>

              <button
                className={styles.menuActionBtn}
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(true);
                }}
              >
                <Edit2 size={14} strokeWidth={1.5} />
                <span>Rename Document</span>
              </button>

              <div className={styles.divider} />

              <button
                className={styles.menuActionBtn}
                onClick={() => {
                  setIsOpen(false);
                  onExportFile();
                }}
              >
                <Download size={14} strokeWidth={1.5} />
                <span>Export File (.markdraw.json)</span>
              </button>

              <button
                className={styles.menuActionBtn}
                onClick={() => {
                  setIsOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={14} strokeWidth={1.5} />
                <span>Import File (.markdraw.json)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.markdraw.json"
                style={{ display: 'none' }}
                onChange={onImportFile}
              />
            </div>

            <div className={styles.divider} />
            <div className={styles.sectionHeader}>Your Documents ({docs.length})</div>

            <div className={styles.docsList}>
              {docs.map((doc) => {
                const isActive = doc.id === activeDoc.id;
                return (
                  <div
                    key={doc.id}
                    className={`${styles.docItem} ${isActive ? styles.docItemActive : ''}`}
                    onClick={() => {
                      if (!isActive) {
                        onSelectDoc(doc.id);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className={styles.docItemInfo}>
                      <span className={styles.docItemTitle}>{doc.name}</span>
                      <span className={styles.docItemDate}>{formatDate(doc.updatedAt)}</span>
                    </div>

                    <div className={styles.docItemActions}>
                      {isActive ? (
                        <Check size={14} strokeWidth={2} color="var(--md-text-bold)" />
                      ) : docs.length > 1 ? (
                        <button
                          className={styles.deleteDocBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${doc.name}"? This cannot be undone.`)) {
                              onDeleteDoc(doc.id);
                            }
                          }}
                          title="Delete document"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
