import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
};

export function LazyLottie({
  loadAnimation,
  active = true,
  className,
  style,
  loop = false,
  autoplay = true,
  rendererSettings,
}: LazyLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
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
      instance.play();
      return;
    }

    instance.pause();
  }, [animationData, shouldAnimate, autoplay, active]);

  if (!active || !animationData) return null;

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay={false}
      className={className}
      style={style}
      renderer={preferCanvasLottieRenderer() ? 'canvas' : 'svg'}
      rendererSettings={rendererSettings}
    />
  );
}
