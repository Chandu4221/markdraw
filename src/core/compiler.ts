import { TLShape, Editor } from '@tldraw/tldraw';
import {
  CompilationResult,
  CompilationOptions,
  LayoutNode,
  NormalizedShape,
  SemanticRole
} from './types';
import {
  IRNode,
  IRTree,
  buildIRTree,
  serializeIRToJsonAst,
  resolveWidgetRole
} from './ir';
import {
  formatSemanticNotation,
  DYNAMIC_LEGEND_MARKDOWN
} from './notation';
import { AsciiSerializer } from './ascii';
import { computeAABB, isEnclosed, sanitizeMarkdown } from './geometry';
import { getCatalogDefaultProps, isUntouchedLabel } from './widgets/widgetCatalog';
import { detectSiblingPatterns } from './patterns';
import { AI_DIRECTIVE_HEADER } from './directive';

export const MARKDRAW_VERSION = '2.8';

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const SEMANTIC_LEGEND_MARKDOWN = DYNAMIC_LEGEND_MARKDOWN;

export function inferPlacement(
  node: IRNode,
  parent: IRNode | null
): 'header' | 'body' | 'footer' | 'nested' | '—' {
  if (!parent) {
    if (node.widgetType === 'page') {
      return '—';
    }
    if (node.widgetType === 'navbar' || node.widgetType === 'header') {
      return 'header';
    }
    if (node.widgetType === 'footer') {
      return 'footer';
    }
    return 'body';
  }

  // Widget TYPE wins: footer/navbar widgets emit placement:type, never contradicted
  if (node.widgetType === 'navbar' || node.widgetType === 'header') {
    return 'header';
  }
  if (node.widgetType === 'footer') {
    return 'footer';
  }

  // If direct child of a [page] root, infer from geometry relative to the page box
  if (parent.widgetType === 'page') {
    const pageBounds = parent.bounds;
    const pageH = pageBounds.h;
    const pageW = pageBounds.w;

    const relTop = node.bounds.y - pageBounds.y;
    const widthRatio = node.bounds.w / pageW;
    const isWideEnough = widthRatio >= 0.70;

    // Top 15% band
    if (relTop <= 0.15 * pageH && isWideEnough) {
      return 'header';
    }

    // Geometric footer: last top-level band AND top edge within bottom 35% of page
    const isBottom35 = node.bounds.y >= pageBounds.y + 0.65 * pageH;
    if (isBottom35 && isWideEnough) {
      const hasSiblingBelow = parent.children.some(
        (sib) => sib.id !== node.id && sib.bounds.y > node.bounds.y + 20
      );
      if (!hasSiblingBelow) {
        return 'footer';
      }
    }

    return 'body';
  }

  // All shapes inside another container get 'nested'
  return 'nested';
}

export class MarkDrawCompiler {
  public static compile(
    shapes: TLShape[],
    editor?: Editor | null,
    options?: CompilationOptions
  ): CompilationResult {
    const opts: Required<CompilationOptions> = {
      containmentThreshold: options?.containmentThreshold ?? 0.85,
      rowClusterThreshold: options?.rowClusterThreshold ?? 16,
      gridBandThreshold: options?.gridBandThreshold ?? 32,
      sizeBucketTolerance: options?.sizeBucketTolerance ?? 2,
      alignTolerance: options?.alignTolerance ?? 3,
      includeTimestamp: options?.includeTimestamp ?? false,
      includeLegend: options?.includeLegend ?? true,
      pageNote: options?.pageNote ?? ''
    };

    // Part 3: All compilation flows strictly Shapes -> IR -> Serializers
    const ir: IRTree = buildIRTree(shapes, editor, opts.containmentThreshold, opts);

    const specBody = this.serializeSpecTable(ir.roots, opts);
    const gridBody = this.serializeSpatialGrid(ir.roots, opts.gridBandThreshold);
    const asciiBody = AsciiSerializer.serialize(ir.roots);
    const jsonAst = serializeIRToJsonAst(ir.roots);

    const directivePrefix = `${AI_DIRECTIVE_HEADER}\n\n`;
    const legendPrefix = opts.includeLegend ? `${DYNAMIC_LEGEND_MARKDOWN}\n\n---\n\n` : '';
    const warningSuffix =
      ir.skippedShapes && ir.skippedShapes > 0
        ? `\n\n_Warning: ${ir.skippedShapes} shape(s) skipped due to processing errors._`
        : '';

    return {
      markdownSpec: `${directivePrefix}${legendPrefix}${specBody}${warningSuffix}`,
      markdownGrid: `${legendPrefix}${gridBody}`,
      markdownAscii: `${legendPrefix}${asciiBody}`,
      jsonAst,
      timestamp: opts.includeTimestamp ? new Date().toISOString() : '',
      elementCount: ir.elementCount
    };
  }

  public static normalize(shapes: TLShape[], editor?: Editor | null): NormalizedShape[] {
    const results: NormalizedShape[] = [];

    for (const s of shapes) {
      const props = (s.props || {}) as Record<string, any>;
      const rawText = (props.text || props.name || props.label || '') as string;
      const text = sanitizeMarkdown(rawText);

      let x = s.x;
      let y = s.y;
      let w = typeof props.w === 'number' ? props.w : 100;
      let h = typeof props.h === 'number' ? props.h : 100;

      if (editor && typeof (editor as any).getShapePageBounds === 'function') {
        const pageBounds = (editor as any).getShapePageBounds(s);
        if (pageBounds) {
          x = pageBounds.x;
          y = pageBounds.y;
          w = pageBounds.w;
          h = pageBounds.h;
        }
      }

      if (s.type !== 'text' && (w < 4 || h < 4)) continue;

      const bounds = { x, y, w, h };
      const aabb = computeAABB(bounds);
      const widgetType = props.widgetType as string | undefined;
      const role: SemanticRole = (widgetType ? resolveWidgetRole(widgetType) : 'unknown') as SemanticRole;

      results.push({
        id: s.id,
        type: s.type,
        bounds,
        aabb,
        color: props.color || 'black',
        isDashed: props.dash === 'dashed',
        text,
        role,
        widgetType,
        widgetProps: props
      });
    }

    return results;
  }

  public static formatProps(node: IRNode | LayoutNode): string {
    const p = (node as any).textProps || (node as any).widgetProps;
    const style = (node as any).style;
    if (!p && !style) return '—';

    const type = (node as any).widgetType || '';
    const defaults = getCatalogDefaultProps(type);
    const propsPairs: string[] = [];

    if (p) {
      if (
        p.variant &&
        p.variant !== defaults.variant &&
        p.variant !== 'default' &&
        p.variant !== 'solid'
      ) {
        propsPairs.push(`variant="${p.variant}"`);
      }
      if (p.placeholder && p.placeholder !== defaults.placeholder) {
        propsPairs.push(`placeholder="${p.placeholder}"`);
      }
      if (
        typeof p.checked === 'boolean' &&
        p.checked === true &&
        p.checked !== defaults.checked
      ) {
        propsPairs.push(`checked=${p.checked}`);
      }
      if (p.options && p.options !== defaults.options) {
        propsPairs.push(`options=[${p.options}]`);
      }
      if (
        typeof p.value === 'number' &&
        p.value > 0 &&
        p.value !== defaults.value
      ) {
        propsPairs.push(`value=${p.value}`);
      }
      if (p.iconName && p.iconName !== defaults.iconName) {
        propsPairs.push(`icon="${p.iconName}"`);
      }
      if (p.subtext && p.subtext !== defaults.subtext) {
        propsPairs.push(`subtext="${p.subtext}"`);
      }
      if (p.altText && p.altText !== defaults.altText) {
        propsPairs.push(`alt="${p.altText}"`);
      }
      if (
        typeof p.showText === 'boolean' &&
        p.showText === true &&
        p.showText !== defaults.showText
      ) {
        propsPairs.push(`showText=${p.showText}`);
      }
    }

    const styleTokens: string[] = [];

    if (style) {
      if (style.widthToken) {
        styleTokens.push(style.widthToken);
      }
      if (style.heightToken) {
        styleTokens.push(`height:${style.heightToken}`);
      }
      if (style.align) {
        styleTokens.push(`align:${style.align}`);
      }
      if (style.alignY) {
        styleTokens.push(`align-y:${style.alignY}`);
      }
      if (style.dist) {
        styleTokens.push(style.dist);
      }
      if (style.rel) {
        styleTokens.push(`rel:${style.rel}`);
      }
      if (Array.isArray(style.behaviors) && style.behaviors.length > 0) {
        styleTokens.push(...style.behaviors);
      }
      if (style.note) {
        styleTokens.push(`note:"${style.note}"`);
      }
    } else if (p) {
      if (Array.isArray(p.behaviors) && p.behaviors.length > 0) {
        styleTokens.push(...p.behaviors);
      }
      if (typeof p.note === 'string' && p.note.trim() !== '') {
        styleTokens.push(`note:"${p.note.trim()}"`);
      }
    }

    const propsStr = propsPairs.join(', ');
    const styleStr = styleTokens.join(' ');

    if (propsStr && styleStr) {
      return `${propsStr} ${styleStr}`;
    }
    if (propsStr) return propsStr;
    if (styleStr) return styleStr;
    return '—';
  }

  private static toIRNode(node: IRNode | LayoutNode): IRNode {
    if ('bounds' in node && 'textProps' in node) {
      return node as IRNode;
    }
    const ln = node as LayoutNode;
    return {
      id: ln.id,
      widgetType: ln.widgetType || (ln.role === 'container' ? 'section' : ln.role === 'button' ? 'button' : 'heading'),
      role: ln.role,
      label: ln.label,
      textProps: (ln.widgetProps as any) || { label: ln.shape?.text || ln.label },
      bounds: ln.shape?.bounds || { x: 0, y: 0, w: 100, h: 40 },
      children: (ln.children || []).map((c) => this.toIRNode(c)),
      parent: ln.parent,
      direction: ln.direction,
      path: ln.path,
      style: (ln as any).style
    };
  }

  public static serializeSpecTable(
    roots: (IRNode | LayoutNode)[],
    options?: CompilationOptions
  ): string {
    if (!roots || roots.length === 0) {
      return '_Canvas is empty. Draw shapes or drop UI components to generate the specification._';
    }

    const irRoots = roots.map((r) => this.toIRNode(r));
    const rows: string[] = [];
    rows.push('### MarkDraw UI Specification');
    if (options?.includeTimestamp) {
      rows.push(`**Generated:** ${new Date().toISOString()}  `);
    }

    const rootPage = irRoots.find((r) => r.widgetType === 'page');
    const effectivePageNote =
      options?.pageNote || (rootPage?.textProps as any)?.note || (rootPage?.style as any)?.note;
    if (effectivePageNote) {
      rows.push(`**Page note:** ${effectivePageNote}  `);
    }

    rows.push(`**Roots Detected:** ${irRoots.length} view(s)\n`);
    rows.push('#### Semantic Hierarchy Table');
    rows.push(
      '| Path | Component | Semantics | Placement | Layout Flow | Props & Attributes | Children / Content |'
    );
    rows.push(
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
    );

    const walk = (node: IRNode, parent: IRNode | null) => {
      const notation = formatSemanticNotation(node);

      let childBadges = '—';
      if (node.children.length > 0) {
        childBadges = detectSiblingPatterns(node.children);
      } else {
        const rawLabel = node.textProps?.label || node.label;
        if (isUntouchedLabel(node.widgetType, rawLabel)) {
          childBadges = '"content: unspecified"';
        } else if (rawLabel) {
          childBadges = `"${rawLabel}"`;
        } else {
          childBadges = '—';
        }
      }

      const semanticsBadge = `<${capitalize(node.widgetType || node.role)}>`;
      const placement = inferPlacement(node, parent);
      const layoutFlow =
        node.children.length > 0
          ? node.direction === 'Leaf'
            ? 'Column'
            : node.direction
          : '—';
      const propsStr = this.formatProps(node);

      rows.push(
        `| \`${node.path}\` | **${notation}** | ${semanticsBadge} | ${placement} | ${layoutFlow} | ${propsStr} | ${childBadges} |`
      );
      for (const child of node.children) {
        walk(child, node);
      }
    };

    for (const root of irRoots) {
      walk(root, null);
    }

    return rows.join('\n');
  }

  public static serializeSpatialGrid(
    roots: (IRNode | LayoutNode)[],
    gridBandThreshold: number = 32
  ): string {
    if (!roots || roots.length === 0) return '_Canvas is empty._';

    const irRoots = roots.map((r) => this.toIRNode(r));
    const lines: string[] = [];
    lines.push('### Spatial Grid Layout Table\n');

    const rowClustered: IRNode[][] = [];
    const sortedRoots = [...irRoots].sort((a, b) => a.bounds.y - b.bounds.y);

    for (const node of sortedRoots) {
      let placed = false;
      for (const cluster of rowClustered) {
        const clusterY = cluster[0].bounds.y;
        if (Math.abs(node.bounds.y - clusterY) <= gridBandThreshold) {
          cluster.push(node);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rowClustered.push([node]);
      }
    }

    let maxCols = 0;
    for (const cluster of rowClustered) {
      cluster.sort((a, b) => a.bounds.x - b.bounds.x);
      maxCols = Math.max(maxCols, cluster.length);
    }

    if (maxCols === 0) return '_No spatial cells formed._';

    const headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);

    for (const cluster of rowClustered) {
      const cellValues = cluster.map((n) => formatSemanticNotation(n));
      while (cellValues.length < maxCols) {
        cellValues.push('—');
      }
      lines.push(`| ${cellValues.join(' | ')} |`);
    }

    return lines.join('\n');
  }

  // Backward compatibility helper for legacy unit tests
  public static buildHierarchy(
    shapes: NormalizedShape[],
    containmentThreshold: number = 0.85
  ): LayoutNode[] {
    if (shapes.length === 0) return [];

    const sortedByAreaDesc = [...shapes].sort(
      (a, b) => b.bounds.w * b.bounds.h - a.bounds.w * a.bounds.h
    );

    const nodeRegistry = new Map<string, LayoutNode>();
    for (const shape of shapes) {
      const fallbackLabel = shape.widgetType
        ? `${capitalize(shape.widgetType)}_${shape.id.slice(-4)}`
        : `${shape.type}_${shape.id.slice(-4)}`;

      const label = shape.text || fallbackLabel;

      const node: LayoutNode = {
        id: shape.id,
        shape,
        role: shape.role,
        label,
        path: 'Root',
        direction: 'Leaf',
        children: [],
        parent: null,
        widgetType: shape.widgetType || (shape.role === 'button' ? 'button' : shape.role === 'container' ? 'section' : 'heading'),
        widgetProps: shape.widgetProps || { label }
      };
      nodeRegistry.set(shape.id, node);
    }

    const roots: LayoutNode[] = [];

    for (const shape of sortedByAreaDesc) {
      const node = nodeRegistry.get(shape.id)!;
      let immediateParent: LayoutNode | null = null;
      let minParentArea = Infinity;

      for (const candidate of shapes) {
        if (candidate.id === shape.id) continue;
        const candidateArea = candidate.bounds.w * candidate.bounds.h;
        const childArea = shape.bounds.w * shape.bounds.h;

        if (
          candidateArea > childArea &&
          isEnclosed(shape.aabb, candidate.aabb, containmentThreshold)
        ) {
          if (candidateArea < minParentArea) {
            minParentArea = candidateArea;
            immediateParent = nodeRegistry.get(candidate.id) || null;
          }
        }
      }

      if (immediateParent) {
        immediateParent.children.push(node);
        node.parent = immediateParent.id;
      } else {
        roots.push(node);
      }
    }

    for (const node of nodeRegistry.values()) {
      if (node.children.length >= 2 && node.role !== 'container') {
        node.role = 'container';
      }
    }

    const processSubtree = (node: LayoutNode, currentPath: string) => {
      node.path = currentPath;
      if (node.children.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const child of node.children) {
          const cx = child.shape.bounds.x + child.shape.bounds.w / 2;
          const cy = child.shape.bounds.y + child.shape.bounds.h / 2;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
        }
        node.direction = (maxY - minY) > (maxX - minX) ? 'Column' : 'Row';
        if (node.direction === 'Row') {
          node.children.sort((a, b) => a.shape.bounds.x - b.shape.bounds.x);
        } else {
          node.children.sort((a, b) => a.shape.bounds.y - b.shape.bounds.y);
        }
        const nextPath = `${currentPath} > ${node.label}`;
        for (const child of node.children) {
          processSubtree(child, nextPath);
        }
      } else {
        node.direction = 'Leaf';
      }
    };

    for (const root of roots) {
      processSubtree(root, 'Root');
    }

    return roots;
  }
}
