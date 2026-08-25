import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';
import { useSpotlight } from './motion';
import HalftoneReveal from './HalftoneReveal';

/**
 * Ekosistem sumber data, adaptasi section integrasi Figma.
 * Hanya sumber yang BENAR-BENAR dipakai engine (diverifikasi dari kode):
 * InaRISK BNPB, PVMBG, BMKG, USGS, Open-Meteo, OpenStreetMap/Overpass,
 * Nominatim. Dibagi 3 peran: Ditarik / Dihitung / Dijelaskan AI /
 * butuh lapangan. Jaring evidence network ringan via CSS (bukan HUD).
 */
export default function DataSourcesSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.2 });
  // Spotlight per kartu, pola AnalysisRailSection: hook eksplisit di parent.
  const spotA = useSpotlight();
  const spotB = useSpotlight();
  const spotC = useSpotlight();
  const spotD = useSpotlight();
  const spotE = useSpotlight();
  const spotF = useSpotlight();
  const spotG = useSpotlight();
  const spotH = useSpotlight();
  const spots = [spotA, spotB, spotC, spotD, spotE, spotF, spotG, spotH];

  const sources = [
    { key: 'Pusgen', role: 'pull' },
    { key: 'Inarisk', role: 'pull' },
    { key: 'Bmkg', role: 'pull' },
    { key: 'Usgs', role: 'pull' },
    { key: 'Pvmbg', role: 'pull' },
    { key: 'Big', role: 'pull' },
    { key: 'Openmeteo', role: 'pull' },
    { key: 'Osm', role: 'pull' },
  ];

  const roles = [
    { key: 'Pull', tone: 'var(--lp-chestnut)' },
    { key: 'Compute', tone: 'var(--lp-copper-deep)' },
    { key: 'Ai', tone: 'var(--lp-clay)' },
    { key: 'Field', tone: 'var(--lp-umber)' },
  ];

  return (
    <section id="sumber-data" ref={rootRef} className="lp-section" aria-labelledby="sumber-title">
      <div className="lp-container">
        <SectionHeader
          eyebrow={t('sourcesEyebrow')}
          title={t('sourcesTitle')} titleId="sumber-title"
          lead={t('sourcesLead')}
        />

        {/* Legenda peran, chip reveal stagger 60ms */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {roles.map((r, i) => (
            <span
              key={r.key}
              className={`inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[color:var(--lp-clay)] ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': `${120 + i * 60}ms` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: r.tone }} aria-hidden="true" />
              {t(`sourcesRole${r.key}`)}
            </span>
          ))}
        </div>

        {/* Grid sumber */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((s, i) => (
            <article
              key={s.key}
              ref={spots[i].ref}
              onMouseMove={spots[i].onMouseMove}
              className={`lp-card lp-card-spot group p-5 transition-all duration-500 hover:-translate-y-0.5 ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': `${160 + i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[1.02rem] font-bold tracking-tight text-[color:var(--lp-mocha)]">
                  {t(`sources${s.key}Name`)}
                </h3>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: s.role === 'pull' ? 'var(--lp-chestnut)' : 'var(--lp-copper-deep)' }}
                  aria-hidden="true"
                />
              </div>
              <p className="lp-mono mt-1 text-[8.5px] text-[color:var(--lp-taupe)]">{t(`sources${s.key}Official`)}</p>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-[color:var(--lp-clay)]">
                {t(`sources${s.key}Desc`)}
              </p>
            </article>
          ))}
        </div>

        {/* Tiga kartu peran: dihitung / dijelaskan AI / lapangan */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {['Compute', 'Ai', 'Field'].map((r, i) => (
            <div
              key={r}
              className={`rounded-2xl border border-dashed border-[color:var(--lp-line)] bg-[color:var(--lp-well)] p-6 ${inView ? 'lp-in' : 'lp-reveal'}`}
              style={{ '--lp-delay': `${300 + i * 100}ms` }}
            >
              <p className="lp-mono text-[9px] text-[color:var(--lp-taupe)]">{t(`sourcesRole${r}`)}</p>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-[color:var(--lp-umber)]/90">
                {t(`sourcesRole${r}Desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* Image break atmosferik, lanskap Indonesia sebagai cetakan halftone.
            Kursor = loupe: memperlihatkan foto tajam di antara titik cetak.
            Tanpa WebGL / gambar gagal → foto biasa tetap tampil (fallback). */}
        <div
          className={`lp-halftone-host relative mt-14 h-52 overflow-hidden rounded-2xl md:h-64 ${inView ? 'lp-in' : 'lp-reveal'}`}
          style={{ '--lp-delay': '420ms' }}
          aria-hidden="true"
        >
          <img
            src="/landing/landscape-break.jpg"
            width={1600}
            height={500}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover will-change-transform transition-transform ease-out ${
              inView ? 'scale-100' : 'scale-105'
            }`}
            style={{ transitionDuration: '2000ms' }}
          />
          <HalftoneReveal />
          <div className="pointer-events-none absolute inset-0 bg-[image:var(--lp-imgbreak-grad)]" />
          <p
            className={`lp-mono absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-[rgba(250,247,241,0.75)] transition-opacity duration-700 ${
              inView ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            {t('sourcesCaption')}
          </p>
        </div>
      </div>
    </section>
  );
}
