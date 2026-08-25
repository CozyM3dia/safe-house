import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { generateBattleReport, generateNarrative, runAudit } from '../services/api';
import { generateProceduralNarrative } from '../lib/proceduralNarrative';
import { STADIA_MAPS_ENABLED } from '../lib/constants';
import { MAP_OVERLAY_KEYS } from '../lib/hazardOverlay';

const INITIAL_OVERLAYS = Object.fromEntries(
  MAP_OVERLAY_KEYS.map((key) => [key, false])
);

// Catatan: opasitas `faults` dipetakan ke "penekanan" garis di
// FaultOverlay (0.34 default ≈ 70% kekuatan visual), bukan alpha mentah.
// Kalau suatu saat ada slider generik, jangan labeli "Opasitas" untuk
// faults — beri label tersendiri ("Penekanan").
const INITIAL_OVERLAY_OPACITIES = Object.fromEntries(
  MAP_OVERLAY_KEYS.map((key) => [key, key === 'faults' ? 0.34 : 0.65])
);

const INITIAL_OVERLAY_STATUSES = Object.fromEntries(
  MAP_OVERLAY_KEYS.map((key) => [key, 'idle'])
);

const INITIAL_OVERLAY_SOURCES = Object.fromEntries(
  MAP_OVERLAY_KEYS.map((key) => [key, 'official'])
);

const baseMapStyleForTheme = (theme) => {
  if (!STADIA_MAPS_ENABLED) return 'street';
  return theme === 'light' ? 'alidade' : 'alidade-dark';
};

/**
 * Slot yang akan terisi bila pengguna mengklik peta sekarang.
 *
 * Satu sumber kebenaran untuk reticle, banner peta, dan dialog konfirmasi.
 * Sebelumnya ketiganya menyalin logika ini masing-masing dan mulai berbeda
 * begitu aturannya berubah. Mengembalikan `null` bila tidak ada slot yang
 * jelas jadi sasaran.
 */
export function targetSlotFor({ mode, propertyA, propertyB, armedSlot }) {
  if (mode !== 'battle') return null;
  if (!propertyA) return 'A';
  if (armedSlot) return armedSlot;
  return propertyB ? null : 'B';
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Language ────────────────────────────────────────────────
      lang: 'id',
      setLang: (lang) => set({ lang }),

      // ─── Appearance ──────────────────────────────────────────────
      // Dark remains the product default, but the selected theme is shared
      // by every surface so the toggle never creates a local-only island.
      theme: 'dark',
      setTheme: (theme) => {
        const nextTheme = theme === 'light' ? 'light' : 'dark';
        set({
          theme: nextTheme,
          baseMapStyle: baseMapStyleForTheme(nextTheme),
        });
      },

      // ─── Current state ─────────────────────────────────────────
      propertyA: null,
      propertyB: null,
      loading: false,
      aiLoading: false,
      currentAiAbortController: null,
      mode: 'audit', // 'audit' | 'battle'
      // Slot yang sedang menunggu klik peta: 'A' | 'B' | null. Boolean lama
      // tidak bisa mengungkapkan "sedang mengganti Lokasi A", jadi slot inilah
      // sumber kebenarannya. `selectingBattlePin` dipertahankan sebagai cermin
      // (armedSlot === 'B') supaya MapArea & AuditConfirmDialog tak berubah.
      armedSlot: null,
      selectingBattlePin: false,
      pendingAudit: null, // { lat: number, lng: number, isBattlePin?: boolean, address?: string }
      auditDrawerOpen: false,
      leftPanelOpen: true,
      cmdPaletteOpen: false,
      chatExpanded: false,
      chatDockDismissed: false,
      mapLayersOpen: false,
      simulatedPga: null,
      battleReportContent: null,
      battleReportMeta: null,
      battleReportLoading: false,

      // ─── Map Overlays & RAG Documents ──────────────────────────
      baseMapStyle: baseMapStyleForTheme('dark'), // 'alidade' | 'alidade-dark' | 'terrain' | 'street' | 'satellite'
      overlays: INITIAL_OVERLAYS,
      overlayOpacities: INITIAL_OVERLAY_OPACITIES,
      overlayStatuses: INITIAL_OVERLAY_STATUSES,
      overlaySources: INITIAL_OVERLAY_SOURCES,
      faultLayerSource: 'fallback',
      uploadedDocuments: [],

      // ─── Onboarding ───────────────────────────────────────────
      hasSeenOnboarding: false,
      onboardingActive: false,
      onboardingStep: 0,
      // Panel kiri menampilkan contoh laporan selama tur menyorotnya.
      // Transien — sengaja tidak masuk partialize.
      tourMockPanel: false,

      // ─── Persisted state ───────────────────────────────────────
      recentSearches: [],
      favorites: [],

      // ─── UI Toggles & Overlay Actions ──────────────────────────
      toggleLeftPanel: () =>
        set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
      setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen: Boolean(leftPanelOpen) }),
      setAuditDrawer: (open) => set({ auditDrawerOpen: open }),
      setCmdPalette: (open) => set({ cmdPaletteOpen: open }),
      setMapLayersOpen: (mapLayersOpen) => set({ mapLayersOpen: Boolean(mapLayersOpen) }),
      // Pindah mode ke audit mereset state lokasi A & B kembali ke awal
      setMode: (mode) => {
        if (mode === 'audit') {
          get().reset();
        } else {
          set({
            mode: 'battle',
            armedSlot: null,
            selectingBattlePin: false,
            pendingAudit: null,
          });
        }
      },

      armSlot: (slot) =>
        set({ armedSlot: slot, selectingBattlePin: slot === 'B' }),

      setSelectingBattlePin: (v) =>
        set({ armedSlot: v ? 'B' : null, selectingBattlePin: Boolean(v) }),

      clearPropertyB: () =>
        set({
          propertyB: null,
          armedSlot: null,
          selectingBattlePin: false,
          battleReportContent: null,
          battleReportMeta: null,
        }),

      swapSites: () => {
        const { propertyA, propertyB } = get();
        if (!propertyA || !propertyB) return;
        set({
          propertyA: propertyB,
          propertyB: propertyA,
          armedSlot: null,
          selectingBattlePin: false,
          battleReportContent: null,
          battleReportMeta: null,
        });
      },

      // Satu-satunya tempat yang memutuskan hasil audit masuk slot mana.
      // Dulu logikanya `isBattle || mode === 'battle'`, yang membuat klik
      // pertama di mode bandingkan jatuh ke propertyB sementara propertyA tetap
      // null — panel kiri lalu terkunci di EmptyState selamanya.
      resolveSlot: (explicitBattlePin = false) => {
        const { mode, propertyA, propertyB, armedSlot } = get();
        if (mode !== 'battle') return 'A';
        if (!propertyA) return 'A';
        if (explicitBattlePin || armedSlot === 'B') return 'B';
        if (armedSlot === 'A') return 'A';
        // Tanpa slot yang di-arm, klik peta berikutnya mengisi slot yang masih
        // kosong. Dulu selalu jatuh ke A, sehingga klik kedua di mode
        // bandingkan diam-diam menimpa lokasi yang baru saja diaudit.
        return propertyB ? 'A' : 'B';
      },
      setPendingAudit: (pendingAudit) => set({ pendingAudit }),
      confirmPendingAudit: () => {
        const { pendingAudit, processLocation } = get();
        if (pendingAudit) {
          const { lat, lng, isBattlePin } = pendingAudit;
          set({ pendingAudit: null });
          processLocation(lat, lng, isBattlePin);
        }
      },
      cancelPendingAudit: () => set({ pendingAudit: null }),
      setSimulatedPga: (v) => set({ simulatedPga: v }),
      setBaseMapStyle: (style) => set({ baseMapStyle: style }),
      setChatExpanded: (chatExpanded) =>
        set({
          chatExpanded: Boolean(chatExpanded),
          ...(chatExpanded ? { chatDockDismissed: false } : {}),
        }),
      setChatDockDismissed: (chatDockDismissed) =>
        set({ chatDockDismissed: Boolean(chatDockDismissed) }),
      setOverlayStatus: (key, status) =>
        set((s) => (
          Object.prototype.hasOwnProperty.call(s.overlayStatuses, key)
            ? { overlayStatuses: { ...s.overlayStatuses, [key]: status } }
            : s
        )),
      setOverlaySource: (key, source) =>
        set((s) => (
          Object.prototype.hasOwnProperty.call(s.overlaySources, key)
            ? { overlaySources: { ...s.overlaySources, [key]: source } }
            : s
        )),
      setFaultLayerSource: (faultLayerSource) => set({ faultLayerSource }),

      toggleOverlay: (key) =>
        set((s) => (
          Object.prototype.hasOwnProperty.call(s.overlays, key)
            ? {
                overlays: { ...s.overlays, [key]: !s.overlays[key] },
                overlayStatuses: {
                  ...s.overlayStatuses,
                  [key]: !s.overlays[key] ? 'loading' : 'idle',
                },
                overlaySources: {
                  ...s.overlaySources,
                  [key]: 'official',
                },
              }
            : s
        )),
      setOverlayOpacity: (key, val) =>
        set((s) => (
          Object.prototype.hasOwnProperty.call(s.overlayOpacities, key)
            ? { overlayOpacities: { ...s.overlayOpacities, [key]: val } }
            : s
        )),
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
      startOnboarding: () => set({
        onboardingActive: true,
        onboardingStep: 0,
        // Permukaan lain tidak boleh menutupi target yang disorot tur.
        cmdPaletteOpen: false,
        auditDrawerOpen: false,
        mapLayersOpen: false,
      }),
      stopOnboarding: () => set({ onboardingActive: false, onboardingStep: 0, hasSeenOnboarding: true, tourMockPanel: false }),
      nextOnboardingStep: () => set((s) => ({ onboardingStep: s.onboardingStep + 1 })),
      prevOnboardingStep: () => set((s) => ({ onboardingStep: Math.max(0, s.onboardingStep - 1) })),
      // Lompatan atomik dari progress dots — satu set, bukan N langkah.
      // Batas atas divalidasi di komponen (jumlah langkah di tangan sana).
      jumpToOnboardingStep: (index) => set({ onboardingStep: Math.max(0, Math.floor(index)) }),
      setTourMockPanel: (tourMockPanel) => set({ tourMockPanel: Boolean(tourMockPanel) }),

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

        const { currentAiAbortController, lang } = get();
        const slot = get().resolveSlot(isBattle);
        const battleTarget = slot === 'B';

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

          // Menulis slot mana pun membuat laporan perbandingan lama basi:
          // laporan itu dibuat untuk pasangan lokasi yang sudah tidak berlaku.
          const staleReport = {
            battleReportContent: null,
            battleReportMeta: null,
          };

          if (battleTarget) {
            set({
              propertyB: data,
              loading: false,
              armedSlot: null,
              selectingBattlePin: false,
              leftPanelOpen: true,
              ...staleReport,
            });
          } else {
            set((state) => ({
              propertyA: {
                ...data,
                aiReport: { reportLoading: true },
              },
              // Di mode bandingkan, mengganti Lokasi A mempertahankan Lokasi B.
              // Di mode audit, audit baru memulai dari bersih.
              propertyB: state.mode === 'battle' ? state.propertyB : null,
              loading: false,
              aiLoading: true,
              armedSlot: null,
              selectingBattlePin: false,
              leftPanelOpen: true,
              ...staleReport,
            }));
          }

          get().addRecentSearch({ label: data.address, lat, lng, timestamp: Date.now() });

          // Beri tahu jujur kalau audit belum layak dianggap final.
          if (data.audit_status && data.audit_status !== 'valid') {
            toast.warning(
              lang === 'en'
                ? `Audit is ${data.audit_status}.`
                : `Audit masih ${data.audit_status}.`,
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
                // Kegagalan lapis AI ditelan diam-diam sebelumnya, jadi audit
                // yang jatuh ke narasi prosedural tak bisa dibedakan dari yang
                // memang dilayani mesin. `warn`, bukan `error`: aplikasi pulih
                // dengan hasil deterministik yang tetap sahih.
                console.warn('AI narrative unavailable, using deterministic fallback', error);
                const fallbackNarrative = generateProceduralNarrative(data, lang);
                set((state) => ({
                  propertyA: state.propertyA
                    ? {
                        ...state.propertyA,
                        aiReport: fallbackNarrative,
                        narrative: fallbackNarrative,
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
      reset: () => {
        const { currentAiAbortController } = get();
        if (currentAiAbortController) currentAiAbortController.abort();
        set({
          propertyA: null,
          propertyB: null,
          loading: false,
          aiLoading: false,
          currentAiAbortController: null,
          simulatedPga: null,
          pendingAudit: null,
          auditDrawerOpen: false,
          battleReportContent: null,
          battleReportMeta: null,
          battleReportLoading: false,
          armedSlot: null,
          selectingBattlePin: false,
          mode: 'audit',
        });
      },
    }),
    {
      name: 'safe-house-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        favorites: state.favorites,
        lang: state.lang,
        theme: state.theme,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      merge: (persistedState, currentState) => {
        const savedState = persistedState && typeof persistedState === 'object'
          ? persistedState
          : {};
        const theme = savedState.theme === 'light' ? 'light' : 'dark';
        return {
          ...currentState,
          ...savedState,
          theme,
          baseMapStyle: baseMapStyleForTheme(theme),
        };
      },
    }
  )
);

if (typeof window !== 'undefined') window.useAppStore = useAppStore;
