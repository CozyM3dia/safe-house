import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { useLocation, useNavigate } from 'react-router-dom';

import { MapArea } from '../components/map/MapArea';
import { TopBar } from '../components/panels/TopBar';
import { LeftPanel } from '../components/panels/LeftPanel';
import { ChatbotFab } from '../components/panels/ChatbotFab';
import { AuditDrawer } from '../components/panels/AuditDrawer';
import { CommandPalette } from '../components/command/CommandPalette';
import { ErrorFallback } from '../components/feedback/ErrorFallback';
import { LoadingBeam } from '../components/feedback/LoadingBeam';
import { DisasterLayersPanel } from '../components/map/DisasterLayersPanel';
import { useAppStore } from '../store/useAppStore';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { isNarrowViewport } from '../lib/responsive';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppShell() {
  const setCmdPalette = useAppStore((s) => s.setCmdPalette);
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel);
  const setChatExpanded = useAppStore((s) => s.setChatExpanded);
  const theme = useAppStore((s) => s.theme);
  const setLeftPanelOpen = useAppStore((s) => s.setLeftPanelOpen);
  const processLocation = useAppStore((s) => s.processLocation);
  const auditedLat = useAppStore((s) => s.propertyA?.lat);
  const auditedLon = useAppStore((s) => s.propertyA?.lon);
  const location = useLocation();
  const navigate = useNavigate();

  // Kunci koordinat yang terakhir dijembatani antara URL dan store. Tanpa ini
  // kedua efek di bawah saling memicu: URL menulis audit, audit menulis URL.
  const bridgedCoordRef = useRef(null);

  // URL → audit. Menjalankan tautan yang dibagikan.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const latStr = params.get('lat');
    const lonStr = params.get('lon') || params.get('lng');
    if (!latStr || !lonStr) return;

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) return;

    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (bridgedCoordRef.current === key) return;
    bridgedCoordRef.current = key;

    processLocation(lat, lon);
    setLeftPanelOpen(true);
  }, [location.search, processLocation, setLeftPanelOpen]);

  // Audit → URL. Hasil audit sebelumnya hanya hidup di memori: menyegarkan
  // halaman membuangnya, tombol Back melempar keluar aplikasi, dan satu-satunya
  // cara membagikan lokasi adalah tombol "Salin Link" yang terkubur di dalam
  // drawer laporan. Koordinatnya sekarang tercermin di bilah alamat, sehingga
  // reload, bookmark, dan tombol bagikan bawaan peramban semuanya bekerja.
  // `replace`, bukan `push`: tiap audit yang menambah entri riwayat akan
  // mengubah satu ketukan Back jadi belasan.
  useEffect(() => {
    if (!auditedLat || !auditedLon) return;

    const key = `${auditedLat.toFixed(5)},${auditedLon.toFixed(5)}`;
    if (bridgedCoordRef.current === key) return;
    bridgedCoordRef.current = key;

    navigate(
      { pathname: '/app', search: `?lat=${auditedLat.toFixed(5)}&lon=${auditedLon.toFixed(5)}` },
      { replace: true }
    );
  }, [auditedLat, auditedLon, navigate]);

  useEffect(() => {
    // The map is the primary mobile surface. Start the sheet collapsed on a
    // narrow viewport, while leaving an existing audit untouched.
    if (isNarrowViewport() && !useAppStore.getState().propertyA && !location.search) {
      setLeftPanelOpen(false);
    }
  }, [setLeftPanelOpen, location.search]);

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCmdPalette(true);
  });

  useHotkeys('l', () => toggleLeftPanel());

  // Palet perintah, dialog konfirmasi, drawer laporan, dan panel chat semuanya
  // tutup dengan Escape; panel kiri satu-satunya yang tidak, sehingga tombol
  // yang sudah dipelajari pengguna tiba-tiba tak berfungsi di permukaan paling
  // sering dibuka. Penjagaan di bawah memastikan Escape tetap dimiliki lapisan
  // teratas: panel baru menutup saat tak ada apa pun di atasnya.
  useHotkeys('escape', () => {
    const state = useAppStore.getState();
    if (
      state.cmdPaletteOpen ||
      state.onboardingActive ||
      state.auditDrawerOpen ||
      state.chatExpanded ||
      state.mapLayersOpen ||
      state.pendingAudit
    ) {
      return;
    }
    if (state.leftPanelOpen) setLeftPanelOpen(false);
  });
  useHotkeys('c', () => {
    const state = useAppStore.getState();
    if (state.cmdPaletteOpen || state.onboardingActive) return;
    if (state.chatExpanded) {
      setChatExpanded(false);
    } else if (state.chatDockDismissed) {
      useAppStore.getState().setChatDockDismissed(false);
    } else {
      setChatExpanded(true);
    }
  });

  return (
    <div className="app-shell relative h-[100svh] min-h-[100dvh] w-full max-w-full overflow-hidden bg-bg">
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
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          style: {
            background: theme === 'dark' ? 'rgba(26, 17, 10, 0.94)' : 'rgba(255, 250, 242, 0.96)',
            border: theme === 'dark' ? '1px solid rgba(255, 210, 170, 0.14)' : '1px solid rgba(91, 67, 48, 0.16)',
            backdropFilter: 'blur(24px)',
            color: theme === 'dark' ? '#f0e4cc' : '#30241d',
          },
        }}
      />
    </div>
  );
}

export default function AppPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
