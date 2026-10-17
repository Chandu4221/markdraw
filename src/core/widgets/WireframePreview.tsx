import React, { useState, useEffect, useRef } from 'react';
import { UIWidgetProps } from './types';
import { RenderMode, useRenderMode } from '../renderMode';
import { getGhostPreview, getLoremLines } from '../lorem';
import { SvgMediaPattern } from '../svgPatterns';
import { isUntouchedLabel } from './widgetCatalog';

export interface WireframePreviewProps {
  props: UIWidgetProps;
  isEditing?: boolean;
  onCommitEdit?: (newText: string) => void;
  onCancelEdit?: () => void;
  width?: number;
  height?: number;
  renderMode?: RenderMode;
  shapeId?: string;
}

const getColumnDividers = (w: number, cols?: number, split?: string): number[] => {
  if (!cols || cols <= 1) return [];
  if (cols === 2) {
    if (split === '70/30') return [Math.round(w * 0.7)];
    if (split === '30/70') return [Math.round(w * 0.3)];
    return [Math.round(w * 0.5)];
  }
  if (cols === 3) {
    if (split === '25/50/25') return [Math.round(w * 0.25), Math.round(w * 0.75)];
    return [Math.round(w * (1 / 3)), Math.round(w * (2 / 3))];
  }
  if (cols === 4) {
    return [Math.round(w * 0.25), Math.round(w * 0.5), Math.round(w * 0.75)];
  }
  return [];
};

/**
 * Uniform Semantic Chip for container wireframe shapes (Task 5).
 * 9px uppercase, muted, top-left (x=6, y=6), height 16px.
 */
interface ChipProps {
  label: string;
  maxWidth: number;
}

const Chip: React.FC<ChipProps> = ({ label, maxWidth }) => {
  const displayLabel = label.replace(/_/g, ' ').toUpperCase();
  const chipWidth = Math.min(Math.max(20, maxWidth - 12), displayLabel.length * 5.6 + 10);

  if (maxWidth < 24) return null;

  return (
    <g className="wireframeChip" style={{ pointerEvents: 'none' }}>
      <rect
        x={6}
        y={6}
        width={chipWidth}
        height={16}
        rx={3}
        fill="var(--md-surface-raised)"
        stroke="var(--md-border)"
        strokeWidth={1}
      />
      <text
        x={11}
        y={14.5}
        dominantBaseline="middle"
        fill="var(--md-text)"
        fontSize={9}
        fontWeight={700}
        letterSpacing="0.08em"
        fontFamily="var(--md-font-mono, monospace)"
      >
        {displayLabel}
      </text>
    </g>
  );
};

export const WireframePreview: React.FC<WireframePreviewProps> = ({
  props,
  isEditing = false,
  onCommitEdit,
  onCancelEdit,
  width,
  height,
  renderMode,
  shapeId
}) => {
  const globalRenderMode = useRenderMode();
  const effectiveMode: RenderMode = renderMode ?? globalRenderMode;
  const seed = shapeId ?? 'default';

  const w = Math.max(10, width ?? props.w ?? 100);
  const h = Math.max(10, height ?? props.h ?? 40);
  const type = props.widgetType || 'button';
  const label = props.label || '';
  const placeholder = props.placeholder || '';
  const variant = props.variant || 'solid';
  const isDashed = variant === 'ghost' || variant === 'dashed' || variant === 'secondary';

  // Inline editing state
  const isInputType = ['input', 'search', 'password', 'textarea', 'date_picker'].includes(type);
  const primaryText = isInputType ? (placeholder || label) : label;

  const [editText, setEditText] = useState(primaryText);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const renderNoteHint = () => {
    if (effectiveMode !== 'realistic' || (!props.note && (!props.behaviors || props.behaviors.length === 0))) {
      return null;
    }
    const isMotion =
      props.behaviors?.includes('parallax') ||
      props.note?.toLowerCase().includes('parallax') ||
      props.note?.toLowerCase().includes('motion');

    if (isMotion) {
      return (
        <g opacity={0.7} style={{ pointerEvents: 'none' }}>
          <line x1={w - 18} y1={5} x2={w - 12} y2={11} stroke="var(--md-accent)" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={w - 13} y1={5} x2={w - 7} y2={11} stroke="var(--md-accent)" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={w - 8} y1={5} x2={w - 2} y2={11} stroke="var(--md-accent)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );
    }

    return (
      <g opacity={0.8} style={{ pointerEvents: 'none' }}>
        <polygon points={`${w - 10},0 ${w},10 ${w},0`} fill="var(--md-accent)" />
      </g>
    );
  };

  useEffect(() => {
    setEditText(primaryText);
  }, [primaryText, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCommitEdit?.(editText);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.();
    }
  };

  const handleBlur = () => {
    onCommitEdit?.(editText);
  };

  // Helper for rendering line glyphs (Part 1.1)
  const renderLineGlyphs = (availableH: number, availableW: number, topOffset: number = 8) => {
    const lineHeight = 12; // 8px bar + 4px gap
    const count = Math.max(1, Math.min(8, Math.floor((availableH - topOffset) / lineHeight)));
    const widths = [0.95, 0.88, 0.92, 0.65, 0.90, 0.80, 0.85, 0.5];
    const bars: React.ReactElement[] = [];

    for (let i = 0; i < count; i++) {
      const barW = Math.max(16, (availableW - 16) * widths[i % widths.length]);
      const y = topOffset + i * lineHeight;
      bars.push(
        <rect
          key={i}
          x={8}
          y={y}
          width={barW}
          height={6}
          rx={3}
          fill="var(--md-text-subtle)"
          opacity={0.9}
        />
      );
    }
    return bars;
  };

  // Render inline editor overlay if active
  const renderInlineEditor = () => {
    if (!isEditing) return null;

    return (
      <foreignObject x={4} y={4} width={w - 8} height={h - 8} style={{ overflow: 'visible' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: type === 'button' ? 'center' : 'flex-start'
          }}
        >
          {type === 'paragraph' || type === 'textarea' || type === 'blockquote' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--md-surface)',
                color: 'var(--md-text)',
                border: '1.5px solid var(--md-accent)',
                borderRadius: '4px',
                fontFamily: 'var(--md-font-mono, monospace)',
                fontSize: '12px',
                padding: '4px 6px',
                resize: 'none',
                outline: 'none'
              }}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{
                width: '100%',
                background: 'var(--md-surface)',
                color: 'var(--md-text)',
                border: '1.5px solid var(--md-accent)',
                borderRadius: '4px',
                fontFamily: 'var(--md-font-mono, monospace)',
                fontSize: '12px',
                padding: '2px 6px',
                textAlign: type === 'button' ? 'center' : 'left',
                outline: 'none'
              }}
            />
          )}
        </div>
      </foreignObject>
    );
  };

  // Render SVG wireframe based on widget class
  const renderSvgContent = () => {
    switch (type) {
      // 1. Page Frame (Fixed Width, Scalable Height)
      case 'page': {
        const title = label || 'Page Frame';
        const isFullHD = variant === 'fullhd' || (!variant && w >= 1800);
        const resLabel = isFullHD ? 'FullHD 1920px' : variant === 'hd' ? 'HD 1280px' : `${Math.round(w)}px`;
        return (
          <g>
            {/* Outer Page Frame */}
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={6}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />

            {/* Browser Header Bar */}
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={36}
              rx={6}
              fill="var(--md-surface-raised)"
            />
            <rect
              x={0.75}
              y={20}
              width={w - 1.5}
              height={16}
              fill="var(--md-surface-raised)"
            />
            <line x1={0} y1={36} x2={w} y2={36} stroke="var(--md-border-strong)" strokeWidth={1.5} />

            {/* Window control dots */}
            <circle cx={16} cy={18} r={3.5} fill="var(--md-border-strong)" />
            <circle cx={27} cy={18} r={3.5} fill="var(--md-border-strong)" />
            <circle cx={38} cy={18} r={3.5} fill="var(--md-border-strong)" />

            {/* Center URL bar */}
            {w >= 300 && (
              <g>
                <rect
                  x={w / 2 - Math.min(160, (w - 120) / 2)}
                  y={8}
                  width={Math.min(320, w - 120)}
                  height={20}
                  rx={4}
                  fill="var(--md-surface)"
                  stroke="var(--md-border-strong)"
                  strokeWidth={1}
                />
                <text
                  x={w / 2}
                  y={22}
                  textAnchor="middle"
                  fill="var(--md-text)"
                  fontSize={12}
                  fontWeight={500}
                  fontFamily="var(--md-font-mono, monospace)"
                >
                  {title} • {resLabel} (height auto)
                </text>
              </g>
            )}

            {/* Right resolution badge */}
            {w >= 500 && (
              <g>
                <rect
                  x={w - 110}
                  y={9}
                  width={96}
                  height={18}
                  rx={3}
                  fill="var(--md-surface)"
                  stroke="var(--md-border-strong)"
                  strokeWidth={1}
                />
                <text
                  x={w - 62}
                  y={22}
                  textAnchor="middle"
                  fill="var(--md-text-bold)"
                  fontSize={10.5}
                  fontWeight={700}
                  letterSpacing="0.06em"
                  fontFamily="var(--md-font-mono, monospace)"
                >
                  {variant.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      }

      // 2. Card Container
      case 'card': {
        const isUntouched = isUntouchedLabel('card', label);
        const ghost = getGhostPreview('card', seed, props);
        const cardTitle = !isUntouched && label ? label : (effectiveMode === 'skeleton' ? '' : ghost.primary);

        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={6}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
              strokeDasharray={isDashed ? '5 3' : undefined}
            />
            {/* Top-left uniform semantic chip */}
            <Chip label="card" maxWidth={w} />

            {/* Card title */}
            {cardTitle && h >= 40 && (
              <text
                x={10}
                y={h >= 48 ? 39 : 32}
                fill="var(--md-text-bold)"
                fontSize={h >= 48 ? 14 : 12}
                fontWeight={700}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {cardTitle.slice(0, Math.floor((w - 20) / 8))}
              </text>
            )}

            {/* Realistic mode: card header divider */}
            {effectiveMode === 'realistic' && h >= 64 && (
              <line x1={0} y1={46} x2={w} y2={46} stroke="var(--md-border)" strokeWidth={1} />
            )}

            {/* Annotated / Realistic mode: ghost body lines */}
            {effectiveMode !== 'skeleton' && h >= 80 && ghost.lines && (
              <g opacity={0.65}>
                <text
                  x={10}
                  y={effectiveMode === 'realistic' && h >= 64 ? 64 : 58}
                  fill="var(--md-text-muted)"
                  fontSize={11}
                  fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
                >
                  {ghost.lines[0]?.slice(0, Math.floor((w - 20) / 6.5))}
                </text>
                {h >= 105 && (
                  <text
                    x={10}
                    y={effectiveMode === 'realistic' && h >= 64 ? 80 : 74}
                    fill="var(--md-text-muted)"
                    fontSize={11}
                    fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
                  >
                    {ghost.lines[1]?.slice(0, Math.floor((w - 20) / 6.5))}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      }

      // 3. Data Table Container
      case 'data_table': {
        const title = label || '';
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={4}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />
            <Chip label="data_table" maxWidth={w} />
            {title && h >= 40 && (
              <text
                x={10}
                y={h >= 48 ? 39 : 32}
                fill="var(--md-text-bold)"
                fontSize={h >= 48 ? 14 : 12}
                fontWeight={700}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {title.slice(0, Math.floor(w / 9))}
              </text>
            )}
            {h >= 40 && (
              <g>
                <line x1={0} y1={26} x2={w} y2={26} stroke="var(--md-border-strong)" strokeWidth={1.5} />
                {effectiveMode === 'realistic' && (
                  <>
                    {Array.from({ length: Math.floor((h - 26) / 20) }).map((_, i) =>
                      i % 2 === 1 ? (
                        <rect
                          key={i}
                          x={1}
                          y={26 + i * 20}
                          width={w - 2}
                          height={Math.min(20, h - (26 + i * 20) - 1)}
                          fill="var(--md-surface-raised)"
                          opacity={0.6}
                        />
                      ) : null
                    )}
                  </>
                )}
                <line x1={w * 0.33} y1={0} x2={w * 0.33} y2={h} stroke="var(--md-border)" strokeWidth={1} />
                <line x1={w * 0.66} y1={0} x2={w * 0.66} y2={h} stroke="var(--md-border)" strokeWidth={1} />
              </g>
            )}
          </g>
        );
      }

      // 4. Other Structural Containers (Task 5: Uniform 9px muted uppercase Chip)
      case 'section':
      case 'hero':
      case 'header':
      case 'footer':
      case 'grid_gallery':
      case 'split_pane':
      case 'modal':
      case 'tabs':
      case 'footer_nav':
      case 'steps':
      case 'menubar':
      case 'sidebar':
      case 'navbar':
      case 'breadcrumbs':
      case 'pagination':
      case 'banner': {
        const title = label || '';
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={type === 'modal' ? 8 : 2}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
              strokeDasharray={isDashed ? '5 3' : undefined}
            />
            {/* Top-left uniform semantic chip */}
            <Chip label={type} maxWidth={w} />

            {title && h >= 40 && (
              <text
                x={10}
                y={h >= 48 ? 39 : 32}
                fill="var(--md-text-bold)"
                fontSize={h >= 48 ? 14 : 12}
                fontWeight={700}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {title.slice(0, Math.floor(w / 9))}
              </text>
            )}

            {/* Modal header border & close button */}
            {type === 'modal' && h >= 40 && (
              <g>
                <line x1={0} y1={28} x2={w} y2={28} stroke="var(--md-border-strong)" strokeWidth={1.5} />
                <line x1={w - 16} y1={10} x2={w - 8} y2={18} stroke="var(--md-text-bold)" strokeWidth={1.8} />
                <line x1={w - 8} y1={10} x2={w - 16} y2={18} stroke="var(--md-text-bold)" strokeWidth={1.8} />
              </g>
            )}

            {/* Column Dividers & Split pane divider */}
            {(() => {
              const cols = props.columns || (type === 'split_pane' ? 2 : 1);
              const split = props.columnSplit || (type === 'split_pane' ? 'equal' : undefined);
              const dividers = getColumnDividers(w, cols, split);
              return dividers.map((divX, idx) => (
                <line
                  key={idx}
                  x1={divX}
                  y1={0}
                  x2={divX}
                  y2={h}
                  stroke="var(--md-border-strong)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={0.7}
                />
              ));
            })()}
          </g>
        );
      }

      // 2. Buttons
      case 'button': {
        const btnText = label || 'Button';
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={5}
              fill="var(--md-surface)"
              stroke="var(--md-text)"
              strokeWidth={1.5}
              strokeDasharray={isDashed ? '4 3' : undefined}
            />
            {!isEditing && (
              <text
                x={w / 2}
                y={h / 2 + 4.5}
                textAnchor="middle"
                fill="var(--md-text-bold)"
                fontSize={13}
                fontWeight={700}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {btnText}
              </text>
            )}
          </g>
        );
      }

      // 5. Inputs / Text Fields
      case 'input':
      case 'search':
      case 'password':
      case 'textarea':
      case 'date_picker':
      case 'file_upload':
      case 'select': {
        const ghost = getGhostPreview(type, seed, props);
        const showTextVal = placeholder || label || (type === 'select' ? props.options || 'Select' : '');
        const displayText = showTextVal || (effectiveMode !== 'skeleton' && ghost.placeholder ? ghost.placeholder : (type === 'search' ? 'Search...' : type === 'password' ? '••••••••' : 'Input...'));
        const isGhost = !showTextVal && effectiveMode !== 'skeleton' && Boolean(ghost.placeholder);

        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={4}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />
            {/* Underline-style caret glyph '⌐' on the left (Part 1.1) */}
            <path
              d="M 8 13 L 13 13 L 13 22"
              fill="none"
              stroke="var(--md-text-bold)"
              strokeWidth={2}
            />
            {!isEditing && (
              <text
                x={20}
                y={h / 2 + 4}
                fill={isGhost ? 'var(--md-text-muted)' : 'var(--md-text)'}
                fontSize={12}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {displayText.slice(0, Math.floor((w - (effectiveMode === 'realistic' && type === 'search' ? 56 : 26)) / 7))}
              </text>
            )}
            {/* Realistic mode: Command/Ctrl+K badge for search */}
            {effectiveMode === 'realistic' && type === 'search' && w >= 110 && (
              <g transform={`translate(${w - 38}, ${h / 2 - 8})`}>
                <rect width={30} height={16} rx={3} fill="var(--md-surface-raised)" stroke="var(--md-border)" strokeWidth={1} />
                <text x={15} y={11.5} textAnchor="middle" fill="var(--md-text-muted)" fontSize={9} fontWeight={600} fontFamily="var(--md-font-mono, monospace)">
                  ⌘K
                </text>
              </g>
            )}
            {type === 'select' && (
              <path
                d={`M ${w - 16} ${h / 2 - 2} L ${w - 11} ${h / 2 + 3} L ${w - 6} ${h / 2 - 2}`}
                fill="none"
                stroke="var(--md-text-bold)"
                strokeWidth={2}
              />
            )}
          </g>
        );
      }

      // 6. Headings & Typography
      case 'heading': {
        const isUntouched = isUntouchedLabel('heading', label);
        const ghost = getGhostPreview('heading', seed, props);
        const hText = !isUntouched && label ? label : (effectiveMode === 'skeleton' ? (label || 'Heading') : ghost.primary);
        const fontSize = variant === 'h1' ? 22 : variant === 'h2' ? 18 : 15;
        const fontWeight = variant === 'h1' ? 800 : 700;
        return (
          <g>
            {!isEditing && (
              <text
                x={4}
                y={h / 2 + fontSize / 3.2}
                fill="var(--md-text-bold)"
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {hText}
              </text>
            )}
          </g>
        );
      }

      // 7. Paragraphs & Body
      case 'paragraph':
      case 'blockquote': {
        const isUntouched = isUntouchedLabel(type, label);
        if (props.showText && !isEditing && label) {
          return (
            <g>
              <text
                x={4}
                y={15}
                fill="var(--md-text)"
                fontSize={12}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label.slice(0, Math.floor(w / 6))}
              </text>
            </g>
          );
        }

        if (!isUntouched && label && !isEditing) {
          return (
            <g>
              {type === 'blockquote' && (
                <line x1={2} y1={2} x2={2} y2={h - 2} stroke={effectiveMode === 'realistic' ? 'var(--md-accent)' : 'var(--md-border-strong)'} strokeWidth={3} />
              )}
              <text
                x={type === 'blockquote' ? 12 : 4}
                y={15}
                fill="var(--md-text)"
                fontSize={12}
                fontStyle={type === 'blockquote' && effectiveMode === 'realistic' ? 'italic' : 'normal'}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label.slice(0, Math.floor((w - 16) / 6.5))}
              </text>
            </g>
          );
        }

        // Skeleton mode: line glyphs
        if (effectiveMode === 'skeleton') {
          return (
            <g>
              {type === 'blockquote' && (
                <line x1={2} y1={2} x2={2} y2={h - 2} stroke="var(--md-border-strong)" strokeWidth={2.5} />
              )}
              {!isEditing && renderLineGlyphs(h, w, 4)}
            </g>
          );
        }

        // Annotated & Realistic mode: deterministic lorem lines
        const lineCount = Math.max(1, Math.min(6, Math.floor((h - 4) / 16)));
        const loremLines = getLoremLines(seed, lineCount);
        const leftPad = type === 'blockquote' ? 12 : 4;

        return (
          <g>
            {type === 'blockquote' && (
              <line
                x1={2}
                y1={2}
                x2={2}
                y2={h - 2}
                stroke={effectiveMode === 'realistic' ? 'var(--md-accent)' : 'var(--md-border-strong)'}
                strokeWidth={3}
              />
            )}
            {!isEditing &&
              loremLines.map((line, idx) => (
                <text
                  key={idx}
                  x={leftPad}
                  y={14 + idx * 16}
                  fill="var(--md-text-muted)"
                  fontSize={11.5}
                  fontStyle={type === 'blockquote' && effectiveMode === 'realistic' ? 'italic' : 'normal'}
                  fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
                >
                  {line.slice(0, Math.floor((w - leftPad - 8) / 6.5))}
                </text>
              ))}
          </g>
        );
      }

      // 8. Carousel
      case 'carousel': {
        const dotCount = 4;
        const dotRadius = 3;
        const dotGap = 10;
        const totalDotsW = dotCount * (dotRadius * 2) + (dotCount - 1) * dotGap;
        const startX = w / 2 - totalDotsW / 2;

        return (
          <g>
            {effectiveMode === 'skeleton' ? (
              <rect
                x={0.5}
                y={0.5}
                width={w - 1}
                height={h - 1}
                rx={6}
                fill="var(--md-surface)"
                stroke="var(--md-border)"
                strokeWidth={1}
              />
            ) : (
              <SvgMediaPattern
                shapeId={seed}
                w={w}
                h={h}
                isVideo={false}
                altText={!isUntouchedLabel('carousel', label) ? label : 'CAROUSEL'}
              />
            )}
            <Chip label="carousel" maxWidth={w} />
            {/* Left Chevron Arrow < */}
            <path
              d={`M ${20} ${h / 2 - 9} L ${12} ${h / 2} L ${20} ${h / 2 + 9}`}
              fill="none"
              stroke="var(--md-text-muted)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right Chevron Arrow > */}
            <path
              d={`M ${w - 20} ${h / 2 - 9} L ${w - 12} ${h / 2} L ${w - 20} ${h / 2 + 9}`}
              fill="none"
              stroke="var(--md-text-muted)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Slide Dots */}
            {Array.from({ length: dotCount }).map((_, i) => (
              <circle
                key={i}
                cx={startX + i * (dotRadius * 2 + dotGap) + dotRadius}
                cy={h - 14}
                r={dotRadius}
                fill={i === 0 ? 'var(--md-accent)' : 'var(--md-border-strong)'}
              />
            ))}
          </g>
        );
      }

      // 9. Media Placeholders
      case 'image_frame':
      case 'video_frame': {
        if (effectiveMode === 'skeleton') {
          return (
            <g>
              <rect
                x={0.75}
                y={0.75}
                width={w - 1.5}
                height={h - 1.5}
                rx={3}
                fill="var(--md-surface)"
                stroke="var(--md-border-strong)"
                strokeWidth={1.5}
              />
              {/* Corner-to-corner diagonal ✕ cross */}
              <line x1={0} y1={0} x2={w} y2={h} stroke="var(--md-border-strong)" strokeWidth={1.5} />
              <line x1={w} y1={0} x2={0} y2={h} stroke="var(--md-border-strong)" strokeWidth={1.5} />
            </g>
          );
        }

        return (
          <SvgMediaPattern
            shapeId={seed}
            w={w}
            h={h}
            isVideo={type === 'video_frame'}
            altText={props.altText || (!isUntouchedLabel(type, label) ? label : undefined)}
          />
        );
      }

      // 10. Stat / KPI
      case 'stat_kpi': {
        const isUntouched = isUntouchedLabel('stat_kpi', label);
        const ghost = getGhostPreview('stat_kpi', seed, props);
        const displayVal = !isUntouched && label ? label : (effectiveMode === 'skeleton' ? (label || 'KPI') : ghost.primary);
        const displaySub = props.subtext || (effectiveMode === 'skeleton' ? '' : ghost.subtext);

        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={6}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />
            <Chip label="KPI" maxWidth={w} />
            {effectiveMode === 'skeleton' ? (
              renderLineGlyphs(h - 24, w, 28)
            ) : (
              <>
                <text
                  x={12}
                  y={h >= 64 ? 38 : h / 2 + 2}
                  fill="var(--md-text-bold)"
                  fontSize={h >= 64 ? 22 : 16}
                  fontWeight={800}
                  fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
                >
                  {displayVal}
                </text>
                {displaySub && h >= 48 && (
                  <text
                    x={12}
                    y={h >= 64 ? 54 : h - 10}
                    fill={displaySub.startsWith('+') ? 'var(--md-accent)' : 'var(--md-text-muted)'}
                    fontSize={11}
                    fontWeight={500}
                    fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
                  >
                    {displaySub.slice(0, Math.floor((w - 20) / 6.5))}
                  </text>
                )}
              </>
            )}
          </g>
        );
      }

      // 7. Icons & Avatars
      case 'avatar': {
        const r = Math.min(w, h) / 2 - 1.5;
        const cx = w / 2;
        const cy = h / 2;
        return (
          <g>
            <circle cx={cx} cy={cy} r={r} fill="var(--md-surface)" stroke="var(--md-text)" strokeWidth={1.5} />
            {/* Head circle */}
            <circle cx={cx} cy={cy - r * 0.25} r={r * 0.35} fill="none" stroke="var(--md-text)" strokeWidth={1.2} />
            {/* Shoulder arc */}
            <path
              d={`M ${cx - r * 0.65} ${cy + r * 0.75} Q ${cx} ${cy + r * 0.15} ${cx + r * 0.65} ${cy + r * 0.75}`}
              fill="none"
              stroke="var(--md-text)"
              strokeWidth={1.2}
            />
          </g>
        );
      }

      case 'icon': {
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={4}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />
            <text
              x={w / 2}
              y={h / 2 + 5.5}
              textAnchor="middle"
              fill="var(--md-text-bold)"
              fontSize={16}
            >
              ⬡
            </text>
          </g>
        );
      }

      // 8. Checkboxes, Radios, Toggles
      case 'checkbox': {
        const checked = props.checked ?? false;
        return (
          <g>
            <rect
              x={2}
              y={h / 2 - 7}
              width={14}
              height={14}
              rx={3}
              fill="var(--md-surface)"
              stroke="var(--md-text-bold)"
              strokeWidth={1.5}
            />
            {checked && (
              <path
                d={`M 5 ${h / 2} L 8 ${h / 2 + 3} L 13 ${h / 2 - 3}`}
                fill="none"
                stroke="var(--md-text-bold)"
                strokeWidth={2.2}
              />
            )}
            {!isEditing && (
              <text
                x={24}
                y={h / 2 + 4.5}
                fill="var(--md-text-bold)"
                fontSize={12.5}
                fontWeight={600}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label || 'Checkbox'}
              </text>
            )}
          </g>
        );
      }

      case 'radio': {
        const checked = props.checked ?? false;
        return (
          <g>
            <circle
              cx={9}
              cy={h / 2}
              r={7}
              fill="var(--md-surface)"
              stroke="var(--md-text-bold)"
              strokeWidth={1.5}
            />
            {checked && (
              <circle cx={9} cy={h / 2} r={3.5} fill="var(--md-text-bold)" />
            )}
            {!isEditing && (
              <text
                x={24}
                y={h / 2 + 4.5}
                fill="var(--md-text-bold)"
                fontSize={12.5}
                fontWeight={600}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label || 'Radio'}
              </text>
            )}
          </g>
        );
      }

      case 'toggle': {
        const checked = props.checked ?? false;
        const knobX = checked ? 21 : 7;
        return (
          <g>
            <rect
              x={0}
              y={h / 2 - 7}
              width={28}
              height={14}
              rx={7}
              fill={checked ? 'var(--md-accent-subtle)' : 'var(--md-surface)'}
              stroke="var(--md-text-bold)"
              strokeWidth={1.5}
            />
            <circle
              cx={knobX}
              cy={h / 2}
              r={5}
              fill="var(--md-text-bold)"
            />
            {!isEditing && (
              <text
                x={36}
                y={h / 2 + 4.5}
                fill="var(--md-text-bold)"
                fontSize={12.5}
                fontWeight={600}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label || (checked ? 'On' : 'Off')}
              </text>
            )}
          </g>
        );
      }

      // 9. Dividers & Spacers
      case 'divider': {
        return (
          <line
            x1={0}
            y1={h / 2}
            x2={w}
            y2={h / 2}
            stroke="var(--md-border-strong)"
            strokeWidth={1.5}
            strokeDasharray={isDashed ? '4 3' : undefined}
          />
        );
      }

      case 'spacer': {
        return (
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            fill="none"
            stroke="var(--md-border)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        );
      }

      // 10. Sliders & Progress
      case 'slider':
      case 'progress_bar': {
        const val = typeof props.value === 'number' ? props.value : 50;
        const filledW = (w - 16) * (Math.min(100, Math.max(0, val)) / 100);
        return (
          <g>
            <line
              x1={8}
              y1={h / 2}
              x2={w - 8}
              y2={h / 2}
              stroke="var(--md-border-strong)"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={8}
              y1={h / 2}
              x2={8 + filledW}
              y2={h / 2}
              stroke="var(--md-text-bold)"
              strokeWidth={4}
              strokeLinecap="round"
            />
            {type === 'slider' && (
              <circle
                cx={8 + filledW}
                cy={h / 2}
                r={7}
                fill="var(--md-surface)"
                stroke="var(--md-text-bold)"
                strokeWidth={2.5}
              />
            )}
          </g>
        );
      }

      // Fallback: rounded wireframe box with label
      default: {
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={4}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
            />
            {!isEditing && (
              <text
                x={w / 2}
                y={h / 2 + 4.5}
                textAnchor="middle"
                fill="var(--md-text-bold)"
                fontSize={12}
                fontWeight={600}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {label || type}
              </text>
            )}
          </g>
        );
      }
    }
  };

  const renderResponsiveBadges = () => {
    if (w < 40 || h < 20) return null;
    return (
      <g className="wireframeResponsiveBadges" style={{ pointerEvents: 'none' }}>
        {/* Responsive Container Pill */}
        {props.isResponsive && w >= 110 && h >= 28 && (
          <g>
            <rect
              x={w - 74}
              y={5}
              width={68}
              height={15}
              rx={3}
              fill="rgba(147, 51, 234, 0.12)"
              stroke="rgba(147, 51, 234, 0.4)"
              strokeWidth={1}
            />
            <text
              x={w - 40}
              y={13.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9333ea"
              fontSize={8}
              fontWeight={700}
              fontFamily="var(--md-font-mono, monospace)"
            >
              {props.mobileStack === 'reverse' ? '📱 REVERSE' : '📱 STACK'}
            </text>
          </g>
        )}

        {/* Hide on Mobile Badge */}
        {props.hideOnMobile && w >= 65 && h >= 26 && (
          <g>
            <rect
              x={w - 56}
              y={h - 17}
              width={50}
              height={13}
              rx={2}
              fill="rgba(245, 158, 11, 0.15)"
              stroke="rgba(245, 158, 11, 0.5)"
              strokeWidth={1}
            />
            <text
              x={w - 31}
              y={h - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#d97706"
              fontSize={7.5}
              fontWeight={700}
              fontFamily="var(--md-font-mono, monospace)"
            >
              DESKTOP
            </text>
          </g>
        )}

        {/* Mobile Order Badge */}
        {typeof props.mobileOrder === 'number' && w >= 50 && h >= 26 && (
          <g>
            <rect
              x={6}
              y={h - 17}
              width={42}
              height={13}
              rx={2}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth={1}
            />
            <text
              x={27}
              y={h - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2563eb"
              fontSize={7.5}
              fontWeight={700}
              fontFamily="var(--md-font-mono, monospace)"
            >
              ORD #{props.mobileOrder}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', overflow: 'visible', userSelect: 'none' }}
    >
      {renderSvgContent()}
      {renderResponsiveBadges()}
      {renderNoteHint()}
      {renderInlineEditor()}
    </svg>
  );
};

export default WireframePreview;
