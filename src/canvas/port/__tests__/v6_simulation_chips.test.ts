import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('v6 Defect 6: Chips hidden during simulation (§1.2.6)', () => {
  it('ExcalidrawCanvas does not gate showChips or showUntagged on breakpoint === 1200 (§1.2.6)', () => {
    const canvasFilePath = path.resolve(__dirname, '../../excalidraw/ExcalidrawCanvas.tsx');
    const source = fs.readFileSync(canvasFilePath, 'utf-8');
    expect(source.includes('breakpoint === 1200')).toBe(false);
  });
});
