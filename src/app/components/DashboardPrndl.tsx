import { motion } from 'motion/react';

const PRNDL_GEARS = ['P', 'R', 'N', 'D', 'L'] as const;

export type DashboardGear = (typeof PRNDL_GEARS)[number];

const PRNDL_GLIDE_TRANSITION = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 30,
  mass: 0.85,
};

type DashboardPrndlProps = {
  activeGear: DashboardGear;
};

export function DashboardPrndl({ activeGear }: DashboardPrndlProps) {
  return (
    <div
      className="dashboard-prndl"
      role="status"
      aria-live="polite"
      aria-label={`Transmission ${activeGear}`}
    >
      <div className="dashboard-prndl__pill">
        {PRNDL_GEARS.map((gear) => {
          const isActive = gear === activeGear;
          return (
            <span
              key={gear}
              className={[
                'dashboard-prndl__gear',
                isActive ? 'dashboard-prndl__gear--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'true' : undefined}
            >
              {isActive ? (
                <motion.span
                  layoutId="dashboard-prndl-highlight"
                  className="dashboard-prndl__highlight"
                  transition={PRNDL_GLIDE_TRANSITION}
                  aria-hidden
                />
              ) : null}
              <span className="dashboard-prndl__gear-label">{gear}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
