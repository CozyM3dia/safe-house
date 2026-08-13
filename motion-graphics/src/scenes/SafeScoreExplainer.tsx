import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const BG = "#0f0b08";
const ACCENT = "#d4956a";
const WHITE = "#f0e4cc";
const MUTED = "rgba(240,228,204,0.45)";
const SAFE_COLOR = "#10b981";
const WARN_COLOR = "#f59e0b";
const DANGER_COLOR = "#ef4444";

function riskColor(value: number) {
  if (value >= 70) return DANGER_COLOR;
  if (value >= 40) return WARN_COLOR;
  return SAFE_COLOR;
}

function scoreColor(score: number) {
  if (score >= 70) return SAFE_COLOR;
  if (score >= 40) return WARN_COLOR;
  return DANGER_COLOR;
}

// Arc gauge — adapts the app's SafeScoreCard SVG
function ArcGauge({ score, animProgress }: { score: number; animProgress: number }) {
  const size = 320;
  const strokeW = 12;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = 150;
  const totalArc = 240;
  const currentScore = score * animProgress;
  const endAngle = startAngle + (totalArc * currentScore) / 100;

  const polarToCart = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCart(start);
    const e = polarToCart(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const hex = scoreColor(score);
  const bgPath = describeArc(startAngle, startAngle + totalArc);
  const fgPath = currentScore > 0 ? describeArc(startAngle, endAngle) : null;

  const ticks = [0, 25, 50, 75, 100].map((v) => {
    const angle = startAngle + (totalArc * v) / 100;
    const inner = polarToCart(angle);
    const outerR = r + 10;
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x1: inner.x, y1: inner.y, x2: cx + outerR * Math.cos(rad), y2: cy + outerR * Math.sin(rad) };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={hex} stopOpacity="0.5" />
          <stop offset="100%" stopColor={hex} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={bgPath} fill="none" stroke="rgba(255,210,170,0.08)" strokeWidth={strokeW} strokeLinecap="round" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,210,170,0.15)" strokeWidth={1.5} />
      ))}
      {fgPath && (
        <path d={fgPath} fill="none" stroke="url(#arcGrad)" strokeWidth={strokeW} strokeLinecap="round" filter="url(#glow)" />
      )}
    </svg>
  );
}

function RiskBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ fps, frame, config: { damping: 22, stiffness: 90 }, delay });
  const hex = riskColor(value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: s, transform: `translateX(${(1 - s) * -20}px)` }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: MUTED, textTransform: "uppercase", fontFamily: "monospace", width: 80 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,210,170,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, value) * s}%`, height: "100%", borderRadius: 3, background: hex, boxShadow: `0 0 8px ${hex}80` }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: hex, fontFamily: "monospace", width: 30, textAlign: "right" }}>
        {Math.round(value * s)}
      </span>
    </div>
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badge = spring({ fps, frame, config: { damping: 18, stiffness: 100 }, delay: 0 });
  const title = spring({ fps, frame, config: { damping: 18, stiffness: 90 },  delay: 10 });
  const sub   = spring({ fps, frame, config: { damping: 20, stiffness: 80 },  delay: 24 });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 120px", textAlign: "center" }}>
      <div style={{ fontSize: 13, letterSpacing: "0.3em", color: ACCENT, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", opacity: badge, marginBottom: 24 }}>
        Perkenalkan
      </div>
      <div style={{ fontSize: 80, fontWeight: 900, color: WHITE, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.02em", lineHeight: 1.05, opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        S.A.F.E Score
      </div>
      <div style={{ marginTop: 32, fontSize: 22, color: MUTED, fontFamily: "system-ui, sans-serif", fontWeight: 400, lineHeight: 1.6, maxWidth: 700, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)` }}>
        Sistem penilaian risiko properti berbasis AI.<br />
        Satu angka. Empat faktor. Satu keputusan lebih bijak.
      </div>
    </AbsoluteFill>
  );
}

function ScoreReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCORE = 24; // Demo: Jakarta Utara — DANGER
  const LOCATION = "Jakarta Utara, DKI Jakarta";

  const containerIn = spring({ fps, frame, config: { damping: 20, stiffness: 80 }, delay: 0 });
  const gaugeProgress = interpolate(frame, [10, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scoreDisplay = Math.round(SCORE * Math.min(gaugeProgress * 1.2, 1));
  const labelIn = spring({ fps, frame, config: { damping: 20, stiffness: 80 }, delay: 40 });
  const barsIn  = spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 80 });

  const hex = scoreColor(SCORE);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 80,
        padding: "0 100px",
        opacity: containerIn,
      }}
    >
      {/* Left — Gauge */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* Location */}
        <div style={{ fontSize: 13, letterSpacing: "0.2em", color: MUTED, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 8 }}>
          Contoh Lokasi
        </div>
        <div style={{ fontSize: 18, color: WHITE, fontFamily: "system-ui, sans-serif", fontWeight: 600, marginBottom: 20, opacity: labelIn }}>
          {LOCATION}
        </div>

        {/* Gauge + score overlay */}
        <div style={{ position: "relative", width: 320, height: 320 }}>
          <ArcGauge score={SCORE} animProgress={gaugeProgress} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 20 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: WHITE, lineHeight: 1, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.03em" }}>
              {scoreDisplay}
            </span>
            <span style={{ fontSize: 16, color: MUTED, fontFamily: "monospace", marginTop: 4 }}>/100</span>
          </div>
        </div>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 20px", background: `${hex}18`, border: `1.5px solid ${hex}40`, opacity: labelIn }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: hex, boxShadow: `0 0 8px ${hex}` }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.15em", color: hex, textTransform: "uppercase", fontFamily: "monospace" }}>
            DANGER
          </span>
        </div>
      </div>

      {/* Right — Risk breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 400, opacity: barsIn, transform: `translateX(${(1 - barsIn) * 30}px)` }}>
        <div style={{ fontSize: 13, letterSpacing: "0.25em", color: ACCENT, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 8 }}>
          Breakdown Risiko
        </div>
        <RiskBar label="Flood" value={82} delay={0} />
        <RiskBar label="Seismic" value={45} delay={8} />
        <RiskBar label="Soil" value={70} delay={16} />
        <RiskBar label="Air" value={30} delay={24} />

        <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 10, background: "rgba(240,228,204,0.04)", border: "1px solid rgba(240,228,204,0.08)" }}>
          <div style={{ fontSize: 13, color: MUTED, fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
            Flood risk sangat tinggi. Elevasi wilayah ini berada di bawah permukaan laut. Tidak ideal untuk investasi properti jangka panjang.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ fps, frame, config: { damping: 18, stiffness: 90 }, delay: 0 });
  const sub1In  = spring({ fps, frame, config: { damping: 20, stiffness: 80 }, delay: 18 });
  const sub2In  = spring({ fps, frame, config: { damping: 20, stiffness: 80 }, delay: 30 });
  const btnIn   = spring({ fps, frame, config: { damping: 20, stiffness: 80 }, delay: 44 });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 140px" }}>
      <div style={{ fontSize: 13, letterSpacing: "0.3em", color: ACCENT, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", opacity: titleIn, marginBottom: 28 }}>
        Saatnya memilih dengan lebih bijak
      </div>
      <div style={{ fontSize: 68, fontWeight: 900, color: WHITE, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.02em", lineHeight: 1.1, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 24}px)` }}>
        Setiap keputusan properti<br />layak mendapat data yang cukup.
      </div>
      <div style={{ marginTop: 32, fontSize: 20, color: MUTED, fontFamily: "system-ui, sans-serif", lineHeight: 1.7, maxWidth: 660, opacity: sub1In, transform: `translateY(${(1 - sub1In) * 16}px)` }}>
        S.A.F.E House menganalisis risiko seismik, banjir, tanah, dan lingkungan — berbasis data InaRISK BNPB 2026.
      </div>
      <div style={{ marginTop: 12, fontSize: 16, color: "rgba(240,228,204,0.3)", fontFamily: "system-ui, sans-serif", opacity: sub2In }}>
        Gratis. Langsung di browser. Tanpa instalasi.
      </div>
      <div style={{ marginTop: 44, display: "inline-flex", alignItems: "center", gap: 12, borderRadius: 50, padding: "14px 36px", background: ACCENT, opacity: btnIn, transform: `scale(${0.8 + 0.2 * btnIn})` }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1a0f08", fontFamily: "system-ui, sans-serif", letterSpacing: "0.03em" }}>
          safehouse.web.id
        </span>
      </div>
    </AbsoluteFill>
  );
}

export const SafeScoreExplainer: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn  = interpolate(frame, [0, 20],   [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [720, 750], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -300, left: -300, width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}0a 0%, transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Scan-line */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none" }} />

      {/* Scene: Intro */}
      <Sequence from={0} durationInFrames={150}>
        <Intro />
      </Sequence>

      {/* Scene: Score reveal */}
      <Sequence from={150} durationInFrames={420}>
        <ScoreReveal />
      </Sequence>

      {/* Scene: CTA */}
      <Sequence from={540} durationInFrames={210}>
        <CTA />
      </Sequence>

      {/* Watermark */}
      <div style={{ position: "absolute", bottom: 32, left: 80, fontSize: 11, letterSpacing: "0.2em", color: "rgba(240,228,204,0.18)", fontFamily: "monospace", textTransform: "uppercase" }}>
        S.A.F.E House · Seismic · Aquatic · Foundation · Environmental
      </div>
    </AbsoluteFill>
  );
};
