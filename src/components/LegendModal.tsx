import React, { useState } from 'react';
import { Copy, Check, BookOpen } from 'lucide-react';
import { SEMANTIC_LEGEND_MARKDOWN } from '../core/compiler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SEMANTIC_LEGEND_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="h-12 px-4 border-b border-[var(--color-line-subtle)] flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[var(--color-accent)]" />
            <DialogTitle className="text-sm font-semibold text-[var(--color-ink-primary)]">
              MarkDraw Semantic Legend
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Semantic notation reference and layout specifications
          </DialogDescription>
          <div className="mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-sm"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-[var(--color-accent)]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Legend</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-48px)]">
          <pre className="text-sm font-mono leading-relaxed text-[var(--color-ink-secondary)] whitespace-pre-wrap select-text bg-[var(--color-surface-raised)] p-3 rounded-[var(--radius-md)] border border-[var(--color-line-subtle)]">
            {SEMANTIC_LEGEND_MARKDOWN}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};
