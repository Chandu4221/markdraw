import { AABB, BoundingBox } from './types';

export function computeAABB(bounds: BoundingBox): AABB {
  return {
    x1: bounds.x,
    y1: bounds.y,
    x2: bounds.x + bounds.w,
    y2: bounds.y + bounds.h
  };
}

export function calculateIntersectionArea(a: AABB, b: AABB): number {
  const xOverlap = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const yOverlap = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  return xOverlap * yOverlap;
}

export function getEnclosureRatio(child: AABB, parent: AABB): number {
  const childArea = (child.x2 - child.x1) * (child.y2 - child.y1);
  if (childArea <= 0) return 0;
  const intersection = calculateIntersectionArea(child, parent);
  return intersection / childArea;
}

export function isEnclosed(child: AABB, parent: AABB, threshold: number = 0.85): boolean {
  return getEnclosureRatio(child, parent) >= threshold;
}

export function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br/>')
    .trim();
}
