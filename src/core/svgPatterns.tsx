import React from 'react';
import { fnv1a32 } from './ids';

interface SvgMediaPatternProps {
  shapeId?: string;
  w: number;
  h: number;
  isVideo?: boolean;
  altText?: string;
}

export const SvgMediaPattern: React.FC<SvgMediaPatternProps> = ({
  shapeId = 'default-img',
  w,
  h,
  isVideo = false,
  altText
}) => {
  const hash = fnv1a32(shapeId);
  const patternType = hash % 4; // 0 = diagonal hatch, 1 = cross-hatch, 2 = scene landscape, 3 = dot grid
  const patId = `pat-${shapeId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const renderPattern = () => {
    switch (patternType) {
      case 0:
        // Diagonal hatch pattern
        return (
          <>
            <defs>
              <pattern
                id={patId}
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="12"
                  stroke="var(--md-border-strong)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />
              </pattern>
            </defs>
            <rect x={1} y={1} width={w - 2} height={h - 2} fill={`url(#${patId})`} />
          </>
        );

      case 1:
        // Cross-hatch pattern
        return (
          <>
            <defs>
              <pattern id={patId} width="16" height="16" patternUnits="userSpaceOnUse">
                <path
                  d="M 0 8 L 16 8 M 8 0 L 8 16"
                  fill="none"
                  stroke="var(--md-border)"
                  strokeWidth="0.8"
                  opacity="0.7"
                />
              </pattern>
            </defs>
            <rect x={1} y={1} width={w - 2} height={h - 2} fill={`url(#${patId})`} />
          </>
        );

      case 2:
        // Minimalist landscape scene mockup (sun + 2 mountains)
        return (
          <g opacity="0.45">
            {/* Sun */}
            <circle
              cx={w * 0.3}
              cy={h * 0.35}
              r={Math.min(w, h) * 0.12}
              fill="var(--md-border-strong)"
            />
            {/* Mountain 1 */}
            <polygon
              points={`${w * 0.1},${h - 2} ${w * 0.45},${h * 0.4} ${w * 0.75},${h - 2}`}
              fill="var(--md-surface-raised)"
              stroke="var(--md-border-strong)"
              strokeWidth="1"
            />
            {/* Mountain 2 */}
            <polygon
              points={`${w * 0.4},${h - 2} ${w * 0.75},${h * 0.48} ${w * 0.95},${h - 2}`}
              fill="var(--md-surface-raised)"
              stroke="var(--md-border-strong)"
              strokeWidth="1"
            />
          </g>
        );

      case 3:
      default:
        // Soft dot matrix pattern
        return (
          <>
            <defs>
              <pattern id={patId} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="7" cy="7" r="1.2" fill="var(--md-border-strong)" opacity="0.5" />
              </pattern>
            </defs>
            <rect x={1} y={1} width={w - 2} height={h - 2} fill={`url(#${patId})`} />
          </>
        );
    }
  };

  const badgeText = isVideo ? 'VIDEO' : altText ? altText.slice(0, 16) : 'IMG';
  const badgeW = Math.min(w - 12, Math.max(34, badgeText.length * 7 + 12));
  const badgeH = 18;

  return (
    <g className="svgMediaPattern">
      {/* Background surface */}
      <rect
        x={0.75}
        y={0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={4}
        fill="var(--md-surface-raised)"
        stroke="var(--md-border-strong)"
        strokeWidth={1.5}
      />

      {/* Seeded Pattern Fill */}
      {renderPattern()}

      {/* Centered Media Badge */}
      {w >= 40 && h >= 28 && (
        <g transform={`translate(${w / 2 - badgeW / 2}, ${h / 2 - badgeH / 2})`}>
          <rect
            width={badgeW}
            height={badgeH}
            rx={3}
            fill="var(--md-surface)"
            stroke="var(--md-border-strong)"
            strokeWidth={1}
            opacity="0.92"
          />
          <text
            x={badgeW / 2}
            y={badgeH / 2 + 3.5}
            textAnchor="middle"
            fill="var(--md-text)"
            fontSize={9}
            fontWeight={700}
            letterSpacing="0.08em"
            fontFamily="var(--md-font-mono, monospace)"
          >
            {badgeText}
          </text>
        </g>
      )}
    </g>
  );
};
