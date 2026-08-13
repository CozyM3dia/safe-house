import "./index.css";
import { Composition } from "remotion";
import { NewsOpening } from "./scenes/NewsOpening";
import { SafeScoreExplainer } from "./scenes/SafeScoreExplainer";
import { LowerThirdDemo } from "./scenes/LowerThird";
import { APICallsScene } from "./scenes/APICallsScene";
import { NewsHighlight } from "./scenes/NewsHighlight";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Opening cinematic — overlay on news footage or standalone */}
      <Composition
        id="NewsOpening"
        component={NewsOpening}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* S.A.F.E Score explainer — standalone explainer segment */}
      <Composition
        id="SafeScoreExplainer"
        component={SafeScoreExplainer}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Lower thirds — transparent, overlay in video editor */}
      <Composition
        id="LowerThirds"
        component={LowerThirdDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* API calls explainer — how many APIs fire per click */}
      <Composition
        id="APICallsScene"
        component={APICallsScene}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* News highlight — Tangerang Selatan flood argument */}
      <Composition
        id="NewsHighlight"
        component={NewsHighlight}
        durationInFrames={570}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
