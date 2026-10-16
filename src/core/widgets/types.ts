import { TLBaseShape } from '@tldraw/tldraw';

export type UIWidgetType =
  // Forms & Controls
  | 'button'
  | 'input'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'select'
  | 'slider'
  // Navigation
  | 'navbar'
  | 'sidebar'
  | 'tabs'
  | 'breadcrumb'
  | 'pagination'
  // Containers & Layout
  | 'card'
  | 'modal'
  | 'alert'
  | 'table'
  // Display & Media
  | 'avatar'
  | 'badge'
  | 'icon'
  | 'divider';

export type UIWidgetCategory = 'forms' | 'navigation' | 'containers' | 'display';

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
