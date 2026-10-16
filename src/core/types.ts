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
  widgetType?: string;
  widgetProps?: Record<string, any>;
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
  widgetType?: string;
  widgetProps?: Record<string, any>;
}

export interface CompilationResult {
  markdownSpec: string;
  markdownGrid: string;
  jsonAst: string;
  timestamp: string;
  elementCount: number;
}
