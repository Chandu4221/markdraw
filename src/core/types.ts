import { TLBaseShape } from '@tldraw/tldraw';

export type UIWidgetCategory =
  | 'layout'
  | 'content'
  | 'forms'
  | 'navigation'
  | 'feedback'
  | 'media';

export type UIWidgetType =
  // Layout & Structural Containers
  | 'section'
  | 'card'
  | 'hero'
  | 'header'
  | 'footer'
  | 'grid_gallery'
  | 'split_pane'
  | 'modal'
  | 'page'

  // Forms & Inputs
  | 'button'
  | 'input'
  | 'search'
  | 'password'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'select'
  | 'slider'
  | 'file_upload'
  | 'date_picker'
  | 'stepper'
  | 'color_swatch'

  // Navigation
  | 'navbar'
  | 'menubar'
  | 'sidebar'
  | 'tabs'
  | 'breadcrumbs'
  | 'pagination'
  | 'footer_nav'
  | 'link'
  | 'chip'
  | 'steps'

  // Content
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'data_table'
  | 'blockquote'
  | 'code_block'
  | 'divider'
  | 'spacer'
  | 'image_frame'
  | 'video_frame'
  | 'stat_kpi'

  // Feedback
  | 'progress_bar'
  | 'skeleton'
  | 'tooltip'
  | 'toast'
  | 'empty_state'
  | 'banner'

  // Media
  | 'avatar'
  | 'avatar_group'
  | 'thumbnail_strip'
  | 'badge'
  | 'icon';

export interface UIWidgetProps {
  w: number;
  h: number;
  widgetType: UIWidgetType;
  label: string;
  variant: string;
  placeholder: string;
  checked: boolean;
  options: string;
  iconName: string;
  subtext: string;
  value: number;
  showText?: boolean;
  altText?: string;
}

export type IUIWidgetShape = TLBaseShape<'ui-widget', UIWidgetProps>;

export interface WidgetCatalogItem {
  type: UIWidgetType;
  category: UIWidgetCategory;
  name: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps: Partial<UIWidgetProps>;
  icon: string;
}

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

export interface CompilationOptions {
  containmentThreshold?: number; // default 0.85
  rowClusterThreshold?: number;  // default 16
  gridBandThreshold?: number;    // default 32
  sizeBucketTolerance?: number;  // default 2 (±2% tolerance)
  alignTolerance?: number;       // default 3 (±3% tolerance)
  includeTimestamp?: boolean;    // default false (for determinism)
  includeLegend?: boolean;       // default true
  pageNote?: string;             // page-level note in document header
}

export interface CompilationResult {
  markdownSpec: string;
  markdownGrid: string;
  markdownAscii: string;
  jsonAst: string;
  timestamp: string;
  elementCount: number;
}
