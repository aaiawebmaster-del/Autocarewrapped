export type LottieAnimationData = Record<string, unknown>;

const animationCache = new Map<string, Promise<LottieAnimationData>>();

function cachedAnimation(
  key: string,
  loader: () => Promise<{ default: LottieAnimationData }>,
): Promise<LottieAnimationData> {
  const existing = animationCache.get(key);
  if (existing) return existing;

  const promise = loader().then((module) => module.default);
  animationCache.set(key, promise);
  return promise;
}

export function loadDrivingAnimation(): Promise<LottieAnimationData> {
  return cachedAnimation('driving', () => import('../imports/driving-animation-background.json'));
}

export function loadGpsMapAnimation(): Promise<LottieAnimationData> {
  return cachedAnimation('gps-map', () => import('../imports/gps-navigation-map.json'));
}

export function loadCarBatteryAnimation(): Promise<LottieAnimationData> {
  return cachedAnimation('car-battery', () => import('../imports/car-battery.json'));
}

export function loadWheelAlignmentAnimation(): Promise<LottieAnimationData> {
  return cachedAnimation('wheel-alignment', () => import('../imports/wheel-alignment-service.json'));
}

export function loadTireGaugeAnimation(): Promise<LottieAnimationData> {
  return cachedAnimation('tire-gauge', () => import('../imports/tire.json'));
}
