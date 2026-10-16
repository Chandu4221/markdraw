import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, T } from '@tldraw/tldraw';
import { IUIWidgetShape } from './types';
import { WidgetPreview } from './WidgetPreview';

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
    value: T.number
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
      value: 0
    };
  }

  override indicator(shape: IUIWidgetShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={6} ry={6} />;
  }

  override component(shape: IUIWidgetShape) {
    const handleWidgetClick = (e: React.MouseEvent) => {
      // Interactive toggles for checkbox, toggle, stepper
      if (shape.props.widgetType === 'checkbox' || shape.props.widgetType === 'toggle') {
        e.stopPropagation();
        this.editor.updateShape({
          id: shape.id,
          type: 'ui-widget',
          props: { checked: !shape.props.checked }
        });
      }
    };

    return (
      <HTMLContainer
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          cursor: 'default'
        }}
        onClick={handleWidgetClick}
      >
        <WidgetPreview props={shape.props} />
      </HTMLContainer>
    );
  }
}
