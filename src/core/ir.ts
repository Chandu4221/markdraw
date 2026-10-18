import { TLShape, Editor } from '@tldraw/tldraw';
import { computeAABB, getEnclosureRatio, sanitizeMarkdown } from './geometry';
import { CompilationOptions } from './types';
import { InferredStyle, inferNodeStyle } from './style';
import { AI_DIRECTIVE_HEADER } from './directive';
import { generateShortId } from './ids';
import { annotateSiblingPatterns } from './patterns';
import { getShapeMeta } from '../annotation/shapeMeta';
import { isAllowedRoleFlag } from '../annotation/roles';
import { isUntouchedRoleLabel, getRoleDefaultProps } from '../annotation/roleDefaults';
import { migrateShapes } from '../annotation/migrate';

export interface IRBounds {
  h: number;
  w: number;
  x: number;
  y: number;
}

export interface IRTextProps {
  altText?: string;
  behaviors?: string[];
  checked?: boolean;
  iconName?: string;
  label?: string;
  note?: string;
  count?: number;
  options?: string;
  placeholder?: string;
  showText?: boolean;
  subtext?: string;
  value?: number;
  variant?: string;
  columns?: number;
  columnSplit?: string;
  isResponsive?: boolean;
  mobileStack?: 'stack' | 'reverse' | 'scroll';
  tabletLayout?: 'stack' | '2-col' | 'maintain';
  mobileOrder?: number;
  hideOnMobile?: boolean;
}

export interface IRNode {
  aiDirective?: string;
  bounds: IRBounds;
  children: IRNode[];
  direction: 'Column' | 'Leaf' | 'Row';
  id: string;
  shortId: string;
  parentId?: string;
  label: string;
  parent: string | null;
  path: string;
  role: string;
  unitId?: string;
  unitName?: string;
  isUnit?: boolean;
  isAnnotationNode?: boolean;
  style?: InferredStyle;
  textProps: IRTextProps;
  widgetType: string;
  patternCount?: number;
}

export interface IRTree {
  elementCount: number;
  roots: IRNode[];
  skippedShapes?: number;
  lints?: string[];
  scopedMeta?: {
    scopeName: string;
    unitCount: number;
    nodeCount: number;
    totalNodes: number;
    rootName: string;
  };
  relations?: string[];
}

function inferDirection(children: { bounds: IRBounds }[]): 'Column' | 'Row' {
  if (children.length <= 1) return 'Row';

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const child of children) {
    const cx = child.bounds.x + child.bounds.w / 2;
    const cy = child.bounds.y + child.bounds.h / 2;
    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  return spanY > spanX ? 'Column' : 'Row';
}

function sortChildren(children: IRNode[], direction: 'Column' | 'Row'): void {
  if (direction === 'Row') {
    children.sort((a, b) => a.bounds.x - b.bounds.x);
  } else {
    children.sort((a, b) => a.bounds.y - b.bounds.y);
  }
}

export function buildIRTree(
  shapes: TLShape[],
  editor?: Editor | null,
  containmentThreshold: number = 0.85,
  options?: CompilationOptions
): IRTree {
  const hasWidgets = shapes.some((s) => s.type === 'ui-widget');
  const migration = hasWidgets ? migrateShapes(shapes) : null;
  const effectiveShapes = migration ? migration.shapes : shapes;
  return buildAnnotationIRTree(effectiveShapes, editor, containmentThreshold, options, migration?.lints);
}


function countSubtree(node?: IRNode): number {
  if (!node) return 0;
  let count = 1;
  for (const c of node.children) {
    count += countSubtree(c);
  }
  return count;
}

function buildAnnotationIRTree(
  shapes: TLShape[],
  editor?: Editor | null,
  _containmentThreshold: number = 0.85,
  options?: CompilationOptions,
  extraLints: string[] = []
): IRTree {
  if (shapes.length === 0) {
    return { elementCount: 0, roots: [], lints: [] };
  }

  const usedShortIds = new Set<string>();
  const rawLints: { text: string; shapeId?: string }[] = extraLints.map((text) => ({ text }));
  const relations: string[] = [];

  // Group shapes by category
  const frames = shapes.filter((s) => s.type === 'frame');
  const groups = shapes.filter((s) => s.type === 'group');
  const arrows = shapes.filter((s) => s.type === 'arrow');
  const otherShapes = shapes.filter(
    (s) => s.type !== 'frame' && s.type !== 'group' && s.type !== 'arrow' && s.type !== 'line'
  );

  // Helper to extract bounds
  const getBounds = (shape: TLShape): IRBounds => {
    if (editor && typeof editor.getShapePageBounds === 'function') {
      const b = editor.getShapePageBounds(shape);
      if (b) return { x: b.x, y: b.y, w: b.w, h: b.h };
    }
    const p = (shape.props as Record<string, unknown>) || {};
    const w = typeof p.w === 'number' ? p.w : 100;
    const h = typeof p.h === 'number' ? p.h : 100;
    const x = shape.x || 0;
    const y = shape.y || 0;
    return { x, y, w, h };
  };

  // Identify tagged shapes and untagged shapes
  const taggedShapes: TLShape[] = [];
  const untaggedShapes: TLShape[] = [];

  for (const s of otherShapes) {
    const meta = getShapeMeta(s);
    if (meta && meta.role) {
      taggedShapes.push(s);
    } else {
      untaggedShapes.push(s);
    }
  }

  // Lint §13: Skipped {n} untagged shapes: {ids} — assign roles or delete.
  if (untaggedShapes.length > 0) {
    const ids = untaggedShapes.map((s) => `#${generateShortId(s.id, usedShortIds)}`);
    rawLints.push({
      text: `Skipped ${untaggedShapes.length} untagged shapes: ${ids.join(', ')} — assign roles or delete.`
    });
  }

  // Build node lookup map
  const nodeMap = new Map<string, IRNode>();
  const allShapesMap = new Map<string, TLShape>();
  for (const s of shapes) {
    allShapesMap.set(s.id, s);
  }

  // Units lookup from options
  const unitDefs = options?.units || [];
  for (const u of unitDefs) {
    if (!u.baseRole) {
      rawLints.push({
        text: `Unit "${u.name}" has no base role — fix in the customization panel.`
      });
    }
  }

  // 1. Process custom units / groups
  for (const g of groups) {
    const gMeta = getShapeMeta(g);
    let unitId = gMeta?.unitId || null;

    // Find children in tldraw group
    const memberShapes = shapes.filter((s) => s.parentId === g.id);

    if (!unitId) {
      for (const m of memberShapes) {
        const mMeta = getShapeMeta(m);
        if (mMeta?.unitId) {
          unitId = mMeta.unitId;
          break;
        }
      }
    }

    const unitDef = unitId ? unitDefs.find((u) => u.id === unitId) : null;
    const isUnit = Boolean(unitId || unitDef || (gMeta && gMeta.role === 'card'));

    const baseRole = unitDef?.baseRole || gMeta?.role || (isUnit ? 'card' : 'group');
    const unitName =
      unitDef?.name ||
      gMeta?.props?.label ||
      ((g.props as Record<string, unknown>)?.name as string) ||
      (isUnit ? 'Follow Card' : 'group');

    let bounds = getBounds(g);
    if (bounds.w <= 100 && bounds.h <= 100 && memberShapes.length > 0) {
      const childBounds = memberShapes.map(getBounds);
      const minX = Math.min(...childBounds.map((b) => b.x));
      const minY = Math.min(...childBounds.map((b) => b.y));
      const maxX = Math.max(...childBounds.map((b) => b.x + b.w));
      const maxY = Math.max(...childBounds.map((b) => b.y + b.h));
      bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    const shortId = generateShortId(g.id, usedShortIds);

    const groupNode: IRNode = {
      id: g.id,
      shortId,
      parentId: gMeta?.parentId || undefined,
      label: unitName,
      parent: null,
      path: 'Root',
      role: baseRole,
      unitId: unitId || (isUnit ? 'u_unit' : undefined),
      unitName: isUnit ? unitName : undefined,
      isUnit,
      bounds,
      children: [],
      direction: 'Leaf',
      textProps: {
        label: unitName
      },
      widgetType: baseRole,
      isAnnotationNode: true
    };

    nodeMap.set(g.id, groupNode);
  }

  // 2. Process tagged shapes
  for (const s of taggedShapes) {
    const meta = getShapeMeta(s)!;
    const role = meta.role!;
    const rawLabel = meta.props?.label || ((s.props as Record<string, unknown>)?.text as string) || '';
    const label = sanitizeMarkdown(rawLabel);
    const shortId = generateShortId(s.id, usedShortIds);
    const bounds = getBounds(s);

    // Filter flags against allow-list (§4, §13)
    const behaviors: string[] = [];
    if (Array.isArray(meta.props?.behaviors)) {
      for (const flag of meta.props.behaviors) {
        if (isAllowedRoleFlag(role, flag)) {
          behaviors.push(flag);
        } else {
          rawLints.push({
            text: `Flag "${flag}" has no meaning for role "${role}" — dropped.`,
            shapeId: s.id
          });
        }
      }
    }

    const pMeta = (meta.props || {}) as Record<string, unknown>;
    const textProps: IRTextProps = {
      label: rawLabel || undefined,
      placeholder: meta.props?.placeholder,
      variant: meta.props?.variant,
      options: meta.props?.options,
      note: meta.props?.note,
      count: meta.props?.count,
      value: typeof pMeta.value === 'number' ? pMeta.value : undefined,
      columns: typeof pMeta.columns === 'number' ? pMeta.columns : undefined,
      columnSplit: typeof pMeta.columnSplit === 'string' ? pMeta.columnSplit : undefined,
      isResponsive: typeof pMeta.isResponsive === 'boolean' ? pMeta.isResponsive : undefined,
      mobileStack: typeof pMeta.mobileStack === 'string' ? (pMeta.mobileStack as any) : undefined,
      tabletLayout: typeof pMeta.tabletLayout === 'string' ? (pMeta.tabletLayout as any) : undefined,
      mobileOrder: typeof pMeta.mobileOrder === 'number' ? pMeta.mobileOrder : undefined,
      hideOnMobile: typeof pMeta.hideOnMobile === 'boolean' ? pMeta.hideOnMobile : undefined,
      behaviors: behaviors.length > 0 ? behaviors : undefined
    };

    if (meta.responsive) {
      if (meta.responsive.smVisible === 'hidden') textProps.hideOnMobile = true;
      if (typeof meta.responsive.order === 'number') textProps.mobileOrder = meta.responsive.order;
      if (meta.responsive.tablet && meta.responsive.tablet !== 'maintain') textProps.tabletLayout = meta.responsive.tablet;
    }

    const widgetType =
      ((meta as any).v3WidgetType as string) ||
      ((s.props as Record<string, unknown>)?.widgetType as string) ||
      role;

    const node: IRNode = {
      id: s.id,
      shortId,
      parentId: meta.parentId || undefined,
      label: label || role,
      parent: null,
      path: 'Root',
      role,
      bounds,
      children: [],
      direction: 'Leaf',
      textProps,
      widgetType,
      isAnnotationNode: true
    };

    nodeMap.set(s.id, node);
  }

  // 3. Process frames
  const frameNodes: IRNode[] = [];
  for (const f of frames) {
    const meta = getShapeMeta(f);
    const role = meta?.role || 'page';
    const rawName = meta?.props?.label || ((f.props as Record<string, unknown>)?.name as string) || 'Page';
    const label = sanitizeMarkdown(rawName);
    const shortId = generateShortId(f.id, usedShortIds);
    const bounds = getBounds(f);

    const isResp = Boolean(
      meta?.responsive ||
      meta?.props?.behaviors?.includes('responsive') ||
      (f.props as Record<string, unknown>)?.isResponsive
    );

    const behaviors: string[] = [];
    if (isResp) behaviors.push('responsive');

    const frameNode: IRNode = {
      id: f.id,
      shortId,
      label,
      parent: null,
      path: 'Root',
      role,
      bounds,
      children: [],
      direction: 'Leaf',
      textProps: {
        label: rawName,
        note: meta?.props?.note || ((f.props as Record<string, unknown>)?.note as string),
        isResponsive: isResp,
        behaviors: behaviors.length > 0 ? behaviors : undefined
      },
      widgetType: role,
      isAnnotationNode: true
    };

    nodeMap.set(f.id, frameNode);
    frameNodes.push(frameNode);
  }

  // 4. Resolve Parentage Priority (§6.3)
  const nonFrameNodes = [...groups, ...taggedShapes]
    .map((s) => nodeMap.get(s.id))
    .filter((n): n is IRNode => Boolean(n));

  const looseShapes: IRNode[] = [];

  for (const node of nonFrameNodes) {
    const s = allShapesMap.get(node.id)!;
    const meta = getShapeMeta(s);
    let assignedParentId: string | null = null;

    // 1) Explicit parentId check
    if (meta?.parentId) {
      const targetShape = allShapesMap.get(meta.parentId);
      const targetNode = nodeMap.get(meta.parentId);
      if (targetShape && targetNode && targetNode.id !== node.id) {
        const nodeAABB = computeAABB(node.bounds);
        const targetAABB = computeAABB(targetNode.bounds);
        const ratio = getEnclosureRatio(nodeAABB, targetAABB);
        if (ratio >= 0.5) {
          assignedParentId = targetNode.id;
        } else {
          rawLints.push({
            text: `#${node.shortId} has stale parentId "${meta.parentId}" — clear it or move the shape back inside.`,
            shapeId: node.id
          });
        }
      } else {
        rawLints.push({
          text: `#${node.shortId} has stale parentId "${meta.parentId}" — clear it or move the shape back inside.`,
          shapeId: node.id
        });
      }
    }

    // 2) Enclosing native group check
    if (!assignedParentId && s.parentId && nodeMap.has(s.parentId)) {
      const parentShape = allShapesMap.get(s.parentId);
      if (parentShape && parentShape.type === 'group') {
        assignedParentId = s.parentId;
      }
    }

    // 3) Enclosing frame check
    if (!assignedParentId) {
      if (s.parentId && nodeMap.has(s.parentId)) {
        const parentShape = allShapesMap.get(s.parentId);
        if (parentShape && parentShape.type === 'frame') {
          assignedParentId = s.parentId;
        }
      }
      if (!assignedParentId && frameNodes.length > 0) {
        for (const fn of frameNodes) {
          const fnAABB = computeAABB(fn.bounds);
          const nAABB = computeAABB(node.bounds);
          if (getEnclosureRatio(nAABB, fnAABB) >= 0.5) {
            assignedParentId = fn.id;
            break;
          }
        }
      }
    }

    // 4) Enclosing geometric container check (section / card)
    if (!assignedParentId && frameNodes.length === 0) {
      const candidates = nonFrameNodes
        .filter((c) => c.id !== node.id && (c.role === 'section' || c.role === 'card'))
        .sort((a, b) => (a.bounds.w * a.bounds.h) - (b.bounds.w * b.bounds.h));

      for (const candidate of candidates) {
        const candidateAABB = computeAABB(candidate.bounds);
        const nAABB = computeAABB(node.bounds);
        if (
          candidate.bounds.w > node.bounds.w &&
          candidate.bounds.h > node.bounds.h &&
          getEnclosureRatio(nAABB, candidateAABB) >= 0.5
        ) {
          assignedParentId = candidate.id;
          break;
        }
      }
    }

    if (assignedParentId) {
      const parentNode = nodeMap.get(assignedParentId);
      if (parentNode) {
        parentNode.children.push(node);
        node.parent = parentNode.id;
      } else {
        looseShapes.push(node);
      }
    } else {
      looseShapes.push(node);
    }
  }

  // 5. Frame skipping (§6.2, §13): Frame "<name>" has no tagged shapes — skipped.
  const activeRoots: IRNode[] = [];
  for (const fn of frameNodes) {
    if (fn.children.length === 0) {
      rawLints.push({
        text: `Frame "${fn.label}" has no tagged shapes — skipped.`,
        shapeId: fn.id
      });
    } else {
      activeRoots.push(fn);
    }
  }

  if (frameNodes.length === 0 && looseShapes.length > 0) {
    activeRoots.push(...looseShapes);
  } else if (looseShapes.length > 0 && !options?.scope) {
    rawLints.push({
      text: `${looseShapes.length} loose shapes outside any frame — move into a frame or select to compile.`
    });
  }

  // 6. Responsive check (§8.2, §13)
  const rootPage = activeRoots.find((r) => r.role === 'page');
  if (rootPage && !rootPage.textProps?.isResponsive) {
    for (const n of nonFrameNodes) {
      if (n.textProps?.hideOnMobile || typeof n.textProps?.mobileOrder === 'number') {
        rawLints.push({
          text: `Responsive props on #${n.shortId} but no responsive root page — tokens not emitted.`,
          shapeId: n.id
        });
        delete n.textProps.hideOnMobile;
        delete n.textProps.mobileOrder;
      }
    }
  }

  // 7. Arrows / Relations (§6.5, §13)
  for (const arr of arrows) {
    const props = (arr.props as Record<string, unknown>) || {};
    const startBound = (props.start as Record<string, unknown>)?.boundShapeId as string | undefined;
    const endBound = (props.end as Record<string, unknown>)?.boundShapeId as string | undefined;
    if (startBound && endBound) {
      const startNode = nodeMap.get(startBound);
      const endNode = nodeMap.get(endBound);
      if (startNode && endNode) {
        const text = ((props.text as string) || '').trim();
        const rel = text ? ` (${text})` : '';
        relations.push(`Relations: #${startNode.shortId} → #${endNode.shortId}${rel}`);
      } else {
        rawLints.push({
          text: 'Arrow endpoint untagged — relation omitted.',
          shapeId: arr.id
        });
      }
    }
  }

  // 8. Scope handling (§9.1)
  let scopedMeta: IRTree['scopedMeta'];
  let scopedIds: Set<string> | null = null;
  if (options?.scope?.shapeIds && options.scope.shapeIds.length > 0) {
    const rawIds = options.scope.shapeIds;
    scopedIds = new Set<string>();

    for (const id of rawIds) scopedIds.add(id);

    let added = true;
    while (added) {
      added = false;
      for (const [id, n] of nodeMap.entries()) {
        if (!scopedIds.has(id) && n.parent && scopedIds.has(n.parent)) {
          scopedIds.add(id);
          added = true;
        }
      }
    }

    for (const id of Array.from(scopedIds)) {
      let curr = nodeMap.get(id);
      while (curr && curr.parent) {
        scopedIds.add(curr.parent);
        curr = nodeMap.get(curr.parent);
      }
    }

    const primaryNode = nodeMap.get(rawIds[0]);
    const scopeName =
      options.scope.scopeName ||
      primaryNode?.unitName ||
      primaryNode?.label ||
      primaryNode?.role ||
      'Selection';

    const rootFrame = activeRoots.find((r) => scopedIds!.has(r.id)) || activeRoots[0];
    const totalNodesUnderRoot = countSubtree(rootFrame) - 1;

    const filterSubtree = (node: IRNode) => {
      node.children = node.children.filter((c) => scopedIds!.has(c.id));
      for (const c of node.children) {
        filterSubtree(c);
      }
    };

    for (const r of activeRoots) {
      filterSubtree(r);
    }

    const nodeCountInScope =
      primaryNode && primaryNode.isUnit
        ? primaryNode.children.length
        : countSubtree(primaryNode || rootFrame) - 1;
    const unitCountInScope = Array.from(scopedIds).filter((id) => nodeMap.get(id)?.isUnit).length;

    scopedMeta = {
      scopeName,
      unitCount: Math.max(1, unitCountInScope),
      nodeCount: Math.max(1, nodeCountInScope),
      totalNodes: totalNodesUnderRoot,
      rootName: rootFrame ? rootFrame.label : 'Canvas'
    };
  }

  // 9. Process subtrees: layout flow direction, sorting, sibling patterns, paths
  const processSubtree = (node: IRNode, currentPath: string, depth: number) => {
    node.path = currentPath;
    if (node.children.length > 0) {
      node.direction = inferDirection(node.children);
      sortChildren(node.children, node.direction);
      annotateSiblingPatterns(node.children);

      // Duplicate literal labels across repeated siblings (§13)
      const labelCounts = new Map<string, { count: number; ids: string[] }>();
      for (const child of node.children) {
        const rawLabel = child.textProps?.label || child.label;
        if (rawLabel && !isUntouchedRoleLabel(child.role, rawLabel)) {
          const entry = labelCounts.get(rawLabel) || { count: 0, ids: [] };
          entry.count++;
          entry.ids.push(child.id);
          labelCounts.set(rawLabel, entry);
        }
      }
      for (const [text, entry] of labelCounts.entries()) {
        if (entry.count >= 2) {
          rawLints.push({
            text: `Identical literal labels "${text}" across ${entry.count} repeated siblings — consider one template (legend rule: vary per item).`,
            shapeId: node.id
          });
        }
      }

      for (const child of node.children) {
        const nextPath = `${currentPath} > #${child.shortId}`;
        processSubtree(child, nextPath, depth + 1);
      }
    } else {
      node.direction = 'Leaf';
    }
  };

  for (const root of activeRoots) {
    const rootPath = `Root > #${root.shortId}`;
    processSubtree(root, rootPath, 0);
  }

  // Attach computed styles to every node
  const attachStyles = (curr: IRNode, parent: IRNode | null, siblings: IRNode[]) => {
    curr.style = inferNodeStyle(curr, parent, siblings, options);
    for (const child of curr.children) {
      attachStyles(child, curr, curr.children);
    }
  };

  for (const root of activeRoots) {
    attachStyles(root, null, activeRoots);
  }

  let finalLints: string[];
  if (scopedIds && scopedIds.size > 0) {
    finalLints = rawLints
      .filter((l) => l.shapeId && scopedIds!.has(l.shapeId))
      .map((l) => l.text);
  } else {
    finalLints = rawLints.map((l) => l.text);
  }

  return {
    elementCount: nodeMap.size,
    roots: activeRoots,
    lints: finalLints,
    scopedMeta,
    relations: relations.length > 0 ? relations : undefined
  };
}

/**
 * Deterministically sorts object keys alphabetically (recursively)
 */
export function sortKeysAlphabetically<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map(sortKeysAlphabetically) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(val).sort();
    for (const k of keys) {
      sortedObj[k] = sortKeysAlphabetically((val as Record<string, unknown>)[k]);
    }
    return sortedObj as T;
  }
  return val;
}

export function pruneDefaultProps(node: IRNode): IRNode {
  const roleOrType = node.role || node.widgetType;
  const defaults = getRoleDefaultProps(roleOrType);
  const cleanProps: Partial<IRTextProps> = {};

  if (node.textProps) {
    for (const [k, v] of Object.entries(node.textProps)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'checked' && (v === false || v === defaults.checked)) continue;
      if (k === 'showText' && (v === false || v === defaults.showText)) continue;
      if (k === 'value' && (v === 0 || v === defaults.value)) continue;
      if (k === 'label' && isUntouchedRoleLabel(roleOrType, v as string)) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (defaults[k] !== undefined && defaults[k] === v) continue;
      (cleanProps as Record<string, unknown>)[k] = v;
    }
  }

  const result: IRNode = {
    ...node,
    textProps: cleanProps,
    children: node.children.map(pruneDefaultProps)
  };

  if (node.style) {
    const cleanStyle: InferredStyle = {};
    if (typeof node.style.widthPct === 'number') cleanStyle.widthPct = node.style.widthPct;
    if (node.style.align) cleanStyle.align = node.style.align;
    if (node.style.alignY) cleanStyle.alignY = node.style.alignY;
    if (node.style.dist) {
      cleanStyle.dist = node.style.dist.replace(/^dist:/, '');
    }
    if (node.style.rel) cleanStyle.rel = node.style.rel;
    if (Array.isArray(node.style.behaviors) && node.style.behaviors.length > 0) {
      cleanStyle.behaviors = node.style.behaviors;
    }
    if (node.style.note) cleanStyle.note = node.style.note;

    if (Object.keys(cleanStyle).length > 0) {
      result.style = cleanStyle;
    } else {
      delete result.style;
    }
  }

  return result;
}

export function serializeIRToJsonAst(ir: IRTree | IRNode[]): string {
  const data = Array.isArray(ir) ? ir : ir.roots;
  const pruned = data.map((rootNode) => {
    const p = pruneDefaultProps(rootNode);
    return {
      aiDirective: AI_DIRECTIVE_HEADER,
      ...p
    };
  });
  const sorted = sortKeysAlphabetically(pruned);
  return JSON.stringify(sorted, null, 2);
}
