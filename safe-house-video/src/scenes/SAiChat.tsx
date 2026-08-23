import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, F } from '../data';
import { Kicker, Panel, SceneBg, Vignette, easeIn, useFade } from '../lib/ui';

const QUESTION = 'Berapa skor S.A.F.E properti ini?';
const ANSWER =
  'Skor S.A.F.E lokasi ini 65 dari 100 — kategori SEDANG, "layak dengan catatan". Poin perhatian: FS likuefaksi 1.15 (di atas 1 namun tipis) dan PGA desain 0.32 g. Disarankan uji geoteknik lanjutan sebelum pengajuan PBG.';

export const S5BAiChat: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = useFade(14, 160, 20);

  const winIn = easeIn(frame, 4, 16, 30);
  const qIn = easeIn(frame, 18, 14, 20);

  // typing dots 26..52, then answer streams 56..128
  const dotsP = interpolate(frame, [26, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const answerChars = Math.round(
    interpolate(frame, [56, 126], [0, ANSWER.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const answerIn = frame >= 54 ? 1 : 0;

  const footIn = easeIn(frame, 130, 12, 14);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <SceneBg />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 230,
          transform: `translateX(-50%) translateY(${winIn.y}px)`,
          opacity: winIn.t,
          width: 1080,
        }}
      >
        <Panel>
          {/* header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingBottom: 20,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <svg width={30} height={30} viewBox="0 0 30 30">
              <path
                d="M15 2 L18 11 L27 15 L18 19 L15 28 L12 19 L3 15 L12 11 Z"
                fill={C.copper}
              />
            </svg>
            <Kicker style={{ fontSize: 22 }}>Tanya AI · SafeHouse</Kicker>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: F.mono,
                fontSize: 17,
                letterSpacing: '0.12em',
                color: C.textMuted,
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                padding: '6px 14px',
              }}
            >
              GEMINI · SERVER-SIDE
            </span>
          </div>

          {/* user bubble */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 28,
              opacity: qIn.t,
              transform: `translateY(${qIn.y}px)`,
            }}
          >
            <div
              style={{
                background: 'rgba(212,149,106,0.16)',
                border: `1px solid ${C.copperDeep}`,
                borderRadius: '18px 18px 4px 18px',
                padding: '18px 26px',
                fontFamily: F.body,
                fontSize: 26,
                color: C.text,
                maxWidth: 640,
              }}
            >
              {QUESTION}
            </div>
          </div>

          {/* typing dots */}
          {dotsP > 0 && dotsP < 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 26, opacity: dotsP }}>
              {[0, 1, 2].map((i) => {
                const pulse = 0.35 + 0.65 * Math.abs(Math.sin((frame - i * 7) / 5));
                return (
                  <span
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: C.copper,
                      opacity: pulse,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* AI answer */}
          {answerIn ? (
            <div style={{ display: 'flex', gap: 16, marginTop: 26, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(212,149,106,0.18)',
                  border: `1px solid ${C.copperDeep}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width={22} height={22} viewBox="0 0 30 30">
                  <path
                    d="M15 2 L18 11 L27 15 L18 19 L15 28 L12 19 L3 15 L12 11 Z"
                    fill={C.copper}
                  />
                </svg>
              </div>
              <div
                style={{
                  background: 'rgba(26,18,8,0.85)',
                  border: `1px solid ${C.lineStrong}`,
                  borderRadius: '4px 18px 18px 18px',
                  padding: '20px 26px',
                  fontFamily: F.body,
                  fontSize: 26,
                  lineHeight: 1.55,
                  color: C.text,
                  maxWidth: 880,
                }}
              >
                {ANSWER.slice(0, answerChars)}
                <span style={{ color: C.copper, opacity: frame % 16 < 8 ? 1 : 0 }}>▍</span>
              </div>
            </div>
          ) : null}

          {/* grounding footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 30,
              paddingTop: 20,
              borderTop: `1px solid ${C.line}`,
              opacity: footIn.t,
              transform: `translateY(${footIn.y}px)`,
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24">
              <path
                d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z"
                fill="none"
                stroke={C.safe}
                strokeWidth={2}
              />
            </svg>
            <span style={{ fontFamily: F.body, fontSize: 22, color: C.textSecondary }}>
              AI menjelaskan hasil audit — engine fisika yang menghitung angka.
            </span>
          </div>
        </Panel>
      </div>

      <Vignette />
    </AbsoluteFill>
  );
};
