import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { MapArea } from './components/map/MapArea';
import { TopBar } from './components/panels/TopBar';
import { LeftPanel } from './components/panels/LeftPanel';
import { ChatbotFab } from './components/panels/ChatbotFab';
import { AuditDrawer } from './components/panels/AuditDrawer';
import { CommandPalette } from './components/command/CommandPalette';
import { ErrorFallback } from './components/feedback/ErrorFallback';
import { LoadingBeam } from './components/feedback/LoadingBeam';
import { DisasterLayersPanel } from './components/map/DisasterLayersPanel';
import { useAppStore } from './store/useAppStore';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { Skeleton, SkeletonText } from './components/ui/skeleton';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const SharedReport = lazy(() => import('./pages/SharedReport'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteSkeleton({ label = 'Memuat S.A.F.E House' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 text-text-muted" role="status" aria-live="polite">
      <div className="w-full max-w-sm space-y-4">
        <span className="sr-only">{label}</span>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-2.5 w-48 rounded" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}

function AppShell() {
  const setCmdPalette = useAppStore((s) => s.setCmdPalette);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const setChatExpanded = useAppStore((s) => s.setChatExpanded);

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCmdPalette(true);
  });

  useHotkeys('l', () => toggleLeftPanel());
  useHotkeys('c', () => {
    const state = useAppStore.getState();
    if (state.cmdPaletteOpen || state.onboardingActive) return;
    setChatExpanded(!state.chatExpanded);
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      {/* z-0: Map */}
      <MapArea />

      {/* z-5: Loading beam (top progress) */}
      <LoadingBeam />

      {/* z-10: TopBar */}
      <TopBar />

      {/* z-20: Floating LeftPanel */}
      <LeftPanel />

      {/* z-25: Overlay Layer Panel — MUST be outside MapArea's z-0 stacking context */}
      <DisasterLayersPanel />

      {/* z-20: ChatbotFab + expand */}
      <ChatbotFab />

      {/* z-30: Bottom drawer for AI markdown report */}
      <AuditDrawer />

      {/* z-40: Cmd+K palette */}
      <CommandPalette />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* z-50: Sonner Toaster */}
      <Toaster
        position="bottom-center"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'rgba(26, 17, 10, 0.94)',
            border: '1px solid rgba(255, 210, 170, 0.14)',
            backdropFilter: 'blur(24px)',
            color: '#f0e4cc',
          },
        }}
      />
    </div>
  );
}

function AppPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteSkeleton label="Memuat halaman utama S.A.F.E House" />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route path="/app" element={<AppPage />} />
        <Route
          path="/laporan/:slug"
          element={
            <Suspense fallback={<RouteSkeleton label="Memuat laporan S.A.F.E House" />}>
              <SharedReport />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
