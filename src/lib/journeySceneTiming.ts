/** Shared motion + event timing for counter ↔ map journey transitions. */
export const JOURNEY_SCENE_TRANSITION = {
  duration: 0.55,
  ease: [0.4, 0, 0.2, 1] as const,
};

export const JOURNEY_SCENE_SLIDE_TRANSITION = {
  duration: 0.95,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const JOURNEY_SCENE_SLIDE_MS = Math.round(JOURNEY_SCENE_SLIDE_TRANSITION.duration * 1000);

/** Brief layout settle while the panel slide is in progress. */
export const JOURNEY_MAP_STABLE_MS = 120;

export const JOURNEY_MAP_ENTRY_FALLBACK_MS = JOURNEY_SCENE_SLIDE_MS + 40;

/** First map segment — hold "calculating" through the dashboard slide. */
export const JOURNEY_CALCULATING_HOLD_MS = JOURNEY_SCENE_SLIDE_MS;

export const JOURNEY_NAV_MAP_ENTER_EVENT = 'journey-nav-map-enter-complete';
export const JOURNEY_NAV_MAP_PLAYBACK_EVENT = 'journey-nav-map-playback-started';
export const JOURNEY_NAV_MAP_REPAINT_EVENT = 'journey-nav-map-repaint';
