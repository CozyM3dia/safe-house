import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const BG = "#0a0806";
const ACCENT = "#d4956a";
const WHITE = "#f0e4cc";
const MUTED = "rgba(240,228,204,0.45)";

const NEWS_ITEMS = [
  {
    location: "JAKARTA · FEBRUARI 2024",
    stat: "47",
    unit: "Kelurahan",
    desc: "terendam banjir dalam semalam",
    sub: "Ribuan warga mengungsi",
    color: "#ef4444",
  },
  {
    location: "SUKABUMI · DESEMBER 2024",
    stat: "3.200",
    unit: "Rumah",
    desc: "rusak berat akibat banjir bandang",
    sub: "Miliaran rupiah kerugian material",
    color: "#f59e0b",
  },
  {
    location: "SUMATERA · NOVEMBER 2025",
    stat: "837",
    unit: "Jiwa",
    desc: "meninggal dunia akibat Siklon Senyar",
    sub: "Ratusan ribu orang kehilangan tempat tinggal",
    color: "#ef4444",
  },
  {
    location: "BNPB · INDONESIA · 2025",
    stat: "#1",
    unit: "Bencana",
    desc: "terbanyak sepanjang 2025 adalah banjir",
    sub: "Terjadi lagi. Dan lagi. Dan lagi.",
    color: ACCENT,
  },
];

const ITEM_DUR = 120;

function NewsItem({ item }: { item: (typeof NEWS_ITEMS)[0] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [96, 114], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const barWidth = interpolate(frame, [4, 30], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const locY = interpolate(frame, [0, 15], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statSpring = spring({ fps, frame, config: { damping: 18, stiffness: 120 }, delay: 6 });
  const descSpring = spring({ fps, frame, config: { damping: 20, stiffness: 100 }, delay: 14 });
  const subSpring  = spring({ fps, frame, config: { damping: 22, stiffness: 90 },  delay: 22 });

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 140px",
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: "0.25em", color: item.color, fontFamily: "monospace", fontWeight: 700, marginBottom: 28, opacity: fadeIn, transform: `translateY(${locY}px)` }}>
        {item.location}
      </div>
      <div style={{ width: barWidth, height: 2, background: item.color, marginBottom: 32, borderRadius: 1 }} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, transform: `translateY(${(1 - statSpring) * 40}px)`, opacity: statSpring }}>
        <span style={{ fontSize: 120, fontWeight: 900, color: WHITE, lineHeight: 1, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.03em" }}>
          {item.stat}
        </span>
        <span style={{ fontSize: 36, fontWeight: 700, color: item.color, fontFamily: "system-ui, sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {item.unit}
        </span>
      </div>
      <div style={{ fontSize: 28, color: WHITE, fontFamily: "system-ui, sans-serif", fontWeight: 400, marginTop: 12, transform: `translateY(${(1 - descSpring) * 20}px)`, opacity: descSpring * 0.9, maxWidth: 700, lineHeight: 1.4 }}>
        {item.desc}
      </div>
      <div style={{ fontSize: 16, color: MUTED, fontFamily: "system-ui, sans-serif", marginTop: 16, transform: `translateY(${(1 - subSpring) * 14}px)`, opacity: subSpring * 0.7, letterSpacing: "0.03em" }}>
        {item.sub}
      </div>
    </AbsoluteFill>
  );
}

function TransitionText() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({ fps, frame, config: { damping: 16, stiffness: 110 }, delay: 0 });
  const line2 = spring({ fps, frame, config: { damping: 16, stiffness: 110 }, delay: 18 });
  const line3 = spring({ fps, frame, config: { damping: 16, stiffness: 110 }, delay: 36 });
  const sub   = spring({ fps, frame, config: { damping: 20, stiffness: 80  }, delay: 56 });

  const lines = [
    { text: "Ini terjadi lagi.",  s: line1, color: WHITE },
    { text: "Dan lagi.",          s: line2, color: ACCENT },
    { text: "Dan lagi.",          s: line3, color: ACCENT },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "0 140px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 72, fontWeight: 900, color: l.color, fontFamily: "system-ui, sans-serif", lineHeight: 1.15, opacity: l.s, transform: `translateY(${(1 - l.s) * 30}px)`, letterSpacing: "-0.02em" }}>
          {l.text}
        </div>
      ))}
      <div style={{ marginTop: 48, fontSize: 18, color: MUTED, fontFamily: "system-ui, sans-serif", opacity: sub, transform: `translateY(${(1 - sub) * 12}px)`, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
        Ini bukan hanya bencana alam.
      </div>
    </AbsoluteFill>
  );
}

function DecisionText() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["Ini", "adalah", "konsekuensi", "dari", "keputusan", "yang", "salah", "lokasi."];
  const highlights = new Set(["keputusan", "salah", "lokasi."]);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "0 140px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 18px", maxWidth: 860 }}>
        {words.map((word, i) => {
          const s = spring({ fps, frame, config: { damping: 18, stiffness: 100 }, delay: i * 5 });
          return (
            <span key={i} style={{ fontSize: 64, fontWeight: 900, color: highlights.has(word) ? ACCENT : WHITE, fontFamily: "system-ui, sans-serif", lineHeight: 1.2, opacity: s, display: "inline-block", transform: `translateY(${(1 - s) * 24}px)`, letterSpacing: "-0.02em" }}>
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const NewsOpening: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn  = interpolate(frame, [0, 20],   [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [570, 600], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, opacity: Math.min(fadeIn, fadeOut) }}>
      {/* Scan-line texture */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 70%)`, pointerEvents: "none" }} />

      {NEWS_ITEMS.map((item, i) => (
        <Sequence key={i} from={i * ITEM_DUR} durationInFrames={ITEM_DUR + 20}>
          <NewsItem item={item} />
        </Sequence>
      ))}

      <Sequence from={480} durationInFrames={90}>
        <TransitionText />
      </Sequence>

      <Sequence from={540} durationInFrames={60}>
        <DecisionText />
      </Sequence>

      {/* Watermark */}
      <div style={{ position: "absolute", bottom: 32, left: 140, fontSize: 11, letterSpacing: "0.2em", color: "rgba(240,228,204,0.18)", fontFamily: "monospace", textTransform: "uppercase" }}>
        S.A.F.E House · Data: InaRISK BNPB 2026
      </div>
    </AbsoluteFill>
  );
};
