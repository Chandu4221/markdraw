import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Ensures strict compliance with minimum 14px typography requirement.
 * No font size < 14px is allowed anywhere in the application code.
 */
describe('v5.1 Typography Minimum 14px Enforcement', () => {
  const srcDir = path.resolve(process.cwd(), 'src');
  const files: string[] = [];

  function scan(dir: string) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        if (item !== '__tests__' && item !== 'node_modules') scan(full);
      } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
        files.push(full);
      }
    }
  }
  scan(srcDir);

  it('guarantees zero classes with font-size < 14px across all components', () => {
    // Matches text-xs or text-[<number><unit>]
    const sub14Regex = /\btext-(xs|\[([0-9.]+)(px|pt|rem)?\])\b/g;
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('//') && line.includes('test-ignore-font')) continue;

        let match: RegExpExecArray | null;
        while ((match = sub14Regex.exec(line)) !== null) {
          const cls = match[0];
          const num = match[2];
          const unit = match[3] || 'px';

          if (cls === 'text-xs') {
            violations.push(
              `${path.relative(process.cwd(), file)}:${i + 1} uses "${cls}" (12px, must be >= 14px)`
            );
          } else if (num) {
            let px = parseFloat(num);
            if (unit === 'rem') px = px * 16;
            if (unit === 'pt') px = px * 1.333;

            if (px < 14) {
              violations.push(
                `${path.relative(process.cwd(), file)}:${i + 1} uses "${cls}" (${px}px, must be >= 14px)`
              );
            }
          }
        }
      }
    }

    expect(
      violations,
      `Found ${violations.length} instances of font size < 14px:\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
