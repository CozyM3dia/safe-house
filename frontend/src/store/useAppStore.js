import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { generateBattleReport, generateNarrative, runAudit } from '../services/api';

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
      battleReportMeta: null,
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
        faults: false,
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
        faults: 0.34,
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
      setMode: (mode) => set({ mode, selectingBattlePin: false, battleReportContent: null, battleReportMeta: null, battleReportLoading: false }),
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

        const { mode, currentAiAbortController, lang } = get();
        const battleTarget = isBattle || mode === 'battle';

        // Token pembatal sederhana: klik baru membatalkan hasil klik lama.
        // Backend tidak dibatalkan, tapi hasil basi diabaikan saat tiba.
        if (currentAiAbortController) currentAiAbortController.abort();
        const abortController = new AbortController();
        set({ loading: true, currentAiAbortController: abortController });

        const toastId = toast.loading(
          lang === 'en' ? 'Running audit…' : 'Menjalankan audit…'
        );

        try {
          // Simpan AuditResult apa adanya — kartu membacanya langsung.
          const data = await runAudit(lat, lng, lang, abortController.signal);

          // Klik yang lebih baru sudah menggantikan permintaan ini.
          if (get().currentAiAbortController !== abortController) {
            toast.dismiss(toastId);
            return;
          }

          if (battleTarget) {
            set({ propertyB: data, loading: false, selectingBattlePin: false });
          } else {
            set({
              propertyA: {
                ...data,
                aiReport: { reportLoading: true },
              },
              propertyB: null,
              loading: false,
              aiLoading: true,
              leftPanelOpen: true,
            });
          }

          get().addRecentSearch({ label: data.address, lat, lng, timestamp: Date.now() });

          // Beri tahu jujur kalau audit belum layak dianggap final.
          if (data.audit_status && data.audit_status !== 'valid') {
            toast.warning(
              lang === 'en'
                ? `Audit is ${data.audit_status}; confidence ${data.confidence ?? 0}%.`
                : `Audit masih ${data.audit_status}; confidence ${data.confidence ?? 0}%.`,
              { id: toastId, duration: 5500 }
            );
          } else if ((data.sources_failed || []).length > 0) {
            toast.warning(
              lang === 'en'
                ? 'Audit ready — some data sources were unavailable.'
                : 'Audit siap — sebagian sumber data tidak tersedia.',
              { id: toastId, duration: 4000 }
            );
          } else {
            toast.success(lang === 'en' ? 'Audit ready' : 'Audit siap', {
              id: toastId,
              duration: 2500,
            });
          }

          // The score is already visible. Generate the explanatory layer in
          // the background so an AI outage can never invalidate the audit.
          if (!battleTarget) {
            void generateNarrative(data, lang, abortController.signal)
              .then((aiReport) => {
                if (get().currentAiAbortController !== abortController) return;
                set((state) => ({
                  propertyA: state.propertyA
                    ? {
                        ...state.propertyA,
                        aiReport,
                        narrative: aiReport,
                      }
                    : state.propertyA,
                  aiLoading: false,
                }));
              })
              .catch((error) => {
                if (abortController.signal.aborted) return;
                if (get().currentAiAbortController !== abortController) return;
                set((state) => ({
                  propertyA: state.propertyA
                    ? {
                        ...state.propertyA,
                        aiReport: {
                          aiError: true,
                          reportLoading: false,
                          errorMessage: error.message,
                        },
                      }
                    : state.propertyA,
                  aiLoading: false,
                }));
              });
          }
        } catch (e) {
          if (get().currentAiAbortController !== abortController) {
            toast.dismiss(toastId);
            return;
          }
          const isExpectedAuditRejection =
            e.cause?.response?.status === 422 ||
            /lokasi .* (perairan|lahan bangunan)|di luar cakupan/i.test(e.message || '');
          if (isExpectedAuditRejection) {
            console.info('processLocation rejected', e.message);
          } else {
            console.error('processLocation failed', e);
          }
          toast.error(e.message || 'Gagal memproses lokasi', { id: toastId });
          set({ loading: false });
        }
      },

      // ─── Battle report ─────────────────────────────────────────
      runBattleReport: async () => {
        const { propertyA, propertyB, lang, battleReportLoading } = get();
        if (battleReportLoading) return null;
        if (!propertyA || !propertyB) {
          toast.error(lang === 'en' ? 'Select two audited locations first.' : 'Pilih dua lokasi yang sudah diaudit terlebih dahulu.');
          return null;
        }

        const toastId = toast.loading(
          lang === 'en' ? 'Generating comparison report…' : 'Membuat laporan perbandingan…'
        );
        set({ battleReportLoading: true, battleReportContent: null, battleReportMeta: null });

        try {
          const result = await generateBattleReport(propertyA, propertyB, lang);
          set({
            battleReportContent: result.report,
            battleReportMeta: result.metadata,
            battleReportLoading: false,
            auditDrawerOpen: true,
          });
          toast.success(
            lang === 'en' ? 'Battle report ready' : 'Laporan perbandingan siap',
            { id: toastId, duration: 3000 }
          );
          return result;
        } catch (error) {
          console.error('runBattleReport failed', error);
          set({ battleReportLoading: false });
          toast.error(error.message || (lang === 'en' ? 'Battle report failed' : 'Laporan perbandingan gagal'), { id: toastId });
          return null;
        }
      },

      runBattleReportAction: () => get().runBattleReport(),

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
          battleReportMeta: null,
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
