import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('v5.0 Design System & Tokens Enforcement (§4, §10)', () => {
  const tokensPath = path.resolve(process.cwd(), 'src/theme/tokens.css');
  const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

  it('declares the single-authority surface and ink token scale', () => {
    // Surface scale 0..4
    expect(tokensContent).toContain('--color-surface-0');
    expect(tokensContent).toContain('--color-surface-1');
    expect(tokensContent).toContain('--color-surface-2');
    expect(tokensContent).toContain('--color-surface-3');
    expect(tokensContent).toContain('--color-surface-4');

    // Ink hierarchy
    expect(tokensContent).toContain('--color-ink-primary');
    expect(tokensContent).toContain('--color-ink-secondary');
    expect(tokensContent).toContain('--color-ink-muted');

    // Lines & Borders
    expect(tokensContent).toContain('--color-line-subtle');
    expect(tokensContent).toContain('--color-line-strong');

    // Semantic accents
    expect(tokensContent).toContain('--color-accent');
    expect(tokensContent).toContain('--color-accent-hover');
    expect(tokensContent).toContain('--color-danger');
    expect(tokensContent).toContain('--color-success');
    expect(tokensContent).toContain('--color-warning');

    // Type Category colors (§2.1)
    expect(tokensContent).toContain('--color-type-structure');
    expect(tokensContent).toContain('--color-type-content');
    expect(tokensContent).toContain('--color-type-interaction');
    expect(tokensContent).toContain('--color-type-navigation');
    expect(tokensContent).toContain('--color-type-feedback');
    expect(tokensContent).toContain('--color-type-platform');

    // Chip grammar & Role Category colors (§2.2, §4.2)
    expect(tokensContent).toContain('--color-role-chip-bg');
    expect(tokensContent).toContain('--color-role-chip-text');
    expect(tokensContent).toContain('--color-untagged-chip-bg');
    expect(tokensContent).toContain('--color-untagged-chip-text');
    expect(tokensContent).toContain('--color-role-structure');
    expect(tokensContent).toContain('--color-role-content');
    expect(tokensContent).toContain('--color-role-interaction');
    expect(tokensContent).toContain('--color-role-nav');
    expect(tokensContent).toContain('--color-role-feedback');
    expect(tokensContent).toContain('--color-role-utility');
  });

  it('declares standard radii and motion tokens', () => {
    expect(tokensContent).toContain('--radius-sm');
    expect(tokensContent).toContain('--radius-md');
    expect(tokensContent).toContain('--radius-lg');
    expect(tokensContent).toContain('--radius-full');
    expect(tokensContent).toContain('--duration-fast');
    expect(tokensContent).toContain('--duration-normal');
  });

  function getSourceFiles(): string[] {
    const srcDir = path.resolve(process.cwd(), 'src');
    const files: string[] = [];
    const exempt = new Set(['tokens.css', 'excalidraw-theme.css']);

    function scan(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          if (item !== '__tests__') scan(full);
        } else if (
          (full.endsWith('.tsx') || full.endsWith('.ts') || full.endsWith('.css') || full.endsWith('.html')) &&
          !full.endsWith('.test.ts') &&
          !full.endsWith('.test.tsx') &&
          !exempt.has(path.basename(full))
        ) {
          files.push(full);
        }
      }
    }
    scan(srcDir);
    return files;
  }

  it('(a) contains zero raw hex literals across all src/ files outside token authority', () => {
    const files = getSourceFiles();
    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
    const hexViolations: string[] = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
        const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
        if (window.some((w) => w.includes('v5-token-exception'))) continue;

        const matches = line.match(hexRegex);
        if (matches) {
          hexViolations.push(`${path.relative(process.cwd(), f)}:${i + 1} -> ${trimmed}`);
        }
      }
    }

    expect(hexViolations).toEqual([]);
  });

  it('(b) contains zero Tailwind raw palette classes across all src/ files', () => {
    const files = getSourceFiles();
    const paletteRegex = /\b(bg|text|border|from|to)-(red|blue|green|purple|slate|gray|zinc|amber|indigo|emerald|rose|teal|sky|orange|lime|pink|cyan|fuchsia|violet|yellow|stone|neutral)-[0-9]/;
    const paletteViolations: string[] = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
        const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
        if (window.some((w) => w.includes('v5-token-exception'))) continue;

        if (paletteRegex.test(line)) {
          paletteViolations.push(`${path.relative(process.cwd(), f)}:${i + 1} -> ${trimmed}`);
        }
      }
    }

    expect(paletteViolations).toEqual([]);
  });

  it('(c) contains zero arbitrary px/rem values across all src/ files', () => {
    const files = getSourceFiles();
    const arbitraryRegex = /\[[0-9]+(px|rem)\]/;
    const arbitraryViolations: string[] = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
        const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
        if (window.some((w) => w.includes('v5-token-exception'))) continue;

        if (arbitraryRegex.test(line)) {
          arbitraryViolations.push(`${path.relative(process.cwd(), f)}:${i + 1} -> ${trimmed}`);
        }
      }
    }

    expect(arbitraryViolations).toEqual([]);
  });

  it('(d) contains zero inline style= across all src/ files without v5-token-exception comment', () => {
    const files = getSourceFiles();
    const styleViolations: string[] = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('style=')) {
          const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
          if (!window.some((w) => w.includes('// v5-token-exception:'))) {
            styleViolations.push(`${path.relative(process.cwd(), f)}:${i + 1} -> ${line.trim()}`);
          }
        }
      }
    }

    expect(styleViolations).toEqual([]);
  });
});

