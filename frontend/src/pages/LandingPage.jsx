import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

import '../styles/landing-v2.css';
import LandingNav from '../components/landing/v2/LandingNav';
import LandingBackdrop from '../components/landing/v2/LandingBackdrop';
import HeroSection from '../components/landing/v2/HeroSection';

import { COPY } from './copy/landingCopy';

const BentoSection = lazy(() => import('../components/landing/v2/BentoSection'));
const AnalysisRailSection = lazy(() => import('../components/landing/v2/AnalysisRailSection'));
const MissionSection = lazy(() => import('../components/landing/v2/MissionSection'));
const UseCasesSection = lazy(() => import('../components/landing/v2/UseCasesSection'));
const ShowcaseSection = lazy(() => import('../components/landing/v2/ShowcaseSection'));
const DeepDiveSection = lazy(() => import('../components/landing/v2/DeepDiveSection'));
const PipelineSection = lazy(() => import('../components/landing/v2/PipelineSection'));
const SampleReportSection = lazy(() => import('../components/landing/v2/SampleReportSection'));
const TestimonialSection = lazy(() => import('../components/landing/v2/TestimonialSection'));
const FaqSection = lazy(() => import('../components/landing/v2/FaqSection'));
const FinalCtaSection = lazy(() => import('../components/landing/v2/FinalCtaSection'));
const LandingFooter = lazy(() => import('../components/landing/v2/LandingFooter'));
const LandingCursor = lazy(() => import('../components/landing/LandingCursor'));

function Deferred({ minHeight, children }) {
  return (
    <div className="lp-defer" style={{ minHeight }}>
      <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
        {children}
      </Suspense>
    </div>
  );
}

/**
 * LandingPage v2, "Arsip Tanah" (Earthen Dossier).
 *
 * Nav + hero dimuat segera. Section di bawah fold dipecah jadi chunk
 * terpisah supaya ponsel tidak mengunduh Three.js, carousel, dan
 * salinan Leaflet sebelum pengguna menggulir.
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

    document.documentElement.classList.add('landing-scroll');
    return () => {
      document.documentElement.classList.remove('landing-scroll');
    };
  }, []);

  return (
    <div className="lp relative isolate flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden">
      <LandingBackdrop />
      <LandingNav t={t} />

      <main>
        <HeroSection t={t} />
        <Deferred minHeight={640}>
          <BentoSection t={t} />
        </Deferred>
        <Deferred minHeight={560}>
          <AnalysisRailSection t={t} />
        </Deferred>
        <Deferred minHeight={480}>
          <MissionSection t={t} />
        </Deferred>
        <Deferred minHeight={420}>
          <UseCasesSection t={t} />
        </Deferred>
        <Deferred minHeight={520}>
          <ShowcaseSection t={t} />
        </Deferred>
        <Deferred minHeight={640}>
          <DeepDiveSection t={t} />
        </Deferred>
        <Deferred minHeight={480}>
          <PipelineSection t={t} />
        </Deferred>
        <Deferred minHeight={560}>
          <SampleReportSection t={t} />
        </Deferred>
        <Deferred minHeight={360}>
          <TestimonialSection t={t} />
        </Deferred>
        <Deferred minHeight={480}>
          <FaqSection t={t} />
        </Deferred>
        <Deferred minHeight={420}>
          <FinalCtaSection t={t} />
        </Deferred>
      </main>

      <Deferred minHeight={220}>
        <LandingFooter t={t} />
      </Deferred>
      <Suspense fallback={null}>
        <LandingCursor />
      </Suspense>
    </div>
  );
}
