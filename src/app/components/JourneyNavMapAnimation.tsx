import { memo, useEffect, useRef } from 'react';
import mapBackgroundUrl from '@/assets/mapbackground.svg';
import { prefersReducedMotion } from '@/lib/browserCompat';
import {
  JOURNEY_MAP_ENTRY_FALLBACK_MS,
  JOURNEY_MAP_SCROLL_DURATION_MS,
  JOURNEY_MAP_STABLE_MS,
  JOURNEY_NAV_MAP_ENTER_EVENT,
  JOURNEY_NAV_MAP_PLAYBACK_EVENT,
  JOURNEY_NAV_MAP_REPAINT_EVENT,
} from '@/lib/journeySceneTiming';

/** viewBox height / width from mapbackground.svg */
const MAP_ASPECT_HEIGHT_RATIO = 1700 / 807;

function JourneyNavMapAnimationInner() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const map = mapRef.current;
    if (!viewport || !map) return;

    let disposed = false;
    let rafId = 0;
    let resizeRafId = 0;
    let stableTimer: ReturnType<typeof setTimeout> | null = null;
    let entryFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let entryReleased = false;
    let playbackStarted = false;
    let finished = false;
    let playStartMs = 0;
    let maxScrollPx = 0;
    let mapReady = false;

    const measure = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const viewportH = viewportRect.height;
      const viewportW = viewportRect.width;
      if (viewportW < 8 || viewportH < 8) return false;

      const mapH = viewportW * MAP_ASPECT_HEIGHT_RATIO;
      maxScrollPx = Math.max(0, mapH - viewportH);
      return true;
    };

    const applyScroll = (scrollPx: number) => {
      map.style.transform = `translate3d(0, ${scrollPx}px, 0)`;
    };

    const holdAtStart = () => {
      if (playbackStarted || finished) return;
      if (!measure()) return;
      applyScroll(0);
    };

    const finishAtEnd = () => {
      if (finished) return;
      finished = true;
      measure();
      applyScroll(maxScrollPx);
    };

    const tick = () => {
      if (finished || !playbackStarted) return;

      const elapsed = performance.now() - playStartMs;
      const progress = Math.min(elapsed / JOURNEY_MAP_SCROLL_DURATION_MS, 1);
      measure();
      applyScroll(progress * maxScrollPx);

      if (progress >= 1) {
        finishAtEnd();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    const startPlayback = () => {
      if (finished || playbackStarted || !entryReleased || !mapReady) return;
      if (!measure()) return;

      playbackStarted = true;

      if (prefersReducedMotion()) {
        finishAtEnd();
        window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_PLAYBACK_EVENT));
        return;
      }

      playStartMs = performance.now();
      applyScroll(0);
      window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_PLAYBACK_EVENT));
      rafId = requestAnimationFrame(tick);
    };

    const schedulePlaybackStart = () => {
      if (playbackStarted || finished || !entryReleased || !mapReady) return;
      if (!measure()) return;

      if (stableTimer) {
        window.clearTimeout(stableTimer);
      }

      stableTimer = window.setTimeout(() => {
        stableTimer = null;
        startPlayback();
      }, JOURNEY_MAP_STABLE_MS);
    };

    const releaseMapEntry = () => {
      if (entryReleased) return;
      entryReleased = true;
      holdAtStart();
      schedulePlaybackStart();
    };

    const onMapReady = () => {
      if (disposed) return;
      mapReady = true;
      holdAtStart();
      schedulePlaybackStart();
    };

    const onEnterComplete = () => {
      releaseMapEntry();
    };

    const onRepaintRequest = () => {
      if (!playbackStarted || finished) return;
      const elapsed = performance.now() - playStartMs;
      const progress = Math.min(elapsed / JOURNEY_MAP_SCROLL_DURATION_MS, 1);
      measure();
      applyScroll(progress * maxScrollPx);
    };

    if (map.complete) {
      onMapReady();
    } else {
      map.addEventListener('load', onMapReady);
    }

    const observer = new ResizeObserver(() => {
      if (resizeRafId) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = 0;
        if (playbackStarted && !finished) {
          onRepaintRequest();
        } else if (!playbackStarted) {
          holdAtStart();
          schedulePlaybackStart();
        } else if (finished) {
          measure();
          applyScroll(maxScrollPx);
        }
      });
    });
    observer.observe(viewport);

    window.addEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
    entryFallbackTimer = window.setTimeout(releaseMapEntry, JOURNEY_MAP_ENTRY_FALLBACK_MS);
    window.addEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);

    return () => {
      disposed = true;
      if (stableTimer) window.clearTimeout(stableTimer);
      if (entryFallbackTimer) window.clearTimeout(entryFallbackTimer);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      map.removeEventListener('load', onMapReady);
      window.removeEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
      window.removeEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);
    };
  }, []);

  return (
    <div className="journey-nav-map-frame" aria-hidden>
      <div ref={viewportRef} className="journey-nav-map-panel__scroll">
        <img
          ref={mapRef}
          className="journey-nav-map-panel__map"
          src={mapBackgroundUrl}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
}

export const JourneyNavMapAnimation = memo(JourneyNavMapAnimationInner);
