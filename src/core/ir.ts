import { TLShape, Editor } from '@tldraw/tldraw';
import { computeAABB, getEnclosureRatio, sanitizeMarkdown } from './geometry';
import { AABB, CompilationOptions, UIWidgetProps } from './types';
import { getCatalogDefaultProps, isUntouchedLabel } from './widgets/widgetCatalog';
import { InferredStyle, inferNodeStyle } from './style';
import { AI_DIRECTIVE_HEADER } from './directive';
import { generateShortId } from './ids';
import { annotateSiblingPatterns } from './patterns';

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
  options?: string;
  placeholder?: string;
  showText?: boolean;
  subtext?: string;
  value?: number;
  variant?: string;
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
}

export function resolveWidgetRole(widgetType: string): string {
  switch (widgetType) {
    // Containers
    case 'page':
    case 'section':
    case 'card':
    case 'carousel':
    case 'hero':
    case 'header':
    case 'footer':
    case 'grid_gallery':
    case 'split_pane':
    case 'modal':
    case 'data_table':
    case 'table':
    case 'tabs':
    case 'footer_nav':
    case 'steps':
    case 'menubar':
    case 'sidebar':
      return 'container';

    // Buttons
    case 'button':
      return 'button';

    // Inputs
    case 'input':
    case 'search':
    case 'password':
    case 'textarea':
    case 'checkbox':
    case 'radio':
    case 'toggle':
    case 'select':
    case 'slider':
    case 'file_upload':
    case 'date_picker':
    case 'stepper':
    case 'color_swatch':
      return 'input';

    // Media & Icons
    case 'avatar':
    case 'avatar_group':
    case 'thumbnail_strip':
    case 'badge':
    case 'icon':
    case 'stat_kpi':
    case 'image_frame':
    case 'video_frame':
      return 'icon_avatar';

    // Dividers
    case 'divider':
    case 'spacer':
      return 'divider';

    // Content / Text
    case 'heading':
    case 'paragraph':
    case 'list':
    case 'blockquote':
    case 'code_block':
    case 'link':
    case 'chip':
    case 'breadcrumbs':
    case 'pagination':
    case 'tooltip':
    case 'toast':
    case 'empty_state':
    case 'banner':
    case 'progress_bar':
    case 'skeleton':
      return 'text';

    default:
      return 'unknown';
  }
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

interface IntermediateItem {
  aabb: AABB;
  area: number;
  node: IRNode;
}

export function buildIRTree(
  shapes: TLShape[],
  editor?: Editor | null,
  containmentThreshold: number = 0.85,
  options?: CompilationOptions
): IRTree {
  // Only process ui-widget shapes; ignore everything else
  const widgetShapes = shapes.filter((s) => s.type === 'ui-widget');
  if (widgetShapes.length === 0) {
    return { elementCount: 0, roots: [], lints: [] };
  }

  const items: IntermediateItem[] = [];
  const usedShortIds = new Set<string>();
  const lints: string[] = [];
  let skippedShapes = 0;

  for (const s of widgetShapes) {
    try {
      const props = (s.props || {}) as Partial<UIWidgetProps>;
      const widgetType = props.widgetType || 'unknown';

      let x = s.x;
      let y = s.y;
      let w = typeof props.w === 'number' ? props.w : 100;
      let h = typeof props.h === 'number' ? props.h : 100;

      if (editor && typeof editor.getShapePageBounds === 'function') {
        const pageBounds = editor.getShapePageBounds(s);
        if (pageBounds) {
          x = pageBounds.x;
          y = pageBounds.y;
          w = pageBounds.w;
          h = pageBounds.h;
        }
      }

      // Filter micro-dots / ghost elements (< 4px)
      if (w < 4 || h < 4) continue;

      const bounds: IRBounds = { x, y, w, h };
      const aabb = computeAABB(bounds);
      const rawLabel = (props.label || props.placeholder || widgetType || '') as string;
      const label = sanitizeMarkdown(rawLabel);

      const textProps: IRTextProps = {};
      if (props.label !== undefined && props.label !== '') textProps.label = props.label;
      if (props.placeholder !== undefined && props.placeholder !== '') textProps.placeholder = props.placeholder;
      if (props.subtext !== undefined && props.subtext !== '') textProps.subtext = props.subtext;
      if (props.altText !== undefined && props.altText !== '') textProps.altText = props.altText;
      if (props.options !== undefined && props.options !== '') textProps.options = props.options;
      if (typeof props.value === 'number') textProps.value = props.value;
      if (typeof props.checked === 'boolean') textProps.checked = props.checked;
      if (props.variant !== undefined && props.variant !== '') textProps.variant = props.variant;
      if (typeof props.showText === 'boolean') textProps.showText = props.showText;
      if (props.iconName !== undefined && props.iconName !== '') textProps.iconName = props.iconName;
      if (Array.isArray(props.behaviors) && props.behaviors.length > 0) {
        textProps.behaviors = [...props.behaviors];
      }
      if (typeof props.note === 'string' && props.note.trim() !== '') {
        textProps.note = props.note.trim();
      }

      const role = resolveWidgetRole(widgetType);
      const shortId = generateShortId(s.id, usedShortIds);
      const explicitParentId =
        typeof props.parentId === 'string' && props.parentId.trim() !== ''
          ? props.parentId.trim()
          : undefined;

      const node: IRNode = {
        bounds,
        children: [],
        direction: 'Leaf',
        id: s.id,
        shortId,
        parentId: explicitParentId,
        label: label || `${widgetType}_${s.id.slice(-4)}`,
        parent: null,
        path: 'Root',
        role,
        textProps,
        widgetType
      };

      items.push({
        aabb,
        area: w * h,
        node
      });
    } catch (err) {
      console.warn(`[MarkDraw] Skipped corrupt shape ${s?.id}:`, err);
      skippedShapes++;
    }
  }

  // Sort descending by area to establish default containment hierarchy
  items.sort((a, b) => b.area - a.area);

  const shapeMap = new Map<string, IntermediateItem>();
  for (const item of items) {
    shapeMap.set(item.node.id, item);
  }

  const roots: IRNode[] = [];

  for (const item of items) {
    let immediateParent: IRNode | null = null;

    // 1. Explicit parent binding check first
    if (item.node.parentId) {
      const candidate = shapeMap.get(item.node.parentId);
      if (candidate && candidate.node.id !== item.node.id) {
        // Prevent simple cycles: verify candidate's ancestor chain does not include item
        let curr: IntermediateItem | undefined = candidate;
        let hasCycle = false;
        const visited = new Set<string>([item.node.id]);

        while (curr && curr.node.parentId) {
          if (visited.has(curr.node.parentId)) {
            hasCycle = true;
            break;
          }
          visited.add(curr.node.parentId);
          curr = shapeMap.get(curr.node.parentId);
        }

        if (!hasCycle) {
          immediateParent = candidate.node;
        }
      }
    }

    // 2. Geometric enclosure fallback if explicit parent was not resolved
    if (!immediateParent) {
      let minParentArea = Infinity;
      let chosenRatio = 1.0;

      for (const candidate of items) {
        if (candidate.node.id === item.node.id) continue;

        if (candidate.area > item.area) {
          const ratio = getEnclosureRatio(item.aabb, candidate.aabb);
          if (ratio >= containmentThreshold) {
            if (candidate.area < minParentArea) {
              minParentArea = candidate.area;
              immediateParent = candidate.node;
              chosenRatio = ratio;
            }
          }
        }
      }

      // Check loose containment lint (< 0.92)
      if (immediateParent && chosenRatio < 0.92) {
        lints.push(
          `"${item.node.label}" (#${item.node.shortId}) is loosely contained (${Math.round(
            chosenRatio * 100
          )}%) — drag fully inside or set parent explicitly.`
        );
      }
    }

    if (immediateParent) {
      immediateParent.children.push(item.node);
      item.node.parent = immediateParent.id;
    } else {
      roots.push(item.node);
    }
  }

  // Container promotion rule: any node with >= 2 children becomes container
  for (const item of items) {
    if (item.node.children.length >= 2 && item.node.role !== 'container') {
      item.node.role = 'container';
    }
  }

  // Process layout flow direction, annotate sibling patterns, and build deterministic `#id` paths
  const processSubtree = (node: IRNode, currentPath: string, depth: number) => {
    node.path = currentPath;

    // Depth lint: non-page widget deeper than 3 levels
    if (node.widgetType !== 'page' && depth > 3) {
      lints.push(
        `Deep hierarchy: "${node.label}" (#${node.shortId}) is ${depth} levels deep (consider flattening).`
      );
    }

    if (node.children.length > 0) {
      node.direction = inferDirection(node.children);
      sortChildren(node.children, node.direction);
      annotateSiblingPatterns(node.children);

      for (const child of node.children) {
        const nextPath = `${currentPath} > #${child.shortId}`;
        processSubtree(child, nextPath, depth + 1);
      }
    } else {
      node.direction = 'Leaf';
    }
  };

  for (const root of roots) {
    const rootPath = `Root > #${root.shortId}`;
    processSubtree(root, rootPath, 0);

    // Cards directly under page lint
    if (root.widgetType === 'page') {
      const cardChildren = root.children.filter((c) => c.widgetType === 'card');
      if (cardChildren.length >= 2) {
        lints.push(`${cardChildren.length} cards directly under page — consider grouping in a section.`);
      }
    }
  }

  // Attach computed styles to every node
  const attachStyles = (curr: IRNode, parent: IRNode | null, siblings: IRNode[]) => {
    curr.style = inferNodeStyle(curr, parent, siblings, options);
    for (const child of curr.children) {
      attachStyles(child, curr, curr.children);
    }
  };

  for (const root of roots) {
    attachStyles(root, null, roots);
  }

  return {
    elementCount: items.length,
    roots,
    skippedShapes,
    lints
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
  const defaults = getCatalogDefaultProps(node.widgetType);
  const cleanProps: Partial<IRTextProps> = {};

  if (node.textProps) {
    for (const [k, v] of Object.entries(node.textProps)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'checked' && (v === false || v === defaults.checked)) continue;
      if (k === 'showText' && (v === false || v === defaults.showText)) continue;
      if (k === 'value' && (v === 0 || v === defaults.value)) continue;
      if (k === 'label' && isUntouchedLabel(node.widgetType, v as string)) continue;
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
