import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, T, resizeBox } from '@tldraw/tldraw';
import { IUIWidgetShape } from './types';
import { WireframePreview } from './WireframePreview';
import { getCatalogItem } from './widgetCatalog';

export class UIWidgetShapeUtil extends BaseBoxShapeUtil<IUIWidgetShape> {
  static override type = 'ui-widget' as const;

  static override props = {
    w: T.number,
    h: T.number,
    widgetType: T.string as any,
    label: T.string,
    variant: T.string,
    placeholder: T.string,
    checked: T.boolean,
    options: T.string,
    iconName: T.string,
    subtext: T.string,
    value: T.number,
    showText: T.optional(T.boolean),
    altText: T.optional(T.string),
    behaviors: T.optional(T.arrayOf(T.string)),
    note: T.optional(T.string),
    parentId: T.optional(T.string),
    columns: T.optional(T.number),
    columnSplit: T.optional(T.string),
    isResponsive: T.optional(T.boolean),
    mobileStack: T.optional(T.string as any),
    tabletLayout: T.optional(T.string as any),
    mobileOrder: T.optional(T.number),
    hideOnMobile: T.optional(T.boolean)
  };

  override getDefaultProps(): IUIWidgetShape['props'] {
    return {
      w: 160,
      h: 40,
      widgetType: 'button',
      label: 'Button',
      variant: 'solid',
      placeholder: '',
      checked: false,
      options: '',
      iconName: '',
      subtext: '',
      value: 0,
      showText: false,
      altText: '',
      behaviors: [],
      note: '',
      parentId: undefined,
      columns: undefined,
      columnSplit: undefined,
      isResponsive: undefined,
      mobileStack: undefined,
      tabletLayout: undefined,
      mobileOrder: undefined,
      hideOnMobile: undefined
    };
  }

  override canEdit(_shape: IUIWidgetShape): boolean {
    return true;
  }

  override canEditInReadonly(_shape: IUIWidgetShape): boolean {
    return false;
  }

  override onResize(shape: any, info: any) {
    if (shape.props.widgetType === 'page') {
      const fixedWidth = shape.props.w;
      const res = resizeBox(shape, info, {
        minWidth: fixedWidth,
        maxWidth: fixedWidth,
        minHeight: 150
      });
      return {
        ...res,
        x: info.initialShape.x,
        props: {
          ...res.props,
          w: fixedWidth
        }
      };
    }
    return super.onResize(shape, info);
  }

  override indicator(shape: IUIWidgetShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={6} ry={6} />;
  }

  override component(shape: IUIWidgetShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    const handleCommitEdit = (newText: string) => {
      const type = shape.props.widgetType;
      const isInputType = ['input', 'search', 'password', 'textarea', 'date_picker'].includes(type);
      const propKey = isInputType ? 'placeholder' : 'label';

      this.editor.updateShape({
        id: shape.id,
        type: 'ui-widget',
        props: { [propKey]: newText }
      });
      this.editor.setEditingShape(null);
    };

    const handleCancelEdit = () => {
      this.editor.setEditingShape(null);
    };

    const handleWidgetClick = (e: React.MouseEvent) => {
      if (isEditing) return;

      // Interactive toggles for checkbox, toggle
      if (shape.props.widgetType === 'checkbox' || shape.props.widgetType === 'toggle') {
        e.stopPropagation();
        this.editor.updateShape({
          id: shape.id,
          type: 'ui-widget',
          props: { checked: !shape.props.checked }
        });
      }
    };

    const item = getCatalogItem(shape.props.widgetType);
    const name = item?.name || shape.props.widgetType;
    const tag = item?.category || 'widget';
    const variant = shape.props.variant || 'solid';
    const tooltipText = `${name} — [${tag}] — variant: ${variant}`;

    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          cursor: isEditing ? 'text' : 'default'
        }}
        onClick={handleWidgetClick}
        title={isEditing ? undefined : tooltipText}
      >
        <WireframePreview
          props={shape.props}
          isEditing={isEditing}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
          width={shape.props.w}
          height={shape.props.h}
          shapeId={shape.id}
        />
      </HTMLContainer>
    );
  }
}
