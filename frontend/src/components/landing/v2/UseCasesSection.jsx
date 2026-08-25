import { ArrowUpRight } from 'lucide-react';
import { useLpNavigate } from '../../../hooks/useLpNavigate';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';
import { useSpotlight } from './motion';

/**
 * Use cases v2 — "slip arsip tanah" (dossier slip).
 *
 * Tiga kartu use-case, masing-masing dengan ILUSTRASI SCENE yang
 * menggambarkan pekerjaannya secara harfiah (bukan garis abstrak):
 *   1. Konsultan PBG  → meja kerja: gambar teknis bangunan + stempel SNI.
 *   2. Developer      → peta screening: dua parcel, bangunan, pin audit.
 *   3. Konsultan geoteknik → pengeboran: rig bor, lapisan tanah, nilai SPT.
 *
 * Semua scene digambar SVG custom dalam palet Mocha (nol aset eksternal,
 * tajam di semua DPI, ikut dua tema lewat CSS var). Ilustrasi duduk di
 * panel sendiri di atas kartu; badan kartu bersih untuk teks.
 *
 * Kontrak:
 * - Semua string via COPY dict bilingual (t()), termasuk alt ilustrasi.
 * - Reduced-motion: sonar & lift mati (CSS), reveal mengikuti sistem .lp.
 */

const CASES = [
  { key: 'Pbg', to: '/app', Scene: ScenePbg },
  { key: 'Developer', to: '/app', Scene: SceneDeveloper },
  { key: 'Geoteknik', to: '/validasi', Scene: SceneGeoteknik },
];

/* Warna scene, dari token halaman (ikut dark/light tanpa logika tema). */
const S = {
  ink: 'var(--lp-clay)',
  soft: 'var(--lp-taupe)',
  copper: 'var(--lp-copper)',
  sheet: 'color-mix(in srgb, var(--lp-mocha) 16%, var(--lp-paper))',
  fillA: 'var(--lp-well)',
  fillB: 'var(--lp-sand)',
};

/* ── Scene 1 · Konsultan PBG: meja kerja berkas perizinan ──────────────── */
function ScenePbg() {
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden="true">
      {/* Meja kerja */}
      <rect x="0" y="218" width="480" height="82" fill={S.fillB} opacity="0.45" />
      <line x1="0" y1="218" x2="480" y2="218" stroke={S.soft} strokeWidth="1.5" />

      {/* Lembar di belakang */}
      <g transform="translate(300 148) rotate(4)">
        <rect x="-66" y="-100" width="148" height="204" rx="6" fill={S.sheet} stroke={S.soft} strokeWidth="1" opacity="0.75" />
      </g>

      {/* Lembar gambar teknis utama */}
      <g transform="translate(185 150) rotate(-3)">
        <rect x="-92" y="-118" width="184" height="236" rx="7" fill={S.sheet} stroke={S.soft} strokeWidth="1.5" />
        {/* Blok judul */}
        <rect x="26" y="82" width="58" height="26" rx="3" fill="none" stroke={S.soft} strokeWidth="1" />
        <line x1="26" y1="91" x2="84" y2="91" stroke={S.soft} strokeWidth="0.8" />
        <line x1="26" y1="100" x2="84" y2="100" stroke={S.soft} strokeWidth="0.8" />
        {/* Gambar bangunan (elevasi) */}
        <rect x="-64" y="-40" width="128" height="10" fill={S.ink} opacity="0.28" />
        <rect x="-58" y="-30" width="116" height="76" fill="none" stroke={S.ink} strokeWidth="1.8" />
        <rect x="-46" y="-16" width="22" height="26" fill="none" stroke={S.ink} strokeWidth="1.2" />
        <rect x="-14" y="-16" width="22" height="26" fill={S.copper} opacity="0.28" stroke={S.ink} strokeWidth="1.2" />
        <rect x="18" y="-16" width="22" height="26" fill="none" stroke={S.ink} strokeWidth="1.2" />
        <rect x="-10" y="18" width="22" height="28" fill="none" stroke={S.ink} strokeWidth="1.4" />
        {/* Garis tanah + arsir */}
        <line x1="-74" y1="46" x2="74" y2="46" stroke={S.ink} strokeWidth="1.5" />
        <g stroke={S.soft} strokeWidth="1">
          <line x1="-66" y1="54" x2="-58" y2="46" />
          <line x1="-46" y1="54" x2="-38" y2="46" />
          <line x1="-26" y1="54" x2="-18" y2="46" />
          <line x1="-6" y1="54" x2="2" y2="46" />
          <line x1="14" y1="54" x2="22" y2="46" />
          <line x1="34" y1="54" x2="42" y2="46" />
          <line x1="54" y1="54" x2="62" y2="46" />
        </g>
        {/* Garis dimensi */}
        <line x1="-58" y1="72" x2="58" y2="72" stroke={S.soft} strokeWidth="1" />
        <line x1="-58" y1="67" x2="-58" y2="77" stroke={S.soft} strokeWidth="1" />
        <line x1="58" y1="67" x2="58" y2="77" stroke={S.soft} strokeWidth="1" />
        <text x="0" y="68" textAnchor="middle" fontSize="9.5" className="lp-num" fill={S.soft}>12,00</text>
      </g>

      {/* Stempel SNI */}
      <g transform="translate(322 94) rotate(-8)">
        <rect x="-14" y="26" width="9" height="17" rx="2" fill={S.copper} opacity="0.5" transform="rotate(14)" />
        <rect x="5" y="26" width="9" height="17" rx="2" fill={S.copper} opacity="0.5" transform="rotate(-14)" />
        <circle r="27" fill="none" stroke={S.copper} strokeWidth="2.2" />
        <circle r="19.5" fill="none" stroke={S.copper} strokeWidth="1.1" />
        <polyline points="-8,1 -2,8 10,-7" fill="none" stroke={S.copper} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Pena di meja */}
      <g transform="translate(352 238) rotate(-16)">
        <rect x="0" y="-4" width="84" height="8" rx="4" fill={S.ink} opacity="0.8" />
        <rect x="10" y="-4" width="3" height="8" fill={S.sheet} opacity="0.7" />
        <polygon points="84,-4 98,0 84,4" fill={S.soft} />
      </g>
    </svg>
  );
}

/* ── Scene 2 · Developer: peta screening dua parcel ────────────────────── */
function SceneDeveloper() {
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden="true">
      {/* Jalan */}
      <path d="M-20 242 C 130 216, 300 256, 500 220" fill="none" stroke={S.soft} strokeWidth="11" opacity="0.22" />
      <path d="M-20 242 C 130 216, 300 256, 500 220" fill="none" stroke={S.ink} strokeWidth="1.2" strokeDasharray="10 9" opacity="0.5" />

      {/* Parcel A (tersaring keluar, redup) */}
      <polygon points="60,72 208,54 236,150 150,190 48,150" fill={S.fillA} stroke={S.soft} strokeWidth="1.5" />
      <g stroke={S.ink} strokeWidth="1.3" fill={S.fillB} opacity="0.75">
        <rect x="96" y="102" width="24" height="15" />
        <polygon points="96,102 108,92 120,102" fill="none" />
        <rect x="148" y="92" width="24" height="15" />
        <polygon points="148,92 160,82 172,92" fill="none" />
        <rect x="118" y="140" width="24" height="15" />
        <polygon points="118,140 130,130 142,140" fill="none" />
      </g>
      {/* Tag A + bar skor redup */}
      <g transform="translate(104 58)">
        <rect x="-17" y="-13" width="34" height="24" rx="7" fill={S.sheet} stroke={S.soft} strokeWidth="1.2" />
        <text x="0" y="4" textAnchor="middle" fontSize="12" className="lp-num" fill={S.soft}>A</text>
      </g>
      <g transform="translate(76 206)">
        <rect x="0" y="0" width="118" height="7" rx="3.5" fill={S.fillA} stroke={S.soft} strokeWidth="0.6" />
        <rect x="0" y="0" width="46" height="7" rx="3.5" fill={S.soft} opacity="0.55" />
      </g>

      {/* Parcel B (terpilih, copper) */}
      <polygon points="262,50 408,68 428,158 330,196 246,148" fill={S.copper} fillOpacity="0.1" stroke={S.copper} strokeWidth="1.8" />
      <g stroke={S.ink} strokeWidth="1.3" fill={S.fillB}>
        <rect x="298" y="98" width="24" height="15" />
        <polygon points="298,98 310,88 322,98" fill="none" />
        <rect x="344" y="88" width="24" height="15" />
        <polygon points="344,88 356,78 368,88" fill="none" />
        <rect x="318" y="136" width="24" height="15" />
        <polygon points="318,136 330,126 342,136" fill="none" />
        <rect x="362" y="122" width="24" height="15" />
        <polygon points="362,122 374,112 386,122" fill="none" />
      </g>
      {/* Tag B + bar skor 65 */}
      <g transform="translate(336 56)">
        <rect x="-17" y="-13" width="34" height="24" rx="7" fill={S.sheet} stroke={S.copper} strokeWidth="1.4" />
        <text x="0" y="4" textAnchor="middle" fontSize="12" className="lp-num" fill={S.copper}>B</text>
      </g>
      <g transform="translate(266 210)">
        <rect x="0" y="0" width="128" height="7" rx="3.5" fill={S.fillA} stroke={S.soft} strokeWidth="0.6" />
        <rect x="0" y="0" width="83" height="7" rx="3.5" fill={S.copper} />
        <text x="136" y="8" fontSize="10" className="lp-num" fill={S.copper}>65</text>
      </g>

      {/* Pin audit + sonar di parcel B */}
      <g transform="translate(330 118)">
        <circle r="10" fill="none" stroke={S.copper} strokeWidth="1.2" className="lp-ucase-sonar" />
        <circle r="3.2" fill={S.copper} />
      </g>

      {/* Pohon + arah utara */}
      <g stroke={S.soft} strokeWidth="1.2">
        <line x1="46" y1="248" x2="46" y2="256" />
        <line x1="72" y1="262" x2="72" y2="270" />
        <line x1="436" y1="244" x2="436" y2="252" />
      </g>
      <circle cx="46" cy="243" r="5.5" fill={S.fillB} stroke={S.soft} strokeWidth="1.2" />
      <circle cx="72" cy="257" r="5.5" fill={S.fillB} stroke={S.soft} strokeWidth="1.2" />
      <circle cx="436" cy="239" r="5.5" fill={S.fillB} stroke={S.soft} strokeWidth="1.2" />
      <g transform="translate(440 44)">
        <circle r="14" fill="none" stroke={S.soft} strokeWidth="1.2" />
        <line x1="0" y1="8" x2="0" y2="-8" stroke={S.copper} strokeWidth="1.6" />
        <polygon points="0,-11 -4,-3 4,-3" fill={S.copper} />
        <text x="0" y="-20" textAnchor="middle" fontSize="9" className="lp-num" fill={S.soft}>U</text>
      </g>
    </svg>
  );
}

/* ── Scene 3 · Konsultan geoteknik: rig bor + lapisan tanah + SPT ──────── */
function SceneGeoteknik() {
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden="true">
      {/* Lapisan tanah */}
      <rect x="0" y="110" width="480" height="190" fill={S.fillA} />
      <rect x="0" y="110" width="480" height="45" fill={S.fillB} opacity="0.5" />
      <rect x="0" y="200" width="480" height="50" fill={S.fillB} opacity="0.6" />
      <g stroke={S.soft} strokeWidth="1" strokeDasharray="5 6" opacity="0.65">
        <line x1="0" y1="155" x2="480" y2="155" />
        <line x1="0" y1="200" x2="480" y2="200" />
        <line x1="0" y1="250" x2="480" y2="250" />
      </g>

      {/* Permukaan tanah + rumput */}
      <line x1="0" y1="110" x2="480" y2="110" stroke={S.ink} strokeWidth="2" />
      <g stroke={S.ink} strokeWidth="1.2" opacity="0.7">
        <polyline points="36,110 40,102 44,110" fill="none" />
        <polyline points="76,110 80,102 84,110" fill="none" />
        <polyline points="236,110 240,102 244,110" fill="none" />
        <polyline points="276,110 280,102 284,110" fill="none" />
        <polyline points="386,110 390,102 394,110" fill="none" />
      </g>

      {/* Rig bor */}
      <g>
        <rect x="112" y="100" width="56" height="10" rx="2" fill={S.ink} opacity="0.75" />
        <polyline points="124,100 132,26 148,26 156,100" fill="none" stroke={S.ink} strokeWidth="2" strokeLinejoin="round" />
        <line x1="127" y1="76" x2="153" y2="76" stroke={S.soft} strokeWidth="1" />
        <line x1="129" y1="50" x2="151" y2="50" stroke={S.soft} strokeWidth="1" />
        <circle cx="172" cy="93" r="7" fill="none" stroke={S.ink} strokeWidth="1.5" />
        <line x1="172" y1="93" x2="177" y2="88" stroke={S.ink} strokeWidth="1" />
      </g>

      {/* Kabel + lubang bor + casing */}
      <line x1="140" y1="26" x2="140" y2="262" stroke={S.copper} strokeWidth="1.4" strokeDasharray="4 4" />
      <g stroke={S.soft} strokeWidth="1.2">
        <line x1="133" y1="110" x2="133" y2="266" />
        <line x1="147" y1="110" x2="147" y2="266" />
      </g>
      <g stroke={S.soft} strokeWidth="0.9" opacity="0.7">
        <line x1="133" y1="126" x2="147" y2="126" />
        <line x1="133" y1="142" x2="147" y2="142" />
        <line x1="133" y1="158" x2="147" y2="158" />
        <line x1="133" y1="174" x2="147" y2="174" />
        <line x1="133" y1="190" x2="147" y2="190" />
        <line x1="133" y1="206" x2="147" y2="206" />
        <line x1="133" y1="222" x2="147" y2="222" />
        <line x1="133" y1="238" x2="147" y2="238" />
        <line x1="133" y1="254" x2="147" y2="254" />
      </g>
      <polygon points="133,266 147,266 140,278" fill={S.copper} />

      {/* Titik bor hidup (sonar) */}
      <g transform="translate(140 110)">
        <circle r="10" fill="none" stroke={S.copper} strokeWidth="1.2" className="lp-ucase-sonar" />
        <circle r="3" fill={S.copper} />
      </g>

      {/* Chip nilai SPT */}
      <g transform="translate(162 160)">
        <rect x="0" y="0" width="58" height="20" rx="10" fill={S.sheet} stroke={S.soft} strokeWidth="1" />
        <text x="29" y="14" textAnchor="middle" fontSize="10" className="lp-num" fill="var(--lp-umber)">N = 14</text>
      </g>
      <g transform="translate(162 226)">
        <rect x="0" y="0" width="58" height="20" rx="10" fill={S.sheet} stroke={S.copper} strokeWidth="1.2" />
        <text x="29" y="14" textAnchor="middle" fontSize="10" className="lp-num" fill={S.copper}>N = 32</text>
      </g>

      {/* Muka air tanah */}
      <line x1="252" y1="212" x2="446" y2="212" stroke={S.soft} strokeWidth="1.2" strokeDasharray="3 7" />
      <polyline points="330,202 339,216 321,216" fill="none" stroke={S.soft} strokeWidth="1.4" />

      {/* Penggaris kedalaman */}
      <line x1="452" y1="110" x2="452" y2="272" stroke={S.soft} strokeWidth="1.2" />
      <g stroke={S.soft} strokeWidth="1">
        <line x1="446" y1="110" x2="452" y2="110" />
        <line x1="446" y1="155" x2="452" y2="155" />
        <line x1="446" y1="200" x2="452" y2="200" />
        <line x1="446" y1="250" x2="452" y2="250" />
      </g>
      <g fontSize="9" className="lp-num" fill={S.soft} textAnchor="end">
        <text x="442" y="113">0,0 m</text>
        <text x="442" y="158">2,0 m</text>
        <text x="442" y="203">4,5 m</text>
        <text x="442" y="253">8,0 m</text>
      </g>
    </svg>
  );
}

/**
 * Tiga slip arsip use-case. Isi = kasus pemakaian nyata SafeHouse
 * (konsultan PBG, developer, konsultan geoteknik); bukti angka di strip
 * readout mengikuti skenario kurasi app, bukan angka karangan.
 */
export default function UseCasesSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });
  const navigate = useLpNavigate();
  const spot1 = useSpotlight();
  const spot2 = useSpotlight();
  const spot3 = useSpotlight();
  const spots = [spot1, spot2, spot3];

  return (
    <section id="use-case" ref={rootRef} className="lp-section" aria-labelledby="usecase-title">
      <div className="lp-container">
        <SectionHeader
          eyebrow={t('casesEyebrow')}
          title={t('casesTitle')} titleId="usecase-title"
          lead={t('casesLead')}
        />

        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3 md:gap-6">
          {CASES.map((c, i) => {
            const Scene = c.Scene;
            return (
              <article
                key={c.key}
                ref={spots[i].ref}
                onMouseMove={spots[i].onMouseMove}
                className={`lp-card-spot lp-ucase lp-card group relative flex flex-col overflow-hidden ${
                  inView ? 'lp-in' : 'lp-reveal'
                }`}
                style={{ '--lp-delay': `${i * 110}ms` }}
              >
                {/* Ilustrasi scene pekerjaan, panel sendiri (teks di bawah bersih) */}
                <figure
                  className="lp-ucase-fig relative m-0 aspect-[16/10] overflow-hidden border-b border-[color:var(--lp-line-soft)]"
                  role="img"
                  aria-label={t(`case${c.key}ImgAlt`)}
                >
                  <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
                    <Scene />
                  </div>
                </figure>

                <div className="relative z-10 flex flex-1 flex-col p-6 md:p-7">
                  {/* Plat arsip + nomor slip */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="lp-ucase-plate">{t('casePlate')}</span>
                    <span className="lp-num text-[11px] text-[color:var(--lp-taupe)]" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="lp-serif mt-6 text-[clamp(1.35rem,1.8vw,1.55rem)] leading-[1.12] text-[color:var(--lp-mocha)]">
                    {t(`case${c.key}Title`)}
                  </h3>
                  <p className="mt-2.5 text-[0.92rem] leading-relaxed text-[color:var(--lp-clay)]">
                    {t(`case${c.key}Desc`)}
                  </p>

                  {/* Readout + tautan, baseline sejajar antar kartu */}
                  <div className="mt-auto pt-7">
                    <div className="border-t border-[color:var(--lp-line-soft)] pt-3.5">
                      {c.key === 'Pbg' ? (
                        <>
                          <UcReadout t={t} label="caseReadoutSiteLabel" value="caseReadoutSite" />
                          <UcReadout t={t} label="caseReadoutPgaLabel" value="caseReadoutPga" />
                        </>
                      ) : null}
                      {c.key === 'Developer' ? (
                        <UcReadout t={t} label="caseReadoutScoreLabel" value="caseReadoutScore" />
                      ) : null}
                      {c.key === 'Geoteknik' ? (
                        <>
                          <UcReadout t={t} label="caseReadoutVs30Label" value="caseReadoutVs30" />
                          <UcReadout t={t} label="caseReadoutFsLabel" value="caseReadoutFs" />
                        </>
                      ) : null}
                      {c.key === 'Developer' ? (
                        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--lp-line)] px-2.5 py-1 text-[0.72rem] text-[color:var(--lp-clay)]">
                          <span className="lp-ucase-dot h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                          {t('caseCompareChip')}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(c.to)}
                      className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[0.88rem] font-semibold text-[color:var(--lp-chestnut)] transition-colors duration-300 hover:text-[color:var(--lp-copper-deep)]"
                    >
                      {t(`case${c.key}Link`)}
                      <ArrowUpRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UcReadout({ t, label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="lp-mono text-[9.5px] text-[color:var(--lp-taupe)]">{t(label)}</span>
      <span className="lp-num text-[0.85rem] font-medium text-[color:var(--lp-umber)]">{t(value)}</span>
    </div>
  );
}
