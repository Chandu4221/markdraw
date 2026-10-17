import { IRNode } from './ir';
import { CompilationOptions } from './types';

export interface InferredStyle {
  widthPct?: number;
  widthToken?: string;
  heightToken?: 'short' | 'compact';
  align?: 'center' | 'right';
  alignY?: 'top' | 'middle' | 'bottom';
  dist?: string;
  rel?: 'overflow' | 'overlap' | 'inset';
  behaviors?: string[];
  note?: string;
}

/**
 * Returns the raw width percentage of node relative to parent.
 */
export function getWidthPct(node: IRNode, parent: IRNode): number {
  if (!parent || parent.bounds.w <= 0) return 100;
  return Math.round((node.bounds.w / parent.bounds.w) * 100);
}

/**
 * Computes the width bucket string given width percentage and tolerance.
 * Buckets (±tolerance):
 * > 100 -> overflow:NN%
 * 95–100 -> full-width
 * 75 -> 75%
 * 66/67 -> 2/3
 * 50 -> 50%
 * 33/34 -> 1/3
 * 25 -> 25%
 * else raw NN%
 */
export function getWidthBucket(
  node: IRNode,
  parent: IRNode,
  tolerance: number = 2
): string {
  const widthPct = getWidthPct(node, parent);

  if (widthPct > 100) {
    return `overflow:${widthPct}%`;
  }
  if (widthPct >= 95 - tolerance && widthPct <= 100) {
    return 'full-width';
  }
  if (Math.abs(widthPct - 75) <= tolerance) {
    return '75%';
  }
  if (
    (widthPct >= 66 - tolerance && widthPct <= 67 + tolerance) ||
    Math.abs(widthPct - 66.67) <= tolerance
  ) {
    return '2/3';
  }
  if (Math.abs(widthPct - 50) <= tolerance) {
    return '50%';
  }
  if (
    (widthPct >= 33 - tolerance && widthPct <= 34 + tolerance) ||
    Math.abs(widthPct - 33.33) <= tolerance
  ) {
    return '1/3';
  }
  if (Math.abs(widthPct - 25) <= tolerance) {
    return '25%';
  }

  return `${widthPct}%`;
}

/**
 * Infers container distribution when there are 2 or more children.
 */
export function inferDistribution(children: IRNode[]): string | undefined {
  if (!children || children.length < 2) return undefined;

  // 1. Grid detection: group children into rows by Y (threshold 16px)
  const rows: IRNode[][] = [];
  const sortedByY = [...children].sort((a, b) => a.bounds.y - b.bounds.y);

  for (const child of sortedByY) {
    let placed = false;
    for (const row of rows) {
      if (Math.abs(child.bounds.y - row[0].bounds.y) <= 16) {
        row.push(child);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([child]);
    }
  }

  // If there are multiple rows
  if (rows.length >= 2) {
    const colCount = rows[0].length;
    const isUniformCols = colCount >= 2 && rows.every((r) => r.length === colCount);
    if (isUniformCols) {
      // Sort each row by X to check column alignment
      for (const row of rows) {
        row.sort((a, b) => a.bounds.x - b.bounds.x);
      }
      // Check column alignment across rows
      let colsAligned = true;
      for (let c = 0; c < colCount; c++) {
        const colX0 = rows[0][c].bounds.x;
        for (let r = 1; r < rows.length; r++) {
          if (Math.abs(rows[r][c].bounds.x - colX0) > 24) {
            colsAligned = false;
            break;
          }
        }
        if (!colsAligned) break;
      }

      if (colsAligned) {
        return `dist:grid cols:${colCount} rows:${rows.length}`;
      }
    }

    return 'dist:wrap';
  }

  // 2. Single flow row: suppress dist inference (adds no information)
  return undefined;
}

/**
 * Infers geometric style for a given IRNode relative to its parent and siblings.
 */
export function inferNodeStyle(
  node: IRNode,
  parent: IRNode | null,
  siblings: IRNode[] = [],
  options?: CompilationOptions
): InferredStyle {
  const style: InferredStyle = {};
  const sizeTol = options?.sizeBucketTolerance ?? 2;
  const alignTol = options?.alignTolerance ?? 3;

  // If node has behavior flags from props
  const rawBehaviors = node.textProps?.behaviors;
  if (Array.isArray(rawBehaviors) && rawBehaviors.length > 0) {
    style.behaviors = [...rawBehaviors];
  }

  // If node has note from props
  const rawNote = node.textProps?.note;
  if (typeof rawNote === 'string' && rawNote.trim() !== '') {
    style.note = rawNote.trim();
  }

  // If node is a container with >= 2 children, compute dist on the node itself
  if (node.children && node.children.length >= 2) {
    const dist = inferDistribution(node.children);
    if (dist) {
      style.dist = dist;
    }
  }

  // Size, align, rel require a valid parent
  if (!parent || parent.bounds.w <= 0 || parent.bounds.h <= 0) {
    return style;
  }

  const widthPct = getWidthPct(node, parent);
  style.widthPct = widthPct;

  // A1. Size (width & height)
  const bucket = getWidthBucket(node, parent, sizeTol);

  // Noise rule: omit width when ALL siblings in the parent share the same bucket (parent's dist covers it)
  let omitWidth = false;
  if (siblings.length >= 2) {
    const allSameBucket = siblings.every(
      (sib) => getWidthBucket(sib, parent, sizeTol) === bucket
    );
    if (allSameBucket) {
      omitWidth = true;
    }
  }

  if (!omitWidth) {
    if (bucket === 'full-width') {
      style.widthToken = 'full-width';
    } else if (bucket.startsWith('overflow:')) {
      style.widthToken = bucket;
    } else {
      style.widthToken = `width:${bucket}`;
    }
  }

  // Height bands: <10% -> short, <35% -> compact; else omit
  const heightPct = Math.round((node.bounds.h / parent.bounds.h) * 100);
  if (heightPct < 10) {
    style.heightToken = 'short';
  } else if (heightPct < 35) {
    style.heightToken = 'compact';
  }

  // A2. Alignment (align, align-y)
  const parentCenterX = parent.bounds.x + parent.bounds.w / 2;
  const childCenterX = node.bounds.x + node.bounds.w / 2;
  const offsetPct = (Math.abs(childCenterX - parentCenterX) / parent.bounds.w) * 100;
  const widthRatio = node.bounds.w / parent.bounds.w;

  if (widthRatio >= 0.95) {
    // Full parent width -> omit align (stretch default)
  } else if (offsetPct <= alignTol) {
    style.align = 'center';
  } else if (
    node.bounds.x >= parent.bounds.x + parent.bounds.w * (2 / 3) - 2 ||
    childCenterX >= parent.bounds.x + parent.bounds.w * (2 / 3)
  ) {
    style.align = 'right';
  }

  // align-y: only when child is much shorter than parent (<60%) and notable
  if (node.bounds.h < 0.6 * parent.bounds.h) {
    const relTop = node.bounds.y - parent.bounds.y;
    const relBottom =
      parent.bounds.y + parent.bounds.h - (node.bounds.y + node.bounds.h);
    const parentCenterY = parent.bounds.y + parent.bounds.h / 2;
    const childCenterY = node.bounds.y + node.bounds.h / 2;
    const offsetYPct =
      (Math.abs(childCenterY - parentCenterY) / parent.bounds.h) * 100;

    if (relTop <= 0.15 * parent.bounds.h) {
      style.alignY = 'top';
    } else if (offsetYPct <= alignTol + 2) {
      style.alignY = 'middle';
    } else if (relBottom <= 0.15 * parent.bounds.h) {
      style.alignY = 'bottom';
    }
  }

  // A4. Relationship (rel)
  // 1. Child extends beyond parent edge > 5% -> rel:overflow
  const overflowLeft = node.bounds.x < parent.bounds.x - 0.05 * parent.bounds.w;
  const overflowRight =
    node.bounds.x + node.bounds.w >
    parent.bounds.x + parent.bounds.w + 0.05 * parent.bounds.w;
  const overflowTop = node.bounds.y < parent.bounds.y - 0.05 * parent.bounds.h;
  const overflowBottom =
    node.bounds.y + node.bounds.h >
    parent.bounds.y + parent.bounds.h + 0.05 * parent.bounds.h;

  if (overflowLeft || overflowRight || overflowTop || overflowBottom) {
    style.rel = 'overflow';
  } else {
    // 2. Sibling overlap 15-60% on later sibling
    let hasOverlap = false;
    const nodeIndex = siblings.findIndex((s) => s.id === node.id);
    if (nodeIndex > 0) {
      for (let i = 0; i < nodeIndex; i++) {
        const prev = siblings[i];
        const ix1 = Math.max(node.bounds.x, prev.bounds.x);
        const iy1 = Math.max(node.bounds.y, prev.bounds.y);
        const ix2 = Math.min(
          node.bounds.x + node.bounds.w,
          prev.bounds.x + prev.bounds.w
        );
        const iy2 = Math.min(
          node.bounds.y + node.bounds.h,
          prev.bounds.y + prev.bounds.h
        );

        if (ix2 > ix1 && iy2 > iy1) {
          const intersectArea = (ix2 - ix1) * (iy2 - iy1);
          const minArea = Math.min(
            node.bounds.w * node.bounds.h,
            prev.bounds.w * prev.bounds.h
          );
          if (minArea > 0) {
            const ratio = intersectArea / minArea;
            if (ratio >= 0.15 && ratio <= 0.6) {
              hasOverlap = true;
              break;
            }
          }
        }
      }
    }

    if (hasOverlap) {
      style.rel = 'overlap';
    } else {
      // 3. Large equal inset > 15% each side -> rel:inset
      const leftInset = (node.bounds.x - parent.bounds.x) / parent.bounds.w;
      const rightInset =
        (parent.bounds.x + parent.bounds.w - (node.bounds.x + node.bounds.w)) /
        parent.bounds.w;
      if (
        leftInset >= 0.15 &&
        rightInset >= 0.15 &&
        Math.abs(leftInset - rightInset) <= 0.05
      ) {
        style.rel = 'inset';
      }
    }
  }

  return style;
}
