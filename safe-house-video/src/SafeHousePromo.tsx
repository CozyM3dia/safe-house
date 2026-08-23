import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from 'remotion';
import { S0Problem } from './scenes/S0Problem';
import { S1Portals } from './scenes/S1Portals';
import { S2Brand } from './scenes/S2Brand';
import { S3AuditFlow } from './scenes/S3AuditFlow';
import { S4HeroScore } from './scenes/S4HeroScore';
import { S5RadarMetrics } from './scenes/S5RadarMetrics';
import { S5BAiChat } from './scenes/SAiChat';
import { S6Battle } from './scenes/S6Battle';
import { S7Trust } from './scenes/S7Trust';
import { S8Outro } from './scenes/S8Outro';

export const FPS = 30;
export const SCENES = [
  { id: 'problem', from: 0, dur: 240 },
  { id: 'portals', from: 240, dur: 240 },
  { id: 'brand', from: 480, dur: 150 },
  { id: 'audit', from: 630, dur: 270 },
  { id: 'score', from: 900, dur: 240 },
  { id: 'radar', from: 1140, dur: 270 },
  { id: 'aichat', from: 1410, dur: 180 },
  { id: 'battle', from: 1590, dur: 210 },
  { id: 'trust', from: 1800, dur: 180 },
  { id: 'outro', from: 1980, dur: 180 },
] as const;

export const SafeHousePromo: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneComponents = [
    <S0Problem key="s0" />,
    <S1Portals key="s1" />,
    <S2Brand key="s2" />,
    <S3AuditFlow key="s3" />,
    <S4HeroScore key="s4" />,
    <S5RadarMetrics key="s5" />,
    <S5BAiChat key="s5b" />,
    <S6Battle key="s6" />,
    <S7Trust key="s7" />,
    <S8Outro key="s8" />,
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0b08' }}>
      <Audio src={require('../public/audio/ambient.wav')} />
      {SCENES.map((scene, i) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
          {sceneComponents[i]}
        </Sequence>
      ))}
      {/* global end fade to black */}
      <AbsoluteFill
        style={{
          backgroundColor: '#000',
          opacity: frame >= 2124 ? (frame - 2124) / 36 : 0,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
