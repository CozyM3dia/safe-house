import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText,
  LayoutDashboard,
  Loader2,
  MapPin,
  Map as MapIcon,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CountUp } from './motion';
import MockMap from './MockMap';

/**
 * AppMockup: rekonstruksi UI /app yang interaktif untuk hero landing.
 * Panel interaktif: Peta / Hasil / Laporan berubah dinamis sesuai lokasi
 * yang dipilih (Pahoman, Monas, Gedung Sate, Malioboro, atau klik koordinat baru).
 */

const EASE = [0.22, 1, 0.36, 1];

const AUDIT_STEPS = ['mockStep1', 'mockStep2', 'mockStep3'];

const PRESET_DATA = {
  'Pahoman, Bandar Lampung': {
    score: 65,
    band: 'SEDANG',
    bandColor: '#f0b95a',
    note: 'Layak dilanjutkan dengan catatan verifikasi geoteknik.',
    subscores: [
      { key: 'seismik', value: 40, color: '#e0a35c' },
      { key: 'banjir', value: 61, color: '#d4956a' },
      { key: 'tanah', value: 10, color: '#9db48a' },
      { key: 'longsor', value: 33, color: '#b98a6e' },
    ],
    metrics: [
      { key: 'Vs30', value: '450', unit: 'm/s', sub: 'SC, tanah keras' },
      { key: 'Pga', value: '0.42', unit: 'g', sub: 'akselerasi puncak' },
      { key: 'Fs', value: '2.00', unit: '', sub: 'stabil (Seed & Idriss)' },
      { key: 'Elev', value: '94', unit: 'm', sub: 'standar' },
    ],
    aiResume:
      'Kelas Situs SC (Tanah Keras) dengan PGA 0.42g (permukaan 0.504g). Lapisan tanah stabil terhadap likuefaksi (FS 2.00). Fondasi dangkal/rakit layak untuk 1–2 lantai dengan penulangan gempa SNI 1726:2019.',
  },
  'Monumen Nasional (Monas), Jakarta': {
    score: 74,
    band: 'SEDANG - BAIK',
    bandColor: '#9db48a',
    note: 'Lahan datar, mitigasi utama pada muka air tanah dangkal.',
    subscores: [
      { key: 'seismik', value: 32, color: '#e0a35c' },
      { key: 'banjir', value: 70, color: '#d4956a' },
      { key: 'tanah', value: 28, color: '#9db48a' },
      { key: 'longsor', value: 5, color: '#b98a6e' },
    ],
    metrics: [
      { key: 'Vs30', value: '320', unit: 'm/s', sub: 'SD, tanah sedang' },
      { key: 'Pga', value: '0.28', unit: 'g', sub: 'zona seismik sedang' },
      { key: 'Fs', value: '1.75', unit: '', sub: 'stabil terkendali' },
      { key: 'Elev', value: '12', unit: 'm', sub: 'dataran rendah' },
    ],
    aiResume:
      'Endapan aluvial pantai (Kelas SD) dengan PGA 0.28g. Muka air tanah dangkal memerlukan waterproofing dinding fondasi basemen, namun risiko likuefaksi dan pergeseran sesar sangat rendah.',
  },
  'Gedung Sate, Bandung': {
    score: 58,
    band: 'SEDANG',
    bandColor: '#e0a35c',
    note: 'Cekungan Bandung, perhatikan amplifikasi tanah lunak.',
    subscores: [
      { key: 'seismik', value: 62, color: '#e0a35c' },
      { key: 'banjir', value: 25, color: '#d4956a' },
      { key: 'tanah', value: 45, color: '#9db48a' },
      { key: 'longsor', value: 20, color: '#b98a6e' },
    ],
    metrics: [
      { key: 'Vs30', value: '240', unit: 'm/s', sub: 'SE, tanah lunak' },
      { key: 'Pga', value: '0.52', unit: 'g', sub: 'amplifikasi cekungan' },
      { key: 'Fs', value: '1.45', unit: '', sub: 'waspada lapisan pasir' },
      { key: 'Elev', value: '710', unit: 'm', sub: 'dataran tinggi' },
    ],
    aiResume:
      'Cekungan lakustrin Bandung memicu amplifikasi guncangan gempa (PGA 0.52g, Kelas SE). Rekomendasi struktur kaku bertingkat atau fondasi mini-pile guna mencegah penurunan diferensial.',
  },
  'Kawasan Malioboro, Yogyakarta': {
    score: 61,
    band: 'SEDANG',
    bandColor: '#f0b95a',
    note: 'Pengaruh Sesar Opak dan material pasir vulkanik.',
    subscores: [
      { key: 'seismik', value: 55, color: '#e0a35c' },
      { key: 'banjir', value: 30, color: '#d4956a' },
      { key: 'tanah', value: 35, color: '#9db48a' },
      { key: 'longsor', value: 15, color: '#b98a6e' },
    ],
    metrics: [
      { key: 'Vs30', value: '380', unit: 'm/s', sub: 'SD, pasir vulkanik' },
      { key: 'Pga', value: '0.46', unit: 'g', sub: 'zona sesar aktif' },
      { key: 'Fs', value: '1.62', unit: '', sub: 'aman stabil' },
      { key: 'Elev', value: '115', unit: 'm', sub: 'lereng vulkanik' },
    ],
    aiResume:
      'Endapan vulkanik berpori dengan PGA 0.46g akibat kedekatan Sesar Opak. Wajib ikatan sloof-kolom monolitik anti-retak gempa sesuai standar SNI 1726:2019.',
  },
};

function getAuditDataForPoint(point) {
  if (point?.name && PRESET_DATA[point.name]) {
    return PRESET_DATA[point.name];
  }
  const lat = point?.lat ?? -5.4292;
  const lon = point?.lon ?? 105.261;
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
  const score = Math.round(55 + (seed % 30));
  const vs30 = Math.round(260 + ((seed * 7) % 240));
  const pga = (0.24 + ((seed * 13) % 0.36)).toFixed(2);
  const fs = (1.45 + ((seed * 17) % 0.75)).toFixed(2);
  const elev = Math.round(15 + ((seed * 31) % 250));
  const isGood = score >= 70;
  const isModerate = score >= 55;
  const band = isGood ? 'BAIK' : isModerate ? 'SEDANG' : 'WASPADA';
  const bandColor = isGood ? '#9db48a' : isModerate ? '#f0b95a' : '#e0a35c';

  return {
    score,
    band,
    bandColor,
    note: isGood ? 'Kondisi geoteknik kondusif untuk pembangunan.' : 'Layak dilanjutkan dengan catatan teknis terarah.',
    subscores: [
      { key: 'seismik', value: Math.round(25 + ((seed * 3) % 45)), color: '#e0a35c' },
      { key: 'banjir', value: Math.round(20 + ((seed * 5) % 55)), color: '#d4956a' },
      { key: 'tanah', value: Math.round(15 + ((seed * 7) % 35)), color: '#9db48a' },
      { key: 'longsor', value: Math.round(10 + ((seed * 11) % 30)), color: '#b98a6e' },
    ],
    metrics: [
      { key: 'Vs30', value: String(vs30), unit: 'm/s', sub: vs30 > 360 ? 'SC, tanah keras' : 'SD, tanah sedang' },
      { key: 'Pga', value: pga, unit: 'g', sub: 'akselerasi tanah' },
      { key: 'Fs', value: fs, unit: '', sub: Number(fs) >= 1.5 ? 'stabil' : 'waspada' },
      { key: 'Elev', value: String(elev), unit: 'm', sub: 'mdpl' },
    ],
    aiResume: `Sintesis koordinat (${lat.toFixed(4)}, ${lon.toFixed(4)}): Skor ${score}/100 (${band}). PGA terestimasi ${pga}g dengan Vs30 ${vs30} m/s dan FS Likuefaksi ${fs}. Desain struktural mengacu standar parameter SNI 1726:2019.`,
  };
}

export default function AppMockup({ t }) {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const startedRef = useRef(false);

  const [tab, setTab] = useState('map');
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [step, setStep] = useState(0);
  const [point, setPoint] = useState({ lat: -5.4292, lon: 105.261, name: 'Pahoman, Bandar Lampung' });
  const [history, setHistory] = useState([
    { lat: -5.4292, lon: 105.261, name: 'Pahoman, Bandar Lampung' },
    { lat: -6.1754, lon: 106.8272, name: 'Monumen Nasional (Monas), Jakarta' },
    { lat: -6.9025, lon: 107.6186, name: 'Gedung Sate, Bandung' },
    { lat: -7.7956, lon: 110.3695, name: 'Kawasan Malioboro, Yogyakarta' },
  ]);
  const timersRef = useRef([]);
  const phaseRef = useRef('idle');
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runSequence = useCallback(
    (nextPoint) => {
      if (phaseRef.current === 'running') return;
      clearTimers();

      // Pastikan nextPoint adalah objek koordinat valid (bukan React SyntheticEvent)
      if (
        nextPoint &&
        typeof nextPoint.lat === 'number' &&
        typeof nextPoint.lon === 'number' &&
        !nextPoint.nativeEvent &&
        !nextPoint.target
      ) {
        setPoint(nextPoint);
        setHistory((h) =>
          h.some((p) => p.name === nextPoint.name)
            ? h
            : [...h, nextPoint].slice(-4)
        );
      }

      setTab('map');
      setPhase('running');
      setStep(1);

      const unit = reduce ? 0 : 750;
      if (unit === 0) {
        setStep(3);
        setPhase('done');
        return;
      }

      const t1 = setTimeout(() => {
        setStep(2);
      }, unit);

      const t2 = setTimeout(() => {
        setStep(3);
      }, unit * 2);

      const t3 = setTimeout(() => {
        setPhase('done');
      }, unit * 3 + 200);

      timersRef.current.push(t1, t2, t3);
    },
    [clearTimers, reduce]
  );

  /* Klik peta: pindahkan pin + jalankan audit demo di titik itu. */
  const handleMapClick = useCallback(
    (lat, lon) => {
      if (phaseRef.current === 'running') return;
      window.dispatchEvent(new Event('lp-mock-map-click'));
      const name = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      runSequence({ lat, lon, name });
    },
    [runSequence]
  );

  /* Auto-demo sekali saat mockup pertama masuk viewport. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const id = setTimeout(() => runSequence(), 900);
            timersRef.current.push(id);
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [runSequence]);

  /* Cleanup all timers on unmount */
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const running = phase === 'running';
  const done = phase === 'done';

  const data = useMemo(() => getAuditDataForPoint(point), [point]);

  const navItems = [
    { key: 'map', icon: MapIcon, label: t('mockNavMap') },
    { key: 'result', icon: LayoutDashboard, label: t('mockNavResult') },
    { key: 'report', icon: FileText, label: t('mockNavReport') },
  ];

  return (
    <div
      ref={rootRef}
      className="lp-mock relative overflow-hidden rounded-[18px] border border-[color:var(--lp-line)] bg-[#141210] text-left shadow-[0_50px_120px_rgba(0,0,0,0.5)]"
      data-theme="dark"
    >
      {/* Bar atas: traffic lights + tab center + chip skenario */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#181512] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#5c4d3d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4a3f33]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#6b5138]" />
        <div className="mx-auto flex items-center gap-1 rounded-lg bg-white/[0.05] p-0.5">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`relative flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                tab === item.key ? 'text-[#f0e4cc]' : 'text-[#a08c74] hover:text-[#d8c8b0]'
              }`}
            >
              {tab === item.key && (
                <motion.span
                  layoutId="lp-mock-tab"
                  className="absolute inset-0 rounded-md bg-[#241d17]"
                  transition={{ duration: 0.35, ease: EASE }}
                />
              )}
              <item.icon size={12} className="relative z-10" aria-hidden="true" />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>
        <span className="lp-mono hidden rounded-full border border-[#d4956a]/30 bg-[#d4956a]/10 px-2.5 py-0.5 text-[8.5px] tracking-[0.14em] text-[#d4956a] sm:inline-flex">
          {t('mockStatusChip')}
        </span>
      </div>

      <div className="flex min-h-[430px]">
        {/* ── Sidebar ── */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-white/[0.06] bg-[#161311] p-3 sm:flex">
          <p className="lp-mono px-2 pb-2 text-[8.5px] uppercase tracking-[0.18em] text-[#7d6b57]">
            {t('mockPointsTitle')}
          </p>
          <p className="px-2 pb-2 text-[9.5px] leading-snug text-[#7d6b57]">
            {t('mockPointsHint')}
          </p>
          <ul className="flex flex-col gap-1 overflow-y-auto">
            {history.map((pt) => {
              const active = Math.abs(pt.lat - point.lat) < 1e-6 && Math.abs(pt.lon - point.lon) < 1e-6;
              return (
                <li key={`${pt.lat},${pt.lon}`}>
                  <button
                    type="button"
                    onClick={() => runSequence(pt)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                      active
                        ? 'bg-[#241d17] text-[#f0e4cc]'
                        : 'text-[#a08c74] hover:bg-white/[0.04] hover:text-[#d8c8b0]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        active ? 'bg-[#d4956a]' : 'bg-[#4a3f33]'
                      }`}
                    />
                    <span className="truncate">{pt.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <button
              type="button"
              onClick={() => runSequence()}
              disabled={running}
              className="btn-shine relative flex h-9 items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#d4956a] text-[11px] font-semibold text-[#241a12] transition-transform hover:enabled:scale-[1.02] disabled:opacity-70"
            >
              {running ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : done ? (
                <RotateCcw size={13} aria-hidden="true" />
              ) : (
                <Play size={13} aria-hidden="true" />
              )}
              {running ? t('mockStep' + step) : done ? t('mockRerun') : t('mockRunAudit')}
            </button>
            <span className="lp-mono truncate rounded-md bg-white/[0.04] px-2 py-1 text-center text-[9px] text-[#a08c74]">
              {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
            </span>
          </div>
        </aside>

        {/* ── Konten ── */}
        <div className="relative min-h-[430px] flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {tab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="absolute inset-0"
              >
                <MockMapPanel
                  t={t}
                  point={point}
                  data={data}
                  running={running}
                  step={step}
                  done={done}
                  onMapClick={handleMapClick}
                />
              </motion.div>
            )}
            {tab === 'result' && (
              <motion.div
                key={`result-${point.lat}-${point.lon}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="absolute inset-0 overflow-y-auto p-5"
              >
                <MockResult t={t} point={point} data={data} />
              </motion.div>
            )}
            {tab === 'report' && (
              <motion.div
                key={`report-${point.lat}-${point.lon}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="absolute inset-0 overflow-y-auto p-5"
              >
                <MockReport t={t} point={point} data={data} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tombol run untuk layar sentuh (sidebar tersembunyi); saat running
          overlay progres sudah menutupi peta, jadi tombolnya disembunyikan. */}
      {!running && (
        <button
          type="button"
          onClick={() => runSequence()}
          className="btn-shine absolute bottom-4 right-4 z-10 flex h-9 items-center gap-2 rounded-full bg-[#d4956a] px-4 text-[11px] font-semibold text-[#241a12] shadow-lg sm:hidden"
        >
          {done ? <RotateCcw size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          {done ? t('mockRerun') : t('mockRunAudit')}
        </button>
      )}
    </div>
  );
}

/* ── Peta: Leaflet asli + tile Stadia, draggable + klik = audit ─────────── */
function MockMapPanel({ t, point, data, running, step, done, onMapClick }) {
  return (
    <div className="relative h-full min-h-[430px] w-full overflow-hidden">
      <MockMap
        lat={point.lat}
        lon={point.lon}
        zoom={14}
        interactive
        onMapClick={onMapClick}
      />

      {/* Hint klik (hilang permanen setelah klik pertama atau selesai audit) */}
      <KlikHint t={t} done={done} />

      {/* Label kota */}
      <span className="pointer-events-none absolute bottom-4 left-5 text-[12px] font-medium tracking-wide text-[#c9ab88] drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
        {point.name || t('mockCityLabel')}
      </span>

      {/* Floating HUD status saat audit berjalan (tanpa menutupi peta) */}
      <AnimatePresence>
        {running && (
          <motion.div
            key="audit-overlay"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="pointer-events-none absolute bottom-4 right-4 z-40 w-[280px] sm:w-[320px] rounded-xl border border-[#d4956a]/40 bg-[#161311]/95 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-[#d4956a]" />
                <span className="lp-mono text-[10px] font-bold uppercase tracking-wider text-[#d4956a]">
                  {t('mockStatusChip')} · COMPUTING
                </span>
              </div>
              <span className="lp-mono text-[9px] text-[#8b7a69]">SNI 1726:2019</span>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {AUDIT_STEPS.map((key, i) => {
                const n = i + 1;
                const active = step >= n;
                const current = step === n;
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      {active ? (
                        current ? (
                          <Loader2 size={11} className="animate-spin text-[#d4956a]" aria-hidden="true" />
                        ) : (
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#d4956a] text-[8px] font-bold text-[#241a12]">
                            ✓
                          </span>
                        )
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full border border-[#4a3f33]" />
                      )}
                    </div>
                    <span className={`text-[11px] ${active ? 'font-medium text-[#e8d9c0]' : 'text-[#7d6b57]'}`}>
                      {t(key)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#d4956a]/80 via-[#d4956a] to-[#e8a25c]"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / AUDIT_STEPS.length) * 100}%` }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chip skor melayang setelah selesai */}
      <AnimatePresence>
        {done && (
          <motion.div
            key="score-chip"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1512]/95 px-3.5 py-2 shadow-2xl"
          >
            <span className="lp-serif text-[1.6rem] leading-none" style={{ color: data.bandColor }}>{data.score}</span>
            <span className="flex flex-col items-start">
              <span className="text-[10px] font-bold tracking-wide" style={{ color: data.bandColor }}>{data.band}</span>
              <span className="lp-mono text-[8px] text-[#7d6b57]">SKOR S.A.F.E</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Hint klik peta: muncul sampai pengguna klik pertama atau audit selesai ─── */
let hintDismissed = false;

function KlikHint({ t, done }) {
  const [gone, setGone] = useState(hintDismissed);
  useEffect(() => {
    if (gone) return undefined;
    const dismiss = () => {
      hintDismissed = true;
      setGone(true);
    };
    window.addEventListener('lp-mock-map-click', dismiss, { once: true });
    return () => window.removeEventListener('lp-mock-map-click', dismiss);
  }, [gone]);

  if (done) return null;

  return (
    <AnimatePresence>
      {!gone && !hintDismissed && (
        <motion.div
          key="klik-hint"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: EASE, delay: 1.6 }}
          className="pointer-events-none absolute left-4 top-4 z-10"
        >
          <span className="lp-mono inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4956a]/35 bg-[#1a1512]/95 px-3 py-1.5 text-[9px] tracking-wide text-[#e8d9c0] shadow-xl">
            <MapPin size={11} className="text-[#d4956a]" aria-hidden="true" />
            {t('mockKlikHint')}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Panel hasil: skor besar + metrik + sub-skor dinamis presisi ──────────── */
function MockResult({ t, point, data }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Kartu skor */}
      <div className="rounded-xl border border-white/[0.07] bg-[#1a1512] p-3.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="lp-mono text-[8px] uppercase tracking-[0.18em] text-[#7d6b57]">
              {t('mockScoreLabel')}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="lp-serif text-[2.2rem] leading-none" style={{ color: data.bandColor }}>
                <CountUp to={data.score} duration={0.6} />
              </span>
              <span className="text-[10px] text-[#7d6b57]">/100</span>
            </div>
            <p className="mt-1 text-[10px] text-[#a08c74]">{data.note}</p>
          </div>
          <span
            className="rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide"
            style={{
              borderColor: `${data.bandColor}55`,
              backgroundColor: `${data.bandColor}15`,
              color: data.bandColor,
            }}
          >
            {data.band}
          </span>
        </div>

        {/* Sub-skor bar */}
        <div className="mt-3">
          <p className="lp-mono mb-1.5 text-[8px] uppercase tracking-[0.18em] text-[#7d6b57]">
            {t('mockSubscoresTitle')}
          </p>
          <div className="flex flex-col gap-1">
            {data.subscores.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="w-12 text-[9px] capitalize text-[#a08c74]">{s.key}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                  />
                </div>
                <span className="lp-num w-5 text-right text-[9px] text-[#c9ab88]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrik 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {data.metrics.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE, delay: i * 0.04 }}
            className="rounded-xl border border-white/[0.07] bg-[#1a1512] p-2.5"
          >
            <p className="lp-mono text-[7.5px] uppercase tracking-[0.16em] text-[#7d6b57]">
              {m.key === 'Vs30'
                ? t('mockMetricVs30')
                : m.key === 'Pga'
                  ? t('mockMetricPga')
                  : m.key === 'Fs'
                    ? t('mockMetricFs')
                    : t('mockMetricElev')}
            </p>
            <p className="mt-0.5 text-[1.05rem] font-semibold leading-none text-[#f0e4cc]">
              {m.value}
              {m.unit ? <span className="ml-1 text-[9px] font-normal text-[#7d6b57]">{m.unit}</span> : null}
            </p>
            <p className="mt-0.5 text-[8.5px] text-[#a08c74]">{m.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Panel laporan: header dokumen + AI resume + baris ringkas ──────────── */
function MockReport({ t, point, data }) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Header Dokumen */}
      <div className="rounded-xl border border-white/[0.07] bg-[#f4efe6] p-3 text-[#241f1a]">
        <p className="lp-mono text-[7.5px] uppercase tracking-[0.16em] text-[#8b7355]">
          {t('mockReportTitle')}
        </p>
        <p className="lp-serif mt-1 text-[1rem] font-semibold leading-snug text-[#241f1a]">
          {point.name || `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`}
        </p>
        <div className="lp-mono mt-1 flex items-center gap-2 text-[8px] text-[#6b5a48]">
          <span>{point.lat.toFixed(4)}, {point.lon.toFixed(4)}</span>
          <span aria-hidden="true">·</span>
          <span>SNI 1726:2019</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 border-t border-[#d8cdb8] pt-2">
          <span className="lp-serif text-[1.35rem] leading-none text-[#b45309]">{data.score}</span>
          <span className="rounded-full border border-[#b45309]/30 bg-[#b45309]/10 px-2 py-0.5 text-[8.5px] font-bold text-[#b45309]">
            {data.band}
          </span>
        </div>
      </div>

      {/* ── Brief S.A.F.E AI Resume ── */}
      <div className="rounded-xl border border-[#d4956a]/35 bg-[#1a1512] p-2.5 text-[#f5ebd9] shadow-md">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1">
          <Sparkles size={11} className="text-[#d4956a]" />
          <span className="lp-mono text-[8.5px] font-bold uppercase tracking-wider text-[#d4956a]">
            Ringkasan S.A.F.E AI
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#d4c5b3]">
          {data.aiResume}
        </p>
      </div>

      <div className="flex gap-2">
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 text-[9.5px] text-[#c9ab88]">
          <FileText size={11} aria-hidden="true" />
          {t('mockReportDownload')}
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 text-[9.5px] text-[#c9ab88]">
          <MapPin size={11} aria-hidden="true" />
          {t('mockReportShare')}
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-[#1a1512] p-2.5">
        {data.metrics.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.1 + i * 0.05 }}
            className="flex items-center justify-between border-b border-white/[0.05] py-1 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="lp-mono text-[7.5px] uppercase tracking-[0.14em] text-[#7d6b57]">
                {m.key}
              </span>
              <span className="text-[9.5px] font-medium text-[#e8d9c0]">
                {m.value} {m.unit}
              </span>
            </div>
            <span className="text-[8.5px] text-[#8b7a69]">{m.sub}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
