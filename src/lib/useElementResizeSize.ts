import { useLayoutEffect, useState, type RefObject } from 'react';

export type ElementResizeSize = {
  width: number;
  height: number;
};

export function useElementResizeSize<T extends Element>(
  ref: RefObject<T | null>,
  enabled = true,
): ElementResizeSize {
  const [size, setSize] = useState<ElementResizeSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);
          setSize((prev) =>
            prev.width === width && prev.height === height
              ? prev
              : { width, height },
          );
        });
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [enabled, ref]);

  return size;
}
