import { useEffect, useRef } from 'react';
import {
  DEMAND_INDEX_PRODUCT_GROUPS,
  DEMAND_INDEX_PRODUCT_LIST_SCROLL_MS,
} from '@/lib/demandIndexProductGroups';

const SCROLL_START_DELAY_MS = 280;

function easeInCubic(t: number): number {
  return t * t * t;
}

function prefersReducedMotion(): boolean {
  if (typeof document === 'undefined') return false;
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type HoodDemandIndexProductListScrollProps = {
  active: boolean;
};

export function HoodDemandIndexProductListScroll({
  active,
}: HoodDemandIndexProductListScrollProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = 0;

    let frameId = 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const stopAutoScroll = () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      cancelAnimationFrame(frameId);
    };

    const onUserInteract = () => stopAutoScroll();

    viewport.addEventListener('wheel', onUserInteract, { passive: true });
    viewport.addEventListener('touchstart', onUserInteract, { passive: true });
    viewport.addEventListener('pointerdown', onUserInteract);

    const runScroll = () => {
      if (cancelled) return;

      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      if (maxScroll <= 0) return;

      if (prefersReducedMotion()) {
        viewport.scrollTop = maxScroll;
        return;
      }

      const startAt = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;

        const elapsed = now - startAt;
        const progress = Math.min(1, elapsed / DEMAND_INDEX_PRODUCT_LIST_SCROLL_MS);
        viewport.scrollTop = maxScroll * easeInCubic(progress);

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    delayTimer = setTimeout(() => {
      if (!cancelled) runScroll();
    }, SCROLL_START_DELAY_MS);

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      cancelAnimationFrame(frameId);
      viewport.removeEventListener('wheel', onUserInteract);
      viewport.removeEventListener('touchstart', onUserInteract);
      viewport.removeEventListener('pointerdown', onUserInteract);
    };
  }, [active]);

  return (
    <div
      ref={viewportRef}
      className="hood-tire-hub__product-list-viewport"
      tabIndex={0}
      role="region"
      aria-label="DemandIndex product groups"
    >
      <ul className="hood-tire-hub__product-list">
        {DEMAND_INDEX_PRODUCT_GROUPS.map((group) => (
          <li key={group} className="hood-tire-hub__product-list-item">
            {group}
          </li>
        ))}
      </ul>
    </div>
  );
}
