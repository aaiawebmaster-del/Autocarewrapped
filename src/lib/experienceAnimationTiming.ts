/** 2× duration = half playback speed for the start + journey sequences. */
export const EXPERIENCE_ANIMATION_TIME_SCALE = 2;

export function scaleExperienceMs(ms: number): number {
  return Math.round(ms * EXPERIENCE_ANIMATION_TIME_SCALE);
}

export function scaleExperienceS(seconds: number): number {
  return seconds * EXPERIENCE_ANIMATION_TIME_SCALE;
}

export const DRIVING_LOTTIE_PLAYBACK_SPEED = 1 / EXPERIENCE_ANIMATION_TIME_SCALE;

export const JOURNEY_GAUGE_DURATION_MS = scaleExperienceMs(2400);
