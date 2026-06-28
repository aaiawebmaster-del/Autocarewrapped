import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { preferCanvasLottieRenderer, prefersReducedMotion } from '@/lib/browserCompat';
import type { LottieAnimationData } from '@/lib/lazyLottieData';

type LazyLottieProps = {
  loadAnimation: () => Promise<LottieAnimationData>;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: {
    preserveAspectRatio?: string;
    hideOnTransparent?: boolean;
  };
  /** Lottie playback rate (1 = normal). Use 0.5 for half speed. */
  playbackSpeed?: number;
  /** Force a renderer; default picks canvas on mobile and SVG on desktop. */
  renderer?: 'canvas' | 'svg' | 'auto';
  /** Measured layout box — when set, Lottie is resized to these dimensions. */
  syncSize?: { width: number; height: number };
  /** Bumps whenever related layout nodes resize (e.g. popup anchor). */
  layoutEpoch?: number;
  /** Closest ancestor used for fresh dimension reads when layoutEpoch changes. */
  sizeContainerSelector?: string;
};

export function LazyLottie({
  loadAnimation,
  active = true,
  className,
  style,
  loop = false,
  autoplay = true,
  rendererSettings,
  playbackSpeed = 1,
  renderer = 'auto',
  syncSize,
  layoutEpoch = 0,
  sizeContainerSelector,
}: LazyLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = active && !prefersReducedMotion();

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    void loadAnimation().then((data) => {
      if (!cancelled) {
        setAnimationData(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [active, loadAnimation]);

  useEffect(() => {
    const instance = lottieRef.current;
    if (!instance || !animationData) return;

    if (shouldAnimate && autoplay) {
      if (typeof instance.setSpeed === 'function') {
        instance.setSpeed(playbackSpeed);
      }
      instance.play();
      return;
    }

    instance.pause();
  }, [animationData, shouldAnimate, autoplay, active, playbackSpeed, layoutEpoch]);

  useLayoutEffect(() => {
    if (!active || !animationData) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    const lastSizeRef = { w: 0, h: 0 };

    const readTargetSize = (): { width: number; height: number } => {
      const sizingEl =
        (sizeContainerSelector
          ? container.closest(sizeContainerSelector)
          : null) ?? container;
      const rect = sizingEl.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };

    const applyResize = (width: number, height: number) => {
      const anim = lottieRef.current?.animationItem;
      if (!anim || typeof anim.resize !== 'function') return;
      if (width < 8 || height < 8) return;
      if (width === lastSizeRef.w && height === lastSizeRef.h) return;

      lastSizeRef.w = width;
      lastSizeRef.h = height;
      anim.resize(width, height);
      if (active && !prefersReducedMotion() && autoplay) {
        lottieRef.current?.play();
      }
    };

    const syncCanvasSize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          const measured = readTargetSize();
          const width = syncSize?.width || measured.width;
          const height = syncSize?.height || measured.height;
          applyResize(width, height);
        });
      });
    };

    syncCanvasSize();
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(container);

    const observeTarget = (selector: string) => {
      const target = container.closest(selector);
      if (target instanceof Element && target !== container) {
        observer.observe(target);
      }
    };

    observeTarget('.hood-standards-scene__battery-bg');
    observeTarget('.hood-standards-scene__animation-slot');
    observeTarget('.hood-standards-scene__content');
    observeTarget('.hood-standards-scene');
    observeTarget('.hood-standards-popup-anchor');
    observeTarget('.driving-view-backdrop');
    observeTarget('.driving-view-root');
    observeTarget('.dashboard-panel--landing');
    observeTarget('.dashboard-panel--pre-journey');

    window.addEventListener('resize', syncCanvasSize);
    window.visualViewport?.addEventListener('resize', syncCanvasSize);
    window.visualViewport?.addEventListener('scroll', syncCanvasSize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', syncCanvasSize);
      window.visualViewport?.removeEventListener('resize', syncCanvasSize);
      window.visualViewport?.removeEventListener('scroll', syncCanvasSize);
    };
  }, [
    active,
    animationData,
    syncSize?.width,
    syncSize?.height,
    layoutEpoch,
    sizeContainerSelector,
  ]);

  if (!active || !animationData) return null;

  const lottieRenderer =
    renderer === 'auto'
      ? preferCanvasLottieRenderer()
        ? 'canvas'
        : 'svg'
      : renderer;

  return (
    <div ref={containerRef} className={className} style={style}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={false}
        style={{ width: '100%', height: '100%' }}
        renderer={lottieRenderer}
        rendererSettings={rendererSettings}
      />
    </div>
  );
}
