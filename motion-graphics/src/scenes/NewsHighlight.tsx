import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadMono  } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";

const { fontFamily: SERIF } = loadSerif();
const { fontFamily: MONO  } = loadMono();
const { fontFamily: BEBAS } = loadBebas();

// ─── Palette — softer, warmer ─────────────────────────────────────────────────
const BG       = "#070503";
const COPPER   = "#c87533";
const COPPER_L = "#e8994a";
const WHITE    = "#f5ead8";
const MUTED    = "rgba(245,234,216,0.42)";
const RED      = "#c94040";       // warmer, less alarm-bell
const RED_SOFT = "#8a2828";       // deep wine for bg tint
const GREEN    = "#00e87a";
const AMBER    = "#f59e0b";
const GRID     = "rgba(200,130,50,0.05)";

// ─── Shared background ────────────────────────────────────────────────────────
function BaseBG({ tint = BG }: { tint?: string }) {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: tint }} />
      <AbsoluteFill style={{
        background: [
          `repeating-linear-gradient(0deg,  ${GRID}, ${GRID} 1px, transparent 1px, transparent 40px)`,
          `repeating-linear-gradient(90deg, ${GRID}, ${GRID} 1px, transparent 1px, transparent 40px)`,
        ].join(", "),
      }} />
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${tint}e8 100%)`,
      }} />
      <AbsoluteFill style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
      }} />
      {[{ top: 28, left: 28 }, { top: 28, right: 28 }, { bottom: 28, left: 28 }, { bottom: 28, right: 28 }].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos, width: 20, height: 20,
          borderTop:    i < 2  ? `1px solid ${COPPER}30` : "none",
          borderBottom: i >= 2 ? `1px solid ${COPPER}30` : "none",
          borderLeft:   i % 2 === 0 ? `1px solid ${COPPER}30` : "none",
          borderRight:  i % 2 === 1 ? `1px solid ${COPPER}30` : "none",
        }} />
      ))}
      <div style={{
        position: "absolute", bottom: 22, left: 40,
        fontFamily: MONO, fontSize: 9, letterSpacing: "0.22em",
        color: `${COPPER}28`, textTransform: "uppercase",
      }}>
        S.A.F.E House · Analisis Risiko Properti Indonesia
      </div>
    </AbsoluteFill>
  );
}

// ─── SCENE 1: Opening — refined, no static (0–90f / 3s) ──────────────────────
function OpeningScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle warm tint that fades in then out
  const warmTint = interpolate(frame, [0, 20, 70, 88], [0, 0.06, 0.04, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const tagIn   = spring({ fps, frame, config: { damping: 20, stiffness: 90 }, delay: 0  });
  const barW    = interpolate(frame, [6, 44], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1   = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 18 });
  const line2   = spring({ fps, frame, config: { damping: 18, stiffness: 76 }, delay: 28 });
  const line3   = spring({ fps, frame, config: { damping: 18, stiffness: 72 }, delay: 38 });
  const subIn   = spring({ fps, frame, config: { damping: 22, stiffness: 70 }, delay: 54 });

  // Slow source blink — subtle, not aggressive
  const blink = interpolate(Math.floor(frame / 24) % 2, [0, 1], [1, 0.5]);

  return (
    <AbsoluteFill>
      <BaseBG tint={`color-mix(in srgb, ${BG} 92%, ${RED_SOFT} 8%)`} />
      <AbsoluteFill style={{ background: RED, opacity: warmTint, pointerEvents: "none" }} />

      {/* Source tag */}
      <div style={{
        position: "absolute", top: 58, left: 120,
        display: "flex", alignItems: "center", gap: 10,
        opacity: tagIn * blink,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: RED, boxShadow: `0 0 8px ${RED}80`,
        }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.35em", color: `${RED}cc`, textTransform: "uppercase" }}>
          Liputan 6
        </span>
        <div style={{
          fontFamily: MONO, fontSize: 8, color: `${RED}80`,
          padding: "2px 8px", border: `1px solid ${RED}40`, borderRadius: 2, letterSpacing: "0.15em",
        }}>
          BERITA TERKINI
        </div>
      </div>

      {/* Accent bar */}
      <div style={{
        position: "absolute", top: 120, left: 120,
        width: barW, height: 1.5,
        background: `linear-gradient(90deg, ${RED}90, ${COPPER}60)`,
        borderRadius: 1,
      }} />

      {/* Headline */}
      <div style={{
        position: "absolute", top: "50%", left: 120, right: 120,
        transform: "translateY(-52%)",
      }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          <div style={{ fontSize: 64, color: WHITE, opacity: line1, transform: `translateY(${(1 - line1) * 18}px)` }}>
            Warga Perumahan Strategis
          </div>
          <div style={{ fontSize: 64, color: WHITE, opacity: line2, transform: `translateY(${(1 - line2) * 18}px)` }}>
            di Tangerang Selatan{" "}
            <span style={{ color: COPPER_L }}>Ramai-Ramai</span>
          </div>
          <div style={{ fontSize: 64, color: WHITE, opacity: line3, transform: `translateY(${(1 - line3) * 18}px)` }}>
            Jual Rumah —{" "}
            <span style={{ color: RED }}>Gara-Gara Banjir.</span>
          </div>
        </div>

        <div style={{
          marginTop: 28, fontFamily: MONO, fontSize: 13,
          color: MUTED, letterSpacing: "0.06em", lineHeight: 1.7,
          opacity: subIn, transform: `translateY(${(1 - subIn) * 10}px)`,
        }}>
          Properti yang dianggap "strategis" — tergenang setiap musim hujan.<br />
          Nilai investasi anjlok. Pemilik menjual rugi.
        </div>
      </div>

      {/* Bottom line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 5%, ${RED}50, ${COPPER}40, transparent 95%)`,
        opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }} />
    </AbsoluteFill>
  );
}

// ─── SCENE 2: Cold facts — asymmetric (90–270f / 6s) ─────────────────────────
function FactsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({ fps, frame, config: { damping: 18, stiffness: 85 }, delay: 0 });
  const bigIn    = spring({ fps, frame, config: { damping: 14, stiffness: 75 }, delay: 6 });
  const divH     = interpolate(frame, [8, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const FACTS = [
    { n: "01", head: "Lokasi dianggap strategis & premium",      body: "Salah satu koridor properti paling diminati investor Jabodetabek",  color: COPPER_L, delay: 14 },
    { n: "02", head: "Banjir terjadi berulang setiap musim",     body: "Bukan kejadian sekali — warga menghadapinya tiap tahun",           color: AMBER,    delay: 24 },
    { n: "03", head: "Nilai properti turun 15–30%",              body: "Sulit laku di pasaran, harga terpaksa dipotong signifikan",        color: RED,      delay: 34 },
    { n: "04", head: "Pemilik menjual rugi secara bersamaan",    body: "Supply melonjak tiba-tiba. Tidak ada yang mau membeli.",          color: RED,      delay: 44 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
      <BaseBG />

      {/* LEFT — 30% — loss number */}
      <div style={{
        width: "30%", height: "100%",
        background: `linear-gradient(160deg, ${RED}0f 0%, ${RED}06 100%)`,
        borderRight: `1px solid ${RED}20`,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 52px",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.32em", color: `${RED}aa`, textTransform: "uppercase", marginBottom: 18, opacity: headerIn }}>
          Kerugian<br />Per Pemilik
        </div>

        <div style={{ opacity: bigIn, transform: `translateY(${(1 - bigIn) * 36}px)` }}>
          <div style={{ fontFamily: BEBAS, fontSize: 44, color: `${RED}cc`, letterSpacing: "0.04em", lineHeight: 1.1 }}>Rp</div>
          <div style={{ fontFamily: BEBAS, fontSize: 110, color: WHITE, lineHeight: 0.9, letterSpacing: "-0.01em" }}>720</div>
          <div style={{ fontFamily: BEBAS, fontSize: 36, color: `${RED}cc`, letterSpacing: "0.18em" }}>JUTA</div>
        </div>

        <div style={{
          width: `${divH * 80}%`, height: 1,
          background: `${RED}40`, margin: "20px 0",
        }} />

        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, lineHeight: 1.9, opacity: headerIn }}>
          Dari Rp 2,4M<br />dijual Rp 1,68M<br />
          <span style={{ color: RED }}>— 30% dari modal</span>
        </div>
      </div>

      <div style={{ width: 1, background: `linear-gradient(180deg, transparent 8%, ${COPPER}28 45%, ${COPPER}28 55%, transparent 92%)`, height: `${divH * 100}%`, alignSelf: "center" }} />

      {/* RIGHT — facts */}
      <div style={{ flex: 1, padding: "56px 80px 56px 60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ opacity: headerIn, transform: `translateY(${(1 - headerIn) * 8}px)`, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.35em", color: COPPER, textTransform: "uppercase", marginBottom: 10 }}>
            Kronologi · Tangerang Selatan
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 38, color: WHITE, lineHeight: 1.1 }}>
            Mengapa properti "strategis"<br />
            <span style={{ color: COPPER_L }}>tetap bisa menjadi jebakan?</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {FACTS.map((f, i) => {
            const s = spring({ fps, frame, config: { damping: 22, stiffness: 100 }, delay: f.delay });
            return (
              <div key={i} style={{
                opacity: s, transform: `translateY(${(1 - s) * 14}px)`,
                padding: "14px 16px", borderRadius: 6,
                background: `${f.color}06`,
                border: `1px solid ${f.color}18`,
                borderLeft: `2px solid ${f.color}70`,
              }}>
                <div style={{ fontFamily: BEBAS, fontSize: 10, color: `${f.color}60`, letterSpacing: "0.22em", marginBottom: 5 }}>—{f.n}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: "bold", color: WHITE, lineHeight: 1.4, marginBottom: 5 }}>{f.head}</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: MUTED, lineHeight: 1.6 }}>{f.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── SCENE 3: Three editorial beats (270–420f) ────────────────────────────────

function EditorialA() {
  // "Satu keputusan tanpa data" — full but not stark
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t1 = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 8  });
  const t2 = spring({ fps, frame, config: { damping: 18, stiffness: 76 }, delay: 20 });
  const t3 = spring({ fps, frame, config: { damping: 20, stiffness: 72 }, delay: 34 });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <BaseBG />
      {/* Soft red ambient */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 50%, ${RED}08 0%, transparent 60%)`, pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: "50%", left: 140, transform: "translateY(-50%)" }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.35em", color: `${RED}90`, textTransform: "uppercase", marginBottom: 20, opacity: t1 }}>
          Akar Masalah
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          <div style={{ fontSize: 72, color: WHITE, opacity: t1, transform: `translateY(${(1 - t1) * 16}px)` }}>Satu keputusan</div>
          <div style={{ fontSize: 72, color: COPPER_L, opacity: t2, transform: `translateY(${(1 - t2) * 16}px)` }}>tanpa data risiko</div>
          <div style={{ fontSize: 72, color: RED, opacity: t3, transform: `translateY(${(1 - t3) * 16}px)` }}>merugikan Rp 720 juta.</div>
        </div>
        <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 12, color: MUTED, lineHeight: 1.8, opacity: t3, maxWidth: 700 }}>
          Ini bukan cerita langka. Ini terjadi pada ribuan pembeli properti Indonesia setiap tahunnya.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function EditorialB() {
  // Data breakdown — refined, not full-screen scream
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headIn = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 6  });
  const barIn  = spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 20 });

  const BARS = [
    { label: "Tahun pembelian",   pct: 100, note: "Rp 2,4M — harga normal pasar", color: GREEN  },
    { label: "Setelah banjir 1",  pct: 88,  note: "−12% · mulai sulit dijual",    color: AMBER  },
    { label: "Setelah banjir 2",  pct: 74,  note: "−26% · banyak yang merugi",    color: AMBER  },
    { label: "Dijual sekarang",   pct: 64,  note: "−36% · terpaksa Rp 1,68M",     color: RED    },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0 120px", gap: 100, opacity: fadeIn }}>
      <BaseBG />

      {/* Left: chart */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.32em", color: COPPER, textTransform: "uppercase", marginBottom: 20, opacity: headIn }}>
          Simulasi Nilai Properti
        </div>
        {BARS.map((b, i) => {
          const s = spring({ fps, frame, config: { damping: 22, stiffness: 85 }, delay: 20 + i * 12 });
          return (
            <div key={i} style={{ marginBottom: 20, opacity: s, transform: `translateX(${(1 - s) * -14}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: b.color, letterSpacing: "0.1em" }}>{b.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>{b.note}</span>
              </div>
              <div style={{ height: 18, background: "rgba(200,120,50,0.07)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${b.pct * s}%`, background: `linear-gradient(90deg, ${b.color}40, ${b.color}cc)`, borderRadius: 3 }} />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: BEBAS, fontSize: 12, color: b.color, letterSpacing: "0.04em" }}>
                  {Math.round(b.pct * Math.min(s, 1))}%
                </span>
              </div>
            </div>
          );
        })}

        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 5,
          background: `${RED}0a`, border: `1px solid ${RED}25`,
          opacity: spring({ fps, frame, config: { damping: 20, stiffness: 75 }, delay: 70 }),
        }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: `${RED}90`, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 4 }}>Total Kerugian</div>
          <div style={{ fontFamily: BEBAS, fontSize: 28, color: WHITE, letterSpacing: "0.04em" }}>≈ Rp 720 Juta</div>
        </div>
      </div>

      {/* Right: pull quote */}
      <div style={{ width: 380 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 36, color: WHITE, lineHeight: 1.3, opacity: barIn, transform: `translateY(${(1 - barIn) * 16}px)` }}>
          "Seandainya ada yang memberitahu risiko banjir lokasi ini{" "}
          <span style={{ color: COPPER_L }}>sebelum akad ditandatangani —</span>
          {" "}kerugian ini bisa dihindari."
        </div>
        <div style={{ marginTop: 20, fontFamily: MONO, fontSize: 10, color: MUTED, opacity: barIn }}>
          — Skenario yang terjadi pada ribuan pembeli properti<br />Indonesia setiap tahun
        </div>
      </div>
    </AbsoluteFill>
  );
}

function EditorialC() {
  // Three problems — clean list
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headIn = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 0 });

  const POINTS = [
    { text: "Beli properti tanpa cek data risiko banjir", sub: "Lokasi terlihat 'strategis' — tapi zona banjir rutin", color: RED,      delay: 12 },
    { text: "Developer tidak wajib ungkap riwayat banjir", sub: "Pembeli tidak tahu. Developer tidak diwajibkan memberitahu.", color: AMBER,   delay: 22 },
    { text: "Nilai anjlok, pemilik menjual rugi",          sub: "Investasi ratusan juta hilang karena informasi yang tidak ada", color: COPPER_L, delay: 32 },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px", opacity: fadeIn }}>
      <BaseBG />

      <div style={{ width: interpolate(frame, [5, 36], [0, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), height: 1.5, background: `linear-gradient(90deg, ${RED}80, transparent)`, marginBottom: 28 }} />

      <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.35em", color: `${RED}90`, textTransform: "uppercase", marginBottom: 14, opacity: headIn }}>
        Mengapa ini terus terjadi
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 48, color: WHITE, lineHeight: 1.1, marginBottom: 36, opacity: headIn, transform: `translateY(${(1 - headIn) * 12}px)` }}>
        Tiga alasan<br /><span style={{ color: COPPER_L }}>yang bisa diubah.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {POINTS.map((pt, i) => {
          const s = spring({ fps, frame, config: { damping: 22, stiffness: 95 }, delay: pt.delay });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 18, opacity: s, transform: `translateX(${(1 - s) * -14}px)` }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `${pt.color}12`, border: `1px solid ${pt.color}35`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                <span style={{ fontFamily: BEBAS, fontSize: 13, color: pt.color, letterSpacing: "0.05em" }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: WHITE, fontWeight: "bold", letterSpacing: "0.02em", marginBottom: 4 }}>{pt.text}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{pt.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─── SCENE 4: Resolution — warm (420–540f) ────────────────────────────────────
function ResolutionScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerIn = spring({ fps, frame, config: { damping: 18, stiffness: 78 }, delay: 0 });
  const SCORE = 22;
  const gP = interpolate(frame, [10, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const size = 210, sw = 10, r2 = (size - sw) / 2, cx = size / 2, cy = size / 2;
  const sA = 150, tA = 240;
  const eA = sA + (tA * SCORE * gP) / 100;
  const p2c = (a: number) => {
    const r = ((a - 90) * Math.PI) / 180;
    return { x: cx + r2 * Math.cos(r), y: cy + r2 * Math.sin(r) };
  };
  const arc = (s: number, e: number) => {
    const a = p2c(s), b = p2c(e);
    return `M ${a.x} ${a.y} A ${r2} ${r2} 0 ${e - s > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  };
  const fgArc = SCORE * gP > 0 ? arc(sA, eA) : null;
  const disp = Math.round(SCORE * gP);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "40px 100px", gap: 80, opacity: containerIn }}>
      <BaseBG />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 18% 50%, ${COPPER}0c 0%, transparent 50%)`, pointerEvents: "none" }} />

      {/* LEFT: gauge */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 320 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.28em", color: MUTED, textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
          Dengan S.A.F.E House
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, padding: "6px 14px", border: `1px solid ${COPPER}22`, borderRadius: 4, background: `${COPPER}07`, marginBottom: 18, textAlign: "center" }}>
          Perumahan Strategis, Tangerang Selatan
        </div>

        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <filter id="rg2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path d={arc(sA, sA + tA)} fill="none" stroke={`${RED}12`} strokeWidth={sw} strokeLinecap="round" />
            {fgArc && <path d={fgArc} fill="none" stroke={RED} strokeWidth={sw} strokeLinecap="round" filter="url(#rg2)" />}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
            <span style={{ fontFamily: BEBAS, fontSize: 68, color: WHITE, lineHeight: 1, letterSpacing: "0.01em" }}>{disp}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>/100</span>
          </div>
        </div>

        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 8,
          padding: "6px 18px", borderRadius: 4, background: `${RED}0e`, border: `1px solid ${RED}35`,
          opacity: spring({ fps, frame, config: { damping: 18, stiffness: 95 }, delay: 28 }),
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: RED, boxShadow: `0 0 6px ${RED}` }} />
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: "bold", letterSpacing: "0.18em", color: RED }}>DANGER · SKOR 22</span>
        </div>

        <div style={{ marginTop: 16, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {[{ l: "Flood", v: 88 }, { l: "Soil", v: 70 }, { l: "Seismic", v: 38 }].map((b, i) => {
            const s = spring({ fps, frame, config: { damping: 22, stiffness: 88 }, delay: 34 + i * 10 });
            const hex = b.v >= 70 ? RED : b.v >= 40 ? AMBER : GREEN;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: s }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: "0.12em", width: 54 }}>{b.l}</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,60,60,0.07)", overflow: "hidden" }}>
                  <div style={{ width: `${b.v * s}%`, height: "100%", background: hex, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: hex, width: 22, textAlign: "right" }}>{Math.round(b.v * s)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 1, height: 420, background: `linear-gradient(180deg, transparent, ${COPPER}30, transparent)` }} />

      {/* RIGHT: message */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.35em", color: COPPER, textTransform: "uppercase", marginBottom: 16, opacity: spring({ fps, frame, config: { damping: 18, stiffness: 88 }, delay: 5 }) }}>
          Informasi ini tersedia — sebelum beli
        </div>

        <div style={{
          fontFamily: SERIF, fontStyle: "italic", fontSize: 50, lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: 30,
          opacity: spring({ fps, frame, config: { damping: 18, stiffness: 82 }, delay: 10 }),
          transform: `translateY(${(1 - spring({ fps, frame, config: { damping: 18, stiffness: 82 }, delay: 10 })) * 18}px)`,
        }}>
          <span style={{ color: WHITE }}>Kerugian Rp 720 juta</span><br />
          <span style={{ color: COPPER_L }}>bisa dicegah.</span>
        </div>

        {[
          { c: RED,      t: "S.A.F.E Score mendeteksi lokasi ini sebagai DANGER 22/100",        d: 20 },
          { c: AMBER,    t: "Flood risk 88 — terlihat jelas. Sebelum transaksi dilakukan.",     d: 30 },
          { c: COPPER_L, t: "AI menjelaskan risiko dalam bahasa yang mudah dimengerti siapapun", d: 40 },
          { c: GREEN,    t: "Gratis. Di browser. Klik peta — dan kamu tahu.",                   d: 50 },
        ].map((pt, i) => {
          const s = spring({ fps, frame, config: { damping: 22, stiffness: 95 }, delay: pt.d });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, opacity: s, transform: `translateX(${(1 - s) * -12}px)` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: pt.c, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${pt.c}80` }} />
              <span style={{ fontFamily: MONO, fontSize: 12, color: WHITE, lineHeight: 1.6 }}>{pt.t}</span>
            </div>
          );
        })}

        <div style={{
          marginTop: 26, padding: "16px 22px", borderRadius: 5,
          background: `${COPPER}0c`, border: `1px solid ${COPPER}30`,
          opacity: spring({ fps, frame, config: { damping: 18, stiffness: 68 }, delay: 68 }),
        }}>
          <div style={{ fontFamily: BEBAS, fontSize: 26, color: COPPER_L, letterSpacing: "0.18em" }}>S.A.F.E HOUSE</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, marginTop: 4, letterSpacing: "0.08em" }}>
            Seismic · Aquatic · Foundation · Environmental · safehouse.web.id
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export const NewsHighlight: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [0, 14],   [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [530, 550], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, opacity: Math.min(fadeIn, fadeOut) }}>
      <Sequence from={0}   durationInFrames={90}><OpeningScene  /></Sequence>
      <Sequence from={90}  durationInFrames={180}><FactsScene   /></Sequence>
      <Sequence from={270} durationInFrames={60}><EditorialA   /></Sequence>
      <Sequence from={330} durationInFrames={60}><EditorialB   /></Sequence>
      <Sequence from={390} durationInFrames={60}><EditorialC   /></Sequence>
      <Sequence from={450} durationInFrames={100}><ResolutionScene /></Sequence>
    </AbsoluteFill>
  );
};
