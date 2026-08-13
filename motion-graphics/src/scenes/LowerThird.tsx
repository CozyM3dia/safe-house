import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

const ACCENT = "#d4956a";
const WHITE = "#f0e4cc";
const MUTED = "rgba(240,228,204,0.55)";

interface LowerThirdProps {
  title: string;
  subtitle?: string;
  tag?: string;
  tagColor?: string;
}

export function LowerThirdCard({ title, subtitle, tag, tagColor = ACCENT }: LowerThirdProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ fps, frame, config: { damping: 22, stiffness: 120 }, delay: 0 });
  const textIn  = spring({ fps, frame, config: { damping: 20, stiffness: 100 }, delay: 8 });
  const subIn   = spring({ fps, frame, config: { damping: 20, stiffness: 90  }, delay: 18 });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-start", padding: "0 80px 80px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          opacity: slideIn,
          transform: `translateY(${(1 - slideIn) * 20}px)`,
        }}
      >
        {/* Accent bar */}
        <div style={{ width: `${80 * slideIn}px`, height: 3, background: tagColor, borderRadius: 2, marginBottom: 10 }} />

        {tag && (
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: tagColor, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", opacity: textIn }}>
            {tag}
          </div>
        )}

        <div style={{ fontSize: 32, fontWeight: 800, color: WHITE, fontFamily: "system-ui, sans-serif", letterSpacing: "-0.01em", lineHeight: 1.2, opacity: textIn, transform: `translateX(${(1 - textIn) * -12}px)` }}>
          {title}
        </div>

        {subtitle && (
          <div style={{ fontSize: 16, color: MUTED, fontFamily: "system-ui, sans-serif", fontWeight: 400, opacity: subIn, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

// Pre-built lower thirds for the demo video
export const LowerThirdDemo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      {/* Card 1: Presenter intro — 0-150 */}
      {frame < 150 && (
        <LowerThirdCard
          tag="S.A.F.E House"
          title="Platform Analisis Risiko Properti Berbasis AI"
          subtitle="Data: InaRISK BNPB 2026"
          tagColor={ACCENT}
        />
      )}
      {/* Card 2: Location analysis — 150-300 */}
      {frame >= 150 && frame < 300 && (
        <LowerThirdCard
          tag="Lokasi Aktif"
          title="Pluit, Jakarta Utara"
          subtitle="Klik peta untuk analisis instan"
          tagColor="#f59e0b"
        />
      )}
      {/* Card 3: Score reveal — 300-450 */}
      {frame >= 300 && frame < 450 && (
        <LowerThirdCard
          tag="S.A.F.E Score · DANGER"
          title="Skor 24 dari 100"
          subtitle="Flood risk sangat tinggi — elevasi di bawah permukaan laut"
          tagColor="#ef4444"
        />
      )}
      {/* Card 4: AI Chat — 450-600 */}
      {frame >= 450 && frame < 600 && (
        <LowerThirdCard
          tag="AI Geoteknik"
          title="Analisis kontekstual berbasis lokasi"
          subtitle="Tanya apa saja tentang risiko, pondasi, atau mitigasi"
          tagColor={ACCENT}
        />
      )}
    </AbsoluteFill>
  );
};
