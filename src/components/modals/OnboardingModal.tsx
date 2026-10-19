import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PenTool, Tag, Copy, Sparkles, CheckCircle2 } from 'lucide-react';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const handleDismiss = () => {
    localStorage.setItem('markdraw_v5_onboarded', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md bg-[var(--color-surface-1)] border border-[var(--color-line-strong)] text-[var(--color-ink-primary)] p-6 rounded-xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold text-sm uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Welcome to MarkDraw v5</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--color-ink-primary)]">
            3 Steps to AI-Ready Layouts
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--color-ink-secondary)]">
            A fast, vendor-neutral canvas engine transforming sketches into binding design contracts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="flex gap-3 items-start p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)]">
            <div className="p-2 rounded-md bg-[var(--color-surface-3)] text-[var(--color-accent)] shrink-0">
              <PenTool size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[var(--color-ink-primary)]">
                1. Draw Your Wireframe
              </div>
              <div className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                Sketch screens, containers, and boxes using Excalidraw's intuitive MIT-licensed canvas tools.
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)]">
            <div className="p-2 rounded-md bg-[var(--color-surface-3)] text-[var(--color-accent)] shrink-0">
              <Tag size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[var(--color-ink-primary)]">
                2. Tag Semantic Roles
              </div>
              <div className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                Select shapes to assign semantic roles like &lt;Page&gt;, &lt;Card&gt;, or create reusable Units in the Inspector.
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-line-subtle)]">
            <div className="p-2 rounded-md bg-[var(--color-surface-3)] text-[var(--color-accent)] shrink-0">
              <Copy size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[var(--color-ink-primary)]">
                3. Copy AI Contract
              </div>
              <div className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                One click generates a lean, byte-deterministic Markdown layout contract ready for LLM prompts.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 flex sm:justify-end">
          <Button
            onClick={handleDismiss}
            className="w-full sm:w-auto bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-semibold gap-1.5 h-9 px-4"
          >
            <CheckCircle2 size={14} />
            <span>Get Started</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
