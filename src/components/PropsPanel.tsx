import React, { useState, useEffect } from 'react';
import { Editor, TLShape } from '@tldraw/tldraw';
import { ChevronDown, ChevronUp, Sliders, StickyNote, Activity, Columns, Smartphone, LayoutGrid } from 'lucide-react';
import { getAllowedBehaviors } from '../core/widgets/widgetCatalog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface PropsPanelProps {
  editor: Editor | null;
  onOpenMobilePreview?: () => void;
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

export const PropsPanel: React.FC<PropsPanelProps> = ({ editor, onOpenMobilePreview }) => {
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
    const isMixed = values.some((v) => JSON.stringify(v) !== JSON.stringify(firstVal));
    return { isMixed, value: isMixed ? undefined : firstVal };
  };

  const updateProps = (patch: Record<string, any>) => {
    const updates = selectedShapes.map((shape) => {
      // Get the freshest shape from editor to avoid stale closure state
      const currentShape = editor.getShape(shape.id) || shape;
      const updatedProps: Record<string, any> = {
        ...currentShape.props,
        ...patch
      };

      if ('variant' in patch && (currentShape.props as any)?.widgetType === 'page') {
        const fixedWidth = PAGE_RESOLUTIONS[patch.variant];
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

  const updateProp = (key: string, val: any) => {
    updateProps({ [key]: val });
  };

  const handleSplitIntoColumns = () => {
    if (!editor || selectedShapes.length !== 1) return;
    const parentShape = selectedShapes[0];
    const p = (parentShape.props as any) || {};
    const cols = typeof p.columns === 'number' && p.columns > 1 ? p.columns : 2;
    const split = p.columnSplit || 'equal';
    const isResp = Boolean(p.isResponsive);
    const mobStack = p.mobileStack || 'stack';

    const parentBounds = editor.getShapePageBounds(parentShape);
    if (!parentBounds) return;

    const pad = 14;
    const gap = 12;
    const innerW = parentBounds.w - pad * 2;
    const innerH = Math.max(120, parentBounds.h - pad * 2 - (parentBounds.h > 60 ? 30 : 0));
    const startX = parentBounds.x + pad;
    const startY = parentBounds.y + (parentBounds.h > 60 ? 38 : pad);

    // Calculate column widths
    const colWidths: number[] = [];
    if (cols === 2) {
      if (split === '70/30') {
        const w1 = Math.round((innerW - gap) * 0.7);
        colWidths.push(w1, innerW - gap - w1);
      } else if (split === '30/70') {
        const w1 = Math.round((innerW - gap) * 0.3);
        colWidths.push(w1, innerW - gap - w1);
      } else {
        const w1 = Math.round((innerW - gap) / 2);
        colWidths.push(w1, w1);
      }
    } else if (cols === 3) {
      if (split === '25/50/25') {
        const w1 = Math.round((innerW - gap * 2) * 0.25);
        const w2 = Math.round((innerW - gap * 2) * 0.5);
        colWidths.push(w1, w2, innerW - gap * 2 - w1 - w2);
      } else {
        const w1 = Math.round((innerW - gap * 2) / 3);
        colWidths.push(w1, w1, innerW - gap * 2 - w1 * 2);
      }
    } else if (cols === 4) {
      const w1 = Math.round((innerW - gap * 3) / 4);
      colWidths.push(w1, w1, w1, innerW - gap * 3 - w1 * 3);
    }

    // Create column card shapes inside parent
    let curX = startX;
    const newShapes: any[] = [];
    const newShapeIds: any[] = [];

    colWidths.forEach((w, idx) => {
      const colNum = idx + 1;
      const order = mobStack === 'reverse' ? cols - idx : colNum;
      const shapeId = `shape:col-${Date.now()}-${colNum}` as any;
      newShapeIds.push(shapeId);
      newShapes.push({
        id: shapeId,
        type: 'ui-widget',
        x: curX,
        y: startY,
        props: {
          w,
          h: innerH,
          widgetType: 'card',
          label: `Column ${colNum}`,
          variant: 'outline',
          parentId: parentShape.id,
          mobileOrder: isResp ? order : undefined
        }
      });
      curX += w + gap;
    });

    editor.createShapes(newShapes);
    editor.setSelectedShapes(newShapeIds);
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
      case 'carousel':
        return ['contained', 'full-width'];
      default:
        return ['default', 'solid', 'outline'];
    }
  };

  const isInput = isSameType && ['input', 'search', 'password', 'textarea', 'date_picker', 'select'].includes(primaryWidgetType);
  const isToggleable = isSameType && ['checkbox', 'radio', 'toggle'].includes(primaryWidgetType);
  const hasOptions = isSameType && ['select', 'radio', 'tabs', 'navbar', 'menubar', 'breadcrumbs', 'footer_nav'].includes(primaryWidgetType);
  const hasValue = isSameType && ['slider', 'progress_bar', 'stepper', 'list'].includes(primaryWidgetType);
  const hasSubtext = isSameType && ['card', 'stat_kpi', 'hero', 'banner', 'empty_state', 'header', 'footer'].includes(primaryWidgetType);
  const isParagraph = isSameType && ['paragraph', 'blockquote'].includes(primaryWidgetType);
  const isMedia = isSameType && ['image_frame', 'video_frame'].includes(primaryWidgetType);
  const canHaveIcon = isSameType && ['button', 'icon', 'chip', 'banner', 'toast', 'input'].includes(primaryWidgetType);

  const allowedBehaviors = isSameType ? getAllowedBehaviors(primaryWidgetType) : [];

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
  const behaviorsStatus = getPropStatus('behaviors');
  const noteStatus = getPropStatus('note');
  const parentIdStatus = getPropStatus('parentId');

  const isContainer = isSameType && ['section', 'split_pane', 'card', 'hero', 'page', 'grid_gallery'].includes(primaryWidgetType);
  const columnsStatus = getPropStatus('columns');
  const columnSplitStatus = getPropStatus('columnSplit');
  const isResponsiveStatus = getPropStatus('isResponsive');
  const mobileStackStatus = getPropStatus('mobileStack');
  const tabletLayoutStatus = getPropStatus('tabletLayout');
  const mobileOrderStatus = getPropStatus('mobileOrder');
  const hideOnMobileStatus = getPropStatus('hideOnMobile');

  const candidateContainers = editor
    ? editor.getCurrentPageShapes().filter((s) => {
        if (s.type !== 'ui-widget') return false;
        if (selectedShapes.some((sel) => sel.id === s.id)) return false;
        const wType = (s.props as Record<string, unknown>)?.widgetType as string;
        return [
          'page',
          'section',
          'card',
          'hero',
          'header',
          'footer',
          'split_pane',
          'modal',
          'grid_gallery',
          'data_table',
          'table',
          'carousel',
          'tabs',
          'sidebar',
          'menubar'
        ].includes(wType);
      })
    : [];

  const activeBehaviors: string[] = Array.isArray(behaviorsStatus.value) ? behaviorsStatus.value : [];

  const handleToggleBehavior = (flag: string) => {
    let next: string[];
    if (activeBehaviors.includes(flag)) {
      next = activeBehaviors.filter((f) => f !== flag);
    } else {
      next = [...activeBehaviors, flag];
    }
    updateProp('behaviors', next);
  };

  return (
    <div
      className="absolute top-3 right-3 w-72 rounded-[var(--md-radius-md)] border border-[var(--md-border)] bg-[var(--md-surface)] shadow-[var(--md-shadow-lg)] z-30 overflow-hidden font-sans select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-9 px-3 border-b border-[var(--md-border)] flex items-center justify-between bg-[var(--md-surface)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders size={13} className="text-[var(--md-accent)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--md-text-bold)] truncate">
            {count === 1
              ? primaryWidgetType
              : isSameType
              ? `${count} × ${primaryWidgetType}s`
              : `${count} widgets selected`}
          </span>
        </div>
        <button
          className="p-1 rounded text-[var(--md-text-muted)] hover:text-[var(--md-text-bold)] hover:bg-[var(--md-surface-raised)] transition-colors cursor-pointer"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          aria-label={isCollapsed ? 'Expand Properties Panel' : 'Collapse Properties Panel'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Label Field */}
          {(!isSameType || (primaryWidgetType !== 'divider' && primaryWidgetType !== 'spacer')) && (
            <div className="space-y-1">
              <label htmlFor="props-label" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Label / Title</span>
                {labelStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-label"
                type="text"
                className="h-7 text-xs"
                value={labelStatus.isMixed ? '' : (labelStatus.value as string) || ''}
                onChange={(e) => updateProp('label', e.target.value)}
                placeholder={labelStatus.isMixed ? '— mixed —' : 'Label...'}
              />
            </div>
          )}

          {/* Parent Container (Explicit Binding) */}
          {count === 1 && (
            <div className="space-y-1">
              <label htmlFor="props-parent" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Parent Container</span>
                {parentIdStatus.value ? (
                  <span className="text-[10px] text-blue-500 font-medium">explicit</span>
                ) : (
                  <span className="text-[10px] text-[var(--md-text-subtle)]">auto (geometric)</span>
                )}
              </label>
              <select
                id="props-parent"
                className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
                value={(parentIdStatus.value as string) || ''}
                onChange={(e) => updateProp('parentId', e.target.value || undefined)}
              >
                <option value="">Auto (Geometric enclosure)</option>
                {candidateContainers.map((container) => {
                  const p = (container.props as Record<string, unknown>) || {};
                  const label = (p.label as string) || (p.widgetType as string) || container.id.slice(-4);
                  return (
                    <option key={container.id} value={container.id}>
                      {String(p.widgetType)}: {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Placeholder for Inputs */}
          {isInput && (
            <div className="space-y-1">
              <label htmlFor="props-placeholder" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Placeholder</span>
                {placeholderStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-placeholder"
                type="text"
                className="h-7 text-xs"
                value={placeholderStatus.isMixed ? '' : (placeholderStatus.value as string) || ''}
                onChange={(e) => updateProp('placeholder', e.target.value)}
                placeholder={placeholderStatus.isMixed ? '— mixed —' : 'Placeholder text...'}
              />
            </div>
          )}

          {/* Variant Select */}
          {isSameType && (
            <div className="space-y-1">
              <label htmlFor="props-variant" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Variant</span>
                {variantStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <select
                id="props-variant"
                className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
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

          {/* Checked State */}
          {isToggleable && (
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="props-checked" className="text-xs text-[var(--md-text)] cursor-pointer">
                Active / Checked {checkedStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Switch
                id="props-checked"
                checked={(checkedStatus.value as boolean) ?? false}
                onCheckedChange={(checked) => updateProp('checked', checked)}
                aria-label="Active or Checked state"
              />
            </div>
          )}

          {/* Options */}
          {hasOptions && (
            <div className="space-y-1">
              <label htmlFor="props-options" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Options (comma-separated)</span>
                {optionsStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-options"
                type="text"
                className="h-7 text-xs"
                value={optionsStatus.isMixed ? '' : (optionsStatus.value as string) || ''}
                onChange={(e) => updateProp('options', e.target.value)}
                placeholder={optionsStatus.isMixed ? '— mixed —' : 'e.g. Option A, Option B'}
              />
            </div>
          )}

          {/* Value */}
          {hasValue && (
            <div className="space-y-1">
              <label htmlFor="props-value" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Value</span>
                {valueStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-value"
                type="number"
                className="h-7 text-xs font-mono"
                value={valueStatus.isMixed ? '' : (valueStatus.value as number) ?? 0}
                onChange={(e) => updateProp('value', parseFloat(e.target.value) || 0)}
                placeholder={valueStatus.isMixed ? '— mixed —' : '0'}
              />
            </div>
          )}

          {/* Subtext */}
          {hasSubtext && (
            <div className="space-y-1">
              <label htmlFor="props-subtext" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Subtext</span>
                {subtextStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-subtext"
                type="text"
                className="h-7 text-xs"
                value={subtextStatus.isMixed ? '' : (subtextStatus.value as string) || ''}
                onChange={(e) => updateProp('subtext', e.target.value)}
                placeholder={subtextStatus.isMixed ? '— mixed —' : 'Supporting subtext...'}
              />
            </div>
          )}

          {/* Icon Selector */}
          {canHaveIcon && (
            <div className="space-y-1">
              <label htmlFor="props-icon" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Icon</span>
                {iconStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <select
                id="props-icon"
                className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
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

          {/* Alt Text */}
          {isMedia && (
            <div className="space-y-1">
              <label htmlFor="props-alt-text" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                <span>Alt / Filename</span>
                {altTextStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </label>
              <Input
                id="props-alt-text"
                type="text"
                className="h-7 text-xs"
                value={altTextStatus.isMixed ? '' : (altTextStatus.value as string) || ''}
                onChange={(e) => updateProp('altText', e.target.value)}
                placeholder={altTextStatus.isMixed ? '— mixed —' : 'hero-banner'}
              />
            </div>
          )}

          {/* Paragraph glyph toggle */}
          {isParagraph && (
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="props-show-text" className="text-xs text-[var(--md-text)] cursor-pointer">
                Show canvas text (no glyphs)
              </label>
              <Switch
                id="props-show-text"
                checked={(showTextStatus.value as boolean) ?? false}
                onCheckedChange={(checked) => updateProp('showText', checked)}
                aria-label="Show canvas text"
              />
            </div>
          )}

          {/* Part: Column Splitting & Responsive Layout (Containers) */}
          {isContainer && (
            <div className="pt-2 border-t border-[var(--md-border)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Columns size={12} className="text-blue-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                    Columns
                  </span>
                </div>
                {columnsStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((num) => {
                  const currentVal = typeof columnsStatus.value === 'number' ? columnsStatus.value : 1;
                  const isSelected = currentVal === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${num} ${num === 1 ? 'Column' : 'Columns'}`}
                      className={`flex-1 py-1 text-xs font-medium rounded-[4px] border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                          : 'border-[var(--md-border)] bg-[var(--md-surface)] text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => {
                        if (num === 1) {
                          updateProps({
                            columns: undefined,
                            columnSplit: undefined
                          });
                        } else {
                          updateProps({
                            columns: num,
                            columnSplit: (columnSplitStatus.value as string) || 'equal'
                          });
                        }
                      }}
                    >
                      {num} {num === 1 ? 'Col' : 'Cols'}
                    </button>
                  );
                })}
              </div>

              {((columnsStatus.value as number) || 1) > 1 && (
                <>
                  <div className="space-y-1 pt-1">
                    <label htmlFor="props-column-split" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                      <span>Split Ratio</span>
                    </label>
                    <select
                      id="props-column-split"
                      className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
                      value={(columnSplitStatus.value as string) || 'equal'}
                      onChange={(e) => updateProp('columnSplit', e.target.value)}
                    >
                      {(columnsStatus.value as number) === 2 && (
                        <>
                          <option value="equal">50 / 50 (Equal)</option>
                          <option value="70/30">70 / 30 (Main + Sidebar)</option>
                          <option value="30/70">30 / 70 (Sidebar + Main)</option>
                        </>
                      )}
                      {(columnsStatus.value as number) === 3 && (
                        <>
                          <option value="equal">Equal (1/3 each)</option>
                          <option value="25/50/25">25 / 50 / 25 (Holy Grail)</option>
                        </>
                      )}
                      {(columnsStatus.value as number) === 4 && (
                        <option value="equal">Equal (1/4 each)</option>
                      )}
                    </select>
                  </div>

                  {/* Split into individual column cards button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSplitIntoColumns}
                      className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold rounded-[4px] border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer shadow-xs"
                      title="Create individual column card shapes on canvas"
                    >
                      <LayoutGrid size={12} />
                      <span>Split into {(columnsStatus.value as number)} Column Cards</span>
                    </button>
                  </div>
                </>
              )}

              {/* Make it Responsive Switch */}
              <div className="pt-1.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="props-is-responsive" className="text-xs text-[var(--md-text)] flex items-center gap-1.5 cursor-pointer font-medium">
                    <Smartphone size={12} className="text-purple-500" />
                    <span>Make it Responsive</span>
                  </label>
                  <Switch
                    id="props-is-responsive"
                    checked={(isResponsiveStatus.value as boolean) ?? false}
                    onCheckedChange={(checked) => {
                      updateProps({
                        isResponsive: checked ? true : undefined,
                        mobileStack: checked ? ((mobileStackStatus.value as string) || 'stack') : undefined
                      });
                    }}
                    aria-label="Make it Responsive"
                  />
                </div>

                {Boolean(isResponsiveStatus.value) && (
                  <div className="pl-2 border-l-2 border-purple-500/40 space-y-2 pt-1">
                    <div className="space-y-1">
                      <label htmlFor="props-mobile-stack" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                        <span>Mobile Stacking</span>
                      </label>
                      <select
                        id="props-mobile-stack"
                        className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
                        value={(mobileStackStatus.value as string) || 'stack'}
                        onChange={(e) => updateProp('mobileStack', e.target.value)}
                      >
                        <option value="stack">Normal (Top to Bottom / Left to Right)</option>
                        <option value="reverse">Reverse (Right/Bottom First)</option>
                        <option value="scroll">Horizontal Swipe Scroll</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="props-tablet-layout" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                        <span>Tablet Mode</span>
                      </label>
                      <select
                        id="props-tablet-layout"
                        className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
                        value={(tabletLayoutStatus.value as string) || 'maintain'}
                        onChange={(e) => updateProp('tabletLayout', e.target.value === 'maintain' ? undefined : e.target.value)}
                      >
                        <option value="maintain">Maintain layout</option>
                        <option value="stack">Stack to 1-col</option>
                        <option value="2-col">2-column grid</option>
                      </select>
                    </div>

                    {onOpenMobilePreview && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={onOpenMobilePreview}
                          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold rounded-[4px] border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer shadow-xs"
                        >
                          <Smartphone size={12} />
                          <span>Live Mobile Preview</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Part: Child Responsive Overrides (only for non-container widgets or child columns) */}
          {!isContainer && (
            <div className="pt-2 border-t border-[var(--md-border)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={12} className="text-purple-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                    Responsive Overrides
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="props-mobile-order" className="text-[11px] font-medium text-[var(--md-text-muted)] flex items-center justify-between">
                  <span>Mobile Stacking Order</span>
                  {mobileOrderStatus.isMixed && <span className="text-[10px] text-[var(--md-text-subtle)]">(mixed)</span>}
                </label>
                <select
                  id="props-mobile-order"
                  className="h-7 w-full rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] px-2 text-xs text-[var(--md-text)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] cursor-pointer"
                  value={mobileOrderStatus.value !== undefined ? String(mobileOrderStatus.value) : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    updateProp('mobileOrder', val);
                  }}
                >
                  <option value="">Auto (DOM flow order)</option>
                  <option value="1">1st (Top on mobile)</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                  <option value="99">Last (Bottom on mobile)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label htmlFor="props-hide-on-mobile" className="text-xs text-[var(--md-text)] cursor-pointer">
                  Hide on mobile (sm:hidden)
                </label>
                <Switch
                  id="props-hide-on-mobile"
                  checked={(hideOnMobileStatus.value as boolean) ?? false}
                  onCheckedChange={(checked) => updateProp('hideOnMobile', checked ? true : undefined)}
                  aria-label="Hide on mobile"
                />
              </div>
            </div>
          )}

          {/* Part B: Behavior Flags Multi-Checkbox Group */}
          {allowedBehaviors.length > 0 && (
            <div className="pt-2 border-t border-[var(--md-border)] space-y-2">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-blue-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                  Behaviors
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowedBehaviors.map((flag) => {
                  const isActive = activeBehaviors.includes(flag);
                  return (
                    <button
                      key={flag}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`Toggle behavior: ${flag}`}
                      className={`px-2 py-0.5 text-[11px] rounded-[4px] border font-medium transition-colors cursor-pointer select-none ${
                        isActive
                          ? 'border-blue-500 bg-blue-500/15 text-blue-500 dark:text-blue-400 font-semibold shadow-xs'
                          : 'border-[var(--md-border)] bg-[var(--md-surface)] text-[var(--md-text-muted)] hover:bg-[var(--md-surface-raised)] hover:text-[var(--md-text)]'
                      }`}
                      onClick={() => handleToggleBehavior(flag)}
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part C.4: Note (Free-text style hint) */}
          <div className="pt-2 border-t border-[var(--md-border)] space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="props-note" className="flex items-center gap-1.5 cursor-pointer">
                <StickyNote size={12} className="text-[var(--md-text-muted)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-text-muted)]">
                  Style Note
                </span>
              </label>
              <span className="text-[10px] text-[var(--md-text-subtle)]">non-binding</span>
            </div>
            <textarea
              id="props-note"
              className="w-full h-14 p-2 rounded-[var(--md-radius-sm)] border border-[var(--md-border)] bg-[var(--md-surface)] text-xs text-[var(--md-text)] placeholder:text-[var(--md-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--md-accent)] resize-none transition-colors"
              placeholder={noteStatus.isMixed ? '— mixed —' : 'e.g. skeleton loading state on mount...'}
              value={noteStatus.isMixed ? '' : (noteStatus.value as string) || ''}
              onChange={(e) => updateProp('note', e.target.value)}
              aria-label="Style note"
            />
          </div>
        </div>
      )}
    </div>
  );
};
