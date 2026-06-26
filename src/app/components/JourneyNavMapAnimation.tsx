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

type MapPlaybackEngine = {
  disposed: boolean;
  rafId: number;
  resizeRafId: number;
  stableTimer: ReturnType<typeof setTimeout> | null;
  entryFallbackTimer: ReturnType<typeof setTimeout> | null;
  entryReleased: boolean;
  playbackStarted: boolean;
  finished: boolean;
  playStartMs: number;
  pausedElapsedMs: number;
  maxScrollPx: number;
  mapReady: boolean;
  viewport: HTMLDivElement | null;
  map: HTMLImageElement | null;
  pause: () => void;
  resume: () => void;
};

function JourneyNavMapAnimationInner({
  playbackPaused = false,
}: {
  playbackPaused?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLImageElement>(null);
  const playbackPausedRef = useRef(playbackPaused);
  playbackPausedRef.current = playbackPaused;

  const engineRef = useRef<MapPlaybackEngine>({
    disposed: false,
    rafId: 0,
    resizeRafId: 0,
    stableTimer: null,
    entryFallbackTimer: null,
    entryReleased: false,
    playbackStarted: false,
    finished: false,
    playStartMs: 0,
    pausedElapsedMs: 0,
    maxScrollPx: 0,
    mapReady: false,
    viewport: null,
    map: null,
    pause: () => {},
    resume: () => {},
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const map = mapRef.current;
    if (!viewport || !map) return;

    const engine = engineRef.current;
    engine.disposed = false;
    engine.viewport = viewport;
    engine.map = map;
    engine.entryReleased = false;
    engine.playbackStarted = false;
    engine.finished = false;
    engine.playStartMs = 0;
    engine.pausedElapsedMs = 0;
    engine.maxScrollPx = 0;
    engine.mapReady = false;

    const measure = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const viewportH = viewportRect.height;
      const viewportW = viewportRect.width;
      if (viewportW < 8 || viewportH < 8) return false;

      const mapH = viewportW * MAP_ASPECT_HEIGHT_RATIO;
      engine.maxScrollPx = Math.max(0, mapH - viewportH);
      return true;
    };

    const applyScroll = (scrollPx: number) => {
      map.style.transform = `translate3d(0, ${scrollPx}px, 0)`;
    };

    const applyProgress = (progress: number) => {
      measure();
      applyScroll(progress * engine.maxScrollPx);
    };

    const holdAtStart = () => {
      if (engine.playbackStarted || engine.finished) return;
      if (!measure()) return;
      applyScroll(0);
    };

    const finishAtEnd = () => {
      if (engine.finished) return;
      engine.finished = true;
      cancelAnimationFrame(engine.rafId);
      measure();
      applyScroll(engine.maxScrollPx);
    };

    const tick = () => {
      if (engine.disposed || engine.finished || !engine.playbackStarted) return;

      if (playbackPausedRef.current) {
        engine.pausedElapsedMs = performance.now() - engine.playStartMs;
        applyProgress(engine.pausedElapsedMs / JOURNEY_MAP_SCROLL_DURATION_MS);
        return;
      }

      const elapsed = performance.now() - engine.playStartMs;
      const progress = Math.min(elapsed / JOURNEY_MAP_SCROLL_DURATION_MS, 1);
      applyProgress(progress);

      if (progress >= 1) {
        finishAtEnd();
        return;
      }

      engine.rafId = requestAnimationFrame(tick);
    };

    engine.pause = () => {
      cancelAnimationFrame(engine.rafId);
      if (!engine.playbackStarted || engine.finished) return;
      engine.pausedElapsedMs = performance.now() - engine.playStartMs;
      applyProgress(engine.pausedElapsedMs / JOURNEY_MAP_SCROLL_DURATION_MS);
    };

    engine.resume = () => {
      if (engine.disposed || engine.finished || !engine.playbackStarted) return;
      if (playbackPausedRef.current) return;
      cancelAnimationFrame(engine.rafId);
      engine.playStartMs = performance.now() - engine.pausedElapsedMs;
      engine.rafId = requestAnimationFrame(tick);
    };

    const startPlayback = () => {
      if (engine.finished || engine.playbackStarted || !engine.entryReleased || !engine.mapReady) return;
      if (!measure()) return;

      engine.playbackStarted = true;

      if (prefersReducedMotion()) {
        finishAtEnd();
        window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_PLAYBACK_EVENT));
        return;
      }

      engine.playStartMs = performance.now();
      engine.pausedElapsedMs = 0;
      applyScroll(0);
      window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_PLAYBACK_EVENT));

      if (playbackPausedRef.current) {
        engine.pause();
        return;
      }

      engine.rafId = requestAnimationFrame(tick);
    };

    const schedulePlaybackStart = () => {
      if (engine.playbackStarted || engine.finished || !engine.entryReleased || !engine.mapReady) return;
      if (!measure()) return;

      if (engine.stableTimer) {
        window.clearTimeout(engine.stableTimer);
      }

      engine.stableTimer = window.setTimeout(() => {
        engine.stableTimer = null;
        startPlayback();
      }, JOURNEY_MAP_STABLE_MS);
    };

    const releaseMapEntry = () => {
      if (engine.entryReleased) return;
      engine.entryReleased = true;
      holdAtStart();
      schedulePlaybackStart();
    };

    const onMapReady = () => {
      if (engine.disposed) return;
      engine.mapReady = true;
      holdAtStart();
      schedulePlaybackStart();
    };

    const onEnterComplete = () => {
      releaseMapEntry();
    };

    const onRepaintRequest = () => {
      if (!engine.playbackStarted || engine.finished) return;
      const elapsed = playbackPausedRef.current
        ? engine.pausedElapsedMs
        : performance.now() - engine.playStartMs;
      applyProgress(Math.min(elapsed / JOURNEY_MAP_SCROLL_DURATION_MS, 1));
    };

    if (map.complete) {
      onMapReady();
    } else {
      map.addEventListener('load', onMapReady);
    }

    const observer = new ResizeObserver(() => {
      if (engine.resizeRafId) return;
      engine.resizeRafId = requestAnimationFrame(() => {
        engine.resizeRafId = 0;
        if (engine.playbackStarted && !engine.finished) {
          onRepaintRequest();
        } else if (!engine.playbackStarted) {
          holdAtStart();
          schedulePlaybackStart();
        } else if (engine.finished) {
          measure();
          applyScroll(engine.maxScrollPx);
        }
      });
    });
    observer.observe(viewport);

    window.addEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
    engine.entryFallbackTimer = window.setTimeout(releaseMapEntry, JOURNEY_MAP_ENTRY_FALLBACK_MS);
    window.addEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);

    if (playbackPausedRef.current) {
      engine.pause();
    }

    return () => {
      engine.disposed = true;
      if (engine.stableTimer) window.clearTimeout(engine.stableTimer);
      if (engine.entryFallbackTimer) window.clearTimeout(engine.entryFallbackTimer);
      if (engine.resizeRafId) cancelAnimationFrame(engine.resizeRafId);
      cancelAnimationFrame(engine.rafId);
      observer.disconnect();
      map.removeEventListener('load', onMapReady);
      window.removeEventListener(JOURNEY_NAV_MAP_ENTER_EVENT, onEnterComplete);
      window.removeEventListener(JOURNEY_NAV_MAP_REPAINT_EVENT, onRepaintRequest);
    };
  }, []);

  useEffect(() => {
    if (playbackPaused) {
      engineRef.current.pause();
      return;
    }
    engineRef.current.resume();
  }, [playbackPaused]);

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
