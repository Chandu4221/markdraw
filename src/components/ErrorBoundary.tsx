import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Download } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  getRecoverySnapshot?: () => Record<string, any> | string | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MarkDraw uncaught error boundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleExportRecovery = () => {
    try {
      let recoveryData: any = null;
      if (this.props.getRecoverySnapshot) {
        recoveryData = this.props.getRecoverySnapshot();
      }

      if (!recoveryData) {
        // Fallback: extract any markdraw local storage
        const storageDump: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('markdraw')) {
            storageDump[key] = localStorage.getItem(key);
          }
        }
        recoveryData = { storage: storageDump, timestamp: new Date().toISOString() };
      }

      const content =
        typeof recoveryData === 'string'
          ? recoveryData
          : JSON.stringify(recoveryData, null, 2);

      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `markdraw-recovery-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export recovery file:', e);
      alert('Could not export recovery file. Please copy errors from developer console.');
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
            background: 'var(--md-bg, #0d0f12)',
            color: 'var(--md-text, #e2e8f0)',
            fontFamily: "var(--md-font-sans, 'Google Sans', sans-serif)",
            padding: 24,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: '100%',
              background: 'var(--md-surface, #161b22)',
              border: '1.5px solid var(--md-border-strong, #30363d)',
              borderRadius: 'var(--md-radius-lg, 8px)',
              padding: 28,
              boxShadow: 'var(--md-shadow-panel, 4px 4px 0px rgba(0,0,0,0.4))',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  background: 'var(--md-text-bold, #fff)',
                  color: 'var(--md-bg, #000)',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '3px 8px',
                  borderRadius: 4
                }}
              >
                MD
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--md-text-bold, #fff)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <AlertCircle size={20} />
                <span>MarkDraw Recoverable Crash</span>
              </h2>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: 'var(--md-text, #94a3b8)' }}>
              A component or renderer encountered an unexpected error. Your documents remain safely stored in local persistence. You can reload the workspace or export a recovery snapshot.
            </p>

            {this.state.error && (
              <pre
                style={{
                  background: 'var(--md-bg, #0d0f12)',
                  border: '1.5px solid var(--md-border, #21262d)',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 12,
                  fontFamily: 'var(--md-font-mono, monospace)',
                  color: 'var(--md-text-bold, #fff)',
                  overflowX: 'auto',
                  maxHeight: 140
                }}
              >
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack?.split('\n').slice(1, 4).join('\n')}
              </pre>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--md-text-bold,#fff)] text-[var(--md-bg,#000)] border-[1.5px] border-[var(--md-border-strong,#fff)] text-[13px] font-bold cursor-pointer shadow-[var(--md-shadow-interactive,2px_2px_0px_#000)] hover:bg-[var(--md-accent,#3b82f6)] hover:text-white hover:border-[var(--md-accent,#3b82f6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring,#3b82f6)] focus-visible:ring-offset-2 transition-colors"
              >
                <RefreshCw size={14} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleExportRecovery}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--md-surface-raised,#21262d)] text-[var(--md-text-bold,#fff)] border-[1.5px] border-[var(--md-border-strong,#30363d)] text-[13px] font-semibold cursor-pointer shadow-[var(--md-shadow-interactive,2px_2px_0px_#000)] hover:bg-[var(--md-surface-hover,#30363d)] hover:border-[var(--md-border-strong,#484f58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-accent-ring,#3b82f6)] focus-visible:ring-offset-2 transition-colors"
              >
                <Download size={14} />
                <span>Export Recovery File</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
