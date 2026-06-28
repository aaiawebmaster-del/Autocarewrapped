import { useMemo, useRef, type ReactNode } from 'react';
import { LazyLottie } from '@/app/components/LazyLottie';
import { loadCarBatteryAnimation } from '@/lib/lazyLottieData';
import { useElementResizeSize } from '@/lib/useElementResizeSize';

type HoodStandardsSceneContentProps = {
  active: boolean;
  popup: ReactNode | null;
};

export function HoodStandardsSceneContent({
  active,
  popup,
}: HoodStandardsSceneContentProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const batteryBgRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const slotSize = useElementResizeSize(slotRef, active);
  const batterySize = useElementResizeSize(batteryBgRef, active);
  const anchorSize = useElementResizeSize(anchorRef, popup != null);

  const layoutEpoch = useMemo(
    () =>
      slotSize.width +
      slotSize.height +
      batterySize.width +
      batterySize.height +
      anchorSize.width +
      anchorSize.height,
    [slotSize, batterySize, anchorSize],
  );

  const syncSize = useMemo(
    () => ({
      width: batterySize.width || slotSize.width,
      height: batterySize.height || slotSize.height,
    }),
    [batterySize, slotSize],
  );

  return (
    <div className="hood-standards-scene__content">
      <div ref={slotRef} className="hood-standards-scene__animation-slot">
        <div ref={batteryBgRef} className="hood-standards-scene__battery-bg">
          <LazyLottie
            loadAnimation={loadCarBatteryAnimation}
            active={active}
            loop
            autoplay
            renderer="svg"
            className="hood-standards-scene__battery-player"
            rendererSettings={{ preserveAspectRatio: 'xMidYMax meet' }}
            syncSize={syncSize}
            layoutEpoch={layoutEpoch}
            sizeContainerSelector=".hood-standards-scene__battery-bg"
          />
        </div>
      </div>
      {popup ? (
        <div ref={anchorRef} className="hood-standards-popup-anchor">
          {popup}
        </div>
      ) : null}
    </div>
  );
}
