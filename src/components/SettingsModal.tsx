import React from 'react';
import { X, RotateCcw, Sliders } from 'lucide-react';
import { CompilationOptions } from '../core/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: Required<CompilationOptions>;
  onChange: (options: Required<CompilationOptions>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChange
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onChange({
      containmentThreshold: 0.85,
      rowClusterThreshold: 16,
      gridBandThreshold: 32,
      includeTimestamp: false,
      includeLegend: true
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440,
          background: 'var(--md-surface)',
          border: '1px solid var(--md-border-strong)',
          borderRadius: 'var(--md-radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--md-font-sans)',
          color: 'var(--md-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 48,
            padding: '0 16px',
            borderBottom: '1px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-surface-raised)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
            <Sliders size={16} strokeWidth={1.5} />
            <span>Compiler & Geometry Settings</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--md-text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Containment Threshold */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Containment Tolerance Threshold</span>
              <span style={{ fontFamily: 'var(--md-font-mono)', color: 'var(--md-text-muted)' }}>
                {Math.round(options.containmentThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={Math.round(options.containmentThreshold * 100)}
              onChange={(e) =>
                onChange({ ...options, containmentThreshold: Number(e.target.value) / 100 })
              }
              style={{ width: '100%', accentColor: 'var(--md-text)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>
              Area overlap percentage required for child enclosure (default: 85%).
            </span>
          </div>

          {/* Row Cluster Threshold */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Row Clustering Band (Y-axis)</span>
              <span style={{ fontFamily: 'var(--md-font-mono)', color: 'var(--md-text-muted)' }}>
                {options.rowClusterThreshold}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="48"
              value={options.rowClusterThreshold}
              onChange={(e) =>
                onChange({ ...options, rowClusterThreshold: Number(e.target.value) })
              }
              style={{ width: '100%', accentColor: 'var(--md-text)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>
              Vertical delta threshold to cluster items into the same horizontal row (default: 16px).
            </span>
          </div>

          {/* Spatial Grid Band */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Spatial Grid Band Threshold</span>
              <span style={{ fontFamily: 'var(--md-font-mono)', color: 'var(--md-text-muted)' }}>
                {options.gridBandThreshold}px
              </span>
            </div>
            <input
              type="range"
              min="16"
              max="64"
              value={options.gridBandThreshold}
              onChange={(e) =>
                onChange({ ...options, gridBandThreshold: Number(e.target.value) })
              }
              style={{ width: '100%', accentColor: 'var(--md-text)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--md-text-muted)' }}>
              Row clustering threshold for 2D pipe tables (default: 32px).
            </span>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.includeLegend}
                onChange={(e) => onChange({ ...options, includeLegend: e.target.checked })}
              />
              <span>Prepend Semantic Legend to Markdown Outputs</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.includeTimestamp}
                onChange={(e) => onChange({ ...options, includeTimestamp: e.target.checked })}
              />
              <span>Include Generation Timestamp (disable for byte-for-byte determinism)</span>
            </label>
          </div>
        </div>

        <div
          style={{
            height: 48,
            padding: '0 16px',
            borderTop: '1px solid var(--md-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--md-surface-raised)'
          }}
        >
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--md-text-muted)',
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--md-radius-md)',
              background: 'var(--md-text)',
              border: 'none',
              color: 'var(--md-bg)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
