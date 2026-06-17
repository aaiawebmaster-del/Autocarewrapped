/** Feature flags and browser hints for progressive enhancement fallbacks. */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export function supportsContainerQueries(): boolean {
  if (typeof CSS === 'undefined' || !('supports' in CSS)) return false;
  return CSS.supports('container-type: inline-size');
}

export function supportsBackdropFilter(): boolean {
  if (typeof CSS === 'undefined' || !('supports' in CSS)) return false;
  return (
    CSS.supports('backdrop-filter: blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter: blur(1px)')
  );
}

/** Lottie canvas renderer is faster on mobile; Safari supports it in recent versions. */
export function preferCanvasLottieRenderer(): boolean {
  return isMobileViewport() || prefersReducedMotion();
}

export function applyDocumentCompatClasses(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (prefersReducedMotion()) {
    root.classList.add('reduce-motion');
  }

  if (!supportsContainerQueries()) {
    root.classList.add('no-container-queries');
  }

  if (!supportsBackdropFilter()) {
    root.classList.add('no-backdrop-filter');
  }

  const ua = navigator.userAgent;
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) {
    root.classList.add('is-safari');
  }
  if (/Firefox/i.test(ua)) {
    root.classList.add('is-firefox');
  }
  if (/Edg/i.test(ua)) {
    root.classList.add('is-edge');
  }
}
