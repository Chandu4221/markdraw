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

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const SEMANTIC_LEGEND_MARKDOWN = DYNAMIC_LEGEND_MARKDOWN;

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
      includeTimestamp: options?.includeTimestamp ?? false,
      includeLegend: options?.includeLegend ?? true
    };

    // Part 3: All compilation flows strictly Shapes -> IR -> Serializers
    const ir: IRTree = buildIRTree(shapes, editor, opts.containmentThreshold);

    const specBody = this.serializeSpecTable(ir.roots, opts);
    const gridBody = this.serializeSpatialGrid(ir.roots, opts.gridBandThreshold);
    const asciiBody = AsciiSerializer.serialize(ir.roots);
    const jsonAst = serializeIRToJsonAst(ir.roots);

    const legendPrefix = opts.includeLegend ? `${DYNAMIC_LEGEND_MARKDOWN}\n\n---\n\n` : '';

    return {
      markdownSpec: `${legendPrefix}${specBody}`,
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
    if (!p) return '—';

    const pairs: string[] = [];
    if (p.variant) pairs.push(`variant="${p.variant}"`);
    if (p.placeholder) pairs.push(`placeholder="${p.placeholder}"`);
    if (typeof p.checked === 'boolean') pairs.push(`checked=${p.checked}`);
    if (p.options) pairs.push(`options=[${p.options}]`);
    if (typeof p.value === 'number' && p.value > 0) pairs.push(`value=${p.value}`);
    if (p.iconName) pairs.push(`icon="${p.iconName}"`);
    if (p.subtext) pairs.push(`subtext="${p.subtext}"`);
    if (p.altText) pairs.push(`alt="${p.altText}"`);
    if (typeof p.showText === 'boolean') pairs.push(`showText=${p.showText}`);

    return pairs.length > 0 ? pairs.join(', ') : '—';
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
      path: ln.path
    };
  }

  public static serializeSpecTable(
    roots: (IRNode | LayoutNode)[],
    options?: { includeTimestamp?: boolean }
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
    rows.push(`**Roots Detected:** ${irRoots.length} view(s)\n`);
    rows.push('#### Semantic Hierarchy Table');
    rows.push('| Path | Component | Semantics | Layout Flow | Props & Attributes | Children / Content |');
    rows.push('| :--- | :--- | :--- | :--- | :--- | :--- |');

    const walk = (node: IRNode) => {
      const notation = formatSemanticNotation(node);

      const childBadges =
        node.children.length > 0
          ? node.children.map((c) => formatSemanticNotation(c)).join(', ')
          : node.textProps?.label || node.label
            ? `"${node.textProps?.label || node.label}"`
            : '—';

      const semanticsBadge = `<${capitalize(node.widgetType || node.role)}>`;
      const propsStr = this.formatProps(node);

      rows.push(
        `| \`${node.path}\` | **${notation}** | ${semanticsBadge} | ${node.direction} | ${propsStr} | ${childBadges} |`
      );
      for (const child of node.children) {
        walk(child);
      }
    };

    for (const root of irRoots) {
      walk(root);
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
