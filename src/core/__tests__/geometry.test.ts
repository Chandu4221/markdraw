import { describe, it, expect } from 'vitest';
import { isEnclosed, calculateIntersectionArea, sanitizeMarkdown } from '../geometry';
import { AABB } from '../types';

describe('Geometry Engine: Containment & Sanitization', () => {
  it('correctly detects full enclosure of a child inside a parent', () => {
    const parent: AABB = { x1: 0, y1: 0, x2: 200, y2: 200 };
    const child: AABB = { x1: 20, y1: 20, x2: 80, y2: 80 };
    expect(isEnclosed(child, parent, 0.85)).toBe(true);
  });

  it('tolerates small spill-over up to 15% threshold', () => {
    const parent: AABB = { x1: 0, y1: 0, x2: 100, y2: 100 };
    // Child area is 1000. Overlap with parent is 900 (90% enclosed)
    const child: AABB = { x1: 10, y1: 0, x2: 110, y2: 10 };
    expect(isEnclosed(child, parent, 0.85)).toBe(true);
  });

  it('rejects shapes when overlap falls below 85%', () => {
    const parent: AABB = { x1: 0, y1: 0, x2: 100, y2: 100 };
    // Child area 10000. Overlap is 5000 (50%)
    const child: AABB = { x1: 50, y1: 0, x2: 150, y2: 100 };
    expect(isEnclosed(child, parent, 0.85)).toBe(false);
  });

  it('escapes Markdown pipes to prevent broken tables', () => {
    const dangerousInput = 'Option A | Option B | Price: $10';
    const clean = sanitizeMarkdown(dangerousInput);
    expect(clean).toBe('Option A \\| Option B \\| Price: $10');
  });

  it('calculates intersection area accurately', () => {
    const a: AABB = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const b: AABB = { x1: 50, y1: 50, x2: 150, y2: 150 };
    expect(calculateIntersectionArea(a, b)).toBe(2500);
  });
});
