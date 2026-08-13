import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import {
  fetchGeospatialData,
  generateSummaryCards,
  generateDetailedReport,
  generateBattleReport,
  runStreetViewAnalysis,
} from '../services/engine';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Language ────────────────────────────────────────────────
      lang: 'id',
      setLang: (lang) => set({ lang }),

      // ─── Current state ─────────────────────────────────────────
      propertyA: null,
      propertyB: null,
      loading: false,
      aiLoading: false,
      currentAiAbortController: null,
      mode: 'audit', // 'audit' | 'battle'
      selectingBattlePin: false,
      auditDrawerOpen: false,
      leftPanelOpen: true,
      cmdPaletteOpen: false,
      chatExpanded: false,
      simulatedPga: null,
      battleReportContent: null,
      battleReportLoading: false,

      // ─── Map Overlays & RAG Documents ──────────────────────────
      baseMapStyle: 'street', // 'street' | 'satellite' | 'terrain'
      overlays: {
        flood: false,
        landslide: false,
        fire: false,
        earthquake: false,
        tsunami: false,
        volcano: false,
        weather: false,
        rtrw: false,
        znt: false,
        landcover: false,
        population: false,
      },
      overlayOpacities: {
        flood: 0.65,
        landslide: 0.65,
        fire: 0.65,
        earthquake: 0.65,
        tsunami: 0.65,
        volcano: 0.65,
        weather: 0.65,
        rtrw: 0.65,
        znt: 0.65,
        landcover: 0.65,
        population: 0.65,
      },
      uploadedDocuments: [],

      // ─── Onboarding ───────────────────────────────────────────
      hasSeenOnboarding: false,
      onboardingActive: false,
      onboardingStep: 0,

      // ─── Persisted state ───────────────────────────────────────
      recentSearches: [],
      favorites: [],

      // ─── UI Toggles & Overlay Actions ──────────────────────────
      toggleLeftPanel: () =>
        set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
      setAuditDrawer: (open) => set({ auditDrawerOpen: open }),
      setCmdPalette: (open) => set({ cmdPaletteOpen: open }),
      setMode: (mode) => set({ mode, selectingBattlePin: false, battleReportContent: null, battleReportLoading: false }),
      setSelectingBattlePin: (v) => set({ selectingBattlePin: v }),
      setSimulatedPga: (v) => set({ simulatedPga: v }),
      setBaseMapStyle: (style) => set({ baseMapStyle: style }),
      setChatExpanded: (chatExpanded) => set({ chatExpanded }),

      toggleOverlay: (key) =>
        set((s) => ({
          overlays: { ...s.overlays, [key]: !s.overlays[key] },
        })),
      setOverlayOpacity: (key, val) =>
        set((s) => ({
          overlayOpacities: { ...s.overlayOpacities, [key]: val },
        })),
      addUploadedDocument: (name, content) =>
        set((s) => ({
          uploadedDocuments: [
            ...s.uploadedDocuments,
            { id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name, content }
          ],
        })),
      removeUploadedDocument: (id) =>
        set((s) => ({
          uploadedDocuments: s.uploadedDocuments.filter((d) => d.id !== id),
        })),
      clearUploadedDocuments: () =>
        set({ uploadedDocuments: [] }),

      // ─── Onboarding actions ────────────────────────────────────
      startOnboarding: () => set({ onboardingActive: true, onboardingStep: 0 }),
      stopOnboarding: () => set({ onboardingActive: false, onboardingStep: 0, hasSeenOnboarding: true }),
      nextOnboardingStep: () => set((s) => ({ onboardingStep: s.onboardingStep + 1 })),
      prevOnboardingStep: () => set((s) => ({ onboardingStep: Math.max(0, s.onboardingStep - 1) })),

      // ─── Persisted actions ─────────────────────────────────────
      addRecentSearch: (entry) =>
        set((s) => ({
          recentSearches: [
            entry,
            ...s.recentSearches.filter(
              (r) => r.label !== entry.label
            ),
          ].slice(0, 8),
        })),

      toggleFavorite: (entry) =>
        set((s) => {
          const exists = s.favorites.some((f) => f.label === entry.label);
          if (exists) {
            return {
              favorites: s.favorites.filter((f) => f.label !== entry.label),
            };
          }
          return { favorites: [entry, ...s.favorites].slice(0, 30) };
        }),

      isFavorite: (label) =>
        get().favorites.some((f) => f.label === label),

      // ─── Core action: process a location ───────────────────────
      processLocation: async (lat, lng, isBattle = false) => {
        if (
          typeof lat !== 'number' || typeof lng !== 'number' ||
          !isFinite(lat) || !isFinite(lng) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180
        ) {
          toast.error('Koordinat tidak valid');
          return;
        }

        const { mode, currentAiAbortController } = get();
        const battleTarget = isBattle || mode === 'battle';

        if (currentAiAbortController) {
          currentAiAbortController.abort();
        }
        const abortController = new AbortController();
        set({ loading: true, currentAiAbortController: abortController });
        try {
          const data = await fetchGeospatialData(lat, lng);

          // Bail out if user already clicked a newer location
          if (get().currentAiAbortController !== abortController) return;

          // Show data immediately — don't block on AI
          if (battleTarget) {
            set({
              propertyB: data,
              loading: false,
              selectingBattlePin: false,
            });
          } else {
            set({
              propertyA: data,
              propertyB: null,
              loading: false,
              leftPanelOpen: true,
            });
          }

          // Save to recent searches
          get().addRecentSearch({
            label: data.address,
            lat,
            lng,
            timestamp: Date.now(),
          });

          // ── Two-phase AI: Summary first, then Detailed (staggered to avoid rate-limiting) ──
          const { lang } = get();
          set({ aiLoading: true });
          const toastId = toast.loading(lang === 'en' ? 'Analyzing location…' : 'Menganalisis lokasi…');

          const summaryPromise = generateSummaryCards(data, lang, abortController.signal);
          // Stagger: wait for summary to finish before firing detailed report
          // This prevents simultaneous Gemini API calls that trigger 429 rate limits
          const detailedReportPromise = summaryPromise
            .catch(() => null) // Don't let summary failure block detailed report
            .then(() => {
              if (abortController.signal.aborted) return null;
              return generateDetailedReport(data, lang, abortController.signal);
            });

          // Handle Summary Cards (Phase 1)
          summaryPromise
            .then((summary) => {
              if (abortController.signal.aborted) { toast.dismiss(toastId); return; }

              if (summary?.aiError) {
                set({ aiLoading: false });
                if (summary.offline) {
                  toast.error('Tidak ada koneksi internet. Periksa jaringan Anda.', { id: toastId, duration: 8000 });
                } else {
                  toast.warning('AI gagal merespons. Data geospasial tetap tersedia.', { id: toastId, duration: 5000 });
                }
                return;
              }

              // Show cards immediately — merging with whatever state is currently present
              if (battleTarget) {
                set((s) => {
                  const existingReport = s.propertyB?.aiReport || {};
                  return {
                    propertyB: s.propertyB
                      ? {
                          ...s.propertyB,
                          aiReport: { reportLoading: true, ...existingReport, ...summary },
                        }
                      : s.propertyB,
                  };
                });
              } else {
                set((s) => {
                  const existingReport = s.propertyA?.aiReport || {};
                  return {
                    propertyA: s.propertyA
                      ? {
                          ...s.propertyA,
                          aiReport: { reportLoading: true, ...existingReport, ...summary },
                        }
                      : s.propertyA,
                  };
                });
              }
              toast.success(lang === 'en' ? 'Summary ready — full report loading…' : 'Ringkasan siap — laporan lengkap sedang dibuat…', { id: toastId, duration: 3000 });
            })
            .catch((err) => {
              if (err.name === 'CanceledError' || err.message === 'canceled' || abortController.signal.aborted) {
                toast.dismiss(toastId); set({ aiLoading: false }); return;
              }
              set({ aiLoading: false });
              toast.error('AI report failed', { id: toastId });
            });

          // Handle Detailed Report (Phase 2)
          detailedReportPromise
            .then((detailedReport) => {
              if (abortController.signal.aborted) return;
              
              if (battleTarget) {
                set((s) => {
                  const existingReport = s.propertyB?.aiReport || {};
                  return {
                    propertyB: s.propertyB
                      ? {
                          ...s.propertyB,
                          aiReport: { ...existingReport, detailedReport, reportLoading: false },
                        }
                      : s.propertyB,
                    aiLoading: false,
                  };
                });
              } else {
                set((s) => {
                  const existingReport = s.propertyA?.aiReport || {};
                  return {
                    propertyA: s.propertyA
                      ? {
                          ...s.propertyA,
                          aiReport: { ...existingReport, detailedReport, reportLoading: false },
                        }
                      : s.propertyA,
                    aiLoading: false,
                  };
                });
              }
              if (detailedReport) toast.success(lang === 'en' ? 'Full report ready' : 'Laporan lengkap siap', { duration: 3000 });

              // ── Street View: fire-and-forget (only audit mode) ──
              if (!battleTarget) {
                runStreetViewAnalysis(data.coords.lat, data.coords.lon, data.address)
                  .then((svAnalysis) => {
                    if (!svAnalysis || abortController.signal.aborted) return;
                    set((s) => {
                      if (!s.propertyA?.aiReport) return {};
                      return { propertyA: { ...s.propertyA, aiReport: { ...s.propertyA.aiReport, microAnalysis: svAnalysis, streetViewUsed: true } } };
                    });
                    toast.success('📸 Street View updated', { duration: 3000 });
                  })
                  .catch(() => {});
              }
            })
            .catch((err) => {
              if (err.name === 'CanceledError' || abortController.signal.aborted) return;
              set({ aiLoading: false });
            });
        } catch (e) {
          console.error('processLocation failed', e);
          toast.error(`Failed to process location: ${e.message}`);
          set({ loading: false, aiLoading: false });
        }
      },

      // ─── Battle report ─────────────────────────────────────────
      runBattleReport: async () => {
        const { propertyA, propertyB } = get();
        if (!propertyA || !propertyB) return null;
        return generateBattleReport(propertyA, propertyB);
      },

      runBattleReportAction: async () => {
        const { propertyA, propertyB, lang } = get();
        if (!propertyA || !propertyB) return;
        set({ battleReportLoading: true });
        try {
          const report = await generateBattleReport(propertyA, propertyB, lang);
          set({ battleReportContent: report, battleReportLoading: false });
          toast.success('Battle report ready!');
        } catch (e) {
          console.error('Battle report failed', e);
          set({ battleReportLoading: false });
          toast.error('Battle report generation failed');
        }
      },

      // ─── Reset ─────────────────────────────────────────────────
      reset: () =>
        set({
          propertyA: null,
          propertyB: null,
          loading: false,
          aiLoading: false,
          simulatedPga: null,
          auditDrawerOpen: false,
          battleReportContent: null,
          battleReportLoading: false,
          mode: 'audit',
        }),
    }),
    {
      name: 'safe-house-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        favorites: state.favorites,
        lang: state.lang,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

if (typeof window !== 'undefined') window.useAppStore = useAppStore;
