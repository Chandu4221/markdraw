// src/core/reflow.ts
// Pure, DOM-free responsive reflow simulation engine (§4.1)
import { CanvasShape } from '../canvas/port/CanvasShape';
import { getShapeMeta } from '../annotation/shapeMeta';
import { RoleResponsive } from '../annotation/types';

export interface ReflowInput {
  shapes: CanvasShape[];          // one root's subtree, neutral scene
  width: number;                  // simulated viewport width in px
  defaultBreakpoint: number;      // from compilation options; use 768 unless a root prop exists
}

export interface ReflowNode {
  shapeId: string;
  role: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  state: 'normal' | 'hidden' | 'collapsed';
  collapseKind?: 'drawer' | 'bottom-bar' | 'hamburger';
  suggestion?: string;
}

export interface ReflowResult {
  nodes: ReflowNode[];
}

const GAP = 8;
const COLLAPSE_STRIP_SIZE = 48;

export function computeReflow(input: ReflowInput): ReflowResult {
  const { shapes, width, defaultBreakpoint } = input;
  if (!shapes || shapes.length === 0) {
    return { nodes: [] };
  }

  // 1. Identify root shape (frame or shape without parentId)
  const rootShape =
    shapes.find((s) => s.kind === 'frame') ||
    shapes.find((s) => !s.parentId) ||
    shapes[0];

  const rootMeta = getShapeMeta(rootShape);
  const rootBreakpoint =
    (typeof rootMeta?.responsive?.breakpoint === 'number'
      ? (rootMeta.responsive.breakpoint as number)
      : undefined) ??
    (typeof rootMeta?.props?.breakpoint === 'number'
      ? (rootMeta.props.breakpoint as number)
      : undefined) ??
    defaultBreakpoint ??
    768;

  // 2. If width >= breakpoint: return current bounds, state 'normal' (desktop is what you drew)
  if (width >= rootBreakpoint) {
    return {
      nodes: shapes.map((s) => {
        const meta = getShapeMeta(s);
        return {
          shapeId: s.id,
          role: meta?.role ?? null,
          x: s.bounds.x,
          y: s.bounds.y,
          w: s.bounds.w,
          h: s.bounds.h,
          state: 'normal'
        };
      })
    };
  }

  // 3. Below breakpoint: build parent -> children tree
  const childrenMap = new Map<string, CanvasShape[]>();
  for (const s of shapes) {
    const pId = s.parentId || '';
    if (!childrenMap.has(pId)) {
      childrenMap.set(pId, []);
    }
    childrenMap.get(pId)!.push(s);
  }

  const nodes: ReflowNode[] = [];

  // Helper to sort siblings: primary first, order ascending, then original y, original x
  function sortSiblings(siblings: CanvasShape[]): CanvasShape[] {
    return [...siblings].sort((a, b) => {
      const metaA = getShapeMeta(a);
      const metaB = getShapeMeta(b);
      const respA: Partial<RoleResponsive> = metaA?.responsive || {};
      const respB: Partial<RoleResponsive> = metaB?.responsive || {};

      // Primary first
      if (respA.primary && !respB.primary) return -1;
      if (!respA.primary && respB.primary) return 1;

      // Numeric order ascending
      const orderA = typeof respA.order === 'number' ? respA.order : Infinity;
      const orderB = typeof respB.order === 'number' ? respB.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;

      // Auto / unannotated: original y, then original x
      if (a.bounds.y !== b.bounds.y) return a.bounds.y - b.bounds.y;
      return a.bounds.x - b.bounds.x;
    });
  }

  // Reflow container children
  function reflowContainer(
    containerId: string,
    containerX: number,
    containerY: number,
    containerW: number,
    containerH: number
  ): number {
    const rawSiblings = childrenMap.get(containerId) || [];
    if (rawSiblings.length === 0) {
      return containerH;
    }

    const siblings = sortSiblings(rawSiblings);

    // Classify children into top-collapsed, bottom-collapsed, drawer-collapsed, hidden, and normal
    const topCollapsed: CanvasShape[] = [];
    const bottomCollapsed: CanvasShape[] = [];
    let drawerCollapsed: CanvasShape | null = null;
    const normalItems: CanvasShape[] = [];

    for (const s of siblings) {
      const meta = getShapeMeta(s);
      const smVisible = meta?.responsive?.smVisible;
      const role = meta?.role;

      if (smVisible === 'hidden') {
        // Ghosted element: preserve original bounds
        nodes.push({
          shapeId: s.id,
          role: role ?? null,
          x: s.bounds.x,
          y: s.bounds.y,
          w: s.bounds.w,
          h: s.bounds.h,
          state: 'hidden'
        });
      } else if (smVisible === 'collapse:bottom-bar') {
        bottomCollapsed.push(s);
      } else if (smVisible === 'collapse:drawer') {
        if (!drawerCollapsed) drawerCollapsed = s;
        else normalItems.push(s);
      } else if (smVisible === 'collapse:hamburger') {
        topCollapsed.push(s);
      } else if (role === 'navbar' && !smVisible) {
        // Navbar without explicit collapse hint auto-collapses to hamburger at the top
        topCollapsed.push(s);
      } else {
        normalItems.push(s);
      }
    }

    let currentY = containerY;
    let contentX = containerX;
    let availableW = containerW;

    // Handle drawer collapse (48px rail on leading edge)
    if (drawerCollapsed) {
      const drawerShape: CanvasShape = drawerCollapsed;
      const dMeta = getShapeMeta(drawerShape);
      nodes.push({
        shapeId: drawerShape.id,
        role: dMeta?.role ?? null,
        x: containerX,
        y: containerY,
        w: COLLAPSE_STRIP_SIZE,
        h: containerH,
        state: 'collapsed',
        collapseKind: 'drawer'
      });
      contentX += COLLAPSE_STRIP_SIZE + GAP;
      availableW = Math.max(availableW - (COLLAPSE_STRIP_SIZE + GAP), 100);
    }

    // Place top collapsed strips (hamburger)
    for (const s of topCollapsed) {
      const meta = getShapeMeta(s);
      const isAuto = meta?.role === 'navbar' && !meta?.responsive?.smVisible;
      nodes.push({
        shapeId: s.id,
        role: meta?.role ?? null,
        x: contentX,
        y: currentY,
        w: availableW,
        h: COLLAPSE_STRIP_SIZE,
        state: 'collapsed',
        collapseKind: 'hamburger',
        suggestion: isAuto ? 'Navbar auto-collapsed to hamburger' : undefined
      });
      currentY += COLLAPSE_STRIP_SIZE + GAP;
    }

    // Stack normal items vertically
    for (const s of normalItems) {
      const meta = getShapeMeta(s);
      const role = meta?.role;
      const smFullWidth = meta?.responsive?.smFullWidth ?? true;

      let itemW = availableW;
      if (!smFullWidth && s.bounds.w < availableW) {
        itemW = s.bounds.w;
      }

      let itemH = s.bounds.h;
      if (role === 'img' || role === 'video') {
        // Proportional shrink to fit width
        if (s.bounds.w > 0) {
          itemH = Math.round((s.bounds.h / s.bounds.w) * itemW);
        }
      } else if (role === 'table') {
        // Table keeps min-width 320 and may overflow band
        itemW = Math.max(320, itemW);
      }

      const itemX = contentX;
      const itemY = currentY;

      // Check if item has children to recursively reflow
      const hasChildren = childrenMap.has(s.id) && childrenMap.get(s.id)!.length > 0;
      if (hasChildren) {
        const measuredChildH = reflowContainer(s.id, itemX, itemY, itemW, itemH);
        itemH = Math.max(itemH, measuredChildH);
      }

      nodes.push({
        shapeId: s.id,
        role: role ?? null,
        x: itemX,
        y: itemY,
        w: itemW,
        h: itemH,
        state: 'normal'
      });

      currentY += itemH + GAP;
    }

    // Place bottom collapsed strips (bottom-bar)
    for (const s of bottomCollapsed) {
      const meta = getShapeMeta(s);
      const bottomY = Math.max(currentY, containerY + containerH - COLLAPSE_STRIP_SIZE);
      nodes.push({
        shapeId: s.id,
        role: meta?.role ?? null,
        x: contentX,
        y: bottomY,
        w: availableW,
        h: COLLAPSE_STRIP_SIZE,
        state: 'collapsed',
        collapseKind: 'bottom-bar'
      });
      currentY = bottomY + COLLAPSE_STRIP_SIZE + GAP;
    }

    return currentY - containerY;
  }

  // Reflow root children
  const rootW = width;
  const rootX = rootShape.bounds.x;
  const rootY = rootShape.bounds.y;
  const initialRootH = rootShape.bounds.h;

  const totalContentH = reflowContainer(
    rootShape.id,
    rootX,
    rootY,
    rootW,
    initialRootH
  );

  const finalRootH = Math.max(initialRootH, totalContentH);

  // Add root frame node
  nodes.unshift({
    shapeId: rootShape.id,
    role: rootMeta?.role ?? 'page',
    x: rootX,
    y: rootY,
    w: rootW,
    h: finalRootH,
    state: 'normal'
  });

  return { nodes };
}
