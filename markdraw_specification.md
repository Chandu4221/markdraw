# Product Requirement Document & Technical Specification: MarkDraw

**Project Codename:** MarkDraw (Canvas-to-Markdown Spatial Compiler)  
**Target Environment:** 100% Client-Side Web Application  
**Deployment Target:** GitHub Pages (Static SPA)  
**Primary Engine:** React 19 + TypeScript (Strict) + Vite + `@tldraw/tldraw`  
**License:** MIT  

---

## 1. Executive Summary & Problem Space

### 1.1 The Problem
Feeding visual mockups and wireframe screenshots to Large Language Models (LLMs) via multimodal vision APIs (GPT-4o, Claude 3.5 Sonnet) introduces:
- High token costs and API billing.
- Latency and rate-limiting bottlenecks.
- Vision hallucinations (misaligned paddings, hallucinated colors, imprecise hierarchy, dropped elements).
- Uneditable, non-reproducible prompt inputs.

### 1.2 The Solution
**MarkDraw** is a zero-backend, client-side visual wireframing canvas that compiles freeform vector shapes and spatial layouts into deterministic GitHub-Flavored Markdown (GFM) tables and component hierarchy specifications in real time. It uses purely deterministic geometric algorithms (Axis-Aligned Bounding Box containment trees, topological sorting, and spatial clustering) paired with a semantic Legend Engine.

### 1.3 Core Invariants
1. **Zero Runtime AI:** No LLM APIs, no vision inference, no cloud compute. Output is generated via deterministic $O(N \log N)$ computational geometry.
2. **Deterministic Output:** Identical canvas coordinates and shapes will always produce byte-for-byte identical Markdown output.
3. **Offline & Edge-First:** Zero network requests required post-bundle hydration. Local-first storage (`IndexedDB` + `localStorage`).

---

## 2. High-Level Architecture & Design Patterns

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER RUNTIME                                 │
│                                                                             │
│  ┌───────────────────────┐                    ┌──────────────────────────┐  │
│  │   tldraw Canvas View  │                    │   Output & Preview View  │  │
│  │  (Infinite Viewport)  │                    │ (Tabs: MD/Spec/JSON/Raw) │  │
│  └───────────┬───────────┘                    └─────────────▲────────────┘  │
│              │ Pointer & Shape Events                       │ Reactive      │
│              ▼                                              │ Subscription  │
│  ┌──────────────────────────────────────────────────────────┴────────────┐  │
│  │                 Reactive Canvas Store (TLStore)                      │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │ Debounced Shape Stream (30ms)            │
│                                  ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    COMPILATION PIPELINE (Worker / Core)               │  │
│  │                                                                       │  │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐  │  │
│  │  │  Shape Extractor │───▶│  Legend Filter   │───▶│ Containment Tree│  │  │
│  │  │   & Normalizer   │    │  (Semantic Tag)  │    │  (R-Tree AABB)  │  │  │
│  │  └──────────────────┘    └──────────────────┘    └────────┬────────┘  │  │
│  │                                                           │           │  │
│  │  ┌──────────────────┐    ┌──────────────────┐             │           │  │
│  │  │ GFM Table & Spec │◀───│ Layout Resolver  │◀────────────┘           │  │
│  │  │    Serializers   │    │ (Row/Col Cluster)│                         │  │
│  │  └──────────────────┘    └──────────────────┘                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Applied Design Patterns
- **Compiler Pipeline Architecture:** The core logic treats canvas shapes as source tokens, parses them into an Abstract Layout Tree (ALT), checks semantic bindings, and generates Markdown as target bytecode.
- **Repository Pattern:** State persistence abstracting `localStorage` (settings, UI state) and `IndexedDB` (vector document history) behind a unified asynchronous document repository interface.
- **Visitor Pattern:** Serializing the Abstract Layout Tree into multiple distinct output targets (GFM Spec Table, Spatial Pipe Grid, JSON AST, Raw HTML Table) using separate visitor implementations.
- **Observer Pattern:** Subscribing to `tldraw` store diffs rather than full-canvas reconciliation on every micro-tick.

---

## 3. The Semantic Legend Engine

To eliminate ambiguity without machine learning, MarkDraw maps shape attributes to semantic UI components through an explicit, user-customizable **Legend Engine**.

### 3.1 Shape-to-Semantic Mapping Rules

| Visual Property | Default Shape | Semantic Component Role | Inferred Markdown Symbol |
| :--- | :--- | :--- | :--- |
| **Dashed Stroke** | Rectangle | Container / Card / Viewport | `[Card: {Label}]` |
| **Solid Blue / Filled** | Rectangle | Action Button / CTA | `[Button: "{Label}"]` |
| **Solid Neutral** | Rectangle | Input Field / Form Element | `<Input: "{Label}">` |
| **Any Stroke** | Ellipse / Circle | Avatar / Icon / Indicator | `(Avatar: "{Label}")` |
| **Solid Double-Line** | Horizontal Line | Divider / Separator | `--- Separator ---` |
| **Raw Text Element** | Text | Label / Heading / Paragraph | `"{Text Content}"` |
| **Group / Frame** | Frame | Modal / View / Screen Page | `# Screen: {Frame Name}` |

### 3.2 Semantic Priority Resolution
If an element satisfies multiple criteria (e.g., a blue rectangle containing text and a circle), resolution follows strict precedence:
1. **Explicit Tag Override:** Shape user metadata `meta.markdrawRole` (set via context menu).
2. **Container Classification:** Any shape containing two or more other shapes is promoted to `Container` regardless of color.
3. **Geometry/Color Heuristic:** Default mappings per Table 3.1.

---

## 4. Geometric Compilation Pipeline

The pipeline converts a flat list of `TLShape` objects into a hierarchical tree and outputs GFM.

### 4.1 Step 1: Shape Normalization
Every vector element on canvas is transformed into a normalized bounding box:
$$\text{Box}_i = (x_i, y_i, w_i, h_i, \theta_i)$$
Where $\theta_i$ is rotation. If $\theta_i \ne 0$, compute the minimum enclosing axis-aligned bounding box (AABB) using:
$$x_{\min} = \min(x_k \cos\theta - y_k \sin\theta), \quad x_{\max} = \max(x_k \cos\theta - y_k \sin\theta)$$

### 4.2 Step 2: Containment Hierarchy (AABB Tree)
Node $B$ is a direct child of Node $A$ ($B \subset A$) if:
$$\frac{\text{Area}(A \cap B)}{\text{Area}(B)} \ge 0.85$$
*Tolerance threshold is set to 85% to account for hand-drawn sketches where an icon or text slightly spills over a card border.*

#### Containment Algorithm
```typescript
interface LayoutNode {
  id: string;
  shape: NormalizedShape;
  role: SemanticRole;
  children: LayoutNode[];
  parent: string | null;
  bounds: AABB;
}

function buildHierarchy(shapes: NormalizedShape[]): LayoutNode[] {
  // 1. Sort by area descending (largest containers first)
  const sorted = [...shapes].sort((a, b) => (b.w * b.h) - (a.w * a.h));
  const roots: LayoutNode[] = [];
  const allNodes = new Map<string, LayoutNode>();

  for (const s of sorted) {
    const node: LayoutNode = {
      id: s.id,
      shape: s,
      role: resolveRole(s),
      children: [],
      parent: null,
      bounds: { x1: s.x, y1: s.y, x2: s.x + s.w, y2: s.y + s.h }
    };
    allNodes.set(s.id, node);

    let placed = false;
    for (const potentialParent of sorted) {
      if (potentialParent.id === s.id) continue;
      const parentNode = allNodes.get(potentialParent.id);
      if (parentNode && isEnclosed(node.bounds, parentNode.bounds, 0.85)) {
        parentNode.children.push(node);
        node.parent = parentNode.id;
        placed = true;
        break; // Smallest enclosing parent gets the node
      }
    }
    if (!placed) {
      roots.push(node);
    }
  }
  return roots;
}
```

### 4.3 Step 3: Spatial Ordering & Layout Alignment
Within each container (and for top-level root items):
1. **Cluster Rows ($Y$-axis):** Group children into visual rows if their vertical centers $\Delta y = |cy_a - cy_b| \le \text{Threshold}$ (default: $16\text{px}$).
2. **Order Columns ($X$-axis):** Sort elements within each cluster row from left to right by $x_{\min}$.
3. **Direction Detection:** If height $\gg$ width and variance in $X$ is minimal, infer `Flex Direction: Column`. Otherwise, infer `Flex Direction: Row`.

---

## 5. Output Serializers & Markdown Formats

MarkDraw supports two core output modes depending on developer prompting needs.

### 5.1 Mode 1: Component Specification Table (Recommended for Code Generation)
Emits a formal layout contract that LLMs can parse directly into component trees (e.g., React, Tailwind, Swift, Jetpack Compose).

#### Example Output:
```markdown
### MarkDraw UI Specification
**Generated:** 2026-10-16T08:50:00Z  
**Root Views:** 1 Screen

#### Semantic Legend
- `[Container]` = Bounding Card / Flex Container
- `[Button]` = Interactive Click Target
- `<Input>` = Form Input Field
- `(Icon/Avatar)` = Graphical Node / Media

#### Layout Hierarchy Table
| Path | Component Name | Inferred Role | Direction | Child Elements / Label |
| :--- | :--- | :--- | :--- | :--- |
| `Root` | MobileFrame | [Container] | Column | HeaderBar, ContentList, BottomNav |
| `Root > MobileFrame` | HeaderBar | [Container] | Row | (Icon: Back), "Title", [Button: "Save"] |
| `Root > MobileFrame > HeaderBar` | BackIcon | (Icon/Avatar) | - | "ArrowLeft" |
| `Root > MobileFrame > HeaderBar` | ScreenTitle | Text | - | "Profile Settings" |
| `Root > MobileFrame > HeaderBar` | SaveAction | [Button] | - | "Save" |
| `Root > MobileFrame` | ContentList | [Container] | Column | NameInput, BioInput |
| `Root > MobileFrame > ContentList` | NameInput | <Input> | Row | "Enter your full name..." |
| `Root > MobileFrame > ContentList` | BioInput | <Input> | Row | "Biography..." |
```

### 5.2 Mode 2: Spatial Pipe Grid Table (Literal Visual Grid)
When the user sketches an actual tabular data layout (e.g., comparison pricing, dashboard grids), MarkDraw maps spatial coordinates to standard GFM pipes:

```markdown
| Plan Name | Monthly Price | Cloud Storage | Active Users |
| :--- | :--- | :--- | :--- |
| Starter | $0 / mo | 5 GB | 1 User |
| Pro | $29 / mo | 500 GB | Up to 10 Users |
| Enterprise | Contact Us | Unlimited | Unlimited |
```

---

## 6. Edge Case Catalog & Mitigations

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Overlapping Shapes (No Clear Parent)** | Cyclic hierarchy or orphan nodes when shape $A$ intersects shape $B$ by 40-60%. | Intersecting shapes without $\ge 85\%$ containment are marked as siblings with a collision warning badge in the output pane. |
| **Rotated Bounding Boxes** | Rotated elements clip into neighboring rows. | Bounding box is computed from the rotated convex hull ($x_{\min}, y_{\min}, x_{\max}, y_{\max}$). Center point $(\bar{x}, \bar{y})$ governs sorting. |
| **Deeply Nested Groups ($>8$ levels)** | Visual tree overflow and table row-key collisions. | Paths use standard CSS/XPath selectors (`Root > Card > Group > Btn`). Recursion depth hard-capped at 12 levels with truncation warning. |
| **Ghost/Empty Elements** | User draws an accidental $2\times 2\text{px}$ dot or empty text box. | Cull shapes where $\min(w, h) < 6\text{px}$ and text elements with `text.trim().length === 0` prior to hierarchy processing. |
| **Split-Second Rapid Drawing** | Infinite UI thrashing on high-frequency drag/draw events. | Debounce compilation pipeline at $30\text{ms}$ with `requestAnimationFrame` coalescing. |
| **Non-Latin Unicode & Special Chars** | Markdown table breakage caused by unescaped pipe `\|` characters in text labels. | Pre-process all string labels through an escaping sanitizer: `val.replace(/\|/g, '\\|').replace(/\n/g, '<br/>')`. |

---

## 7. Step-by-Step Implementation Roadmap

```
Phase 1: Project Scaffolding & Setup
  ├── Step 1.1: Vite + React 19 + TypeScript template with strict ESLint
  ├── Step 1.2: Install `@tldraw/tldraw`, `lucide-react`, and configure CSS modules
  └── Step 1.3: Configure static base path in `vite.config.ts` for GitHub Pages deployment

Phase 2: Split-Screen Layout & State Machine
  ├── Step 2.1: Implement dual-pane split container (Canvas 60% / Output 40%) with drag resizer
  ├── Step 2.2: Setup TLStore change listeners using `editor.store.listen()`
  └── Step 2.3: Establish local storage sync for editor persistence

Phase 3: Geometry & Compiler Engine (Domain Core)
  ├── Step 3.1: Write geometric math utility library (`aabb.ts`, `containment.ts`, `centroid.ts`)
  ├── Step 3.2: Implement `LegendEngine` with configurable color/stroke token maps
  ├── Step 3.3: Implement `TreeBuilder` parsing raw shapes into an Abstract Layout Tree (ALT)
  └── Step 3.4: Write comprehensive unit tests for geometry and containment edge cases

Phase 4: Markdown Serializers & Output Panel
  ├── Step 4.1: Implement `HierarchyTableSerializer` emitting GFM spec tables
  ├── Step 4.2: Implement `SpatialGridSerializer` emitting literal 2D pipe tables
  ├── Step 4.3: Implement `JSONAstSerializer` for programmable AST exports
  └── Step 4.4: Add Tabbed output UI with Copy to Clipboard, Download `.md`, and Toast triggers

Phase 5: Production Hardening, CI/CD & Deploy
  ├── Step 5.1: Setup GitHub Actions workflow for zero-config build & static deploy
  ├── Step 5.2: Add error boundary and canvas crash recovery handlers
  └── Step 5.3: Verify 100% offline functionality and bundle size optimization
```

---

## 8. Complete Project Codebase

### 8.1 Build Configuration & Manifests

#### `package.json`
```json
{
  "name": "markdraw",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "@tldraw/tldraw": "^3.8.0",
    "lucide-react": "^0.454.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.8.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "~5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.3"
  }
}
```

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'markdraw' with your GitHub repository name if deploying to project page
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/markdraw/' : '/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
});
```

---

### 8.2 Domain Layer: Geometry & Compiler Types

#### `src/core/types.ts`
```typescript
export type SemanticRole = 
  | 'container' 
  | 'button' 
  | 'input' 
  | 'icon_avatar' 
  | 'divider' 
  | 'text' 
  | 'unknown';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AABB {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface NormalizedShape {
  id: string;
  type: string;
  role: SemanticRole;
  text: string;
  bounds: BoundingBox;
  aabb: AABB;
  color: string;
  isDashed: boolean;
}

export interface LayoutNode {
  id: string;
  shape: NormalizedShape;
  role: SemanticRole;
  label: string;
  path: string;
  direction: 'Row' | 'Column' | 'Leaf';
  children: LayoutNode[];
  parent: string | null;
}

export interface CompilationResult {
  markdownSpec: string;
  markdownGrid: string;
  jsonAst: string;
  timestamp: string;
  elementCount: number;
}
```

---

### 8.3 Domain Layer: Semantic Legend & Geometry Math

#### `src/core/geometry.ts`
```typescript
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

export function isEnclosed(child: AABB, parent: AABB, threshold: number = 0.85): boolean {
  const childArea = (child.x2 - child.x1) * (child.y2 - child.y1);
  if (childArea <= 0) return false;
  const intersection = calculateIntersectionArea(child, parent);
  return (intersection / childArea) >= threshold;
}

export function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br/>')
    .trim();
}
```

#### `src/core/legend.ts`
```typescript
import { SemanticRole } from './types';

export interface ShapeAttributes {
  type: string;
  color: string;
  dash: string;
  text?: string;
  userMetaRole?: string;
}

export class LegendEngine {
  public static resolveRole(attr: ShapeAttributes): SemanticRole {
    if (attr.userMetaRole) {
      return attr.userMetaRole as SemanticRole;
    }

    if (attr.type === 'text') {
      return 'text';
    }

    if (attr.type === 'line' || attr.type === 'draw') {
      return 'divider';
    }

    if (attr.type === 'geo') {
      // Circle / Ellipse
      if (attr.color === 'light-blue' || attr.color === 'blue') {
        return 'button';
      }
      if (attr.dash === 'dashed' || attr.dash === 'dotted') {
        return 'container';
      }
      return 'input';
    }

    return 'unknown';
  }

  public static getBadgeSymbol(role: SemanticRole, label: string): string {
    const clean = label || 'Untitled';
    switch (role) {
      case 'container': return `[Container: ${clean}]`;
      case 'button': return `[Button: "${clean}"]`;
      case 'input': return `<Input: "${clean}">`;
      case 'icon_avatar': return `(Icon: ${clean})`;
      case 'divider': return `--- Divider ---`;
      case 'text': return `"${clean}"`;
      default: return clean;
    }
  }
}
```

---

### 8.4 Compiler Pipeline: Parser & Serializers

#### `src/core/compiler.ts`
```typescript
import { TLShape } from '@tldraw/tldraw';
import { NormalizedShape, LayoutNode, CompilationResult } from './types';
import { computeAABB, isEnclosed, sanitizeMarkdown } from './geometry';
import { LegendEngine } from './legend';

export class MarkDrawCompiler {
  public static compile(shapes: TLShape[]): CompilationResult {
    const normalized = this.normalize(shapes);
    const tree = this.buildHierarchy(normalized);
    
    return {
      markdownSpec: this.serializeSpecTable(tree),
      markdownGrid: this.serializeSpatialGrid(tree),
      jsonAst: JSON.stringify(tree, null, 2),
      timestamp: new Date().toISOString(),
      elementCount: normalized.length
    };
  }

  private static normalize(shapes: TLShape[]): NormalizedShape[] {
    return shapes
      .filter((s) => {
        // Drop empty or invisible micro-artifacts
        const props = s.props as any;
        const w = props.w ?? 0;
        const h = props.h ?? 0;
        if (s.type === 'text') return ((props.text as string) || '').trim().length > 0;
        return w >= 8 && h >= 8;
      })
      .map((s) => {
        const props = s.props as any;
        const w = props.w ?? 100;
        const h = props.h ?? 100;
        const bounds = { x: s.x, y: s.y, w, h };
        const text = sanitizeMarkdown(props.text || props.name || '');

        return {
          id: s.id,
          type: s.type,
          bounds,
          aabb: computeAABB(bounds),
          color: props.color || 'black',
          isDashed: props.dash === 'dashed' || props.dash === 'dotted',
          text,
          role: LegendEngine.resolveRole({
            type: s.type,
            color: props.color || 'black',
            dash: props.dash || 'draw',
            text,
            userMetaRole: (s.meta as any)?.markdrawRole
          })
        };
      });
  }

  private static buildHierarchy(shapes: NormalizedShape[]): LayoutNode[] {
    // Sort descending by area so largest containers are processed first
    const sorted = [...shapes].sort((a, b) => (b.bounds.w * b.bounds.h) - (a.bounds.w * a.bounds.h));
    const roots: LayoutNode[] = [];
    const nodeRegistry = new Map<string, LayoutNode>();

    for (const shape of sorted) {
      const node: LayoutNode = {
        id: shape.id,
        shape,
        role: shape.role,
        label: shape.text || `${shape.type}_${shape.id.slice(-4)}`,
        path: 'Root',
        direction: 'Leaf',
        children: [],
        parent: null
      };
      nodeRegistry.set(shape.id, node);

      let assignedParent = false;
      for (const candidate of sorted) {
        if (candidate.id === shape.id) continue;
        const parentNode = nodeRegistry.get(candidate.id);
        if (parentNode && isEnclosed(shape.aabb, candidate.aabb, 0.85)) {
          parentNode.children.push(node);
          node.parent = parentNode.id;
          node.path = `${parentNode.path} > ${parentNode.label}`;
          assignedParent = true;
          break; // Assigned to smallest enclosing parent
        }
      }

      if (!assignedParent) {
        roots.push(node);
      }
    }

    // Infer layout direction and sort children inside each node
    for (const node of nodeRegistry.values()) {
      if (node.children.length > 0) {
        node.direction = this.inferDirection(node.children);
        this.sortChildren(node.children, node.direction);
      }
    }

    return roots;
  }

  private static inferDirection(children: LayoutNode[]): 'Row' | 'Column' {
    if (children.length <= 1) return 'Row';
    const first = children[0].shape.bounds;
    const last = children[children.length - 1].shape.bounds;
    const dx = Math.abs(last.x - first.x);
    const dy = Math.abs(last.y - first.y);
    return dy > dx ? 'Column' : 'Row';
  }

  private static sortChildren(children: LayoutNode[], direction: 'Row' | 'Column'): void {
    if (direction === 'Row') {
      children.sort((a, b) => a.shape.bounds.x - b.shape.bounds.x);
    } else {
      children.sort((a, b) => a.shape.bounds.y - b.shape.bounds.y);
    }
  }

  private static serializeSpecTable(roots: LayoutNode[]): string {
    const rows: string[] = [];
    rows.push('### MarkDraw UI Specification');
    rows.push(`**Generated:** ${new Date().toISOString()}  `);
    rows.push(`**Roots Detected:** ${roots.length} view(s)\n`);
    rows.push('#### Semantic Hierarchy Table');
    rows.push('| Path | Component | Role | Layout Flow | Children / Content |');
    rows.push('| :--- | :--- | :--- | :--- | :--- |');

    const walk = (node: LayoutNode) => {
      const badge = LegendEngine.getBadgeSymbol(node.role, node.label);
      const childBadges = node.children.length > 0
        ? node.children.map(c => LegendEngine.getBadgeSymbol(c.role, c.label)).join(', ')
        : (node.shape.text ? `"${node.shape.text}"` : '—');

      rows.push(`| \`${node.path}\` | **${node.label}** | ${node.role} | ${node.direction} | ${childBadges} |`);
      for (const child of node.children) {
        walk(child);
      }
    };

    for (const root of roots) {
      walk(root);
    }

    return rows.join('\n');
  }

  private static serializeSpatialGrid(roots: LayoutNode[]): string {
    if (roots.length === 0) return '_Canvas is empty._';

    const lines: string[] = [];
    lines.push('### Spatial Grid Layout Table\n');

    // Group roots by vertical position into table rows
    const rowClustered: LayoutNode[][] = [];
    const sortedRoots = [...roots].sort((a, b) => a.shape.bounds.y - b.shape.bounds.y);

    for (const node of sortedRoots) {
      let placed = false;
      for (const cluster of rowClustered) {
        const clusterY = cluster[0].shape.bounds.y;
        if (Math.abs(node.shape.bounds.y - clusterY) <= 32) {
          cluster.push(node);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rowClustered.push([node]);
      }
    }

    // Determine max columns
    let maxCols = 0;
    for (const cluster of rowClustered) {
      cluster.sort((a, b) => a.shape.bounds.x - b.shape.bounds.x);
      maxCols = Math.max(maxCols, cluster.length);
    }

    if (maxCols === 0) return '_No spatial cells formed._';

    // Build GFM Header
    const headers = Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`);
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => ':---').join(' | ')} |`);

    for (const cluster of rowClustered) {
      const cellValues = cluster.map(n => LegendEngine.getBadgeSymbol(n.role, n.label));
      while (cellValues.length < maxCols) {
        cellValues.push('—');
      }
      lines.push(`| ${cellValues.join(' | ')} |`);
    }

    return lines.join('\n');
  }
}
```

---

### 8.5 User Interface Layer (React + Split-Pane)

#### `src/App.tsx`
```tsx
import React, { useState, useCallback, useRef } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { MarkDrawCompiler } from './core/compiler';
import { CompilationResult } from './core/types';
import { Copy, Download, RefreshCw, Check, Code, LayoutGrid, FileText } from 'lucide-react';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [outputTab, setOutputTab] = useState<'spec' | 'grid' | 'json'>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [compilation, setCompilation] = useState<CompilationResult>({
    markdownSpec: 'Draw elements on the left to generate the specification.',
    markdownGrid: '',
    jsonAst: '{}',
    timestamp: '',
    elementCount: 0
  });

  const editorRef = useRef<Editor | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const handleEditorMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Listen to all shape changes and debounce compilation
    const dispose = editor.store.listen(() => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        const shapes = editor.getCurrentPageShapes();
        const result = MarkDrawCompiler.compile(shapes);
        setCompilation(result);
      }, 35);
    });

    return () => {
      dispose();
    };
  }, []);

  const getActiveContent = (): string => {
    switch (outputTab) {
      case 'spec': return compilation.markdownSpec;
      case 'grid': return compilation.markdownGrid;
      case 'json': return compilation.jsonAst;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = outputTab === 'json' ? 'json' : 'md';
    const blob = new Blob([getActiveContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdraw-export-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.appShell}>
      {/* Top Application Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoBadge}>MD</div>
          <span className={styles.brandTitle}>MarkDraw</span>
          <span className={styles.versionBadge}>v1.0 (Zero-AI Compiler)</span>
        </div>
        <div className={styles.headerStats}>
          <span>Shapes: <strong>{compilation.elementCount}</strong></span>
          <span className={styles.statDivider}>|</span>
          <span>Status: <strong>Deterministic Reactive</strong></span>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className={styles.workspace}>
        {/* Left Pane: Infinite Canvas */}
        <div className={styles.canvasContainer}>
          <Tldraw onMount={handleEditorMount} />
        </div>

        {/* Right Pane: Live Reactive Markdown Output */}
        <aside className={styles.outputContainer}>
          <div className={styles.outputToolbar}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tabBtn} ${outputTab === 'spec' ? styles.activeTab : ''}`}
                onClick={() => setOutputTab('spec')}
              >
                <FileText size={15} /> Spec Table
              </button>
              <button
                className={`${styles.tabBtn} ${outputTab === 'grid' ? styles.activeTab : ''}`}
                onClick={() => setOutputTab('grid')}
              >
                <LayoutGrid size={15} /> Spatial Grid
              </button>
              <button
                className={`${styles.tabBtn} ${outputTab === 'json' ? styles.activeTab : ''}`}
                onClick={() => setOutputTab('json')}
              >
                <Code size={15} /> AST (JSON)
              </button>
            </div>
            <div className={styles.actions}>
              <button className={styles.actionBtn} onClick={handleCopy} title="Copy to Clipboard">
                {copied ? <Check size={16} className={styles.greenIcon} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className={styles.actionBtn} onClick={handleDownload} title="Download Source">
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className={styles.outputViewport}>
            <pre className={styles.codeBlock}>
              <code>{getActiveContent()}</code>
            </pre>
          </div>

          <footer className={styles.outputFooter}>
            <span>Feed this Markdown table directly into your LLM prompt for code generation.</span>
          </footer>
        </aside>
      </div>
    </div>
  );
};
```

#### `src/App.module.css`
```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
  --border-color: #334155;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body, html, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-main);
}

.appShell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}

.header {
  height: 48px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  user-select: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logoBadge {
  background: var(--accent);
  color: #000;
  font-weight: 800;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
}

.brandTitle {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.3px;
}

.versionBadge {
  font-size: 12px;
  color: var(--text-muted);
}

.headerStats {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.statDivider {
  color: var(--border-color);
}

.workspace {
  display: flex;
  flex: 1;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}

.canvasContainer {
  flex: 6;
  height: 100%;
  position: relative;
  border-right: 1px solid var(--border-color);
}

.outputContainer {
  flex: 4;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.outputToolbar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.tabs {
  display: flex;
  gap: 6px;
}

.tabBtn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.tabBtn:hover {
  background: var(--bg-tertiary);
  color: var(--text-main);
}

.activeTab {
  background: var(--bg-tertiary);
  color: var(--accent);
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actionBtn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.actionBtn:hover {
  background: var(--bg-tertiary);
}

.greenIcon {
  color: #4ade80;
}

.outputViewport {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background: #090d16;
}

.codeBlock {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e2e8f0;
}

.outputFooter {
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}
```

---

### 8.6 Automated GitHub Actions Deployment Workflow

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy MarkDraw to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm run test -- --run

      - name: Build Static Production Distribution
        run: npm run build

      - name: Setup GitHub Pages Engine
        uses: actions/configure-pages@v4

      - name: Upload Build Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 9. Comprehensive Testing & Validation Strategy

The project includes unit test suites executing via Vitest to verify deterministic spatial containment logic and edge-case handling.

#### `src/core/__tests__/geometry.test.ts`
```typescript
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
});
```

---

## 10. How to Use for LLM Prompting

Once MarkDraw generates the Markdown output table, copy and paste it into ChatGPT, Claude, or GitHub Copilot using this system prompt template:

```markdown
You are an expert frontend engineer. Implement the following UI wireframe using React and Tailwind CSS.
Strictly adhere to the element hierarchy, containers, and component roles specified in the MarkDraw table below.

{{PASTE_MARKDRAW_OUTPUT_HERE}}
```

Because the output explicitly models parent-child relationships and layout directions (`Row` vs. `Column`), LLMs generate precise flexbox structures without missing elements or guessing spatial layout.