import { useState } from 'react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLpInView } from '../../../hooks/useLpMotion';

/**
 * FinalCtaSection: Full Remake — Simpel, Elegan, Anti AI-Slop.
 * Mempertahankan lanskap gambar kaki web dengan integrasi gradasi ultra-halus,
 * dipadukan dengan search console kaca kristal, preset alamat siap klik,
 * dan tipografi editorial berwibawa.
 */

const PRESETS = [
  { name: 'Pahoman, Bandar Lampung', lat: -5.4292, lon: 105.261 },
  { name: 'Monas, Jakarta', lat: -6.17539, lon: 106.82715 },
  { name: 'Gedung Sate, Bandung', lat: -6.90248, lon: 107.61867 },
  { name: 'Malioboro, Jogja', lat: -7.79259, lon: 110.36584 },
];

export default function FinalCtaSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.2 });
  const reduce = useReducedMotion();
  const navigate = useLpNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const parseCoord = (raw) => {
    const text = raw.trim();
    if (!text) return null;
    const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };
    const bang = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (bang) return { lat: parseFloat(bang[1]), lon: parseFloat(bang[2]) };
    const pair = text.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (pair) return { lat: parseFloat(pair[1]), lon: parseFloat(pair[2]) };
    return null;
  };

  const submit = (raw) => {
    const text = raw.trim();
    if (!text) {
      navigate('/app');
      return;
    }
    const coord = parseCoord(text);
    if (coord && Math.abs(coord.lat) <= 90 && Math.abs(coord.lon) <= 180) {
      setError('');
      navigate(`/app?lat=${coord.lat.toFixed(5)}&lon=${coord.lon.toFixed(5)}`);
      return;
    }

    // Cek apakah cocok dengan preset
    const foundPreset = PRESETS.find(
      (p) => p.name.toLowerCase().includes(text.toLowerCase())
    );
    if (foundPreset) {
      setError('');
      navigate(`/app?lat=${foundPreset.lat.toFixed(5)}&lon=${foundPreset.lon.toFixed(5)}`);
      return;
    }

    // Default ke /app
    setError('');
    navigate(`/app?lat=-5.42920&lon=105.26100`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    submit(value);
  };

  const handlePresetClick = (preset) => {
    setValue(preset.name);
    navigate(`/app?lat=${preset.lat.toFixed(5)}&lon=${preset.lon.toFixed(5)}`);
  };

  return (
    <section
      id="mulai"
      ref={rootRef}
      className="relative isolate overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36"
      aria-labelledby="cta-title"
    >
      {/* ── Latar Gambar Lanskap dengan Masking Atmosferik Halus ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          animate={inView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full"
        >
          <img
            src="/landing/footer-redesign.jpg"
            width={1920}
            height={900}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center brightness-90 opacity-75"
            style={{
              maskImage:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.4) 90%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.4) 90%, transparent 100%)',
            }}
          />
        </motion.div>

        {/* Gradien pelindung atas & bawah */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12100d] via-[#12100d]/50 to-[#12100d]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#12100d] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#12100d] to-transparent" />
      </div>

      <div className="lp-container relative z-10 flex flex-col items-center text-center">
        {/* 2-Part Contrast Headline */}
        <h2
          id="cta-title"
          className="max-w-[22ch] text-balance font-sans text-[clamp(2.3rem,5.2vw,4rem)] font-bold leading-[1.06] tracking-[-0.025em] text-[#faf7f1]"
        >
          <span className="block drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            Cukup satu alamat properti,
          </span>
          <span className="lp-serif block font-normal italic text-[#f3d3a8] drop-shadow-[0_4px_24px_rgba(212,149,106,0.35)]">
            parameter SNI siap lampir.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-5 max-w-[56ch] text-[1.05rem] leading-relaxed text-[#dcd1c0]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {t('ctaSub')}
        </p>

        {/* ── Console Pencarian Kaca Elegan ── */}
        <div className="mt-9 w-full max-w-2xl px-2">
          <form
            onSubmit={onSubmit}
            className="group relative flex flex-col items-center gap-2 rounded-2xl border border-white/[0.14] bg-[#18130f]/90 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.1)_inset] backdrop-blur-2xl transition-all duration-300 focus-within:border-amber-500/50 focus-within:shadow-[0_20px_50px_rgba(212,149,106,0.25)] sm:flex-row"
            noValidate
          >
            <label htmlFor="cta-address-input" className="sr-only">
              {t('ctaInputLabel')}
            </label>
            <div className="flex w-full flex-1 items-center gap-3 px-3 py-1.5">
              <MapPin size={18} className="shrink-0 text-[#d4956a]" aria-hidden="true" />
              <input
                id="cta-address-input"
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                placeholder="Ketik alamat properti, nama jalan, atau koordinat..."
                className="w-full bg-transparent text-[0.95rem] text-[#f5ebd9] placeholder-[#9a8573] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4956a] to-[#c27f52] px-6 text-[0.92rem] font-bold text-[#14100c] shadow-[0_4px_20px_rgba(212,149,106,0.4)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] sm:w-auto"
            >
              <span>{t('ctaSubmit')}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          {error ? (
            <p role="alert" className="mt-2 text-center text-[0.82rem] font-medium text-rose-400">
              {error}
            </p>
          ) : null}

          {/* Quick Preset Location Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11.5px] font-medium text-[#a89582] mr-1">Coba cepat:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetClick(p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#1e1814]/75 px-3 py-1 text-[11px] font-medium text-[#e8d9c0] transition-all duration-200 hover:border-amber-500/30 hover:bg-[#28201a] hover:text-white active:scale-95"
              >
                <Compass size={11} className="text-[#d4956a]" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {/* Trust Value Badges Line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11.5px] font-medium text-[#c4b5a2]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#d4956a]" />
              5 Sumber Data Resmi Pemerintah
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#d4956a]" />
              Gratis · Tanpa Perlu Akun
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-[#d4956a]" />
              Format Siap Lampiran PBG
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
