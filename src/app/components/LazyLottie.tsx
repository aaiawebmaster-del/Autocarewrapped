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
}: LazyLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = active && !prefersReducedMotion();

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    void loadAnimation().then((data) => {
      if (!cancelled) setAnimationData(data);
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
  }, [animationData, shouldAnimate, autoplay, active, playbackSpeed]);

  useLayoutEffect(() => {
    if (!active || !animationData) return;
    const container = containerRef.current;
    if (!container) return;

    const lastSizeRef = { w: 0, h: 0 };

    const syncCanvasSize = () => {
      const anim = lottieRef.current?.animationItem;
      if (!anim || typeof anim.resize !== 'function') return;

      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 8 || height < 8) return;
      if (width === lastSizeRef.w && height === lastSizeRef.h) return;

      lastSizeRef.w = width;
      lastSizeRef.h = height;
      anim.resize(width, height);
    };

    syncCanvasSize();
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(container);

    const slot = container.closest('.hood-standards-scene__animation-slot');
    if (slot && slot !== container) {
      observer.observe(slot);
    }

    window.addEventListener('resize', syncCanvasSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [active, animationData]);

  if (!active || !animationData) return null;

  return (
    <div ref={containerRef} className={className} style={style}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={false}
        style={{ width: '100%', height: '100%' }}
        renderer={preferCanvasLottieRenderer() ? 'canvas' : 'svg'}
        rendererSettings={rendererSettings}
      />
    </div>
  );
}
