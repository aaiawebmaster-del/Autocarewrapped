import { memo, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import mapAnimationData from '../../imports/gps-navigation-map.json';

const MAP_ANIM_META = mapAnimationData as { op: number; fr: number };
const MAP_ANIM_FPS = MAP_ANIM_META.fr;
const MAP_FRAME_END = Math.floor(MAP_ANIM_META.op - 1);
/** Center-anchored cover fit — keeps frame 0 in view without bottom snap on resize. */
const MAP_ANIM_PRESERVE_ASPECT_DESKTOP = 'xMidYMid slice' as const;
const MAP_ANIM_PRESERVE_ASPECT_MOBILE = 'xMinYMid slice' as const;
const MOBILE_MAP_MEDIA_QUERY = '(max-width: 768px)';
/** Wait for dashboard panel height to settle before starting playback. */
const STABLE_SIZE_MS = 450;
/** Matches DrivingView map panel slide-in (`JOURNEY_SCENE_SLIDE_MS`). */
const MAP_ENTRY_FALLBACK_MS = 1050;

function getMapPreserveAspectRatio() {
  if (typeof window === 'undefined') return MAP_ANIM_PRESERVE_ASPECT_DESKTOP;
  return window.matchMedia(MOBILE_MAP_MEDIA_QUERY).matches
    ? MAP_ANIM_PRESERVE_ASPECT_MOBILE
    : MAP_ANIM_PRESERVE_ASPECT_DESKTOP;
}

function applyMapPreserveAspectRatio(container: HTMLDivElement) {
  const svg = container.querySelector('svg');
  if (svg) {
    svg.setAttribute('preserveAspectRatio', getMapPreserveAspectRatio());
  }
}

function JourneyNavMapAnimationInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let finished = false;
    let playbackStarted = false;
    let playStartMs = 0;
    let manualRafId = 0;
    let stableTimer: ReturnType<typeof setTimeout> | null = null;
    let entryFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let lastPaintedFrame = -1;
    let entryReleased = false;
    const lastSizeRef = { w: 0, h: 0 };

    const anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: mapAnimationData,
      rendererSettings: {
        preserveAspectRatio: getMapPreserveAspectRatio(),
        progressiveLoad: false,
        hideOnTransparent: true,
      },
    });

    const paintFrame = (frame: number) => {
      const clamped = Math.max(0, Math.min(frame, MAP_FRAME_END));
      anim.goToAndStop(clamped, true);
      applyMapPreserveAspectRatio(container);
      lastPaintedFrame = clamped;
    };

    const finishAtEnd = () => {
      if (finished) return;
      finished = true;
      paintFrame(MAP_FRAME_END);
    };

    const holdAtStartFrame = () => {
      if (playbackStarted || finished) return;
      if (!sizeToContainer()) return;
      paintFrame(0);
    };

    const sizeToContainer = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 8 || height < 8) return false;

      if (width === lastSizeRef.w && height === lastSizeRef.h) {
        return true;
      }

      const frameBefore = playbackStarted ? lastPaintedFrame : 0;

      lastSizeRef.w = width;
      lastSizeRef.h = height;
      anim.resize(width, height);
      applyMapPreserveAspectRatio(container);

      if (playbackStarted && frameBefore >= 0) {
        paintFrame(frameBefore);
      } else if (!playbackStarted) {
        holdAtStartFrame();
      }

      return true;
    };

    const tickManualPlayback = () => {
      if (finished || !playbackStarted) return;

      const elapsedSec = (performance.now() - playStartMs) / 1000;
      const targetFrame = Math.min(
        Math.floor(elapsedSec * MAP_ANIM_FPS),
        MAP_FRAME_END,
      );

      if (targetFrame >= MAP_FRAME_END) {
        finishAtEnd();
        return;
      }

      if (targetFrame !== lastPaintedFrame) {
        paintFrame(targetFrame);
      }

      manualRafId = requestAnimationFrame(tickManualPlayback);
    };

    const startPlayback = () => {
      if (finished || playbackStarted) return;
      if (!sizeToContainer()) return;

      playbackStarted = true;
      playStartMs = performance.now();
      paintFrame(0);
      manualRafId = requestAnimationFrame(tickManualPlayback);
    };

    const releaseMapEntry = () => {
      if (entryReleased) return;
      entryReleased = true;
      holdAtStartFrame();
      schedulePlaybackStart();
    };

    const schedulePlaybackStart = () => {
      if (playbackStarted || finished || !entryReleased) return;
      if (!sizeToContainer()) return;

      if (stableTimer) {
        window.clearTimeout(stableTimer);
      }

      stableTimer = window.setTimeout(() => {
        stableTimer = null;
        startPlayback();
      }, STABLE_SIZE_MS);
    };

    const onDomLoaded = () => {
      holdAtStartFrame();
      schedulePlaybackStart();
    };

    anim.addEventListener('DOMLoaded', onDomLoaded);

    if (anim.isLoaded) {
      holdAtStartFrame();
      schedulePlaybackStart();
    }

    const observer = new ResizeObserver(() => {
      sizeToContainer();
      schedulePlaybackStart();
    });
    observer.observe(container);

    const onEnterComplete = () => {
      releaseMapEntry();
    };
    window.addEventListener('journey-nav-map-enter-complete', onEnterComplete);
    entryFallbackTimer = window.setTimeout(releaseMapEntry, MAP_ENTRY_FALLBACK_MS);

    const onRepaintRequest = () => {
      if (!playbackStarted || finished) return;
      paintFrame(lastPaintedFrame);
    };
    window.addEventListener('journey-nav-map-repaint', onRepaintRequest);

    const mobileMapQuery = window.matchMedia(MOBILE_MAP_MEDIA_QUERY);
    const onMobileMapQueryChange = () => {
      applyMapPreserveAspectRatio(container);
      if (playbackStarted && !finished) {
        paintFrame(lastPaintedFrame);
      } else if (!playbackStarted) {
        holdAtStartFrame();
      }
    };
    mobileMapQuery.addEventListener('change', onMobileMapQueryChange);

    return () => {
      if (stableTimer) {
        window.clearTimeout(stableTimer);
      }
      if (entryFallbackTimer) {
        window.clearTimeout(entryFallbackTimer);
      }
      cancelAnimationFrame(manualRafId);
      observer.disconnect();
      window.removeEventListener('journey-nav-map-enter-complete', onEnterComplete);
      window.removeEventListener('journey-nav-map-repaint', onRepaintRequest);
      mobileMapQuery.removeEventListener('change', onMobileMapQueryChange);
      anim.removeEventListener('DOMLoaded', onDomLoaded);
      anim.destroy();
    };
  }, []);

  return (
    <div className="journey-nav-map-frame" aria-hidden>
      <div ref={containerRef} className="journey-nav-map-panel__lottie" />
    </div>
  );
}

export const JourneyNavMapAnimation = memo(JourneyNavMapAnimationInner);
