import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const PRNDL_GEARS = ['P', 'R', 'N', 'D', 'L'] as const;

export type DashboardGear = (typeof PRNDL_GEARS)[number];

type HighlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DashboardPrndlProps = {
  activeGear: DashboardGear;
};

export function DashboardPrndl({ activeGear }: DashboardPrndlProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const gearRefs = useRef<Partial<Record<DashboardGear, HTMLSpanElement>>>({});
  const [highlight, setHighlight] = useState<HighlightRect | null>(null);

  const updateHighlight = useCallback(() => {
    const pill = pillRef.current;
    const gearEl = gearRefs.current[activeGear];
    if (!pill || !gearEl) return;

    setHighlight({
      left: gearEl.offsetLeft,
      top: gearEl.offsetTop,
      width: gearEl.offsetWidth,
      height: gearEl.offsetHeight,
    });
  }, [activeGear]);

  useLayoutEffect(() => {
    updateHighlight();

    const pill = pillRef.current;
    if (!pill) return;

    const resizeObserver = new ResizeObserver(() => {
      updateHighlight();
    });

    resizeObserver.observe(pill);
    for (const gearEl of Object.values(gearRefs.current)) {
      if (gearEl) resizeObserver.observe(gearEl);
    }

    return () => resizeObserver.disconnect();
  }, [activeGear, updateHighlight]);

  return (
    <div
      className="dashboard-prndl"
      role="status"
      aria-live="polite"
      aria-label={`Transmission ${activeGear}`}
    >
      <div className="dashboard-prndl__pill" ref={pillRef}>
        {highlight ? (
          <span
            className="dashboard-prndl__highlight"
            style={{
              left: highlight.left,
              top: highlight.top,
              width: highlight.width,
              height: highlight.height,
            }}
            aria-hidden
          />
        ) : null}
        {PRNDL_GEARS.map((gear) => {
          const isActive = gear === activeGear;
          return (
            <span
              key={gear}
              ref={(element) => {
                if (element) {
                  gearRefs.current[gear] = element;
                } else {
                  delete gearRefs.current[gear];
                }
              }}
              className={[
                'dashboard-prndl__gear',
                isActive ? 'dashboard-prndl__gear--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="dashboard-prndl__gear-label">{gear}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
