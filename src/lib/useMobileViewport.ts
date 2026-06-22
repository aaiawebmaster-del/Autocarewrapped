import { useEffect, useState } from 'react';
import { isMobileLayoutWidth } from '@/lib/viewportLayout';

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

export function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (import.meta.env.VITE_DISABLE_MOBILE_VIEWPORT === '1') return false;
    return (
      window.matchMedia(MOBILE_MEDIA_QUERY).matches &&
      isMobileLayoutWidth(window.innerWidth)
    );
  });

  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_MOBILE_VIEWPORT === '1') {
      setIsMobile(false);
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => {
      setIsMobile(
        mediaQuery.matches && isMobileLayoutWidth(window.innerWidth),
      );
    };
    mediaQuery.addEventListener('change', onChange);
    onChange();
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
