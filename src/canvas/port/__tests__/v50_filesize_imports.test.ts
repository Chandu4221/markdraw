import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('v5.0 File Size and Import Boundary Enforcement (§9.4, §14)', () => {
  it('passes check-imports script with zero boundary violations', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/check-imports.mjs');
    const result = execSync(`node ${scriptPath}`, { encoding: 'utf-8' });
    expect(result).toContain('Import boundaries check passed');
  });

  it('passes check-file-size script with zero non-legacy files exceeding 500 lines', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/check-file-size.mjs');
    const result = execSync(`node ${scriptPath}`, { encoding: 'utf-8' });
    expect(result).toContain('File size check passed');
  });
});
