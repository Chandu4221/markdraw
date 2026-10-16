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
