import React, { useState, useEffect, useRef } from 'react';
import { UIWidgetProps } from './types';

export interface WireframePreviewProps {
  props: UIWidgetProps;
  isEditing?: boolean;
  onCommitEdit?: (newText: string) => void;
  onCancelEdit?: () => void;
  width?: number;
  height?: number;
}

export const WireframePreview: React.FC<WireframePreviewProps> = ({
  props,
  isEditing = false,
  onCommitEdit,
  onCancelEdit,
  width,
  height
}) => {
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

      // 2. Containers
      case 'section':
      case 'card':
      case 'hero':
      case 'header':
      case 'footer':
      case 'grid_gallery':
      case 'split_pane':
      case 'modal':
      case 'data_table':
      case 'tabs':
      case 'footer_nav':
      case 'steps':
      case 'menubar':
      case 'sidebar': {
        const title = label || '';
        return (
          <g>
            <rect
              x={0.75}
              y={0.75}
              width={w - 1.5}
              height={h - 1.5}
              rx={type === 'card' ? 6 : type === 'modal' ? 8 : 2}
              fill="var(--md-surface)"
              stroke="var(--md-border-strong)"
              strokeWidth={1.5}
              strokeDasharray={isDashed ? '5 3' : undefined}
            />
            {/* Top-left accessible uppercase label chip */}
            <rect
              x={6}
              y={6}
              width={Math.min(w - 12, type.replace('_', ' ').length * 7.5 + 16)}
              height={18}
              rx={3}
              fill="var(--md-surface-raised)"
              stroke="var(--md-border)"
              strokeWidth={1}
            />
            <text
              x={10}
              y={19}
              fill="var(--md-text-bold)"
              fontSize={11}
              fontWeight={700}
              letterSpacing="0.08em"
              fontFamily="var(--md-font-mono, monospace)"
            >
              {type.replace('_', ' ').toUpperCase()}
            </text>

            {title && h >= 48 && (
              <text
                x={10}
                y={39}
                fill="var(--md-text-bold)"
                fontSize={14}
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

            {/* Split pane divider */}
            {type === 'split_pane' && (
              <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="var(--md-border-strong)" strokeWidth={1.5} strokeDasharray="3 3" />
            )}

            {/* Data table wireframe grid */}
            {type === 'data_table' && h >= 40 && (
              <g>
                <line x1={0} y1={24} x2={w} y2={24} stroke="var(--md-border-strong)" strokeWidth={1.5} />
                <line x1={w * 0.33} y1={0} x2={w * 0.33} y2={h} stroke="var(--md-border)" strokeWidth={1} />
                <line x1={w * 0.66} y1={0} x2={w * 0.66} y2={h} stroke="var(--md-border)" strokeWidth={1} />
              </g>
            )}
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

      // 3. Inputs / Text Fields
      case 'input':
      case 'search':
      case 'password':
      case 'textarea':
      case 'date_picker':
      case 'file_upload':
      case 'select': {
        const showTextVal = placeholder || label || (type === 'select' ? props.options || 'Select' : '');
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
                fill="var(--md-text)"
                fontSize={12}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {showTextVal || (type === 'search' ? 'Search...' : type === 'password' ? '••••••••' : 'Input...')}
              </text>
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

      // 4. Headings & Typography
      case 'heading': {
        const hText = label || 'Heading';
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

      // 5. Paragraphs & Body (Line Glyphs)
      case 'paragraph':
      case 'blockquote': {
        if (props.showText && !isEditing) {
          return (
            <g>
              <text
                x={4}
                y={15}
                fill="var(--md-text)"
                fontSize={12}
                fontFamily="var(--md-font-sans, 'Google Sans', sans-serif)"
              >
                {(label || 'Paragraph text...').slice(0, Math.floor(w / 6))}
              </text>
            </g>
          );
        }
        return (
          <g>
            {type === 'blockquote' && (
              <line x1={2} y1={2} x2={2} y2={h - 2} stroke="var(--md-border-strong)" strokeWidth={2.5} />
            )}
            {!isEditing && renderLineGlyphs(h, w, 4)}
          </g>
        );
      }

      // 6. Media Placeholders (Cross ✕ Boxes)
      case 'image_frame':
      case 'video_frame': {
        const mediaTag = type === 'video_frame' ? 'VIDEO' : 'IMG';
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

            {/* Center label chip */}
            <rect
              x={w / 2 - 24}
              y={h / 2 - 10}
              width={48}
              height={20}
              rx={3}
              fill="var(--md-surface-raised)"
              stroke="var(--md-border-strong)"
              strokeWidth={1}
            />
            <text
              x={w / 2}
              y={h / 2 + 4}
              textAnchor="middle"
              fill="var(--md-text-bold)"
              fontSize={11}
              fontWeight={700}
              letterSpacing="0.08em"
              fontFamily="var(--md-font-mono, monospace)"
            >
              {mediaTag}
            </text>
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

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', overflow: 'visible', userSelect: 'none' }}
    >
      {renderSvgContent()}
      {renderInlineEditor()}
    </svg>
  );
};
