import React from 'react';
import { UIWidgetProps } from './types';
import { WireframePreview } from './WireframePreview';

export interface WidgetPreviewProps {
  props: UIWidgetProps;
  width?: number;
  height?: number;
  isEditing?: boolean;
  onCommitEdit?: (val: string) => void;
  onCancelEdit?: () => void;
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = (previewProps) => {
  return <WireframePreview {...previewProps} />;
};
