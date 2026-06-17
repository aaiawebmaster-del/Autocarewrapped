import { memo, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { loadGpsMapAnimation } from '@/lib/lazyLottieData';
import { preferCanvasLottieRenderer } from '@/lib/browserCompat';
import {
  JOURNEY_MAP_ENTRY_FALLBACK_MS,
  JOURNEY_MAP_STABLE_MS,
  JOURNEY_NAV_MAP_ENTER_EVENT,
  JOURNEY_NAV_MAP_PLAYBACK_EVENT,
  JOURNEY_NAV_MAP_REPAINT_EVENT,
} from '@/lib/journeySceneTiming';

const MAP_ANIM_META_FALLBACK = { op: 300, fr: 30 };
const MAP_ANIM_PRESERVE_ASPECT_DESKTOP = 'xMidYMid slice' as const;
const MAP_ANIM_PRESERVE_ASPECT_MOBILE = 'xMinYMid slice' as const;
const MOBILE_MAP_MEDIA_QUERY = '(max-width: 768px)';

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
    let anim: ReturnType<typeof lottie.loadAnimation> | null = null;
    let mapAnimFps = MAP_ANIM_META_FALLBACK.fr;
    let mapFrameEnd = Math.floor(MAP_ANIM_META_FALLBACK.op - 1);
    let disposed = false;
    const cleanupRef = { current: () => {} };

    void loadGpsMapAnimation().then((mapAnimationData) => {
      if (disposed || !containerRef.current) return;

      const mapAnimMeta = mapAnimationData as { op: number; fr: number };
      mapAnimFps = mapAnimMeta.fr;
      mapFrameEnd = Math.floor(mapAnimMeta.op - 1);

      anim = lottie.loadAnimation({
        container,
        renderer: preferCanvasLottieRenderer() ? 'canvas' : 'svg',
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
        if (!anim) return;
        const clamped = Math.max(0, Math.min(frame, mapFrameEnd));
        anim.goToAndStop(clamped, true);
        if (anim.renderer === 'svg') {
          applyMapPreserveAspectRatio(container);
        }
        lastPaintedFrame = clamped;
      };

      const finishAtEnd = () => {
        if (finished) return;
        finished = true;
        paintFrame(mapFrameEnd);
      };

      const holdAtStartFrame = () => {
        if (playbackStarted || finished) return;
        if (!sizeToContainer()) return;
        paintFrame(0);
      };

      const sizeToContainer = () => {
        if (!anim) return false;
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
          Math.floor(elapsedSec * mapAnimFps),
          mapFrameEnd,
        );

        if (targetFrame >= mapFrameEnd) {
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
        window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_PLAYBACK_EVENT));
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
        }, JOURNEY_MAP_STABLE_MS);
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

      let resizeRafId = 0;
      const observer = new ResizeObserver(() => {
        if (resizeRafId) return;
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = 0;
          sizeToContainer();
          schedulePlaybackStart();
        });
      });
      observer.observe(container);

      const onEnterComplete = () => {
        releaseMapEntry();
      };
      window.addEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
      entryFallbackTimer = window.setTimeout(releaseMapEntry, JOURNEY_MAP_ENTRY_FALLBACK_MS);

      const onRepaintRequest = () => {
        if (!playbackStarted || finished) return;
        paintFrame(lastPaintedFrame);
      };
      window.addEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);

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

      cleanupRef.current = () => {
        if (stableTimer) {
          window.clearTimeout(stableTimer);
        }
        if (entryFallbackTimer) {
          window.clearTimeout(entryFallbackTimer);
        }
        if (resizeRafId) cancelAnimationFrame(resizeRafId);
        cancelAnimationFrame(manualRafId);
        observer.disconnect();
        window.removeEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
        window.removeEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);
        mobileMapQuery.removeEventListener('change', onMobileMapQueryChange);
        anim?.removeEventListener('DOMLoaded', onDomLoaded);
        anim?.destroy();
        anim = null;
      };
    });

    return () => {
      disposed = true;
      cleanupRef.current();
    };
  }, []);

  return (
    <div className="journey-nav-map-frame" aria-hidden>
      <div ref={containerRef} className="journey-nav-map-panel__lottie" />
    </div>
  );
}

export const JourneyNavMapAnimation = memo(JourneyNavMapAnimationInner);
