import { useCallback, useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import mapAnimationData from '../../imports/map-animation.json';

const MAP_ANIM_META = mapAnimationData as { op: number; fr: number };
const MAP_ANIM_FPS = MAP_ANIM_META.fr;
const MAP_FRAME_END = MAP_ANIM_META.op - 1;
/** Frame milestones for GPS popup timing only — never pauses playback. */
const MAP_EVENTS_PLAY_SECONDS = 7;
const MAP_WEBINARS_PLAY_SECONDS = 4;
const mapFrameAt = (seconds: number) => Math.round(seconds * MAP_ANIM_FPS);
const MAP_FRAME_EVENTS_END = mapFrameAt(MAP_EVENTS_PLAY_SECONDS);
const MAP_FRAME_WEBINARS_END = mapFrameAt(
  MAP_EVENTS_PLAY_SECONDS + MAP_WEBINARS_PLAY_SECONDS,
);
/** Bottom-anchored cover fit — matches other journey map panels. */
const MAP_ANIM_PRESERVE_ASPECT = 'xMidYMax slice' as const;

export function JourneyNavMapAnimation({
  initialPhase,
  replayFromStart,
  onEventsMilestone,
  onWebinarsMilestone,
}: {
  initialPhase: number;
  replayFromStart: boolean;
  onEventsMilestone?: () => void;
  onWebinarsMilestone?: () => void;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const enterFrameHandlerRef = useRef<(() => void) | null>(null);
  const eventsFiredRef = useRef(false);
  const webinarsFiredRef = useRef(false);
  const onEventsMilestoneRef = useRef(onEventsMilestone);
  const onWebinarsMilestoneRef = useRef(onWebinarsMilestone);
  onEventsMilestoneRef.current = onEventsMilestone;
  onWebinarsMilestoneRef.current = onWebinarsMilestone;

  const detachEnterFrameHandler = useCallback(() => {
    const anim = lottieRef.current?.animationItem;
    const handler = enterFrameHandlerRef.current;
    if (anim && handler) {
      anim.removeEventListener('enterFrame', handler);
    }
    enterFrameHandlerRef.current = null;
  }, []);

  const fireMilestonesThrough = useCallback((frame: number) => {
    if (frame >= MAP_FRAME_EVENTS_END && !eventsFiredRef.current) {
      eventsFiredRef.current = true;
      onEventsMilestoneRef.current?.();
    }
    if (frame >= MAP_FRAME_WEBINARS_END && !webinarsFiredRef.current) {
      webinarsFiredRef.current = true;
      onWebinarsMilestoneRef.current?.();
    }
  }, []);

  const sizeLottie = useCallback(() => {
    const anim = lottieRef.current?.animationItem;
    const el = containerRef.current;
    if (!anim || !el) return false;

    const rect = el.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 8 || height < 8) return false;

    anim.resize(width, height);
    return true;
  }, []);

  const beginMapPlayback = useCallback(() => {
    if (startedRef.current) return true;

    const anim = lottieRef.current?.animationItem;
    if (!anim || !sizeLottie()) return false;

    startedRef.current = true;
    eventsFiredRef.current = false;
    webinarsFiredRef.current = false;
    detachEnterFrameHandler();

    if (!replayFromStart && initialPhase >= 4) {
      fireMilestonesThrough(MAP_FRAME_END);
      anim.goToAndStop(MAP_FRAME_END, true);
      return true;
    }

    const onEnterFrame = () => {
      fireMilestonesThrough(Math.round(anim.currentFrame));
    };

    enterFrameHandlerRef.current = onEnterFrame;
    anim.addEventListener('enterFrame', onEnterFrame);
    anim.resetSegments(true);
    anim.goToAndStop(0, true);
    anim.play();
    return true;
  }, [
    detachEnterFrameHandler,
    fireMilestonesThrough,
    initialPhase,
    replayFromStart,
    sizeLottie,
  ]);

  const beginMapPlaybackRef = useRef(beginMapPlayback);
  beginMapPlaybackRef.current = beginMapPlayback;

  const handleComplete = useCallback(() => {
    const anim = lottieRef.current?.animationItem;
    if (!anim) return;
    if (Math.round(anim.currentFrame) < MAP_FRAME_END - 1) return;
    detachEnterFrameHandler();
    fireMilestonesThrough(MAP_FRAME_END);
    anim.goToAndStop(MAP_FRAME_END, true);
  }, [detachEnterFrameHandler, fireMilestonesThrough]);

  useEffect(() => {
    startedRef.current = false;
    eventsFiredRef.current = false;
    webinarsFiredRef.current = false;

    let cancelled = false;
    let attempts = 0;

    const tryStart = () => {
      if (cancelled || startedRef.current) return true;
      if (!lottieRef.current?.animationItem) return false;
      return beginMapPlaybackRef.current();
    };

    if (tryStart()) {
      return () => {
        cancelled = true;
        detachEnterFrameHandler();
      };
    }

    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (tryStart() || attempts > 250) {
        window.clearInterval(intervalId);
      }
    }, 32);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      detachEnterFrameHandler();
    };
  }, [detachEnterFrameHandler]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      sizeLottie();
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [sizeLottie]);

  return (
    <div ref={containerRef} className="journey-nav-map-frame">
      <Lottie
        lottieRef={lottieRef}
        animationData={mapAnimationData}
        renderer="canvas"
        loop={false}
        autoplay={false}
        onComplete={handleComplete}
        className="journey-nav-map-panel__lottie"
        rendererSettings={{
          preserveAspectRatio: MAP_ANIM_PRESERVE_ASPECT,
          clearCanvas: true,
        }}
      />
    </div>
  );
}
