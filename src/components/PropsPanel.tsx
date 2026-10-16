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

const PAGE_RESOLUTIONS: Record<string, number> = {
  fullhd: 1920,
  hd: 1280,
  desktop: 1440,
  laptop: 1366,
  tablet: 768,
  mobile: 375
};

export const PropsPanel: React.FC<PropsPanelProps> = ({ editor }) => {
  const [selectedShapes, setSelectedShapes] = useState<TLShape[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const selected = editor.getSelectedShapes().filter((s) => s.type === 'ui-widget');
      setSelectedShapes(selected);
    };

    updateSelection();

    const dispose = editor.store.listen(() => {
      updateSelection();
    });

    return () => {
      dispose();
    };
  }, [editor]);

  if (!editor || selectedShapes.length === 0) {
    return null;
  }

  const count = selectedShapes.length;
  const types = Array.from(
    new Set(selectedShapes.map((s) => ((s.props as any)?.widgetType as string) || 'widget'))
  );
  const isSameType = types.length === 1;
  const primaryWidgetType = types[0];

  const getPropStatus = (key: string) => {
    const values = selectedShapes.map((s) => (s.props as any)?.[key]);
    const firstVal = values[0];
    const isMixed = values.some((v) => v !== firstVal);
    return { isMixed, value: isMixed ? undefined : firstVal };
  };

  const updateProp = (key: string, val: any) => {
    const updates = selectedShapes.map((shape) => {
      const updatedProps: Record<string, any> = {
        ...shape.props,
        [key]: val
      };

      if (key === 'variant' && (shape.props as any)?.widgetType === 'page') {
        const fixedWidth = PAGE_RESOLUTIONS[val];
        if (fixedWidth) {
          updatedProps.w = fixedWidth;
        }
      }

      return {
        id: shape.id,
        type: 'ui-widget' as const,
        props: updatedProps
      };
    });

    editor.updateShapes(updates);
  };

  const getVariantOptions = () => {
    switch (primaryWidgetType) {
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

  const isInput = isSameType && ['input', 'search', 'password', 'textarea', 'date_picker', 'select'].includes(primaryWidgetType);
  const isToggleable = isSameType && ['checkbox', 'radio', 'toggle'].includes(primaryWidgetType);
  const hasOptions = isSameType && ['select', 'radio', 'tabs', 'navbar', 'menubar', 'breadcrumbs', 'footer_nav'].includes(primaryWidgetType);
  const hasValue = isSameType && ['slider', 'progress_bar', 'stepper', 'list'].includes(primaryWidgetType);
  const hasSubtext = isSameType && ['card', 'stat_kpi', 'hero', 'banner', 'empty_state'].includes(primaryWidgetType);
  const isParagraph = isSameType && ['paragraph', 'blockquote'].includes(primaryWidgetType);
  const isMedia = isSameType && ['image_frame', 'video_frame'].includes(primaryWidgetType);
  const canHaveIcon = isSameType && ['button', 'icon', 'chip', 'banner', 'toast', 'input'].includes(primaryWidgetType);

  const labelStatus = getPropStatus('label');
  const variantStatus = getPropStatus('variant');
  const checkedStatus = getPropStatus('checked');
  const showTextStatus = getPropStatus('showText');
  const placeholderStatus = getPropStatus('placeholder');
  const iconStatus = getPropStatus('iconName');
  const subtextStatus = getPropStatus('subtext');
  const valueStatus = getPropStatus('value');
  const optionsStatus = getPropStatus('options');
  const altTextStatus = getPropStatus('altText');

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.headerTitle}>
          <Sliders size={13} strokeWidth={1.5} />
          <span className={styles.widgetBadge}>
            {count === 1
              ? primaryWidgetType
              : isSameType
              ? `${count} × ${primaryWidgetType}s`
              : `${count} widgets selected`}
          </span>
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
          {(!isSameType || (primaryWidgetType !== 'divider' && primaryWidgetType !== 'spacer')) && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Label / Title {labelStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                value={labelStatus.isMixed ? '' : (labelStatus.value as string) || ''}
                onChange={(e) => updateProp('label', e.target.value)}
                placeholder={labelStatus.isMixed ? '— mixed —' : 'Label...'}
              />
            </div>
          )}

          {/* Placeholder for Inputs (Same Type) */}
          {isInput && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Placeholder {placeholderStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                value={placeholderStatus.isMixed ? '' : (placeholderStatus.value as string) || ''}
                onChange={(e) => updateProp('placeholder', e.target.value)}
                placeholder={placeholderStatus.isMixed ? '— mixed —' : 'Placeholder text...'}
              />
            </div>
          )}

          {/* Variant Dropdown (Same Type) */}
          {isSameType && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Variant {variantStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <select
                className={styles.select}
                value={variantStatus.isMixed ? '' : (variantStatus.value as string) || getVariantOptions()[0]}
                onChange={(e) => updateProp('variant', e.target.value)}
              >
                {variantStatus.isMixed && (
                  <option value="" disabled hidden>
                    — mixed —
                  </option>
                )}
                {getVariantOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Checked State (Same Type) */}
          {isToggleable && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={(checkedStatus.value as boolean) ?? false}
                  onChange={(e) => updateProp('checked', e.target.checked)}
                />
                <span>Active / Checked {checkedStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}</span>
              </label>
            </div>
          )}

          {/* Comma-separated Options (Same Type) */}
          {hasOptions && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Options (comma-separated) {optionsStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                value={optionsStatus.isMixed ? '' : (optionsStatus.value as string) || ''}
                onChange={(e) => updateProp('options', e.target.value)}
                placeholder={optionsStatus.isMixed ? '— mixed —' : 'e.g. Option A, Option B'}
              />
            </div>
          )}

          {/* Numeric Value (Same Type) */}
          {hasValue && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Value {valueStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="number"
                className={styles.input}
                value={valueStatus.isMixed ? '' : (valueStatus.value as number) ?? 0}
                onChange={(e) => updateProp('value', parseFloat(e.target.value) || 0)}
                placeholder={valueStatus.isMixed ? '— mixed —' : '0'}
              />
            </div>
          )}

          {/* Icon Selector (Same Type) */}
          {canHaveIcon && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Icon {iconStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <select
                className={styles.select}
                value={iconStatus.isMixed ? '' : (iconStatus.value as string) || ''}
                onChange={(e) => updateProp('iconName', e.target.value)}
              >
                {iconStatus.isMixed && (
                  <option value="" disabled hidden>
                    — mixed —
                  </option>
                )}
                {COMMON_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon || 'None'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtext (Same Type) */}
          {hasSubtext && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Subtext {subtextStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                value={subtextStatus.isMixed ? '' : (subtextStatus.value as string) || ''}
                onChange={(e) => updateProp('subtext', e.target.value)}
                placeholder={subtextStatus.isMixed ? '— mixed —' : 'Supporting text...'}
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
                  checked={(showTextStatus.value as boolean) ?? false}
                  onChange={(e) => updateProp('showText', e.target.checked)}
                />
                <span>Show text on canvas (disable glyphs)</span>
              </label>
            </div>
          )}

          {/* Alt Text for media */}
          {isMedia && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Alt / Filename {altTextStatus.isMixed && <span style={{ opacity: 0.6 }}>(mixed)</span>}
              </label>
              <input
                type="text"
                className={styles.input}
                value={altTextStatus.isMixed ? '' : (altTextStatus.value as string) || ''}
                onChange={(e) => updateProp('altText', e.target.value)}
                placeholder={altTextStatus.isMixed ? '— mixed —' : 'hero-banner'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
