import { useEffect, useState } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

export function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    onChange();
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
