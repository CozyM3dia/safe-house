import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadMono  } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const { fontFamily: SERIF } = loadSerif();
const { fontFamily: MONO  } = loadMono();
const { fontFamily: BEBAS } = loadBebas();

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG       = "#070503";
const COPPER   = "#c87533";
const COPPER_L = "#e8994a";
const CYAN     = "#00d4b8";
const RED      = "#ff4242";
const GREEN    = "#00e87a";
const AMBER    = "#f59e0b";
const BLUE     = "#38bdf8";
const WHITE    = "#f5ead8";
const MUTED    = "rgba(245,234,216,0.38)";
const GRID     = "rgba(200,130,50,0.055)";

// ─── Data ─────────────────────────────────────────────────────────────────────
const GEO_APIS = [
  { name: "OpenStreetMap Nominatim", desc: "Geocoding — nama & alamat lokasi",     color: GREEN, ms: 320 },
  { name: "Open-Meteo Forecast",     desc: "Elevasi, suhu, kelembaban real-time",  color: BLUE,  ms: 280 },
  { name: "Open-Meteo Air Quality",  desc: "Indeks AQI & PM2.5",                  color: AMBER, ms: 310 },
  { name: "USGS Earthquake API",     desc: "Gempa terdekat radius 100 km",         color: RED,   ms: 390 },
  { name: "BNPB InaRISK — Banjir",  desc: "Layer bahaya banjir (data resmi)",     color: BLUE,  ms: 440 },
  { name: "BNPB InaRISK — Longsor", desc: "Layer bahaya tanah longsor",           color: AMBER, ms: 460 },
  { name: "Overpass API (OSM)",      desc: "POI terdekat: sungai, jalan, drainase",color: GREEN, ms: 290 },
];

const AI_MODELS = [
  { name: "Gemini Flash 3.1",    role: "PRIMARY",    desc: "Google Gemini via backend proxy",  color: GREEN,  opacity: 1.0  },
  { name: "FreeLLMAPI",          role: "FALLBACK 1", desc: "Open model pool — auto-select",    color: AMBER,  opacity: 0.65 },
  { name: "OpenRouter (Gemma)",  role: "FALLBACK 2", desc: "Gemma 2 9B via OpenRouter",        color: BLUE,   opacity: 0.45 },
  { name: "Ollama (local)",      role: "FALLBACK 3", desc: "Offline mode — no cloud needed",   color: MUTED,  opacity: 0.30 },
];

// ─── Seismic waveform path generator ─────────────────────────────────────────
function buildWaveformPath(w: number, cy: number): string {
  const pts: string[] = [];
  const N = 480;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * w;
    let y = 0;
    y += Math.sin(t * Math.PI * 80) * 1.5;
    if (t > 0.18) {
      const tp = (t - 0.18) * 12;
      y += Math.exp(-tp * 0.6) * Math.sin(tp * Math.PI * 4) * 14;
    }
    if (t > 0.32) {
      const ts = (t - 0.32) * 9;
      y += Math.exp(-ts * 0.32) * Math.sin(ts * Math.PI * 2.5) * 32;
    }
    if (t > 0.48) {
      const tl = (t - 0.48) * 6;
      y += Math.exp(-tl * 0.22) * Math.sin(tl * Math.PI * 1.8) * 52;
    }
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(cy + y).toFixed(1)}`);
  }
  return pts.join(" ");
}

// ─── Background: Topographic grid + seismic trace ────────────────────────────
function SceneBackground({ showWave = true }: { showWave?: boolean }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const wavePath = buildWaveformPath(width, 80);
  const WAVE_APPROX_LEN = 2400;
  const waveProgress = interpolate(frame, [0, 90], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const dashOffset = WAVE_APPROX_LEN * (1 - waveProgress);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Topographic grid */}
      <AbsoluteFill style={{
        background: [
          `repeating-linear-gradient(0deg, ${GRID}, ${GRID} 1px, transparent 1px, transparent 40px)`,
          `repeating-linear-gradient(90deg, ${GRID}, ${GRID} 1px, transparent 1px, transparent 40px)`,
        ].join(", "),
      }} />

      {/* Vignette */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 35%, ${BG}cc 100%)`,
      }} />

      {/* Seismic waveform trace at bottom */}
      {showWave && (
        <svg
          viewBox={`0 0 ${width} 200`}
          style={{ position: "absolute", bottom: 60, left: 0, width: "100%", height: 200 }}
        >
          <path
            d={wavePath}
            fill="none"
            stroke={COPPER}
            strokeWidth={1.5}
            opacity={0.28}
            strokeLinecap="round"
            strokeDasharray={WAVE_APPROX_LEN}
            strokeDashoffset={dashOffset}
          />
          <path
            d={wavePath}
            fill="none"
            stroke={COPPER_L}
            strokeWidth={0.5}
            opacity={0.12}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Scanline overlay */}
      <AbsoluteFill style={{
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
      }} />

      {/* Corner marks */}
      {[
        { top: 28, left: 28 },
        { top: 28, right: 28 },
        { bottom: 28, left: 28 },
        { bottom: 28, right: 28 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: 20, height: 20,
          borderTop: i < 2 ? `1px solid ${COPPER}40` : "none",
          borderBottom: i >= 2 ? `1px solid ${COPPER}40` : "none",
          borderLeft: i % 2 === 0 ? `1px solid ${COPPER}40` : "none",
          borderRight: i % 2 === 1 ? `1px solid ${COPPER}40` : "none",
        }} />
      ))}

      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 22, left: 40,
        fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.22em",
        color: `${COPPER}35`, textTransform: "uppercase",
      }}>
        S.A.F.E House · Geological Risk Intelligence · InaRISK BNPB 2026
      </div>
    </AbsoluteFill>
  );
}

// ─── Sonar ring component ─────────────────────────────────────────────────────
function SonarPing({ cx, cy, color, delay, size = 40 }: { cx: number; cy: number; color: string; delay: number; size?: number }) {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);
  const cycle = localFrame % 90;
  const scale = interpolate(cycle, [0, 90], [0.2, 2.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op    = interpolate(cycle, [0, 60, 90], [0.8, 0.2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <circle
      cx={cx} cy={cy}
      r={(size / 2) * scale}
      fill="none"
      stroke={color}
      strokeWidth={1}
      opacity={op}
    />
  );
}

// ─── Radar: 7 API dots on a circle ───────────────────────────────────────────
function RadarVis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const CX = 200, CY = 200, R = 140;
  const containerIn = spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 20 });

  // Radar sweep line
  const sweepAngle = interpolate(frame, [0, 300], [0, 720], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sweepRad = (sweepAngle * Math.PI) / 180;

  return (
    <div style={{ position: "relative", width: 400, height: 400, opacity: containerIn, transform: `scale(${0.8 + 0.2 * containerIn})` }}>
      <svg viewBox="0 0 400 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* Concentric circles */}
        {[R * 0.35, R * 0.65, R, R * 1.1].map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r}
            fill="none"
            stroke={COPPER}
            strokeWidth={i === 2 ? 1 : 0.5}
            opacity={i === 2 ? 0.22 : 0.1}
          />
        ))}

        {/* Cross hairs */}
        {[0, 90, 45, 135].map((angle, i) => {
          const r = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={CX - Math.cos(r) * R * 1.1} y1={CY - Math.sin(r) * R * 1.1}
              x2={CX + Math.cos(r) * R * 1.1} y2={CY + Math.sin(r) * R * 1.1}
              stroke={COPPER} strokeWidth={0.4} opacity={0.12}
            />
          );
        })}

        {/* Radar sweep gradient */}
        <defs>
          <radialGradient id="sweep-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={CYAN} stopOpacity="0.0" />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* Sweep sector */}
        <path
          d={`M ${CX} ${CY} L ${CX + Math.cos(sweepRad - 0.4) * R} ${CY + Math.sin(sweepRad - 0.4) * R} A ${R} ${R} 0 0 1 ${CX + Math.cos(sweepRad) * R} ${CY + Math.sin(sweepRad) * R} Z`}
          fill={CYAN} opacity={0.18}
        />
        {/* Sweep line */}
        <line
          x1={CX} y1={CY}
          x2={CX + Math.cos(sweepRad) * R} y2={CY + Math.sin(sweepRad) * R}
          stroke={CYAN} strokeWidth={1.5} opacity={0.6}
        />

        {/* API dots around circle */}
        {GEO_APIS.map((api, i) => {
          const angle = (i / GEO_APIS.length) * 2 * Math.PI - Math.PI / 2;
          const x = CX + Math.cos(angle) * R;
          const y = CY + Math.sin(angle) * R;
          const dotIn = spring({ fps: 30, frame: Math.max(0, frame - (i * 12)), config: { damping: 18, stiffness: 120 } });
          return (
            <g key={i} opacity={dotIn}>
              <SonarPing cx={x} cy={y} color={api.color} delay={i * 14} size={24} />
              <circle cx={x} cy={y} r={5} fill={api.color} opacity={0.9} />
              <circle cx={x} cy={y} r={3} fill={WHITE} opacity={0.7} />
            </g>
          );
        })}

        {/* Center label */}
        <text x={CX} y={CY - 8} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={COPPER} opacity={0.7} letterSpacing="2">
          PROMISE
        </text>
        <text x={CX} y={CY + 6} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={COPPER} opacity={0.7} letterSpacing="2">
          .ALL
        </text>
        <text x={CX} y={CY + 22} textAnchor="middle" fontFamily={MONO} fontSize={8} fill={CYAN} opacity={0.8} letterSpacing="1">
          {"< 4 SECONDS"}
        </text>
      </svg>
    </div>
  );
}

// ─── SCENE 1: Trigger ─────────────────────────────────────────────────────────
function TriggerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barW  = interpolate(frame, [8, 55], [0, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const title = spring({ fps, frame, config: { damping: 16, stiffness: 90 }, delay: 12 });
  const sub   = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 30 });
  const term  = spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 50 });
  const cursor = Math.floor(frame / 14) % 2 === 0 ? "▌" : " ";

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px" }}>

      {/* Copper accent bar */}
      <div style={{ width: barW, height: 2, background: `linear-gradient(90deg, ${COPPER}, ${COPPER_L})`, marginBottom: 40, borderRadius: 1 }} />

      {/* Overline label */}
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.3em", color: COPPER, textTransform: "uppercase", marginBottom: 20, opacity: title }}>
        Satu Klik Di Peta
      </div>

      {/* Giant headline */}
      <div style={{
        fontFamily: SERIF, fontStyle: "italic",
        fontSize: 104, color: WHITE, lineHeight: 1.0,
        letterSpacing: "-0.01em",
        opacity: title, transform: `translateY(${(1 - title) * 28}px)`,
      }}>
        Memicu 7<br />
        <span style={{ color: COPPER_L }}>API Calls</span>
      </div>

      {/* Sub */}
      <div style={{
        fontFamily: MONO, fontSize: 15, color: MUTED, marginTop: 28,
        lineHeight: 1.9, letterSpacing: "0.04em",
        opacity: sub, transform: `translateY(${(1 - sub) * 14}px)`,
        maxWidth: 560,
      }}>
        Semua berjalan secara bersamaan —<br />
        tidak ada yang menunggu yang lain selesai.
      </div>

      {/* Terminal */}
      <div style={{
        marginTop: 44, fontFamily: MONO, fontSize: 13,
        padding: "18px 26px", borderRadius: 4,
        background: `${CYAN}09`,
        border: `1px solid ${CYAN}28`,
        display: "inline-flex", alignItems: "center", gap: 10,
        opacity: term, width: "fit-content",
      }}>
        <span style={{ color: COPPER, opacity: 0.7 }}>›</span>
        <span style={{ color: MUTED }}>Promise.all([</span>
        <span style={{ color: GREEN }}>...7 requests</span>
        <span style={{ color: MUTED }}>])</span>
        <span style={{ color: CYAN }}>{cursor}</span>
      </div>

      {/* Right side: big ghost number */}
      <div style={{
        position: "absolute", right: 100, top: "50%",
        transform: `translateY(-50%) translateY(${(1 - title) * 30}px)`,
        fontFamily: BEBAS, fontSize: 280, color: WHITE,
        opacity: title * 0.04, letterSpacing: "-0.04em",
        lineHeight: 1, userSelect: "none",
      }}>
        7
      </div>
    </AbsoluteFill>
  );
}

// ─── API row ──────────────────────────────────────────────────────────────────
function APIRow({ api, idx, baseDelay }: { api: typeof GEO_APIS[0]; idx: number; baseDelay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = baseDelay + idx * 8;
  const s = spring({ fps, frame, config: { damping: 22, stiffness: 120 }, delay });

  // Timing bar fill
  const maxMs = 500;
  const barPct = (api.ms / maxMs) * 100;

  // Pulse dot
  const cycle = (frame - delay * 1.1) % 75;
  const dotScale = interpolate(cycle, [0, 20, 75], [1, 1.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dotOp    = interpolate(cycle, [0, 20, 75], [1, 0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      opacity: s, transform: `translateX(${(1 - s) * -24}px)`,
      paddingBottom: 10, marginBottom: 10,
      borderBottom: `1px solid rgba(200,130,50,0.08)`,
    }}>
      {/* Left accent line */}
      <div style={{ width: 2, height: 36, background: `${api.color}60`, marginRight: 14, borderRadius: 1, flexShrink: 0 }} />

      {/* Pulse dot */}
      <div style={{ width: 20, display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: api.color, boxShadow: `0 0 8px ${api.color}`,
          transform: `scale(${dotScale})`, opacity: dotOp,
        }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, marginLeft: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: "bold", color: WHITE, letterSpacing: "0.04em", marginBottom: 3 }}>
          {api.name}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: "0.03em" }}>
          {api.desc}
        </div>
      </div>

      {/* Timing bar */}
      <div style={{ width: 100, marginLeft: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: api.color, letterSpacing: "0.1em" }}>{api.ms}ms</span>
        </div>
        <div style={{ height: 3, background: "rgba(200,130,50,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${barPct * s}%`, height: "100%",
            background: `linear-gradient(90deg, ${api.color}60, ${api.color})`,
            borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── SCENE 2: Geo APIs ────────────────────────────────────────────────────────
function GeoAPIsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ fps, frame, config: { damping: 18, stiffness: 90 }, delay: 0 });
  const dividerW = interpolate(frame, [5, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "40px 80px", gap: 60 }}>
      {/* Left: API list */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ opacity: headerIn, transform: `translateY(${(1 - headerIn) * 10}px)`, marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.35em", color: COPPER, textTransform: "uppercase", marginBottom: 8 }}>
            Data Layer — Geospatial
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: WHITE, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            7 sumber data,<br /><span style={{ color: COPPER_L }}>satu detik.</span>
          </div>
          <div style={{ width: `${dividerW * 200}px`, height: 1, background: `linear-gradient(90deg, ${COPPER}60, transparent)`, marginTop: 16 }} />
        </div>

        {/* API rows */}
        {GEO_APIS.map((api, i) => (
          <APIRow key={i} api={api} idx={i} baseDelay={16} />
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 420, background: `linear-gradient(180deg, transparent, ${COPPER}30, transparent)` }} />

      {/* Right: Radar visual */}
      <div style={{ width: 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <RadarVis />
        <div style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.28em",
          color: MUTED, textTransform: "uppercase", marginTop: -20, textAlign: "center",
        }}>
          Eksekusi Paralel · Semua serentak
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── AI model row ─────────────────────────────────────────────────────────────
function AIModelRow({ model, idx, baseDelay }: { model: typeof AI_MODELS[0]; idx: number; baseDelay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = baseDelay + idx * 12;
  const s = spring({ fps, frame, config: { damping: 20, stiffness: 100 }, delay });
  const isPrimary = idx === 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      opacity: s * model.opacity + (1 - model.opacity) * 0.1,
      transform: `translateX(${(1 - s) * -20}px)`,
      marginLeft: idx * 20,
      marginBottom: isPrimary ? 0 : 6,
    }}>
      {/* Connector line from above (for fallbacks) */}
      {idx > 0 && (
        <div style={{
          position: "absolute",
          left: 80 + idx * 20 - 1,
          width: 1,
          height: 20,
          background: `${model.color}30`,
          marginTop: -13,
        }} />
      )}

      {/* Badge */}
      <div style={{
        fontFamily: MONO, fontSize: 8, fontWeight: "bold",
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: isPrimary ? model.color : MUTED,
        padding: "3px 8px", borderRadius: 2,
        background: isPrimary ? `${model.color}18` : "rgba(245,234,216,0.04)",
        border: `1px solid ${isPrimary ? model.color + "35" : "rgba(245,234,216,0.1)"}`,
        width: 90, textAlign: "center", flexShrink: 0,
      }}>
        {model.role}
      </div>

      {/* Name */}
      <div style={{ marginLeft: 16, flex: 1 }}>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: isPrimary ? "bold" : "normal", color: isPrimary ? WHITE : MUTED, letterSpacing: "0.04em" }}>
          {model.name}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: `${MUTED}88`, marginLeft: 12 }}>
          {model.desc}
        </span>
      </div>

      {/* Status */}
      <div style={{ fontFamily: MONO, fontSize: 9, color: isPrimary ? GREEN : "rgba(245,234,216,0.2)", letterSpacing: "0.15em" }}>
        {isPrimary ? "● ACTIVE" : "○ STANDBY"}
      </div>
    </div>
  );
}

// ─── SCENE 3: AI Models ───────────────────────────────────────────────────────
function AIScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerIn = spring({ fps, frame, config: { damping: 18, stiffness: 85 }, delay: 0 });
  const bigIn    = spring({ fps, frame, config: { damping: 18, stiffness: 70 }, delay: 10 });
  const dividerW = interpolate(frame, [5, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "40px 80px", gap: 80 }}>
      {/* Left: model list */}
      <div style={{ flex: 1.3 }}>
        <div style={{ opacity: headerIn, transform: `translateY(${(1 - headerIn) * 10}px)`, marginBottom: 36 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.35em", color: COPPER, textTransform: "uppercase", marginBottom: 8 }}>
            AI Analysis Engine
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: WHITE, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            4 model AI,<br /><span style={{ color: COPPER_L }}>zero downtime.</span>
          </div>
          <div style={{ width: `${dividerW * 200}px`, height: 1, background: `linear-gradient(90deg, ${COPPER}60, transparent)`, marginTop: 16 }} />
        </div>

        <div style={{ position: "relative" }}>
          {/* Vertical connector line */}
          <div style={{
            position: "absolute", left: 81, top: 14, bottom: 14,
            width: 1, background: `linear-gradient(180deg, ${GREEN}50, ${MUTED}20)`,
            opacity: spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 20 }),
          }} />

          {AI_MODELS.map((m, i) => (
            <div key={i} style={{ marginBottom: i < AI_MODELS.length - 1 ? 14 : 0 }}>
              <AIModelRow model={m} idx={i} baseDelay={20} />
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, fontFamily: MONO, fontSize: 11, color: MUTED,
          lineHeight: 1.8, maxWidth: 500,
          opacity: spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 70 }),
        }}>
          Sistem mencoba setiap model secara berurutan.<br />
          Jika satu gagal, langsung lanjut ke berikutnya — otomatis.
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 420, background: `linear-gradient(180deg, transparent, ${COPPER}30, transparent)` }} />

      {/* Right: big stat */}
      <div style={{ width: 280, display: "flex", flexDirection: "column", alignItems: "center", opacity: bigIn, transform: `scale(${0.8 + 0.2 * bigIn})` }}>
        <div style={{ fontFamily: BEBAS, fontSize: 180, color: WHITE, lineHeight: 1, letterSpacing: "-0.02em" }}>
          4
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.3em", color: COPPER, textTransform: "uppercase", textAlign: "center", marginTop: -8 }}>
          Model AI
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: MUTED, textTransform: "uppercase", textAlign: "center", marginTop: 4 }}>
          Fallback Chain
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 1, background: `${COPPER}50`, margin: "20px 0" }} />

        <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, textAlign: "center", letterSpacing: "0.1em", lineHeight: 1.9 }}>
          Gemini → FreeLLM<br />
          → OpenRouter → Ollama
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── SCENE 4: Summary ─────────────────────────────────────────────────────────
function SummaryScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const containerIn = spring({ fps, frame, config: { damping: 18, stiffness: 80 }, delay: 0 });

  const STATS = [
    { n: 7,  label: "Geospatial APIs", sub: "Berjalan paralel", color: GREEN  },
    { n: 4,  label: "AI Model Options", sub: "Fallback chain",  color: AMBER  },
    { n: 11, label: "Total Endpoints",  sub: "Per klik peta",   color: COPPER },
  ];

  // Scrolling ticker
  const TICKER = [
    "OpenStreetMap", "Open-Meteo", "Air Quality", "USGS Earthquake",
    "BNPB InaRISK", "Overpass OSM", "Gemini Flash", "OpenRouter",
    "FreeLLMAPI", "Ollama", "Google Street View",
  ];
  const tickerOffset = interpolate(frame, [0, 180], [0, -1200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: containerIn }}>

      {/* Overline */}
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.38em", color: COPPER, textTransform: "uppercase", marginBottom: 48 }}>
        Setiap klik · Setiap saat · Semua otomatis
      </div>

      {/* Big counters */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {STATS.map((stat, i) => {
          const count = Math.round(stat.n * Math.min(interpolate(frame, [10 + i * 14, 60 + i * 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 1));
          const s = spring({ fps, frame, config: { damping: 16, stiffness: 80 }, delay: 6 + i * 14 });
          return (
            <div key={i} style={{ display: "flex", alignItems: "stretch" }}>
              <div style={{ textAlign: "center", padding: "0 64px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
                <div style={{ fontFamily: BEBAS, fontSize: 160, color: WHITE, lineHeight: 1, letterSpacing: "-0.02em", textShadow: `0 0 60px ${stat.color}30` }}>
                  {count}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: "bold", color: stat.color, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: -4 }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 6 }}>
                  {stat.sub}
                </div>
              </div>
              {i < STATS.length - 1 && (
                <div style={{ width: 1, background: `linear-gradient(180deg, transparent, ${COPPER}35, transparent)`, margin: "20px 0" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div style={{
        marginTop: 48, fontFamily: SERIF, fontStyle: "italic",
        fontSize: 22, color: MUTED,
        opacity: spring({ fps, frame, config: { damping: 20, stiffness: 70 }, delay: 60 }),
      }}>
        Data geospasial lengkap — dalam satu klik, kurang dari 4 detik.
      </div>

      {/* Scrolling ticker */}
      <div style={{
        position: "absolute", bottom: 56, left: 0, right: 0,
        overflow: "hidden", height: 20,
        borderTop: `1px solid ${COPPER}15`,
        borderBottom: `1px solid ${COPPER}15`,
        display: "flex", alignItems: "center",
        opacity: spring({ fps, frame, config: { damping: 20, stiffness: 60 }, delay: 70 }),
      }}>
        <div style={{ display: "flex", gap: 0, transform: `translateX(${tickerOffset}px)`, whiteSpace: "nowrap" }}>
          {[...TICKER, ...TICKER, ...TICKER].map((name, i) => (
            <span key={i} style={{ fontFamily: MONO, fontSize: 8.5, color: MUTED, letterSpacing: "0.22em", textTransform: "uppercase", paddingRight: 48 }}>
              {name}
              <span style={{ color: COPPER, marginLeft: 24, marginRight: 0 }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Root composition ─────────────────────────────────────────────────────────
export const APICallsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [0, 12],   [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [870, 900], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, opacity: Math.min(fadeIn, fadeOut) }}>
      <SceneBackground />

      <Sequence from={0}   durationInFrames={150}><TriggerScene  /></Sequence>
      <Sequence from={150} durationInFrames={300}><GeoAPIsScene  /></Sequence>
      <Sequence from={450} durationInFrames={270}><AIScene       /></Sequence>
      <Sequence from={720} durationInFrames={180}><SummaryScene  /></Sequence>
    </AbsoluteFill>
  );
};
