import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, T } from '@tldraw/tldraw';
import { IUIWidgetShape } from './types';
import {
  Check,
  ChevronDown,
  ArrowRight,
  Bell,
  Search,
  User,
  AlertCircle,
  Menu,
  Sparkles
} from 'lucide-react';

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
      variant: 'primary',
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
    const { w, h, widgetType, label, variant, placeholder, checked, options, subtext, value } = shape.props;

    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      userSelect: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    switch (widgetType) {
      case 'button': {
        const isPrimary = variant === 'primary' || !variant;
        const isDanger = variant === 'danger';
        const isOutline = variant === 'outline';

        return (
          <HTMLContainer style={{ ...baseStyle, pointerEvents: 'all' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 6,
                padding: '0 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                background: isPrimary ? '#2563eb' : isDanger ? '#dc2626' : isOutline ? 'transparent' : '#334155',
                color: '#ffffff',
                border: isOutline ? '1.5px solid #64748b' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              <span>{label || 'Button'}</span>
              {shape.props.iconName && <ArrowRight size={14} />}
            </div>
          </HTMLContainer>
        );
      }

      case 'input': {
        return (
          <HTMLContainer style={{ ...baseStyle, flexDirection: 'column', justifyContent: 'center' }}>
            {label && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                {label}
              </span>
            )}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderRadius: 6,
                color: '#f8fafc',
                fontSize: 13,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              <span style={{ color: '#64748b' }}>{placeholder || 'Enter text...'}</span>
            </div>
          </HTMLContainer>
        );
      }

      case 'textarea': {
        return (
          <HTMLContainer style={{ ...baseStyle, flexDirection: 'column' }}>
            {label && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                {label}
              </span>
            )}
            <div
              style={{
                flex: 1,
                padding: 10,
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderRadius: 6,
                color: '#64748b',
                fontSize: 12,
                lineHeight: 1.4
              }}
            >
              {placeholder || 'Enter multiline text...'}
            </div>
          </HTMLContainer>
        );
      }

      case 'checkbox': {
        return (
          <HTMLContainer style={{ ...baseStyle, pointerEvents: 'all', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => {
                this.editor.updateShape({
                  id: shape.id,
                  type: 'ui-widget',
                  props: { checked: !checked }
                });
              }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: checked ? '#2563eb' : '#1e293b',
                border: checked ? '1.5px solid #3b82f6' : '1.5px solid #475569',
                transition: 'all 0.15s ease'
              }}
            >
              {checked && <Check size={13} color="#ffffff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>
              {label || 'Checkbox option'}
            </span>
          </HTMLContainer>
        );
      }

      case 'radio': {
        const optionList = (options || 'Option A, Option B').split(',').map((o) => o.trim());
        const selectedIdx = value ?? 0;

        return (
          <HTMLContainer style={{ ...baseStyle, flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            {label && <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{label}</span>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {optionList.map((opt, i) => {
                const isSelected = i === selectedIdx;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      this.editor.updateShape({
                        id: shape.id,
                        type: 'ui-widget',
                        props: { value: i }
                      });
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #2563eb' : '1.5px solid #475569',
                        background: '#1e293b',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: 12, color: isSelected ? '#ffffff' : '#cbd5e1' }}>{opt}</span>
                  </div>
                );
              })}
            </div>
          </HTMLContainer>
        );
      }

      case 'toggle': {
        return (
          <HTMLContainer style={{ ...baseStyle, pointerEvents: 'all', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => {
                this.editor.updateShape({
                  id: shape.id,
                  type: 'ui-widget',
                  props: { checked: !checked }
                });
              }}
              style={{
                width: 38,
                height: 22,
                borderRadius: 12,
                background: checked ? '#2563eb' : '#334155',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: checked ? 'flex-end' : 'flex-start',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>
              {label || 'Toggle switch'}
            </span>
          </HTMLContainer>
        );
      }

      case 'select': {
        return (
          <HTMLContainer style={{ ...baseStyle, flexDirection: 'column', justifyContent: 'center' }}>
            {label && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                {label}
              </span>
            )}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderRadius: 6,
                color: '#cbd5e1',
                fontSize: 13
              }}
            >
              <span>{placeholder || 'Choose option...'}</span>
              <ChevronDown size={15} color="#94a3b8" />
            </div>
          </HTMLContainer>
        );
      }

      case 'slider': {
        const percent = Math.min(100, Math.max(0, value ?? 50));
        return (
          <HTMLContainer style={{ ...baseStyle, flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
              <span>{label || 'Slider'}</span>
              <span>{percent}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: '#334155',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: '#2563eb'
                }}
              />
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  position: 'absolute',
                  top: -5,
                  left: `calc(${percent}% - 8px)`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }}
              />
            </div>
          </HTMLContainer>
        );
      }

      case 'navbar': {
        const links = (options || 'Home, Features, Pricing').split(',').map((l) => l.trim());
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#0f172a',
                borderBottom: '1.5px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#38bdf8' }}>
                  {label || 'App Logo'}
                </span>
                <div style={{ display: 'flex', gap: 16 }}>
                  {links.map((link, i) => (
                    <span key={i} style={{ fontSize: 12, color: i === 0 ? '#ffffff' : '#94a3b8', fontWeight: 500 }}>
                      {link}
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  background: '#2563eb',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {subtext || 'Action'}
              </div>
            </div>
          </HTMLContainer>
        );
      }

      case 'sidebar': {
        const items = (options || 'Dashboard, Reports, Settings').split(',').map((it) => it.trim());
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#0f172a',
                borderRight: '1.5px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                padding: 12,
                gap: 8
              }}
            >
              <div style={{ padding: '8px 6px', fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                {label || 'Menu'}
              </div>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: i === 0 ? '#1e293b' : 'transparent',
                    color: i === 0 ? '#38bdf8' : '#94a3b8',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  <Menu size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </HTMLContainer>
        );
      }

      case 'tabs': {
        const tabList = (options || 'Tab 1, Tab 2, Tab 3').split(',').map((t) => t.trim());
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#0f172a',
                padding: 4,
                borderRadius: 6,
                border: '1px solid #334155'
              }}
            >
              {tabList.map((tab, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: i === 0 ? '#1e293b' : 'transparent',
                    color: i === 0 ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </HTMLContainer>
        );
      }

      case 'breadcrumb': {
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              {options || 'Home > Projects > Settings'}
            </span>
          </HTMLContainer>
        );
      }

      case 'pagination': {
        const pages = (options || '<, 1, 2, 3, >').split(',').map((p) => p.trim());
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center', gap: 6 }}>
            {pages.map((p, i) => (
              <div
                key={i}
                style={{
                  minWidth: 28,
                  height: 28,
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: p === '2' ? '#2563eb' : '#1e293b',
                  color: p === '2' ? '#ffffff' : '#cbd5e1',
                  border: '1px solid #334155'
                }}
              >
                {p}
              </div>
            ))}
          </HTMLContainer>
        );
      }

      case 'card': {
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <div
                style={{
                  height: 36,
                  background: '#0f172a',
                  borderBottom: '1px solid #334155',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#f8fafc'
                }}
              >
                <span>{label || 'Card Container'}</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>[Container]</span>
              </div>
              <div style={{ flex: 1, border: '1px dashed #334155', margin: 8, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 11 }}>
                Drop child components here
              </div>
            </div>
          </HTMLContainer>
        );
      }

      case 'modal': {
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#1e293b',
                border: '2px solid #475569',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.7)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: 40,
                  background: '#0f172a',
                  borderBottom: '1px solid #334155',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                <span>{label || 'Modal Dialog'}</span>
                <span style={{ color: '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>✕</span>
              </div>
              <div style={{ flex: 1, padding: 14, color: '#cbd5e1', fontSize: 12 }}>
                {subtext || 'Modal dialog content goes here.'}
              </div>
              <div
                style={{
                  height: 44,
                  background: '#0f172a',
                  borderTop: '1px solid #334155',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8
                }}
              >
                <div style={{ padding: '4px 10px', fontSize: 11, color: '#94a3b8' }}>Cancel</div>
                <div style={{ padding: '4px 12px', borderRadius: 4, background: '#2563eb', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                  Confirm
                </div>
              </div>
            </div>
          </HTMLContainer>
        );
      }

      case 'alert': {
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 6,
                background: variant === 'warning' ? '#451a03' : '#0c4a6e',
                border: `1.5px solid ${variant === 'warning' ? '#f59e0b' : '#38bdf8'}`,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <AlertCircle size={18} color={variant === 'warning' ? '#f59e0b' : '#38bdf8'} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{label || 'Notice'}</span>
                {subtext && <span style={{ fontSize: 10, color: '#cbd5e1' }}>{subtext}</span>}
              </div>
            </div>
          </HTMLContainer>
        );
      }

      case 'table': {
        const headers = (options || 'Col 1 | Col 2 | Col 3').split('|').map((h) => h.trim());
        return (
          <HTMLContainer style={baseStyle}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#0f172a',
                border: '1.5px solid #334155',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                {headers.map((h, i) => (
                  <div key={i} style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                    {h}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {[1, 2, 3].map((row) => (
                  <div key={row} style={{ display: 'flex', borderBottom: '1px solid #1e293b', padding: '6px 10px', fontSize: 11, color: '#cbd5e1' }}>
                    {headers.map((_, i) => (
                      <div key={i} style={{ flex: 1 }}>Data {row}-{i + 1}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </HTMLContainer>
        );
      }

      case 'avatar': {
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#2563eb',
                border: '2px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: Math.max(12, Math.floor(Math.min(w, h) / 3)),
                boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
              }}
            >
              {label || <User size={Math.floor(Math.min(w, h) / 2)} />}
            </div>
          </HTMLContainer>
        );
      }

      case 'badge': {
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                background: variant === 'success' ? '#14532d' : '#1e293b',
                border: `1px solid ${variant === 'success' ? '#22c55e' : '#38bdf8'}`,
                color: variant === 'success' ? '#4ade80' : '#38bdf8',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase'
              }}
            >
              {label || 'TAG'}
            </div>
          </HTMLContainer>
        );
      }

      case 'icon': {
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e293b',
                borderRadius: 6,
                border: '1px solid #334155',
                color: '#38bdf8'
              }}
            >
              {shape.props.iconName === 'Search' ? (
                <Search size={Math.floor(Math.min(w, h) * 0.5)} />
              ) : shape.props.iconName === 'Bell' ? (
                <Bell size={Math.floor(Math.min(w, h) * 0.5)} />
              ) : (
                <Sparkles size={Math.floor(Math.min(w, h) * 0.5)} />
              )}
            </div>
          </HTMLContainer>
        );
      }

      case 'divider': {
        return (
          <HTMLContainer style={{ ...baseStyle, alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                height: 1,
                background: '#334155',
                borderTop: '1px dashed #475569'
              }}
            />
          </HTMLContainer>
        );
      }

      default:
        return (
          <HTMLContainer style={{ ...baseStyle, border: '1px solid #334155', background: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{label || widgetType}</span>
          </HTMLContainer>
        );
    }
  }
}
