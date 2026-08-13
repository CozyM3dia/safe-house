import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg p-8">
      <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-risk-danger/15 border border-risk-danger/30">
          <AlertTriangle className="h-8 w-8 text-risk-danger" />
        </div>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
          Something broke
        </h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          The app encountered an unexpected error. Try reloading — your saved
          locations are preserved.
        </p>
        <pre className="mb-6 max-h-32 overflow-auto rounded-md bg-black/40 p-3 text-left text-[10px] text-risk-danger/80 font-mono">
          {error?.message || 'Unknown error'}
        </pre>
        <Button onClick={resetErrorBoundary} className="w-full">
          <RefreshCcw className="h-4 w-4" />
          Reload App
        </Button>
      </div>
    </div>
  );
}
