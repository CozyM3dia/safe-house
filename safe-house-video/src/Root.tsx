import { Composition } from 'remotion';
import './index.css';
import { SafeHousePromo, FPS, SCENES } from './SafeHousePromo';

export const RemotionRoot: React.FC = () => {
  const total = SCENES.reduce((acc, s) => Math.max(acc, s.from + s.dur), 0);
  return (
    <Composition
      id="SafeHousePromo"
      component={SafeHousePromo}
      durationInFrames={total}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
