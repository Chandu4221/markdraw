// src/annotation/legacyShapeUtil.ts
import { BaseBoxShapeUtil, Rectangle2d, T, TLBaseShape } from '@tldraw/tldraw';

export type LegacyWidgetShape = TLBaseShape<'ui-widget', {
  w: number;
  h: number;
  widgetType?: string;
  label?: string;
  variant?: string;
  placeholder?: string;
  checked?: boolean;
  options?: string;
  iconName?: string;
  subtext?: string;
  value?: number;
  showText?: boolean;
  altText?: string;
  behaviors?: string[];
  note?: string;
  parentId?: string;
  columns?: number;
  columnSplit?: string;
  isResponsive?: boolean;
  mobileStack?: string;
  tabletLayout?: string;
  mobileOrder?: number;
  hideOnMobile?: boolean;
}>;

/**
 * Lightweight transitional shape util that satisfies tldraw's store validation
 * for legacy v3 "ui-widget" shapes stored in IndexedDB or imported documents,
 * allowing the v4 migration engine in handleEditorMount to migrate them losslessly.
 */
export class LegacyWidgetShapeUtil extends BaseBoxShapeUtil<LegacyWidgetShape> {
  static override type = 'ui-widget' as const;

  static override props = {
    w: T.number,
    h: T.number,
    widgetType: T.optional(T.string),
    label: T.optional(T.string),
    variant: T.optional(T.string),
    placeholder: T.optional(T.string),
    checked: T.optional(T.boolean),
    options: T.optional(T.string),
    iconName: T.optional(T.string),
    subtext: T.optional(T.string),
    value: T.optional(T.number),
    showText: T.optional(T.boolean),
    altText: T.optional(T.string),
    behaviors: T.optional(T.arrayOf(T.string)),
    note: T.optional(T.string),
    parentId: T.optional(T.string),
    columns: T.optional(T.number),
    columnSplit: T.optional(T.string),
    isResponsive: T.optional(T.boolean),
    mobileStack: T.optional(T.string),
    tabletLayout: T.optional(T.string),
    mobileOrder: T.optional(T.number),
    hideOnMobile: T.optional(T.boolean)
  };

  override getDefaultProps(): LegacyWidgetShape['props'] {
    return {
      w: 100,
      h: 100,
      widgetType: 'card',
      label: ''
    };
  }

  override getGeometry(shape: LegacyWidgetShape) {
    const w = typeof shape.props.w === 'number' ? shape.props.w : 100;
    const h = typeof shape.props.h === 'number' ? shape.props.h : 100;
    return new Rectangle2d({
      width: Math.max(1, w),
      height: Math.max(1, h),
      isFilled: true
    });
  }

  override component() {
    return null;
  }

  override indicator() {
    return null;
  }
}
