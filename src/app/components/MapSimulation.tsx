import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import frame7Paths from '../../imports/Frame7/svg-6dey2phzjs';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import gpsMapTexture from '../../assets/gps-map-dark.png';
import engineFullImage from '../../assets/engine-full.png';
import engineHoleFrameImage from '../../assets/engine-hole-frame.png';
import acesOilImage from '../../assets/aces-oil.png';
import piesOilImage from '../../assets/pies-oil.png';
import ipoOilImage from '../../assets/ipo-oil.png';
import ishopOilImage from '../../assets/ishop-oil.png';
import superspecOilImage from '../../assets/superspec-oil.png';
import trendlensLogoImage from '../../assets/trendlens-logo.png';
import iconGear from '../../assets/map-controls/gear-solid-full.png';
import iconVolume from '../../assets/map-controls/volume-low-solid-full.png';
import iconPlus from '../../assets/map-controls/plus-solid-full.png';
import iconMinus from '../../assets/map-controls/minus-solid-full.png';

export const DASHBOARD_ARCH_PATH = svgPaths.p33654d00;
export const MAP_CANVAS_DARK = '#151a22';
export const ARCH_FILL_GREY = '#737373';

export type HoodPhase = 'standards' | 'trendlens' | 'demandindex';

export const TRENDLENS_USER_COUNT = 40;
export const TRENDLENS_CONTACT_PCT = 54;
export const DEMANDINDEX_USER_COUNT = 30;
export const DEMANDINDEX_CONTACT_PCT = 45;

const TIRE_ROLL_MS = 900;

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

const HOOD_DIPSTICK_RISE_TOP = 20;
const HOOD_DIPSTICK_ELEVATED_TOP = -48;

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
  risenTop?: number;
  className?: string;
}) {
  const isInitialRise = risenTop === HOOD_DIPSTICK_RISE_TOP;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      initial={{ top: '92%' }}
      animate={{ top: risen ? risenTop : '92%' }}
      transition={{
        duration: isInitialRise ? DIPSTICK_RISE.duration : 1.25,
        ease: DIPSTICK_RISE.ease,
        delay: isInitialRise ? 0.15 : 0,
      }}
    />
  );
}

type TireVariant = 'trendlens' | 'demandindex';

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

function HoodTireWheel({ variant }: { variant: TireVariant }) {
  return (
    <div className={`hood-tire-wheel hood-tire-wheel--${variant}`}>
      <div className="hood-tire-wheel__rim">
        {variant === 'trendlens' ? (
          <img
            src={trendlensLogoImage}
            alt="TrendLens"
            className="hood-tire-wheel__logo"
            draggable={false}
          />
        ) : (
          <span className="hood-tire-wheel__label">DemandIndex</span>
        )}
      </div>
    </div>
  );
}

type TrendLensReadoutPhase = 0 | 1 | 2;

function HoodTireHubReadout({
  variant,
  onTrendlensReady,
}: {
  variant: TireVariant;
  onTrendlensReady?: () => void;
}) {
  const [tlPhase, setTlPhase] = useState<TrendLensReadoutPhase>(0);

  useEffect(() => {
    if (variant !== 'trendlens') return;
    setTlPhase(0);
    const timers = [
      setTimeout(() => setTlPhase(1), 2000),
      setTimeout(() => {
        setTlPhase(2);
        onTrendlensReady?.();
      }, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [variant, onTrendlensReady]);

  const primary =
    variant === 'trendlens'
      ? `${TRENDLENS_USER_COUNT} TrendLens Users`
      : `${DEMANDINDEX_USER_COUNT} DemandIndex users`;
  const secondary =
    variant === 'trendlens'
      ? `${TRENDLENS_CONTACT_PCT}% of your active contacts`
      : `${DEMANDINDEX_CONTACT_PCT}% of active contacts`;

  return (
    <motion.div
      className="hood-tire-hub__screen"
      key={variant}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className="hood-tire-hub__screen-bezel">
        <div className="hood-tire-hub__screen-glass">
          {variant === 'trendlens' && tlPhase === 0 ? (
            <p className="hood-tire-hub__line hood-tire-hub__line--measuring">
              measuring trendlens usage..
            </p>
          ) : (
            <div className="hood-tire-hub__results">
              <p className="hood-tire-hub__line hood-tire-hub__line--primary">{primary}</p>
              {(variant === 'demandindex' || tlPhase >= 2) && (
                <motion.p
                  className="hood-tire-hub__line hood-tire-hub__line--secondary"
                  initial={variant === 'demandindex' ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                  {secondary}
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
  onTrendlensReady,
}: {
  phase: 'trendlens' | 'demandindex';
  isRolling: boolean;
  onTrendlensReady: () => void;
}) {
  const tireTransitioning = phase === 'demandindex' || isRolling;

  return (
    <div className="hood-tire-hub">
      <div className="hood-tire-hub__black" aria-hidden />
      <div className="hood-tire-hub__arch-wrap">
        <HoodTireBaseArch />
      </div>
      <div className="hood-tire-hub__stage">
        <motion.div
          className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--trendlens"
          initial={false}
          animate={{
            x: tireTransitioning ? '-118%' : '0%',
            rotate: tireTransitioning ? -24 : 0,
            opacity: tireTransitioning ? 0.55 : 1,
          }}
          transition={{ duration: TIRE_ROLL_MS / 1000, ease: [0.45, 0, 0.2, 1] }}
        >
          <HoodTireWheel variant="trendlens" />
        </motion.div>
        <motion.div
          className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--demandindex"
          initial={{ x: '118%', rotate: 24, opacity: 0 }}
          animate={{
            x: tireTransitioning ? '0%' : '118%',
            rotate: tireTransitioning ? 0 : 24,
            opacity: tireTransitioning ? 1 : 0,
          }}
          transition={{ duration: TIRE_ROLL_MS / 1000, ease: [0.45, 0, 0.2, 1] }}
        >
          <HoodTireWheel variant="demandindex" />
        </motion.div>
      </div>
      <div className="hood-tire-hub__readout">
        <HoodTireHubReadout variant={phase} onTrendlensReady={onTrendlensReady} />
      </div>
    </div>
  );
}

/**
 * Under the Hood arch — layer stack inside one SVG clip (back → front):
 * 1. Full engine  2. Dipstick  3. Frame overlay (black hole = transparent via mask)
 */
export function DashboardHoodArch({
  onPhaseChange,
}: {
  onPhaseChange?: (phase: HoodPhase) => void;
}) {
  const [popupIndex, setPopupIndex] = useState(0);
  const [acesRisen, setAcesRisen] = useState(false);
  const [piesRisen, setPiesRisen] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [ipoRisen, setIpoRisen] = useState(false);
  const [ishopRisen, setIshopRisen] = useState(false);
  const [superspecRisen, setSuperspecRisen] = useState(false);
  const [hoodPhase, setHoodPhase] = useState<HoodPhase>('standards');
  const missingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const missingRisen = [ipoRisen, ishopRisen, superspecRisen];
  const missingComplete = ipoRisen && ishopRisen && superspecRisen;

  const [tireRolling, setTireRolling] = useState(false);
  const [trendlensReadoutReady, setTrendlensReadoutReady] = useState(false);

  const goToTrendLens = useCallback(() => {
    setTrendlensReadoutReady(false);
    setHoodPhase('trendlens');
    onPhaseChange?.('trendlens');
  }, [onPhaseChange]);

  const goToDemandIndex = useCallback(() => {
    setTireRolling(true);
    setTimeout(() => {
      setHoodPhase('demandindex');
      onPhaseChange?.('demandindex');
      setTireRolling(false);
    }, TIRE_ROLL_MS);
  }, [onPhaseChange]);

  const returnToStandards = useCallback(() => {
    setHoodPhase('standards');
    onPhaseChange?.('standards');
  }, [onPhaseChange]);

  const returnToTrendLens = useCallback(() => {
    setHoodPhase('trendlens');
    onPhaseChange?.('trendlens');
  }, [onPhaseChange]);

  const clearMissingTimers = useCallback(() => {
    missingTimersRef.current.forEach(clearTimeout);
    missingTimersRef.current = [];
  }, []);

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
    if (hoodPhase === 'demandindex') {
      returnToTrendLens();
      return;
    }
    if (hoodPhase === 'trendlens') {
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
  }, [hoodPhase, popupIndex, clearMissingTimers, returnToStandards, returnToTrendLens]);

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

  const showForwardChevron = hoodPhase === 'standards' && popupIndex >= 1;
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
        {hoodPhase === 'standards' ? (
          <motion.div
            key="hood-standards"
            className="dashboard-hood-arch__standards"
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
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
                                  className="hood-dipstick-img hood-dipstick-img--aces"
                                />
                                <HoodDipstickRise
                                  src={piesOilImage}
                                  alt="PIES standard"
                                  risen={piesRisen}
                                  risenTop={pairRisenTop}
                                  className="hood-dipstick-img hood-dipstick-img--pies"
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
                                    className={`hood-dipstick-img hood-dipstick-img--missing ${stick.className}`}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            <HoodTireHubScene
              phase={hoodPhase as 'trendlens' | 'demandindex'}
              isRolling={tireRolling}
              onTrendlensReady={() => setTrendlensReadoutReady(true)}
            />
            <div className="hood-tire-hub__nav">
              <HoodNavChevron
                direction="left"
                onClick={handlePrev}
                disabled={tireRolling}
                label={
                  hoodPhase === 'demandindex' ? 'Back to TrendLens' : 'Back to standards'
                }
              />
              {hoodPhase === 'trendlens' && (
                <HoodNavChevron
                  direction="right"
                  onClick={goToDemandIndex}
                  disabled={!trendlensReadoutReady || tireRolling}
                  label="Show DemandIndex"
                />
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
