import { describe, it, expect } from 'vitest';

/**
 * Standard WCAG 2.1 Relative Luminance & Contrast Ratio Algorithm
 * Matching https://colourcontrast.cc/
 */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const fullHex =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(fullHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function blend(
  fgRgba: [number, number, number, number],
  bgRgb: [number, number, number]
): [number, number, number] {
  const alpha = fgRgba[3];
  return [
    Math.round((1 - alpha) * bgRgb[0] + alpha * fgRgba[0]),
    Math.round((1 - alpha) * bgRgb[1] + alpha * fgRgba[1]),
    Math.round((1 - alpha) * bgRgb[2] + alpha * fgRgba[2])
  ];
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('v5.1 Accessibility & Color Contrast (colourcontrast.cc / WCAG 2.1 AA/AAA)', () => {
  it('guarantees dark theme text against surfaces satisfies WCAG AA (>= 4.5:1)', () => {
    const darkSurfaces: Record<string, string> = {
      'surface-0': '#0b0f19',
      'surface-1': '#111827',
      'surface-2': '#1f2937',
      'surface-3': '#2e384d'
    };

    const darkTexts: Record<string, string> = {
      'ink-primary': '#ffffff',
      'ink-secondary': '#f1f5f9',
      'ink-muted': '#94a3b8'
    };

    for (const [surfName, surfHex] of Object.entries(darkSurfaces)) {
      for (const [textName, textHex] of Object.entries(darkTexts)) {
        const ratio = contrastRatio(hexToRgb(textHex), hexToRgb(surfHex));
        expect(
          ratio,
          `Dark theme ${textName} (${textHex}) on ${surfName} (${surfHex}) contrast ratio ${ratio.toFixed(2)} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('guarantees light theme text against surfaces satisfies WCAG AA (>= 4.5:1)', () => {
    const lightSurfaces: Record<string, string> = {
      'surface-0': '#f8fafc',
      'surface-1': '#ffffff',
      'surface-2': '#f1f5f9',
      'surface-3': '#e2e8f0'
    };

    const lightTexts: Record<string, string> = {
      'ink-primary': '#0f172a',
      'ink-secondary': '#1e293b',
      'ink-muted': '#475569'
    };

    for (const [surfName, surfHex] of Object.entries(lightSurfaces)) {
      for (const [textName, textHex] of Object.entries(lightTexts)) {
        const ratio = contrastRatio(hexToRgb(textHex), hexToRgb(surfHex));
        expect(
          ratio,
          `Light theme ${textName} (${textHex}) on ${surfName} (${surfHex}) contrast ratio ${ratio.toFixed(2)} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('guarantees dark theme role category chips satisfy WCAG AA (>= 4.5:1) on panels and cards', () => {
    const darkSurfaces: [number, number, number][] = [
      hexToRgb('#0b0f19'),
      hexToRgb('#111827'),
      hexToRgb('#1f2937')
    ];

    const darkCategoryChips: Record<string, { fg: string; bg: [number, number, number, number] }> = {
      structure: { fg: '#c4b5fd', bg: [196, 181, 253, 0.15] },
      content: { fg: '#7dd3fc', bg: [125, 211, 252, 0.15] },
      interaction: { fg: '#93c5fd', bg: [147, 197, 253, 0.15] },
      nav: { fg: '#6ee7b7', bg: [110, 231, 183, 0.15] },
      feedback: { fg: '#fca5a5', bg: [252, 165, 165, 0.15] },
      utility: { fg: '#cbd5e1', bg: [203, 213, 225, 0.15] },
      platform: { fg: '#d8b4fe', bg: [216, 180, 254, 0.15] }
    };

    for (const surfRgb of darkSurfaces) {
      for (const [catName, { fg, bg }] of Object.entries(darkCategoryChips)) {
        const blendedBg = blend(bg, surfRgb);
        const ratio = contrastRatio(hexToRgb(fg), blendedBg);
        expect(
          ratio,
          `Dark category chip ${catName} text (${fg}) on blended chip bg ratio ${ratio.toFixed(2)} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('guarantees light theme role category chips satisfy WCAG AA (>= 4.5:1) on panels and cards', () => {
    const lightSurfaces: [number, number, number][] = [
      hexToRgb('#ffffff'),
      hexToRgb('#f8fafc'),
      hexToRgb('#f1f5f9')
    ];

    const lightCategoryChips: Record<string, { fg: string; bg: [number, number, number, number] }> = {
      structure: { fg: '#6d28d9', bg: [109, 40, 217, 0.10] },
      content: { fg: '#0369a1', bg: [3, 105, 161, 0.10] },
      interaction: { fg: '#1d4ed8', bg: [29, 78, 216, 0.10] },
      nav: { fg: '#065f46', bg: [6, 95, 70, 0.10] },
      feedback: { fg: '#b91c1c', bg: [185, 28, 28, 0.10] },
      utility: { fg: '#334155', bg: [51, 65, 85, 0.10] },
      platform: { fg: '#7e22ce', bg: [126, 34, 206, 0.10] }
    };

    for (const surfRgb of lightSurfaces) {
      for (const [catName, { fg, bg }] of Object.entries(lightCategoryChips)) {
        const blendedBg = blend(bg, surfRgb);
        const ratio = contrastRatio(hexToRgb(fg), blendedBg);
        expect(
          ratio,
          `Light category chip ${catName} text (${fg}) on blended chip bg ratio ${ratio.toFixed(2)} must be >= 4.5:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('guarantees primary button text contrast meets WCAG AA (>= 4.5:1)', () => {
    // Primary button: white text on blue-600 #2563eb
    const buttonBg = hexToRgb('#2563eb');
    const buttonText = hexToRgb('#ffffff');
    const ratio = contrastRatio(buttonText, buttonBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
