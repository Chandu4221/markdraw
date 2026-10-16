import React from 'react';
import { UIWidgetProps } from './types';
import {
  Search,
  Lock,
  ArrowRight,
  Check,
  ChevronDown,
  Upload,
  Calendar,
  Image as ImageIcon,
  Video,
  Menu,
  Sparkles,
  ExternalLink,
  X,
  Minus,
  Plus,
  User,
  Info
} from 'lucide-react';

interface WidgetPreviewProps {
  props: Partial<UIWidgetProps> & { widgetType: string };
  isThumbnail?: boolean;
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({ props, isThumbnail = false }) => {
  const {
    widgetType,
    label = '',
    variant = '',
    placeholder = '',
    checked = false,
    options = '',
    subtext = '',
    value = 0,
    iconName = ''
  } = props;

  const baseContainer: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    fontFamily: 'var(--md-font-sans)',
    color: 'var(--md-text)',
    userSelect: 'none',
    fontSize: isThumbnail ? 11 : 12,
    position: 'relative'
  };

  switch (widgetType) {
    // ==================== LAYOUT ====================
    case 'section':
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            border: '1.5px dashed var(--md-border-strong)',
            background: 'var(--md-surface)',
            borderRadius: 'var(--md-radius-lg)',
            padding: isThumbnail ? 6 : 12
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--md-border)',
              paddingBottom: 4,
              marginBottom: 4
            }}
          >
            <span style={{ fontWeight: 700, fontSize: isThumbnail ? 10 : 13, color: 'var(--md-text-bold)' }}>
              {label || 'Section'}
            </span>
            <span style={{ fontSize: 9, color: 'var(--md-text-muted)' }}>[Section]</span>
          </div>
          {!isThumbnail && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-text-subtle)', fontSize: 11 }}>
              Section Band Container
            </div>
          )}
        </div>
      );

    case 'card': {
      const isElevated = variant === 'elevated';
      const isFlat = variant === 'flat';
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            background: isFlat ? 'transparent' : 'var(--md-surface)',
            border: isElevated ? '1px solid var(--md-border-strong)' : '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-md)',
            boxShadow: isElevated ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: isThumbnail ? '4px 6px' : '8px 12px',
              borderBottom: '1px solid var(--md-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--md-surface-raised)'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: isThumbnail ? 10 : 12 }}>{label || 'Card'}</span>
            <span style={{ fontSize: 9, color: 'var(--md-text-muted)' }}>[Card]</span>
          </div>
          {!isThumbnail && (
            <div style={{ flex: 1, padding: 8, color: 'var(--md-text-subtle)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Card Content Slot
            </div>
          )}
        </div>
      );
    }

    case 'hero':
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: isThumbnail ? 8 : 16,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-lg)',
            gap: 6
          }}
        >
          <span style={{ fontWeight: 800, fontSize: isThumbnail ? 11 : 16, color: 'var(--md-text-bold)' }}>
            {label || 'Hero Banner Title'}
          </span>
          <span style={{ fontSize: isThumbnail ? 9 : 11, color: 'var(--md-text-muted)', maxWidth: '80%' }}>
            {subtext || 'Engaging subtitle describing product benefits.'}
          </span>
          <div
            style={{
              marginTop: 4,
              padding: '4px 12px',
              background: 'var(--md-text)',
              color: 'var(--md-bg)',
              fontWeight: 600,
              fontSize: 10,
              borderRadius: 'var(--md-radius-sm)'
            }}
          >
            Get Started
          </div>
        </div>
      );

    case 'header':
    case 'footer':
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-sm)'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 11 }}>{label || (widgetType === 'header' ? 'Site Header' : 'Site Footer')}</span>
          <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>{subtext || 'Brand & Links'}</span>
        </div>
      );

    case 'grid_gallery':
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            padding: 8,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-md)',
            gap: 6
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 10, color: 'var(--md-text-muted)' }}>{label || 'Grid Gallery'}</span>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ border: '1px dashed var(--md-border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--md-text-subtle)' }}>
                Slot {i}
              </div>
            ))}
          </div>
        </div>
      );

    case 'split_pane':
      return (
        <div
          style={{
            ...baseContainer,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-md)'
          }}
        >
          <div style={{ flex: 1, padding: 8, borderRight: '1px solid var(--md-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--md-text-muted)' }}>
            Left Pane
          </div>
          <div style={{ flex: 1, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--md-text-muted)' }}>
            Right Pane
          </div>
        </div>
      );

    case 'modal':
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            background: 'var(--md-surface)',
            border: '1.5px solid var(--md-border-strong)',
            borderRadius: 'var(--md-radius-lg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              background: 'var(--md-surface-raised)',
              borderBottom: '1px solid var(--md-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: 12
            }}
          >
            <span>{label || 'Modal Dialog'}</span>
            <X size={12} color="var(--md-text-muted)" />
          </div>
          {!isThumbnail && (
            <div style={{ flex: 1, padding: 10, fontSize: 11, color: 'var(--md-text-muted)' }}>
              {subtext || 'Dialog content and prompt instructions.'}
            </div>
          )}
          <div
            style={{
              padding: '4px 10px',
              borderTop: '1px solid var(--md-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 6
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--md-text-muted)', padding: '2px 6px' }}>Cancel</span>
            <span style={{ fontSize: 10, background: 'var(--md-text)', color: 'var(--md-bg)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Confirm
            </span>
          </div>
        </div>
      );

    // ==================== FORMS ====================
    case 'button': {
      const isSolid = variant === 'solid' || variant === 'primary' || !variant;
      const isGhost = variant === 'ghost';
      const isDanger = variant === 'danger';

      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 'var(--md-radius-md)',
            padding: '0 12px',
            fontWeight: 600,
            background: isSolid ? 'var(--md-text)' : isGhost ? 'transparent' : 'var(--md-surface)',
            color: isSolid ? 'var(--md-bg)' : 'var(--md-text)',
            border: isGhost ? 'none' : isDanger ? '1.5px dashed var(--md-border-strong)' : '1px solid var(--md-border-strong)'
          }}
        >
          <span>{label || 'Button'}</span>
          {iconName && <ArrowRight size={12} />}
        </div>
      );
    }

    case 'input':
    case 'search':
    case 'password':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', justifyContent: 'center' }}>
          {label && !isThumbnail && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--md-text-muted)', marginBottom: 2 }}>
              {label}
            </span>
          )}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 8px',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-border)',
              borderRadius: 'var(--md-radius-md)'
            }}
          >
            {widgetType === 'search' && <Search size={12} color="var(--md-text-muted)" />}
            {widgetType === 'password' && <Lock size={12} color="var(--md-text-muted)" />}
            <span style={{ color: 'var(--md-text-muted)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {widgetType === 'password' ? '••••••••' : placeholder || label || 'Enter value...'}
            </span>
          </div>
        </div>
      );

    case 'textarea':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column' }}>
          {label && !isThumbnail && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--md-text-muted)', marginBottom: 2 }}>
              {label}
            </span>
          )}
          <div
            style={{
              flex: 1,
              padding: 6,
              background: 'var(--md-surface)',
              border: '1px solid var(--md-border)',
              borderRadius: 'var(--md-radius-md)',
              color: 'var(--md-text-muted)',
              fontSize: 10
            }}
          >
            {placeholder || 'Multi-line notes...'}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: checked ? 'var(--md-text)' : 'var(--md-surface)',
              border: '1.5px solid var(--md-border-strong)'
            }}
          >
            {checked && <Check size={10} color="var(--md-bg)" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500 }}>{label || 'Checkbox'}</span>
        </div>
      );

    case 'radio': {
      const opts = (options || 'Option A, Option B').split(',').map((o) => o.trim());
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {label && !isThumbnail && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--md-text-muted)' }}>{label}</span>}
          {opts.slice(0, isThumbnail ? 2 : 4).map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: i === 0 ? '4px solid var(--md-text)' : '1px solid var(--md-border-strong)',
                  background: 'var(--md-surface)'
                }}
              />
              <span style={{ fontSize: 10, color: i === 0 ? 'var(--md-text-bold)' : 'var(--md-text-muted)' }}>{opt}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'toggle':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 16,
              borderRadius: 8,
              background: checked ? 'var(--md-text)' : 'var(--md-surface-raised)',
              border: '1px solid var(--md-border)',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: checked ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: checked ? 'var(--md-bg)' : 'var(--md-text-muted)' }} />
          </div>
          <span style={{ fontSize: 11 }}>{label || 'Toggle'}</span>
        </div>
      );

    case 'select':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', justifyContent: 'center' }}>
          {label && !isThumbnail && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--md-text-muted)', marginBottom: 2 }}>{label}</span>}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-border)',
              borderRadius: 'var(--md-radius-md)',
              fontSize: 11
            }}
          >
            <span style={{ color: 'var(--md-text-muted)' }}>{placeholder || 'Choose...'}</span>
            <ChevronDown size={12} color="var(--md-text-muted)" />
          </div>
        </div>
      );

    case 'slider': {
      const pct = Math.min(100, Math.max(0, value ?? 50));
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--md-text-muted)' }}>
            <span>{label || 'Slider'}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--md-border)', borderRadius: 2, position: 'relative' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--md-text)', borderRadius: 2 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--md-bg)', border: '2px solid var(--md-text)', position: 'absolute', top: -3, left: `calc(${pct}% - 5px)` }} />
          </div>
        </div>
      );
    }

    case 'file_upload':
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px dashed var(--md-border-strong)',
            borderRadius: 'var(--md-radius-md)',
            background: 'var(--md-surface)',
            padding: 8,
            gap: 4
          }}
        >
          <Upload size={14} color="var(--md-text-muted)" />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{label || 'Upload File'}</span>
          <span style={{ fontSize: 8, color: 'var(--md-text-muted)' }}>Drag & drop or browse</span>
        </div>
      );

    case 'date_picker':
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-md)'
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--md-text-muted)' }}>{placeholder || 'YYYY-MM-DD'}</span>
          <Calendar size={12} color="var(--md-text-muted)" />
        </div>
      );

    case 'stepper':
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-md)',
            padding: '0 6px'
          }}
        >
          <Minus size={12} color="var(--md-text-muted)" />
          <span style={{ fontWeight: 700, fontSize: 11 }}>{value || 1}</span>
          <Plus size={12} color="var(--md-text-muted)" />
        </div>
      );

    case 'color_swatch':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 4 }}>
          {['#09090b', '#3f3f46', '#71717a', '#d4d4d8', '#fafafa'].map((c, i) => (
            <div key={i} style={{ flex: 1, height: '100%', background: c, border: '1px solid var(--md-border)', borderRadius: 2 }} />
          ))}
        </div>
      );

    // ==================== NAVIGATION ====================
    case 'navbar': {
      const links = (options || 'Home, Features, Pricing').split(',').map((l) => l.trim());
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            background: 'var(--md-surface)',
            borderBottom: '1px solid var(--md-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{label || 'Brand'}</span>
            {!isThumbnail && (
              <div style={{ display: 'flex', gap: 8 }}>
                {links.map((link, i) => (
                  <span key={i} style={{ fontSize: 10, color: i === 0 ? 'var(--md-text)' : 'var(--md-text-muted)' }}>
                    {link}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: '2px 8px', background: 'var(--md-text)', color: 'var(--md-bg)', borderRadius: 3, fontSize: 9, fontWeight: 600 }}>
            {subtext || 'Action'}
          </div>
        </div>
      );
    }

    case 'menubar': {
      const menus = (options || 'File, Edit, View, Window, Help').split(',').map((m) => m.trim());
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            gap: 12,
            padding: '0 8px',
            background: 'var(--md-surface)',
            borderBottom: '1px solid var(--md-border)'
          }}
        >
          {menus.map((m, i) => (
            <span key={i} style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>{m}</span>
          ))}
        </div>
      );
    }

    case 'sidebar': {
      const items = (options || 'Dashboard, Analytics, Customers, Settings').split(',').map((it) => it.trim());
      return (
        <div
          style={{
            ...baseContainer,
            flexDirection: 'column',
            padding: 8,
            gap: 6,
            background: 'var(--md-surface)',
            borderRight: '1px solid var(--md-border)'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{label || 'Menu'}</span>
          {items.slice(0, isThumbnail ? 2 : 5).map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: i === 0 ? 'var(--md-text)' : 'var(--md-text-muted)' }}>
              <Menu size={11} />
              <span>{it}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'tabs': {
      const tabList = (options || 'Tab 1, Tab 2, Tab 3').split(',').map((t) => t.trim());
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            gap: 2,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border)',
            borderRadius: 'var(--md-radius-sm)',
            padding: 2
          }}
        >
          {tabList.map((t, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '2px 4px',
                borderRadius: 2,
                fontSize: 10,
                fontWeight: 600,
                background: i === 0 ? 'var(--md-surface-raised)' : 'transparent',
                color: i === 0 ? 'var(--md-text-bold)' : 'var(--md-text-muted)'
              }}
            >
              {t}
            </div>
          ))}
        </div>
      );
    }

    case 'breadcrumbs':
      return (
        <div style={{ ...baseContainer, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>{options || 'Home / Settings / Profile'}</span>
        </div>
      );

    case 'pagination':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 4 }}>
          {['<', '1', '2', '3', '>'].map((p, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                border: '1px solid var(--md-border)',
                background: p === '2' ? 'var(--md-text)' : 'var(--md-surface)',
                color: p === '2' ? 'var(--md-bg)' : 'var(--md-text)',
                fontSize: 9,
                fontWeight: 600
              }}
            >
              {p}
            </div>
          ))}
        </div>
      );

    case 'footer_nav':
      return (
        <div style={{ ...baseContainer, padding: 8, gap: 12, borderTop: '1px solid var(--md-border)' }}>
          {['Product', 'Company', 'Legal'].map((col, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 9 }}>{col}</span>
              <span style={{ fontSize: 8, color: 'var(--md-text-muted)' }}>Link 1</span>
              <span style={{ fontSize: 8, color: 'var(--md-text-muted)' }}>Link 2</span>
            </div>
          ))}
        </div>
      );

    case 'link':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 4 }}>
          <span style={{ textDecoration: 'underline', fontSize: 11 }}>{label || 'Hyperlink text'}</span>
          <ExternalLink size={10} color="var(--md-text-muted)" />
        </div>
      );

    case 'chip':
      return (
        <div
          style={{
            ...baseContainer,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '2px 8px',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-border-strong)',
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 600
          }}
        >
          <span>{label || 'Chip Tag'}</span>
          <X size={9} color="var(--md-text-muted)" />
        </div>
      );

    case 'steps':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
          {['1. Cart', '2. Pay', '3. Done'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: i === 1 ? 700 : 500, color: i === 1 ? 'var(--md-text-bold)' : 'var(--md-text-muted)' }}>
                {step}
              </span>
              {i < 2 && <span style={{ color: 'var(--md-border-strong)' }}>──</span>}
            </div>
          ))}
        </div>
      );

    // ==================== CONTENT ====================
    case 'heading':
      return (
        <div style={{ ...baseContainer, alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: variant === 'h1' ? 16 : variant === 'h2' ? 14 : 12, color: 'var(--md-text-bold)' }}>
            {label || 'Heading Title'}
          </span>
        </div>
      );

    case 'paragraph':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', gap: 4, padding: 4 }}>
          <div style={{ width: '100%', height: 3, background: 'var(--md-border-strong)', borderRadius: 1 }} />
          <div style={{ width: '85%', height: 3, background: 'var(--md-border)', borderRadius: 1 }} />
          <div style={{ width: '60%', height: 3, background: 'var(--md-border)', borderRadius: 1 }} />
        </div>
      );

    case 'list': {
      const items = (options || 'Item 1, Item 2, Item 3').split(',').map((it) => it.trim());
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', gap: 4, padding: 4 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--md-text-muted)' }} />
              <span style={{ fontSize: 10 }}>{it}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'data_table': {
      const cols = (options || 'ID | Item | Value').split('|').map((c) => c.trim());
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', border: '1px solid var(--md-border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: 'var(--md-surface-raised)', borderBottom: '1px solid var(--md-border)' }}>
            {cols.map((col, i) => (
              <div key={i} style={{ flex: 1, padding: '4px 6px', fontSize: 9, fontWeight: 700 }}>{col}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {[1, 2].map((r) => (
              <div key={r} style={{ display: 'flex', borderBottom: '1px solid var(--md-border)', padding: '3px 6px', fontSize: 8, color: 'var(--md-text-muted)' }}>
                {cols.map((_, i) => (
                  <div key={i} style={{ flex: 1 }}>val_{r}_{i + 1}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'blockquote':
      return (
        <div style={{ ...baseContainer, borderLeft: '3px solid var(--md-text-bold)', padding: '2px 8px', fontStyle: 'italic', color: 'var(--md-text-muted)' }}>
          "{label || 'Blockquote citation or callout text.'}"
        </div>
      );

    case 'code_block':
      return (
        <div style={{ ...baseContainer, padding: 6, background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 4, fontFamily: 'var(--md-font-mono)', fontSize: 9 }}>
          <code>{label || 'const markdraw = compile(canvas);'}</code>
        </div>
      );

    case 'divider':
      return (
        <div style={{ ...baseContainer, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--md-border)' }} />
        </div>
      );

    case 'spacer':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--md-border)', color: 'var(--md-text-subtle)', fontSize: 9 }}>
          ↕ {label || 'Spacer (24px)'}
        </div>
      );

    case 'image_frame':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center', background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 4, gap: 4 }}>
          <ImageIcon size={16} color="var(--md-text-muted)" />
          <span style={{ fontSize: 9, color: 'var(--md-text-muted)' }}>{label || 'Image'}</span>
        </div>
      );

    case 'video_frame':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center', background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 4, gap: 4 }}>
          <Video size={16} color="var(--md-text-muted)" />
          <span style={{ fontSize: 9, color: 'var(--md-text-muted)' }}>{label || 'Video Player'}</span>
        </div>
      );

    case 'stat_kpi':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', justifyContent: 'center', padding: '6px 10px', background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--md-text-muted)', textTransform: 'uppercase' }}>{label || 'Total Revenue'}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--md-text-bold)' }}>{subtext || '$48,250'}</span>
        </div>
      );

    // ==================== FEEDBACK ====================
    case 'progress_bar': {
      const pct = Math.min(100, Math.max(0, value ?? 65));
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--md-text-muted)' }}>
            <span>{label || 'Progress'}</span>
            <span>{pct}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--md-border)', borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--md-text)', borderRadius: 2 }} />
          </div>
        </div>
      );
    }

    case 'skeleton':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', gap: 4, padding: 4 }}>
          <div style={{ width: '100%', height: 8, background: 'var(--md-border)', borderRadius: 4, opacity: 0.5 }} />
          <div style={{ width: '70%', height: 8, background: 'var(--md-border)', borderRadius: 4, opacity: 0.5 }} />
        </div>
      );

    case 'tooltip':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '3px 8px', background: 'var(--md-text)', color: 'var(--md-bg)', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>
            {label || 'Tooltip hint'}
          </div>
        </div>
      );

    case 'toast':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--md-surface-raised)', border: '1px solid var(--md-border-strong)', borderRadius: 4 }}>
          <span style={{ fontSize: 10 }}>{label || 'Notification saved.'}</span>
          <X size={10} color="var(--md-text-muted)" />
        </div>
      );

    case 'empty_state':
      return (
        <div style={{ ...baseContainer, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, border: '1px dashed var(--md-border)', borderRadius: 6, gap: 4 }}>
          <Info size={14} color="var(--md-text-muted)" />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{label || 'No elements found'}</span>
          <span style={{ fontSize: 8, color: 'var(--md-text-muted)' }}>Create your first entry</span>
        </div>
      );

    case 'banner':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--md-surface)', border: '1px solid var(--md-border-strong)', borderRadius: 4 }}>
          <Info size={12} color="var(--md-text-muted)" />
          <span style={{ fontSize: 10 }}>{label || 'System maintenance scheduled.'}</span>
        </div>
      );

    // ==================== MEDIA ====================
    case 'avatar':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--md-surface-raised)', border: '1.5px solid var(--md-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: isThumbnail ? 9 : 12 }}>
            {label || <User size={isThumbnail ? 10 : 16} />}
          </div>
        </div>
      );

    case 'avatar_group':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', padding: 2 }}>
          {['A', 'B', 'C'].map((av, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--md-surface-raised)', border: '1.5px solid var(--md-border-strong)', marginLeft: i > 0 ? -6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>
              {av}
            </div>
          ))}
          <span style={{ fontSize: 8, marginLeft: 4, color: 'var(--md-text-muted)' }}>+3</span>
        </div>
      );

    case 'thumbnail_strip':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', gap: 4, padding: 2 }}>
          {[1, 2, 3].map((t) => (
            <div key={t} style={{ flex: 1, height: '100%', background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={10} color="var(--md-text-muted)" />
            </div>
          ))}
        </div>
      );

    case 'badge':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ padding: '2px 8px', borderRadius: 10, background: 'var(--md-surface)', border: '1px solid var(--md-border-strong)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label || 'BADGE'}
          </span>
        </div>
      );

    case 'icon':
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center', background: 'var(--md-surface)', border: '1px solid var(--md-border)', borderRadius: 4 }}>
          <Sparkles size={isThumbnail ? 12 : 16} color="var(--md-text)" />
        </div>
      );

    default:
      return (
        <div style={{ ...baseContainer, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--md-border)', background: 'var(--md-surface)' }}>
          <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>{label || widgetType}</span>
        </div>
      );
  }
};
