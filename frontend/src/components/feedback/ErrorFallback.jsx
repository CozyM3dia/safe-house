import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppStore } from '../../store/useAppStore';

export function ErrorFallback({ error, resetErrorBoundary }) {
  const lang = useAppStore((state) => state.lang);
  const copy = lang === 'en'
    ? {
        title: 'Something went wrong',
        description: 'The app encountered an unexpected error. Your saved locations are preserved.',
        details: 'Show technical details',
        action: 'Reload app',
        unknown: 'Unknown error',
      }
    : {
        title: 'Terjadi kesalahan',
        description: 'Aplikasi mengalami kendala tak terduga. Lokasi tersimpan Anda tetap aman.',
        details: 'Tampilkan detail teknis',
        action: 'Muat ulang aplikasi',
        unknown: 'Kesalahan tidak diketahui',
      };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg p-8" role="alert" aria-live="assertive">
      <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-risk-danger/15 border border-risk-danger/30">
          <AlertTriangle className="h-8 w-8 text-risk-danger" />
        </div>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
          {copy.title}
        </h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          {copy.description}
        </p>
        <details className="mb-6 rounded-md border border-risk-danger/20 bg-bg/40 p-3 text-left">
          <summary className="cursor-pointer text-xs font-medium text-text-secondary">{copy.details}</summary>
          <pre className="mt-3 max-h-32 overflow-auto text-[10px] text-risk-danger/80 font-mono">
            {error?.message || copy.unknown}
          </pre>
        </details>
        <Button type="button" onClick={resetErrorBoundary} className="w-full">
          <RefreshCcw className="h-4 w-4" />
          {copy.action}
        </Button>
      </div>
    </div>
  );
}
