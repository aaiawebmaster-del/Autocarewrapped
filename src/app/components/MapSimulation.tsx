import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import frame7Paths from '../../imports/Frame7/svg-6dey2phzjs';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import gpsMapTexture from '../../assets/gps-map-dark.png';
import engineFullImage from '../../assets/engine-full.png?url';
import engineHoleFrameImage from '../../assets/engine-hole-frame.png?url';
import acesOilImage from '../../assets/aces-oil.png?url';
import piesOilImage from '../../assets/pies-oil.png?url';
import ipoOilImage from '../../assets/ipo-oil.png?url';
import ishopOilImage from '../../assets/ishop-oil.png?url';
import superspecOilImage from '../../assets/superspec-oil.png?url';
import trendlensLogoImage from '../../assets/trendlens-logo.png?url';
import tireWheelImage from '../../assets/tire-wheel.png?url';
import tirePressureGaugeImage from '../../assets/tire-pressure-gauge.png?url';
import iconGear from '../../assets/map-controls/gear-solid-full.png';
import iconVolume from '../../assets/map-controls/volume-low-solid-full.png';
import iconPlus from '../../assets/map-controls/plus-solid-full.png';
import iconMinus from '../../assets/map-controls/minus-solid-full.png';

export const DASHBOARD_ARCH_PATH = svgPaths.p33654d00;
export const MAP_CANVAS_DARK = '#151a22';
export const ARCH_FILL_GREY = '#737373';

export const TIRE_PHASE_ORDER = [
  'trendlens',
  'demandindex',
  'factbook',
  'academy',
] as const;

export type TirePhase = (typeof TIRE_PHASE_ORDER)[number];
export type HoodPhase = 'standards' | TirePhase;

export function isTirePhase(phase: HoodPhase): phase is TirePhase {
  return phase !== 'standards';
}

/** Checkmark slots: top-left → top-right → bottom-left → bottom-right */
export function getTireCheckIndex(phase: TirePhase): number {
  return TIRE_PHASE_ORDER.indexOf(phase);
}

export const TRENDLENS_USER_COUNT = 40;
export const TRENDLENS_CONTACT_PCT = 54;
export const DEMANDINDEX_USER_COUNT = 30;
export const DEMANDINDEX_CONTACT_PCT = 45;
export const FACTBOOK_USER_COUNT = 20;
export const FACTBOOK_CONTACT_PCT = 13;
export const ACADEMY_GRADUATES = 3;
export const ACADEMY_COURSES_COMPLETED = 3;
export const ACADEMY_COURSES_TOTAL = 6;

function getNextTirePhase(phase: TirePhase): TirePhase | null {
  const i = TIRE_PHASE_ORDER.indexOf(phase);
  return i < 0 || i >= TIRE_PHASE_ORDER.length - 1 ? null : TIRE_PHASE_ORDER[i + 1];
}

function getPrevTirePhase(phase: TirePhase): TirePhase | null {
  const i = TIRE_PHASE_ORDER.indexOf(phase);
  return i <= 0 ? null : TIRE_PHASE_ORDER[i - 1];
}

type TireReadoutSecondary =
  | { type: 'percent'; value: number; suffix: string }
  | { type: 'fraction'; completed: number; total: number; suffix: string };

type TireReadoutConfig = {
  measuring: string;
  primaryValue: number;
  primaryLabel: string;
  secondary: TireReadoutSecondary;
};

const TIRE_READOUT_CONFIG: Record<TirePhase, TireReadoutConfig> = {
  trendlens: {
    measuring: 'measuring trendlens usage..',
    primaryValue: TRENDLENS_USER_COUNT,
    primaryLabel: 'TrendLens Users',
    secondary: { type: 'percent', value: TRENDLENS_CONTACT_PCT, suffix: 'of your active contacts' },
  },
  demandindex: {
    measuring: 'measuring demandindex usage..',
    primaryValue: DEMANDINDEX_USER_COUNT,
    primaryLabel: 'DemandIndex users',
    secondary: { type: 'percent', value: DEMANDINDEX_CONTACT_PCT, suffix: 'of active contacts' },
  },
  factbook: {
    measuring: 'measuring factbook usage..',
    primaryValue: FACTBOOK_USER_COUNT,
    primaryLabel: 'Factbook Users',
    secondary: { type: 'percent', value: FACTBOOK_CONTACT_PCT, suffix: 'of active contacts' },
  },
  academy: {
    measuring: 'measuring academy progress..',
    primaryValue: ACADEMY_GRADUATES,
    primaryLabel: 'Academy graduates',
    secondary: {
      type: 'fraction',
      completed: ACADEMY_COURSES_COMPLETED,
      total: ACADEMY_COURSES_TOTAL,
      suffix: 'courses completed',
    },
  },
};

const TIRE_BADGE_LABELS: Record<TirePhase, string> = {
  trendlens: 'TrendLens',
  demandindex: 'DemandIndex',
  factbook: 'Factbook',
  academy: 'Academy',
};

const TIRE_ROLL_MS = 900;
const HOOD_STANDARDS_EXIT_MS = 850;
const HOOD_GROUND_RISE_MS = 700;
const HOOD_WHEEL_ROLL_IN_MS = 900;
const HOOD_COUNTER_MEASURE_MS = 1400;
const HOOD_COUNTER_COUNT_MS = 1200;
const HOOD_WHEEL_MAX_PX = 380;
const HOOD_WHEEL_ROLL_SPIN = 540;

function useWheelLaneMetrics() {
  const [metrics, setMetrics] = useState({
    laneW: typeof window !== 'undefined' ? window.innerWidth : 1200,
    wheelW: HOOD_WHEEL_MAX_PX,
    offLeft: -HOOD_WHEEL_MAX_PX,
    center: 400,
    offRight: 1200,
  });

  useLayoutEffect(() => {
    const update = () => {
      const laneW = window.innerWidth;
      const wheelW = Math.min(laneW * 0.82, HOOD_WHEEL_MAX_PX);
      setMetrics({
        laneW,
        wheelW,
        offLeft: -wheelW,
        center: (laneW - wheelW) / 2,
        offRight: laneW,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return metrics;
}

const CLIP_ID = 'dashboard-map-arch-clip';
const HOOD_CLIP_ID = 'dashboard-hood-arch-clip';
const VB_W = 1889;
const VB_H = 540;

/** Dark GPS street map inside arch clip, with slow parallax drift */
export function DashboardMapArch({ showNavCursor = true }: { showNavCursor?: boolean }) {
  return (
    <div className="dashboard-map-arch" aria-hidden={false}>
      <svg
        className="dashboard-map-arch__svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <clipPath id={CLIP_ID}>
            <path d={DASHBOARD_ARCH_PATH} />
          </clipPath>
        </defs>

        {/* Arch silhouette base (replaces previous blue fill) */}
        <path d={DASHBOARD_ARCH_PATH} fill={MAP_CANVAS_DARK} />

        <g clipPath={`url(#${CLIP_ID})`}>
          {/* Parallax map texture — drifts to simulate driving */}
          <foreignObject x="0" y="0" width={VB_W} height={VB_H}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="gps-map-parallax-host">
              <motion.div
                className="gps-map-parallax-track"
                animate={{ x: ['0%', '-50%'], y: ['0%', '-5%'] }}
                transition={{ duration: 56, repeat: Infinity, ease: 'linear' }}
              >
                <img src={gpsMapTexture} alt="" className="gps-map-parallax-tile" draggable={false} />
                <img src={gpsMapTexture} alt="" className="gps-map-parallax-tile" draggable={false} aria-hidden />
              </motion.div>
            </div>
          </foreignObject>

          {/* Route highlight + nav cursor (fixed on map, does not parallax) */}
          <path
            d="M303.5 2.88681L334.731 2.88681L231.753 253.113L201.477 252.49L303.5 2.88681Z"
            fill="#3d4550"
            fillOpacity="0.55"
          />
          <path
            d="M565.051 82.4587L565.191 114.213L281.575 105.845L282.518 73.8586L565.051 82.4587Z"
            fill="#4a5360"
            fillOpacity="0.45"
          />

          {showNavCursor && (
            <g transform="translate(480 235) scale(0.95)">
              <path d={frame7Paths.p3732cb80} fill="#007ac3" />
              <path d={frame7Paths.p3732cb80} fill="#5eb8e8" fillOpacity="0.35" transform="translate(2 2)" />
            </g>
          )}
        </g>
      </svg>

      <div className="map-simulation__controls" style={{ clipPath: `url(#${CLIP_ID})` }}>
        <MapNavControls />
        <div className="map-control-zoom">
          <MapControlButton label="Zoom in" className="map-control--zoom-in" src={iconPlus} />
          <MapControlButton label="Zoom out" className="map-control--zoom-out" src={iconMinus} />
        </div>
      </div>
    </div>
  );
}

const HOOD_POPUP_MESSAGES = [
  'checking standards levels',
  'you are subscribed to 40% of our data standards',
  'you are missing IPO, ISHOP, and Super Spec',
] as const;

const DIPSTICK_RISE = { duration: 4.5, ease: [0.25, 0, 0.2, 1] as const };
const HOOD_RISE_DURATION_MS = 4500;
const HOOD_ACES_START_MS = 2000;
const HOOD_PIES_STAGGER_MS = 900;
const HOOD_MISSING_STAGGER_MS = 900;
const HOOD_PAIR_COMPLETE_MS =
  HOOD_ACES_START_MS + HOOD_PIES_STAGGER_MS + HOOD_RISE_DURATION_MS + 200;

const MISSING_DIPSTICKS = [
  { src: ipoOilImage, alt: 'IPO standard', className: 'hood-dipstick-img--ipo' },
  { src: ishopOilImage, alt: 'iSHOP standard', className: 'hood-dipstick-img--ishop' },
  { src: superspecOilImage, alt: 'Super Spec standard', className: 'hood-dipstick-img--superspec' },
] as const;

function HoodNavChevron({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`hood-nav-chevron hood-nav-chevron--${direction}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3901D"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hood-nav-chevron-icon"
      >
        <path d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

function HoodStandardsPopup({ index, onPrev }: { index: number; onPrev: () => void }) {
  return (
    <motion.div
      className="hood-standards-popup-row"
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      <HoodNavChevron
        direction="left"
        onClick={onPrev}
        disabled={index <= 0}
        label="Previous standards message"
      />
      <div className="hood-standards-popup" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            className="hood-standards-popup__text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {HOOD_POPUP_MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const HOOD_DIPSTICK_HIDDEN_TOP = '88%';
const HOOD_DIPSTICK_RISE_TOP = '24%';
const HOOD_DIPSTICK_ELEVATED_TOP = '34%';

function HoodDipstickRise({
  src,
  alt,
  risen,
  risenTop = HOOD_DIPSTICK_RISE_TOP,
  className,
}: {
  src: string;
  alt: string;
  risen: boolean;
  risenTop?: string;
  className?: string;
}) {
  const isInitialRise = risenTop === HOOD_DIPSTICK_RISE_TOP;

  return (
    <motion.div
      className={`hood-dipstick-rise${className ? ` ${className}` : ''}`}
      initial={{ top: HOOD_DIPSTICK_HIDDEN_TOP }}
      animate={{ top: risen ? risenTop : HOOD_DIPSTICK_HIDDEN_TOP }}
      transition={{
        duration: isInitialRise ? DIPSTICK_RISE.duration : 1.25,
        ease: DIPSTICK_RISE.ease,
        delay: isInitialRise ? 0.15 : 0,
      }}
    >
      <img src={src} alt={alt} className="hood-dipstick-rise__img" draggable={false} />
    </motion.div>
  );
}

type TireIntroStep = 'ground' | 'wheel' | 'counter' | 'done';
export type TireRollTarget = TirePhase | null;

function HoodTireBaseArch() {
  return (
    <svg
      className="hood-tire-hub__arch"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden
    >
      <path d={DASHBOARD_ARCH_PATH} fill={ARCH_FILL_GREY} />
    </svg>
  );
}

function HoodCountUp({
  value,
  active,
  duration = HOOD_COUNTER_COUNT_MS,
}: {
  value: number;
  active: boolean;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, duration]);

  return <>{display}</>;
}

function HoodTireWheel({ tirePhase }: { tirePhase: TirePhase }) {
  return (
    <div className={`hood-tire-wheel hood-tire-wheel--${tirePhase}`}>
      <img
        src={tireWheelImage}
        alt=""
        className="hood-tire-wheel__asset"
        draggable={false}
      />
      {tirePhase === 'trendlens' ? (
        <img
          src={trendlensLogoImage}
          alt="TrendLens"
          className="hood-tire-wheel__badge hood-tire-wheel__logo"
          draggable={false}
        />
      ) : (
        <span className="hood-tire-wheel__badge hood-tire-wheel__label">
          {TIRE_BADGE_LABELS[tirePhase]}
        </span>
      )}
    </div>
  );
}

type ReadoutPhase = 'idle' | 'measuring' | 'counting' | 'secondary';

function HoodTirePressureGauge({ completedTires }: { completedTires: ReadonlySet<TirePhase> }) {
  return (
    <div className="hood-tire-pressure-gauge" aria-hidden={false}>
      <img
        src={tirePressureGaugeImage}
        alt=""
        className="hood-tire-pressure-gauge__img"
        draggable={false}
      />
      <div className="hood-tire-pressure-gauge__checks">
        {TIRE_PHASE_ORDER.map((tirePhase) => {
          const checked = completedTires.has(tirePhase);
          return (
            <div
              key={tirePhase}
              className={`hood-tire-pressure-gauge__slot hood-tire-pressure-gauge__slot--${getTireCheckIndex(tirePhase)}`}
            >
              {checked && (
                <motion.span
                  className="hood-tire-pressure-gauge__check"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  aria-hidden
                >
                  ✓
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HoodTireHubReadout({
  tirePhase,
  counterActive,
  onReadoutReady,
}: {
  tirePhase: TirePhase;
  counterActive: boolean;
  onReadoutReady?: () => void;
}) {
  const [readoutPhase, setReadoutPhase] = useState<ReadoutPhase>('idle');
  const onReadyRef = useRef(onReadoutReady);
  onReadyRef.current = onReadoutReady;
  const config = TIRE_READOUT_CONFIG[tirePhase];

  useEffect(() => {
    setReadoutPhase('idle');
    if (!counterActive) return;

    const timers = [
      setTimeout(() => setReadoutPhase('measuring'), 80),
      setTimeout(() => setReadoutPhase('counting'), HOOD_COUNTER_MEASURE_MS),
      setTimeout(() => {
        setReadoutPhase('secondary');
        onReadyRef.current?.();
      }, HOOD_COUNTER_MEASURE_MS + HOOD_COUNTER_COUNT_MS + 200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [tirePhase, counterActive]);

  const counting = readoutPhase === 'counting' || readoutPhase === 'secondary';

  return (
    <motion.div
      className="hood-tire-hub__screen"
      key={tirePhase}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: counterActive ? 1 : 0, y: counterActive ? 0 : 12 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className="hood-tire-hub__screen-bezel">
        <div className="hood-tire-hub__screen-glass">
          {readoutPhase === 'measuring' ? (
            <p className="hood-tire-hub__line hood-tire-hub__line--measuring">
              {config.measuring}
            </p>
          ) : readoutPhase === 'idle' ? null : (
            <div className="hood-tire-hub__results">
              <p className="hood-tire-hub__line hood-tire-hub__line--primary">
                <HoodCountUp value={config.primaryValue} active={counting} /> {config.primaryLabel}
              </p>
              {readoutPhase === 'secondary' && (
                <motion.p
                  className="hood-tire-hub__line hood-tire-hub__line--secondary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                  {config.secondary.type === 'percent' ? (
                    <>
                      <HoodCountUp value={config.secondary.value} active />% {config.secondary.suffix}
                    </>
                  ) : (
                    <>
                      <HoodCountUp value={config.secondary.completed} active /> of{' '}
                      <HoodCountUp value={config.secondary.total} active /> {config.secondary.suffix}
                    </>
                  )}
                </motion.p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HoodTireHubScene({
  phase,
  isRolling,
  rollTarget,
  playIntro,
  completedTires,
  onIntroComplete,
  onReadoutReady,
}: {
  phase: TirePhase;
  isRolling: boolean;
  rollTarget: TireRollTarget;
  playIntro: boolean;
  completedTires: ReadonlySet<TirePhase>;
  onIntroComplete: () => void;
  onReadoutReady: () => void;
}) {
  const [introStep, setIntroStep] = useState<TireIntroStep>(playIntro ? 'ground' : 'done');
  const { offLeft, center, offRight, wheelW } = useWheelLaneMetrics();
  const counterActive =
    !isRolling && (introStep === 'counter' || introStep === 'done');

  const swapping = isRolling && rollTarget !== null;
  const introWheelRolling = playIntro && introStep === 'wheel';

  useEffect(() => {
    if (!playIntro) {
      setIntroStep('done');
      return;
    }
    setIntroStep('ground');
    const timers = [
      setTimeout(() => setIntroStep('wheel'), HOOD_GROUND_RISE_MS),
      setTimeout(
        () => setIntroStep('counter'),
        HOOD_GROUND_RISE_MS + HOOD_WHEEL_ROLL_IN_MS,
      ),
      setTimeout(
        () => {
          setIntroStep('done');
          onIntroComplete();
        },
        HOOD_GROUND_RISE_MS + HOOD_WHEEL_ROLL_IN_MS + 80,
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playIntro, onIntroComplete]);

  const idleX = center;
  const outgoingX = swapping ? offRight : idleX;
  const incomingX = introWheelRolling || swapping ? center : offLeft;
  const outgoingSpin = swapping || introWheelRolling ? HOOD_WHEEL_ROLL_SPIN : 0;
  const incomingSpin = swapping || introWheelRolling ? HOOD_WHEEL_ROLL_SPIN : 0;

  const rollDuration =
    introWheelRolling ? HOOD_WHEEL_ROLL_IN_MS / 1000 : TIRE_ROLL_MS / 1000;

  const showIdleWheel = !swapping && introStep !== 'ground' && introStep !== 'wheel';
  const showOutgoingWheel = swapping;
  const showIncomingWheel = swapping || introWheelRolling;

  return (
    <div className="hood-tire-hub">
      <div className="hood-tire-hub__black" aria-hidden />
      <motion.div
        className="hood-tire-hub__arch-wrap"
        initial={playIntro ? { y: '100%' } : { y: 0 }}
        animate={{ y: 0 }}
        transition={{
          duration: playIntro ? HOOD_GROUND_RISE_MS / 1000 : 0,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <HoodTireBaseArch />
      </motion.div>
      <div className="hood-tire-hub__lane" aria-hidden={false}>
        {showIdleWheel && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--active"
            style={{ width: wheelW }}
            animate={{ x: idleX, rotate: 0, opacity: 1 }}
            transition={{ duration: rollDuration, ease: [0.45, 0, 0.2, 1] }}
          >
            <HoodTireWheel tirePhase={phase} />
          </motion.div>
        )}
        {showOutgoingWheel && rollTarget && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--outgoing"
            style={{ width: wheelW }}
            initial={{ x: center, rotate: 0, opacity: 1 }}
            animate={{ x: outgoingX, rotate: outgoingSpin, opacity: 1 }}
            transition={{ duration: rollDuration, ease: [0.45, 0, 0.2, 1] }}
          >
            <HoodTireWheel tirePhase={phase} />
          </motion.div>
        )}
        {showIncomingWheel && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--incoming"
            style={{ width: wheelW }}
            initial={{ x: offLeft, rotate: 0, opacity: 1 }}
            animate={{ x: incomingX, rotate: incomingSpin, opacity: 1 }}
            transition={{ duration: rollDuration, ease: [0.45, 0, 0.2, 1] }}
          >
            <HoodTireWheel tirePhase={swapping && rollTarget ? rollTarget : 'trendlens'} />
          </motion.div>
        )}
      </div>
      <div className="hood-tire-hub__readout-row">
        <div className="hood-tire-hub__readout">
          <HoodTireHubReadout
            tirePhase={phase}
            counterActive={counterActive}
            onReadoutReady={onReadoutReady}
          />
        </div>
        <HoodTirePressureGauge completedTires={completedTires} />
      </div>
    </div>
  );
}

/**
 * Under the Hood arch — layer stack inside one SVG clip (back → front):
 * 1. Full engine  2. Dipstick  3. Frame overlay (black hole = transparent via mask)
 */
export function DashboardHoodArch({
  phase,
  onPhaseChange,
  onFinishTireSequence,
}: {
  phase: HoodPhase;
  onPhaseChange: (phase: HoodPhase) => void;
  onFinishTireSequence?: () => void;
}) {
  const [popupIndex, setPopupIndex] = useState(0);
  const [acesRisen, setAcesRisen] = useState(false);
  const [piesRisen, setPiesRisen] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [ipoRisen, setIpoRisen] = useState(false);
  const [ishopRisen, setIshopRisen] = useState(false);
  const [superspecRisen, setSuperspecRisen] = useState(false);
  const missingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const missingRisen = [ipoRisen, ishopRisen, superspecRisen];
  const missingComplete = ipoRisen && ishopRisen && superspecRisen;

  const [tireRolling, setTireRolling] = useState(false);
  const [tireRollTarget, setTireRollTarget] = useState<TireRollTarget>(null);
  const [tireIntroComplete, setTireIntroComplete] = useState(false);
  const [tireReadoutReady, setTireReadoutReady] = useState(false);
  const [completedTires, setCompletedTires] = useState<Set<TirePhase>>(() => new Set());

  const tirePhase = phase === 'standards' ? 'trendlens' : phase;
  const nextTirePhase = getNextTirePhase(tirePhase);
  const prevTirePhase = getPrevTirePhase(tirePhase);

  const handleReadoutReady = useCallback(() => {
    setTireReadoutReady(true);
    if (isTirePhase(phase)) {
      setCompletedTires((prev) => new Set(prev).add(phase));
    }
  }, [phase]);

  const handleTireIntroComplete = useCallback(() => {
    setTireIntroComplete(true);
  }, []);

  const rollToTirePhase = useCallback(
    (target: TirePhase) => {
      setTireReadoutReady(false);
      setTireRollTarget(target);
      setTireRolling(true);
      setTimeout(() => {
        onPhaseChange(target);
        setTireRolling(false);
        setTireRollTarget(null);
      }, TIRE_ROLL_MS);
    },
    [onPhaseChange],
  );

  const goToTrendLens = useCallback(() => {
    setTireReadoutReady(false);
    setTireIntroComplete(false);
    onPhaseChange('trendlens');
  }, [onPhaseChange]);

  const clearMissingTimers = useCallback(() => {
    missingTimersRef.current.forEach(clearTimeout);
    missingTimersRef.current = [];
  }, []);

  const returnToStandards = useCallback(() => {
    clearMissingTimers();
    setShowMissing(true);
    setIpoRisen(true);
    setIshopRisen(true);
    setSuperspecRisen(true);
    setPopupIndex(2);
    setAcesRisen(true);
    setPiesRisen(true);
    setTireIntroComplete(false);
    setTireReadoutReady(false);
    onPhaseChange('standards');
  }, [clearMissingTimers, onPhaseChange]);

  const beginMissingSequence = useCallback(() => {
    clearMissingTimers();
    setShowMissing(true);
    setIpoRisen(false);
    setIshopRisen(false);
    setSuperspecRisen(false);

    missingTimersRef.current.push(setTimeout(() => setIpoRisen(true), 150));
    missingTimersRef.current.push(
      setTimeout(() => setIshopRisen(true), HOOD_MISSING_STAGGER_MS + 150),
    );
    missingTimersRef.current.push(
      setTimeout(() => setSuperspecRisen(true), HOOD_MISSING_STAGGER_MS * 2 + 150),
    );
  }, [clearMissingTimers]);

  const handlePrev = useCallback(() => {
    if (prevTirePhase) {
      rollToTirePhase(prevTirePhase);
      return;
    }
    if (phase !== 'standards') {
      returnToStandards();
      return;
    }
    if (popupIndex === 2) {
      clearMissingTimers();
      setShowMissing(false);
      setIpoRisen(false);
      setIshopRisen(false);
      setSuperspecRisen(false);
      setPopupIndex(1);
      return;
    }
    if (popupIndex > 0) setPopupIndex((i) => i - 1);
  }, [phase, prevTirePhase, popupIndex, clearMissingTimers, returnToStandards, rollToTirePhase]);

  const handleNext = useCallback(() => {
    if (popupIndex === 1) {
      setPopupIndex(2);
      beginMissingSequence();
      return;
    }
    if (popupIndex === 2 && missingComplete) {
      goToTrendLens();
    }
  }, [popupIndex, missingComplete, beginMissingSequence, goToTrendLens]);

  const showForwardChevron = phase === 'standards' && popupIndex >= 1;
  const forwardDisabled =
    popupIndex === 1 ? false : popupIndex === 2 ? !missingComplete : true;
  const pairElevated = popupIndex >= 1 && !showMissing;
  const pairRisenTop = pairElevated ? HOOD_DIPSTICK_ELEVATED_TOP : HOOD_DIPSTICK_RISE_TOP;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setAcesRisen(true), HOOD_ACES_START_MS));
    timers.push(
      setTimeout(() => setPiesRisen(true), HOOD_ACES_START_MS + HOOD_PIES_STAGGER_MS),
    );
    timers.push(setTimeout(() => setPopupIndex(1), HOOD_PAIR_COMPLETE_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => () => clearMissingTimers(), [clearMissingTimers]);

  return (
    <div className="dashboard-hood-arch" aria-hidden={false}>
      <AnimatePresence mode="wait">
        {phase === 'standards' ? (
          <motion.div
            key="hood-standards"
            className="dashboard-hood-arch__standards"
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: HOOD_STANDARDS_EXIT_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          >
            <svg
              className="dashboard-hood-arch__svg"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMax slice"
              fill="none"
            >
              <defs>
                <clipPath id={HOOD_CLIP_ID}>
                  <path d={DASHBOARD_ARCH_PATH} />
                </clipPath>
              </defs>

              <path d={DASHBOARD_ARCH_PATH} fill={ARCH_FILL_GREY} />

              <g clipPath={`url(#${HOOD_CLIP_ID})`}>
                <foreignObject x="0" y="0" width={VB_W} height={VB_H}>
                  <div xmlns="http://www.w3.org/1999/xhtml" className="hood-engine-stack">
                    <img
                      src={engineFullImage}
                      alt=""
                      className="hood-engine-img hood-engine-img--back"
                      draggable={false}
                    />
                    <div className="hood-dipstick-slot">
                      <div className="hood-standards-band">
                        <HoodStandardsPopup index={popupIndex} onPrev={handlePrev} />
                        <div
                          className={`hood-dipsticks-row${showMissing ? ' hood-dipsticks-row--triple' : ''}`}
                        >
                          <AnimatePresence mode="wait">
                            {!showMissing ? (
                              <motion.div
                                key="pair"
                                className="hood-dipsticks-pair"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35 }}
                              >
                                <HoodDipstickRise
                                  src={acesOilImage}
                                  alt="ACES standard"
                                  risen={acesRisen}
                                  risenTop={pairRisenTop}
                                  className="hood-dipstick-img--aces"
                                />
                                <HoodDipstickRise
                                  src={piesOilImage}
                                  alt="PIES standard"
                                  risen={piesRisen}
                                  risenTop={pairRisenTop}
                                  className="hood-dipstick-img--pies"
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="triple"
                                className="hood-dipsticks-triple"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.35 }}
                              >
                                {MISSING_DIPSTICKS.map((stick, i) => (
                                  <HoodDipstickRise
                                    key={stick.alt}
                                    src={stick.src}
                                    alt={stick.alt}
                                    risen={missingRisen[i]}
                                    className={`hood-dipstick-img--missing ${stick.className}`}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {showForwardChevron && (
                          <HoodNavChevron
                            direction="right"
                            onClick={handleNext}
                            disabled={forwardDisabled}
                            label={
                              popupIndex === 2
                                ? 'Show TrendLens users'
                                : 'Show missing standards'
                            }
                          />
                        )}
                      </div>
                    </div>
                    <img
                      src={engineHoleFrameImage}
                      alt=""
                      className="hood-engine-img hood-engine-img--front"
                      draggable={false}
                    />
                  </div>
                </foreignObject>
              </g>
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="hood-tire-hub"
            className="dashboard-hood-arch__tire-hub"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            <HoodTireHubScene
              phase={tirePhase}
              isRolling={tireRolling}
              rollTarget={tireRollTarget}
              playIntro={!tireIntroComplete}
              completedTires={completedTires}
              onIntroComplete={handleTireIntroComplete}
              onReadoutReady={handleReadoutReady}
            />
            <div className="hood-tire-hub__nav">
              <HoodNavChevron
                direction="left"
                onClick={handlePrev}
                disabled={tireRolling}
                label={
                  prevTirePhase
                    ? `Back to ${TIRE_BADGE_LABELS[prevTirePhase]}`
                    : 'Back to standards'
                }
              />
              {nextTirePhase ? (
                <HoodNavChevron
                  direction="right"
                  onClick={() => rollToTirePhase(nextTirePhase)}
                  disabled={!tireReadoutReady || tireRolling}
                  label={`Show ${TIRE_BADGE_LABELS[nextTirePhase]}`}
                />
              ) : (
                onFinishTireSequence && (
                  <HoodNavChevron
                    direction="right"
                    onClick={onFinishTireSequence}
                    disabled={!tireReadoutReady || tireRolling}
                    label="Complete diagnostics"
                  />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** @deprecated Use DashboardMapArch inside dashboard panel */
export function MapSimulation(props: { showNavCursor?: boolean }) {
  return <DashboardMapArch {...props} />;
}

/** Volume + settings — top-left of arch, same vertical band as time/weather row */
export function MapNavControls() {
  return (
    <div className="map-nav-controls">
      <MapControlButton label="Volume" className="map-control--nav-volume" src={iconVolume} />
      <MapControlButton label="Map settings" className="map-control--nav-settings" src={iconGear} />
    </div>
  );
}

export function MapControlButton({
  label,
  className,
  src,
  icon,
}: {
  label: string;
  className?: string;
  src?: string;
  icon?: ReactNode;
}) {
  return (
    <button type="button" className={`map-control-btn ${className ?? ''}`} aria-label={label}>
      <span className="map-control-btn__glyph">
        {icon ?? <img src={src} alt="" className="map-control-btn__icon" draggable={false} />}
      </span>
    </button>
  );
}
