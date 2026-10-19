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
        <div className="flex flex-col items-center justify-center w-screen h-screen bg-[var(--color-surface-0)] text-[var(--color-ink-primary)] p-6 box-border font-sans">
          <div className="max-w-xl w-full bg-[var(--color-surface-1)] border border-[var(--color-line-strong)] rounded-lg p-7 shadow-xl flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-ink-primary)] text-[var(--color-surface-0)] font-extrabold text-sm px-2 py-0.5 rounded">
                MD
              </div>
              <h2 className="text-lg font-bold text-[var(--color-ink-primary)] m-0 flex items-center gap-2">
                <AlertCircle size={20} className="text-[var(--color-danger)]" />
                <span>MarkDraw Recoverable Crash</span>
              </h2>
            </div>

            <p className="text-sm leading-relaxed m-0 text-[var(--color-ink-secondary)]">
              A component or renderer encountered an unexpected error. Your documents remain safely stored in local persistence. You can reload the workspace or export a recovery snapshot.
            </p>

            {this.state.error && (
              <pre className="bg-[var(--color-surface-0)] border border-[var(--color-line-subtle)] rounded p-3 text-sm font-mono text-[var(--color-ink-primary)] overflow-x-auto max-h-36">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack?.split('\n').slice(1, 4).join('\n')}
              </pre>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--color-accent)] text-white text-sm font-bold cursor-pointer hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
              >
                <RefreshCw size={14} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleExportRecovery}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--color-surface-2)] text-[var(--color-ink-primary)] border border-[var(--color-line-strong)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
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
