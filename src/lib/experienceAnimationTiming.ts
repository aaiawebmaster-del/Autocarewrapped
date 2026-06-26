/** 2× duration = half playback speed for Lottie, gauges, map parallax, and sky. */
export const EXPERIENCE_PLAYBACK_TIME_SCALE = 2;

export function scalePlaybackMs(ms: number): number {
  return Math.round(ms * EXPERIENCE_PLAYBACK_TIME_SCALE);
}

export function scalePlaybackS(seconds: number): number {
  return seconds * EXPERIENCE_PLAYBACK_TIME_SCALE;
}

export const DRIVING_LOTTIE_PLAYBACK_SPEED = 1 / EXPERIENCE_PLAYBACK_TIME_SCALE;

export const JOURNEY_GAUGE_DURATION_MS = scalePlaybackMs(2400);
