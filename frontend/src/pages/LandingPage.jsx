import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

import '../styles/landing-v2.css';
import LandingNav from '../components/landing/v2/LandingNav';
import LandingBackdrop from '../components/landing/v2/LandingBackdrop';
import HeroSection from '../components/landing/v2/HeroSection';
import BentoSection from '../components/landing/v2/BentoSection';
import AnalysisRailSection from '../components/landing/v2/AnalysisRailSection';
import MissionSection from '../components/landing/v2/MissionSection';
import UseCasesSection from '../components/landing/v2/UseCasesSection';
import ShowcaseSection from '../components/landing/v2/ShowcaseSection';
import DeepDiveSection from '../components/landing/v2/DeepDiveSection';
import PipelineSection from '../components/landing/v2/PipelineSection';
import SampleReportSection from '../components/landing/v2/SampleReportSection';
import TestimonialSection from '../components/landing/v2/TestimonialSection';
import FaqSection from '../components/landing/v2/FaqSection';
import FinalCtaSection from '../components/landing/v2/FinalCtaSection';
import LandingFooter from '../components/landing/v2/LandingFooter';
import LandingCursor from '../components/landing/LandingCursor';

import { COPY } from './copy/landingCopy';

/**
 * LandingPage v2, "Arsip Tanah" (Earthen Dossier).
 *
 * Rombak total halaman publik: ritme editorial terang (kertas hangat)
 * dengan bukti produk ASLI dalam jendela gelap berbingkai ganda.
 * /app, engine, API, dan rute lain tidak disentuh.
 *
 * Kontrak yang dipertahankan:
 * - COPY dict bilingual (id/en) + t(), semua string baru ada di kedua bahasa.
 * - header + h1 tanpa overflow 320–1440px; menu mobile dengan
 *   aria-label "Open navigation"/"Close navigation" (test:mobile).
 * - components/landing/CTASection.jsx lama tetap ada (ui_quality_contract
 *   membaca file itu); halaman ini memakai FinalCtaSection + LandingFooter.
 */
export default function LandingPage() {
  const lang = useAppStore((s) => s.lang);
  const dict = COPY[lang] || COPY.id;
  const t = useCallback((key) => dict[key] ?? COPY.id[key] ?? key, [dict]);

  useEffect(() => {
    document.title = 'Cek Risiko Tanah Properti dari Alamat | S.A.F.E House';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Ketik alamat properti, langsung dapat parameter SNI 1726:2019: kelas situs, PGA desain, risiko likuefaksi, dan banjir — dari data resmi BNPB & PuSGeN. Gratis, tanpa akun.';

    // Landing memakai scroll dokumen (dikelola AppPreferences via document-scroll).
    document.documentElement.classList.add('landing-scroll');
    return () => {
      document.documentElement.classList.remove('landing-scroll');
    };
  }, []);

  return (
    <div className="lp relative isolate flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden">
      {/* Latar penuh halaman: kontur topografi WebGL (fixed, z -10) */}
      <LandingBackdrop />
      <LandingNav t={t} />

      <main>
        {/* 1-2. Hero + jendela produk */}
        <HeroSection t={t} />

        {/* 2b. Bento: di dalam app */}
        <BentoSection t={t} />

        {/* 3. Rail lapisan analisis */}
        <AnalysisRailSection t={t} />

        {/* 4. Misi editorial */}
        <MissionSection t={t} />

        {/* 5. Tiga kartu use-case */}
        <UseCasesSection t={t} />

        {/* 6. Showcase utama */}
        <ShowcaseSection t={t} />

        {/* 8. Deep-dive selang-seling */}
        <DeepDiveSection t={t} />

        {/* 10. Pipeline audit */}
        <PipelineSection t={t} />

        {/* 11. Sample report */}
        <SampleReportSection t={t} />

        {/* 11b. Testimoni pelaku industri */}
        <TestimonialSection t={t} />

        {/* 12. FAQ */}
        <FaqSection t={t} />

        {/* 13. CTA koordinat final */}
        <FinalCtaSection t={t} />
      </main>

      {/* 14. Footer */}
      <LandingFooter t={t} />
      <LandingCursor />
    </div>
  );
}
