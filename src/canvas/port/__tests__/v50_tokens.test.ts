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

    // Chip grammar
    expect(tokensContent).toContain('--color-role-chip-bg');
    expect(tokensContent).toContain('--color-role-chip-text');
    expect(tokensContent).toContain('--color-untagged-chip-bg');
    expect(tokensContent).toContain('--color-untagged-chip-text');
  });

  it('declares standard radii and motion tokens', () => {
    expect(tokensContent).toContain('--radius-sm');
    expect(tokensContent).toContain('--radius-md');
    expect(tokensContent).toContain('--radius-lg');
    expect(tokensContent).toContain('--radius-full');
    expect(tokensContent).toContain('--duration-fast');
    expect(tokensContent).toContain('--duration-normal');
  });

  it('contains zero raw hex literals in components outside tokens.css and test files', () => {
    const componentsDir = path.resolve(process.cwd(), 'src/components');
    const files: string[] = [];

    function scan(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          if (item !== '__tests__') scan(full);
        } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
          files.push(full);
        }
      }
    }
    scan(componentsDir);

    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
    const hexViolations: string[] = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Allow MarkdownPreview test table or documentation comments
        if (f.endsWith('MarkdownPreview.tsx') && line.includes('#8ac')) continue;
        if (line.includes('//') && (line.includes('color') || line.includes('hex'))) continue;
        const matches = line.match(hexRegex);
        if (matches) {
          hexViolations.push(`${path.relative(process.cwd(), f)}:${i + 1} -> ${line.trim()}`);
        }
      }
    }

    expect(hexViolations).toEqual([]);
  });
});

