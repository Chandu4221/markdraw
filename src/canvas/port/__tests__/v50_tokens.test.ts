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
});
