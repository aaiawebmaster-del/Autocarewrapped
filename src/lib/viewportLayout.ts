import { useEffect, useState } from 'react';

const MOBILE_LAYOUT_MAX_WIDTH_PX = 768;

/** Kick-the-tires tablet stack — always follows real viewport unless ?hoodDesktop=1. */
export function isTireHubMobileStack(widthPx: number): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('hoodDesktop')) return false;
  }
  return widthPx <= MOBILE_LAYOUT_MAX_WIDTH_PX;
}

/** General app mobile layout — respects VITE_DISABLE_MOBILE_VIEWPORT for desktop testing. */
export function isMobileLayoutWidth(widthPx: number): boolean {
  if (import.meta.env.VITE_DISABLE_MOBILE_VIEWPORT === '1') return false;
  return isTireHubMobileStack(widthPx);
}

export function useTireHubMobileStack(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isTireHubMobileStack(window.innerWidth);
  });

  useEffect(() => {
    const onResize = () => setIsMobile(isTireHubMobileStack(window.innerWidth));
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}
