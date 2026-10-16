import React, { useState, useEffect } from 'react';
import { Editor, TLShape } from '@tldraw/tldraw';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import styles from './PropsPanel.module.css';

interface PropsPanelProps {
  editor: Editor | null;
}

const COMMON_ICONS = [
  '',
  'Settings',
  'User',
  'Search',
  'Bell',
  'Mail',
  'Home',
  'Trash',
  'Check',
  'Plus',
  'Star',
  'Heart',
  'ArrowRight',
  'Menu',
  'X',
  'Edit',
  'Folder',
  'File',
  'Share',
  'Eye',
  'Calendar'
];

export const PropsPanel: React.FC<PropsPanelProps> = ({ editor }) => {
  const [selectedShape, setSelectedShape] = useState<TLShape | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const selected = editor.getSelectedShapes();
      if (selected.length === 1 && selected[0].type === 'ui-widget') {
        setSelectedShape(selected[0]);
      } else {
        setSelectedShape(null);
      }
    };

    updateSelection();

    const dispose = editor.store.listen(() => {
      updateSelection();
    });

    return () => {
      dispose();
    };
  }, [editor]);

  if (!editor || !selectedShape || selectedShape.type !== 'ui-widget') {
    return null;
  }

  const props = (selectedShape.props || {}) as Record<string, any>;
  const widgetType = props.widgetType || 'widget';

  const PAGE_RESOLUTIONS: Record<string, number> = {
    fullhd: 1920,
    hd: 1280,
    desktop: 1440,
    laptop: 1366,
    tablet: 768,
    mobile: 375
  };

  const updateProp = (key: string, val: any) => {
    const updatedProps: Record<string, any> = {
      ...selectedShape.props,
      [key]: val
    };

    if (key === 'variant' && widgetType === 'page') {
      const fixedWidth = PAGE_RESOLUTIONS[val];
      if (fixedWidth) {
        updatedProps.w = fixedWidth;
      }
    }

    editor.updateShape({
      id: selectedShape.id,
      type: 'ui-widget',
      props: updatedProps
    });
  };

  const getVariantOptions = () => {
    switch (widgetType) {
      case 'page':
        return ['fullhd', 'hd', 'desktop', 'laptop', 'tablet', 'mobile'];
      case 'button':
        return ['solid', 'ghost', 'dashed'];
      case 'heading':
        return ['h1', 'h2', 'h3'];
      case 'card':
        return ['outline', 'elevated', 'solid'];
      case 'banner':
        return ['info', 'warn', 'error', 'success'];
      case 'grid_gallery':
        return ['2x2', '3x2', '4x3'];
      case 'data_table':
        return ['3x3', '4x3', '5x4'];
      case 'divider':
        return ['solid', 'dashed'];
      case 'steps':
        return ['1-3', '1-4', '1-5'];
      case 'pagination':
        return ['1/5', '1/10', '1/20'];
      default:
        return ['default', 'solid', 'outline'];
    }
  };

  const isInput = ['input', 'search', 'password', 'textarea', 'date_picker', 'select'].includes(widgetType);
  const isToggleable = ['checkbox', 'radio', 'toggle'].includes(widgetType);
  const hasOptions = ['select', 'radio', 'tabs', 'navbar', 'menubar', 'breadcrumbs', 'footer_nav'].includes(widgetType);
  const hasValue = ['slider', 'progress_bar', 'stepper', 'list'].includes(widgetType);
  const hasSubtext = ['card', 'stat_kpi', 'hero', 'banner', 'empty_state'].includes(widgetType);
  const isParagraph = ['paragraph', 'blockquote'].includes(widgetType);
  const isMedia = ['image_frame', 'video_frame'].includes(widgetType);
  const canHaveIcon = ['button', 'icon', 'chip', 'banner', 'toast', 'input'].includes(widgetType);

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.headerTitle}>
          <Sliders size={13} strokeWidth={2} />
          <span className={styles.widgetBadge}>{widgetType}</span>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.panelBody}>
          {/* Label Field */}
          {widgetType !== 'divider' && widgetType !== 'spacer' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Label / Title</label>
              <input
                type="text"
                className={styles.input}
                value={props.label || ''}
                onChange={(e) => updateProp('label', e.target.value)}
                placeholder="Label..."
              />
            </div>
          )}

          {/* Placeholder for Inputs */}
          {isInput && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Placeholder</label>
              <input
                type="text"
                className={styles.input}
                value={props.placeholder || ''}
                onChange={(e) => updateProp('placeholder', e.target.value)}
                placeholder="Placeholder text..."
              />
            </div>
          )}

          {/* Variant Dropdown */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Variant</label>
            <select
              className={styles.select}
              value={props.variant || getVariantOptions()[0]}
              onChange={(e) => updateProp('variant', e.target.value)}
            >
              {getVariantOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Checked State */}
          {isToggleable && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={props.checked ?? false}
                  onChange={(e) => updateProp('checked', e.target.checked)}
                />
                <span>Active / Checked</span>
              </label>
            </div>
          )}

          {/* Comma-separated Options */}
          {hasOptions && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Options (comma-separated)</label>
              <input
                type="text"
                className={styles.input}
                value={props.options || ''}
                onChange={(e) => updateProp('options', e.target.value)}
                placeholder="e.g. Option A, Option B"
              />
            </div>
          )}

          {/* Numeric Value */}
          {hasValue && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Value</label>
              <input
                type="number"
                className={styles.input}
                value={props.value ?? 0}
                onChange={(e) => updateProp('value', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {/* Icon Selector */}
          {canHaveIcon && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Icon</label>
              <select
                className={styles.select}
                value={props.iconName || ''}
                onChange={(e) => updateProp('iconName', e.target.value)}
              >
                {COMMON_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon || 'None'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtext */}
          {hasSubtext && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Subtext</label>
              <input
                type="text"
                className={styles.input}
                value={props.subtext || ''}
                onChange={(e) => updateProp('subtext', e.target.value)}
                placeholder="Supporting text..."
              />
            </div>
          )}

          {/* Paragraph Line Glyphs vs Real Text toggle */}
          {isParagraph && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={props.showText ?? false}
                  onChange={(e) => updateProp('showText', e.target.checked)}
                />
                <span>Show text on canvas (disable glyphs)</span>
              </label>
            </div>
          )}

          {/* Alt Text for media */}
          {isMedia && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Alt / Filename</label>
              <input
                type="text"
                className={styles.input}
                value={props.altText || ''}
                onChange={(e) => updateProp('altText', e.target.value)}
                placeholder="hero-banner"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
