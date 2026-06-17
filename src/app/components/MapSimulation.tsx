import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Lottie from 'lottie-react';
import tireGaugeData from '../../imports/tire.json';
import wheelAlignmentServiceData from '../../imports/wheel-alignment-service.json';
import gpsMapTexture from '../../assets/gps-map-dark.png';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import engineFullImage from '../../assets/engine-full.png?url';
import engineHoleFrameImage from '../../assets/engine-hole-frame.png?url';
import acesDipstickImage from '../../assets/dipstick-aces.svg?url';
import piesDipstickImage from '../../assets/dipstick-pies.svg?url';
import ipoDipstickImage from '../../assets/dipstick-ipo.svg?url';
import ishopDipstickImage from '../../assets/dipstick-ishop.svg?url';
import superspecDipstickImage from '../../assets/dipstick-superspec.svg?url';
import tireTrendlensImage from '../../assets/tire-trendlens.svg?url';
import tireDemandindexImage from '../../assets/tire-demandindex.svg?url';
import tireFactbookImage from '../../assets/tire-factbook.svg?url';
import tireAcademyImage from '../../assets/tire-academy.svg?url';
import tireCheckNullImage from '../../assets/tire-check-null.png?url';
import tireCheck2Image from '../../assets/tire-check-2.png?url';
import tireCheck3Image from '../../assets/tire-check-3.png?url';
import tireCheck4Image from '../../assets/tire-check-4.png?url';
import tireCheck5Image from '../../assets/tire-check-5.png?url';
import iconGear from '../../assets/map-controls/gear-solid-full.png';
import iconVolume from '../../assets/map-controls/volume-low-solid-full.png';
import iconPlus from '../../assets/map-controls/plus-solid-full.png';
import iconMinus from '../../assets/map-controls/minus-solid-full.png';
import circleChevronLeft from '../../assets/circle-chevron-left-solid-full.png';
import circleChevronRight from '../../assets/circle-chevron-right-solid-full.png';
import {
  buildTireReadoutConfig,
  getHoodStandardsMessages,
  isTirePhaseEmpty,
  type TireReadoutConfig,
} from '@/lib/contentVariants';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';
import type { WrappedReport } from '@/types/wrappedReport';

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

/** Tire check gauge frames: null → 1 check → 2 → 3 → all 4 */
const TIRE_CHECK_SEQUENCE = [
  tireCheckNullImage,
  tireCheck2Image,
  tireCheck3Image,
  tireCheck4Image,
  tireCheck5Image,
] as const;

function getTireCheckImageIndex(completedCount: number): number {
  return Math.min(Math.max(completedCount, 0), TIRE_CHECK_SEQUENCE.length - 1);
}

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
  | { type: 'fraction'; completed: number; total: number; suffix: string }
  | { type: 'overTotal'; total: number; suffix: string }
  | { type: 'count'; value: number; suffix: string };

const TIRE_BADGE_LABELS: Record<TirePhase, string> = {
  trendlens: 'TrendLens',
  demandindex: 'DemandIndex',
  factbook: 'Factbook',
  academy: 'Academy',
};

const TIRE_ROLL_MS = 900;
const HOOD_STANDARDS_EXIT_MS = 850;
export const HOOD_PANEL_SLIDE_MS = 700;
const HOOD_ENGINE_EXIT_MS = 550;
const HOOD_GROUND_RISE_MS = HOOD_PANEL_SLIDE_MS;
const HOOD_WHEEL_ROLL_IN_MS = 900;
const HOOD_COUNTER_COUNT_MS = 1200;
const HOOD_WHEEL_MAX_PX = 272; /* ~15% smaller than 320px */
const HOOD_READOUT_GAP_PX = 20;
const HOOD_READOUT_WIDTH_DESKTOP = 340;
const HOOD_READOUT_WIDTH_MOBILE = 272;
const HOOD_READOUT_MIN_WIDTH = HOOD_READOUT_WIDTH_MOBILE;
const HOOD_READOUT_GAUGE_SLOT_PX = 162;
/** Fixed content area below gauge — same on every tire so the screen never resizes. */
const HOOD_READOUT_CONTENT_SLOT_PX = 156;
const HOOD_READOUT_SCREEN_CONTENT_PX = 211;
const HOOD_READOUT_BEZEL_HEIGHT_PX =
  168 + HOOD_READOUT_GAUGE_SLOT_PX + HOOD_READOUT_CONTENT_SLOT_PX;
const HOOD_READOUT_GLASS_HEIGHT_PX =
  108 + HOOD_READOUT_GAUGE_SLOT_PX + HOOD_READOUT_CONTENT_SLOT_PX;

/** Scale tablet chrome proportionally from the 340×486 design width. */
function hoodReadoutDimensions(widthPx: number) {
  const readoutWidth = Math.min(
    HOOD_READOUT_WIDTH_DESKTOP,
    Math.max(HOOD_READOUT_MIN_WIDTH, widthPx),
  );
  const scale = readoutWidth / HOOD_READOUT_WIDTH_DESKTOP;
  return {
    readoutWidth,
    readoutBezelHeight: Math.round(HOOD_READOUT_BEZEL_HEIGHT_PX * scale),
    readoutGlassHeight: Math.round(HOOD_READOUT_GLASS_HEIGHT_PX * scale),
    readoutGaugeSlot: Math.round(HOOD_READOUT_GAUGE_SLOT_PX * scale),
    readoutContentMin: Math.round(HOOD_READOUT_CONTENT_SLOT_PX * scale),
    readoutContentHeight: Math.round(HOOD_READOUT_SCREEN_CONTENT_PX * scale),
    readoutScreenPadding: Math.round(14 * scale),
    readoutBezelPadding: `${Math.round(12 * scale)}px ${Math.round(10 * scale)}px ${Math.round(16 * scale)}px`,
  };
}
type TireCtaConfig = {
  message: string;
  linkLabel: string;
  href: string;
  nextTarget: TirePhase | null;
};

const TIRE_CTA_CONFIG: Partial<Record<TirePhase, TireCtaConfig>> = {
  trendlens: {
    message: 'Get the most interactive and up to date economic data',
    linkLabel: 'Visit TrendLens',
    href: EXTERNAL_CTA_LINKS.visitTrendLens,
    nextTarget: 'demandindex',
  },
  demandindex: {
    message:
      'See the full list of product groups to see what else might be eligible to subscribe to.',
    linkLabel: 'Learn More',
    href: EXTERNAL_CTA_LINKS.demandIndexLearnMore,
    nextTarget: 'factbook',
  },
  factbook: {
    message: 'Send the latest factbook to your team to find out what you missed!',
    linkLabel: 'Factbook 2027',
    href: EXTERNAL_CTA_LINKS.factbook2027,
    nextTarget: 'academy',
  },
  academy: {
    message: "See what's new in our course catalog",
    linkLabel: 'Explore Academy Courses',
    href: EXTERNAL_CTA_LINKS.exploreAcademyCourses,
    nextTarget: null,
  },
};

function tireHasCta(phase: TirePhase): boolean {
  return TIRE_CTA_CONFIG[phase] != null;
}
const HOOD_TIRE_LAYOUT_BREAKPOINT = 768;
const TIRE_WHEEL_NATIVE_PX: Record<TirePhase, number> = {
  trendlens: 548,
  demandindex: 548,
  factbook: 548,
  academy: 548,
};
/** Full rotations so the branded tire art lands upright when motion stops. */
const HOOD_WHEEL_ROLL_SPIN = 720;

const TIRE_WHEEL_IMAGES: Record<TirePhase, string> = {
  trendlens: tireTrendlensImage,
  demandindex: tireDemandindexImage,
  factbook: tireFactbookImage,
  academy: tireAcademyImage,
};

function useWheelLaneMetrics() {
  const [metrics, setMetrics] = useState({
    laneW: typeof window !== 'undefined' ? window.innerWidth : 1200,
    wheelW: HOOD_WHEEL_MAX_PX,
    offLeft: -HOOD_WHEEL_MAX_PX,
    parkX: 400,
    offRight: 1200,
    ...hoodReadoutDimensions(HOOD_READOUT_WIDTH_DESKTOP),
    readoutGap: HOOD_READOUT_GAP_PX,
    isMobile:
      typeof window !== 'undefined' && window.innerWidth <= HOOD_TIRE_LAYOUT_BREAKPOINT,
  });

  useLayoutEffect(() => {
    const update = () => {
      const laneW = window.innerWidth;
      const isMobile = laneW <= HOOD_TIRE_LAYOUT_BREAKPOINT;
      const wheelW = Math.min(laneW * 0.82, HOOD_WHEEL_MAX_PX);
      let readoutWidth = isMobile ? HOOD_READOUT_WIDTH_MOBILE : HOOD_READOUT_WIDTH_DESKTOP;
      let groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      const maxGroupWidth = laneW - 24;
      if (groupWidth > maxGroupWidth) {
        readoutWidth = maxGroupWidth - HOOD_READOUT_GAP_PX - wheelW;
        groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      }
      const readout = hoodReadoutDimensions(readoutWidth);
      readoutWidth = readout.readoutWidth;
      groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      const groupLeft = Math.round(
        Math.max(12, Math.min((laneW - groupWidth) / 2, laneW - groupWidth - 12)),
      );
      const parkX = groupLeft + readoutWidth + HOOD_READOUT_GAP_PX;

      setMetrics({
        laneW,
        wheelW,
        offLeft: -wheelW,
        parkX,
        offRight: laneW,
        readoutGap: HOOD_READOUT_GAP_PX,
        isMobile,
        ...readout,
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

/** Dashboard arch silhouette with soft-touch plastic / leather grain */
export function DashboardPanelArch() {
  return (
    <div className="dashboard-panel-arch" aria-hidden>
      <svg
        className="dashboard-panel__arch dashboard-panel-arch__svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient
            id="dashboard-panel-arch-gradient"
            x1="944.5"
            y1="0"
            x2="944.5"
            y2="540"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4a4a52" />
            <stop offset="24%" stopColor="#242428" />
            <stop offset="58%" stopColor="#111114" />
            <stop offset="100%" stopColor="#060608" />
          </linearGradient>
          <filter
            id="dashboard-panel-plastic-noise"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="3"
              seed="8"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
            <feComponentTransfer in="mono">
              <feFuncA type="linear" slope="0.42" intercept="0" />
            </feComponentTransfer>
          </filter>
          <pattern
            id="dashboard-panel-grain-pattern"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            <rect width="180" height="180" filter="url(#dashboard-panel-plastic-noise)" />
          </pattern>
          <pattern
            id="dashboard-panel-weave-pattern"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(24)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,255,255,0.045)" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="12" y2="0" stroke="rgba(0,0,0,0.05)" strokeWidth="0.65" />
          </pattern>
        </defs>
        <path
          className="dashboard-panel__arch-fill"
          d={DASHBOARD_ARCH_PATH}
          fill="url(#dashboard-panel-arch-gradient)"
        />
        <path
          className="dashboard-panel__arch-grain"
          d={DASHBOARD_ARCH_PATH}
          fill="url(#dashboard-panel-grain-pattern)"
        />
        <path
          className="dashboard-panel__arch-weave"
          d={DASHBOARD_ARCH_PATH}
          fill="url(#dashboard-panel-weave-pattern)"
        />
      </svg>
    </div>
  );
}

/** Dark GPS street map inside arch clip, with slow parallax drift */
export function DashboardMapArch({
  showNavCursor: _showNavCursor = true,
  showZoomControls = true,
}: {
  showNavCursor?: boolean;
  showZoomControls?: boolean;
}) {
  return (
    <div className="dashboard-map-arch" aria-hidden={false}>
      <svg
        className="dashboard-panel__arch dashboard-map-arch__svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <clipPath id={CLIP_ID}>
            <path d={DASHBOARD_ARCH_PATH} />
          </clipPath>
        </defs>

        <path d={DASHBOARD_ARCH_PATH} fill={MAP_CANVAS_DARK} />

        <g clipPath={`url(#${CLIP_ID})`}>
          <foreignObject x="0" y="0" width={VB_W} height={VB_H}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="gps-map-parallax-host">
              <motion.div
                className="gps-map-parallax-track"
                animate={{ x: ['0%', '-50%'], y: ['0%', '-5%'] }}
                transition={{ duration: 56, repeat: Infinity, ease: 'linear' }}
              >
                <img src={gpsMapTexture} alt="" className="gps-map-parallax-tile" draggable={false} />
                <img
                  src={gpsMapTexture}
                  alt=""
                  className="gps-map-parallax-tile"
                  draggable={false}
                  aria-hidden
                />
              </motion.div>
            </div>
          </foreignObject>
        </g>
      </svg>

      <div className="map-simulation__controls" style={{ clipPath: `url(#${CLIP_ID})` }}>
        <MapNavControls />
        {showZoomControls ? (
          <div className="map-control-zoom">
            <MapControlButton label="Zoom in" className="map-control--zoom-in" src={iconPlus} />
            <MapControlButton label="Zoom out" className="map-control--zoom-out" src={iconMinus} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

const HOOD_POPUP_MESSAGES_FALLBACK = [
  'checking standards levels',
  'you are subscribed to 40% of our data standards',
  'you are missing IPO, ISHOP, and Super Spec',
] as const;

const HOOD_VIP_MESSAGE =
  'Make sure your databases are up-to-date with the latest releases';

const EXPLORE_VIP_HREF = EXTERNAL_CTA_LINKS.exploreAutoCareVip;
const SEE_LATEST_RELEASES_HREF = EXTERNAL_CTA_LINKS.seeLatestReleases;
const SEE_ALL_SUBSCRIPTIONS_HREF = EXTERNAL_CTA_LINKS.seeAllSubscriptions;

const HOOD_CHECKING_POPUP_INDEX = 0;
const HOOD_SUBSCRIBED_POPUP_INDEX = 1;
const HOOD_VIP_POPUP_INDEX = 2;
const HOOD_MISSING_POPUP_INDEX = 3;

function getHoodPopupMessage(
  index: number,
  messages: ReturnType<typeof getHoodStandardsMessages>,
): string {
  if (index === HOOD_VIP_POPUP_INDEX) return messages.vip;
  if (index === HOOD_MISSING_POPUP_INDEX) return messages.missing;
  if (index === HOOD_SUBSCRIBED_POPUP_INDEX) return messages.subscribed;
  if (index === HOOD_CHECKING_POPUP_INDEX) return messages.checking;
  return HOOD_POPUP_MESSAGES_FALLBACK[index] ?? '';
}

const DIPSTICK_RISE = { duration: 2.2, ease: [0.25, 0, 0.2, 1] as const };
const HOOD_ACES_START_MS = 280;
const HOOD_PIES_STAGGER_MS = 320;
const HOOD_MISSING_STAGGER_MS = 700;

const MISSING_DIPSTICKS = [
  { src: ipoDipstickImage, alt: 'IPO standard', className: 'hood-dipstick-img--ipo' },
  { src: ishopDipstickImage, alt: 'iSHOP standard', className: 'hood-dipstick-img--ishop' },
  { src: superspecDipstickImage, alt: 'SuperSpec standard', className: 'hood-dipstick-img--superspec' },
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
  const icon = direction === 'left' ? circleChevronLeft : circleChevronRight;

  return (
    <button
      type="button"
      className={`hood-nav-chevron hood-nav-chevron--${direction}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <img
        src={icon}
        alt=""
        className="hood-nav-chevron-icon"
        width={44}
        height={44}
        draggable={false}
        aria-hidden
      />
    </button>
  );
}

function HoodTypewriterText({
  text,
  onComplete,
  onTypingStart,
  charDelayMs = 42,
  scrollContainerRef,
  showCursorAfterComplete = false,
}: {
  text: string;
  onComplete?: () => void;
  onTypingStart?: () => void;
  charDelayMs?: number;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Keep blinking cursor visible after typing until the user clicks next. */
  showCursorAfterComplete?: boolean;
}) {
  const [count, setCount] = useState(0);
  const completedRef = useRef(false);
  const typingStartedRef = useRef(false);

  useEffect(() => {
    setCount(0);
    completedRef.current = false;
    typingStartedRef.current = false;
    const el = scrollContainerRef?.current;
    if (el) el.scrollTop = 0;
  }, [text, scrollContainerRef]);

  useEffect(() => {
    if (count >= text.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }
    if (count === 1 && !typingStartedRef.current) {
      typingStartedRef.current = true;
      onTypingStart?.();
    }
    const id = window.setTimeout(() => setCount((c) => c + 1), charDelayMs);
    return () => window.clearTimeout(id);
  }, [count, text, charDelayMs, onComplete, onTypingStart]);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [count, scrollContainerRef]);

  const done = count >= text.length;
  const showCursor = !done || showCursorAfterComplete;

  return (
    <p className="hood-standards-popup__text">
      <span>{text.slice(0, count)}</span>
      {showCursor && <span className="hood-standards-popup__cursor" aria-hidden />}
    </p>
  );
}

function HoodStandardsGauge({
  targetProgress,
  animateFill,
  showFull,
}: {
  targetProgress: number;
  animateFill: boolean;
  showFull: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, targetProgress));
  const displayPct = Math.round(clamped);
  const [fillProgress, setFillProgress] = useState(0);

  useEffect(() => {
    if (clamped === 0 || (!animateFill && !showFull)) {
      setFillProgress(0);
      return;
    }

    if (showFull) {
      setFillProgress(clamped);
      return;
    }

    setFillProgress(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFillProgress(clamped));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [clamped, animateFill, showFull]);

  const labelPct = Math.round(fillProgress);
  const useTransition = animateFill && !showFull;

  return (
    <div
      className="hood-standards-gauge"
      role="img"
      aria-label={
        fillProgress > 0
          ? `Data standards subscription ${displayPct} percent`
          : 'Checking data standards levels'
      }
    >
      <div className="hood-standards-gauge__shell">
        <div className="hood-standards-gauge__caps" aria-hidden>
          <span className="hood-standards-gauge__cap" />
          <span className="hood-standards-gauge__cap" />
        </div>
        <div className="hood-standards-gauge__well">
          <div
            className={`hood-standards-gauge__fill${useTransition ? '' : ' hood-standards-gauge__fill--instant'}`}
            style={{ height: `${fillProgress}%` }}
          >
            {labelPct >= 12 && (
              <span className="hood-standards-gauge__label">{labelPct}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoodStandardsPopup({
  index,
  onTypeComplete,
  onBackToJourney,
  onNext,
  nextDisabled = false,
  showNavButtons = false,
  hoodMessages,
}: {
  index: number;
  onTypeComplete?: () => void;
  onBackToJourney?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  showNavButtons?: boolean;
  hoodMessages: ReturnType<typeof getHoodStandardsMessages>;
}) {
  const textAreaRef = useRef<HTMLDivElement>(null);
  const message = getHoodPopupMessage(index, hoodMessages);
  const isMissing = index === HOOD_MISSING_POPUP_INDEX;
  const databaseAccessIcons = hoodMessages.databaseAccessIcons;
  const [gaugeFillStarted, setGaugeFillStarted] = useState(false);
  const gaugeTarget =
    index === HOOD_CHECKING_POPUP_INDEX ? 0 : hoodMessages.subscribedPct;
  const gaugeAnimateFill =
    index === HOOD_SUBSCRIBED_POPUP_INDEX && gaugeFillStarted;
  const gaugeShowFull = index > HOOD_SUBSCRIBED_POPUP_INDEX;

  useEffect(() => {
    setGaugeFillStarted(false);
  }, [index]);

  const handleGaugeTypingStart = useCallback(() => {
    if (index === HOOD_SUBSCRIBED_POPUP_INDEX) {
      setGaugeFillStarted(true);
    }
  }, [index]);

  const handleTypeComplete = useCallback(() => {
    onTypeComplete?.();
  }, [onTypeComplete]);

  return (
    <motion.div
      className="hood-standards-popup-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="hood-standards-popup" role="status" aria-live="polite">
        <div className="hood-standards-device__side-controls hood-standards-device__side-controls--left" aria-hidden>
          <span className="hood-standards-device__side-btn" />
          <span className="hood-standards-device__side-btn" />
        </div>
        <div className="hood-standards-device__side-controls hood-standards-device__side-controls--right" aria-hidden>
          <span className="hood-standards-device__side-btn" />
          <span className="hood-standards-device__side-btn" />
        </div>
        <div className="hood-standards-device">
          <div className="hood-standards-device__screen">
            <div className="hood-standards-device__toolbar" aria-hidden>
              <div className="hood-standards-device__brand">
                <span className="hood-standards-device__led" />
                <span className="hood-standards-device__label">Data Standards</span>
              </div>
              <div className="hood-standards-device__status">
                <div className="hood-standards-device__signal">
                  <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--1" />
                  <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--2" />
                  <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--3" />
                  <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--4" />
                </div>
                <div className="hood-standards-device__battery">
                  <div className="hood-standards-device__battery-body">
                    <span className="hood-standards-device__battery-fill" />
                  </div>
                </div>
              </div>
            </div>
            <div className="hood-standards-popup__body">
              <div className="hood-standards-popup__text-area">
                <HoodStandardsGauge
                  targetProgress={gaugeTarget}
                  animateFill={gaugeAnimateFill}
                  showFull={gaugeShowFull}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    className="hood-standards-popup__text-scroll"
                    ref={textAreaRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <HoodTypewriterText
                      text={message}
                      onComplete={handleTypeComplete}
                      onTypingStart={handleGaugeTypingStart}
                      scrollContainerRef={textAreaRef}
                      showCursorAfterComplete={showNavButtons}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              {showNavButtons && databaseAccessIcons.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`db-${index}`}
                    className="hood-standards-popup__database-row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="hood-standards-popup__database-label">Database Access:</span>
                    <div className="hood-standards-popup__nav-icons" aria-hidden>
                      {databaseAccessIcons.map((icon) => (
                        <img
                          key={icon.id}
                          className="hood-standards-popup__nav-icon"
                          src={icon.src}
                          alt={icon.label}
                          title={icon.label}
                          draggable={false}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
          {showNavButtons && (
            <div className="hood-standards-device__controls">
              <button
                type="button"
                className="hood-standards-device__btn hood-standards-device__btn--back"
                onClick={onBackToJourney}
              >
                BACK
              </button>
              <div className="hood-standards-device__controls-center">
                {isMissing ? (
                  <a
                    href={SEE_ALL_SUBSCRIPTIONS_HREF}
                    className="hood-standards-device__btn hood-standards-device__btn--cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    SEE ALL SUBSCRIPTIONS
                  </a>
                ) : (
                  <a
                    href={EXPLORE_VIP_HREF}
                    className="hood-standards-device__btn hood-standards-device__btn--cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    EXPLORE VIP
                  </a>
                )}
                <a
                  href={SEE_LATEST_RELEASES_HREF}
                  className="hood-standards-device__btn hood-standards-device__btn--cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SEE LATEST RELEASES
                </a>
              </div>
              <button
                type="button"
                className="hood-standards-device__btn hood-standards-device__btn--next"
                onClick={onNext}
                disabled={nextDisabled}
              >
                NEXT
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const HOOD_DIPSTICK_HIDDEN_TOP = '115%';
const HOOD_DIPSTICK_RISE_TOP = '17%';
const HOOD_DIPSTICK_ELEVATED_TOP = '27%';

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
        delay: isInitialRise ? 0.05 : 0,
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

/** Green check or red X — tablet gauge overlay and Full Diagnostics tire row. */
export function HoodTireCheckBadge({
  className,
  delay = 0,
  variant = 'success',
}: {
  className?: string;
  delay?: number;
  variant?: 'success' | 'fail';
}) {
  const isFail = variant === 'fail';

  return (
    <motion.span
      className={[
        'hood-tire-check-badge',
        isFail ? 'hood-tire-check-badge--fail' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
      initial={{ opacity: 0, scale: 0.35 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 22,
        delay,
      }}
    >
      <svg viewBox="0 0 48 48" className="hood-tire-check-badge__svg" aria-hidden>
        {isFail ? (
          <>
            <circle cx="24" cy="24" r="22" fill="#ef4444" stroke="#fecaca" strokeWidth="2" />
            <path
              d="M16 16 L32 32 M32 16 L16 32"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <circle cx="24" cy="24" r="22" fill="#39ff14" stroke="#bbf7d0" strokeWidth="2" />
            <path
              d="M14 25 L20 31 L34 16"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </motion.span>
  );
}

/** Rugged tablet shell — battery gauge + database badges only (no nav buttons). */
export function HoodStandardsSummaryDevice({
  subscribedPct,
  databaseAccessIcons,
  className,
  animateOnMount = true,
}: {
  subscribedPct: number;
  databaseAccessIcons: ReturnType<typeof getHoodStandardsMessages>['databaseAccessIcons'];
  className?: string;
  animateOnMount?: boolean;
}) {
  const [gaugeFillStarted, setGaugeFillStarted] = useState(false);

  useEffect(() => {
    if (!animateOnMount) {
      setGaugeFillStarted(true);
      return;
    }
    setGaugeFillStarted(false);
    const timer = window.setTimeout(() => setGaugeFillStarted(true), 450);
    return () => window.clearTimeout(timer);
  }, [animateOnMount, subscribedPct]);

  return (
    <div
      className={['hood-standards-popup', 'hood-standards-summary', className]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={`Data standards subscription ${Math.round(subscribedPct)} percent`}
    >
      <div className="hood-standards-device">
        <div className="hood-standards-device__screen">
          <div className="hood-standards-device__toolbar" aria-hidden>
            <div className="hood-standards-device__brand">
              <span className="hood-standards-device__led" />
              <span className="hood-standards-device__label">Data Standards</span>
            </div>
            <div className="hood-standards-device__status">
              <div className="hood-standards-device__signal">
                <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--1" />
                <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--2" />
                <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--3" />
                <span className="hood-standards-device__signal-bar hood-standards-device__signal-bar--4" />
              </div>
              <div className="hood-standards-device__battery">
                <div className="hood-standards-device__battery-body">
                  <span className="hood-standards-device__battery-fill" />
                </div>
              </div>
            </div>
          </div>
          <div className="hood-standards-popup__body hood-standards-popup__body--summary">
            <HoodStandardsGauge
              targetProgress={subscribedPct}
              animateFill={gaugeFillStarted}
              showFull={!animateOnMount}
            />
            {databaseAccessIcons.length > 0 ? (
              <div className="hood-standards-popup__database-row">
                <span className="hood-standards-popup__database-label">Database Access:</span>
                <div className="hood-standards-popup__nav-icons" aria-hidden>
                  {databaseAccessIcons.map((icon) => (
                    <img
                      key={icon.id}
                      className="hood-standards-popup__nav-icon"
                      src={icon.src}
                      alt={icon.label}
                      title={icon.label}
                      draggable={false}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoodTireWheel({ tirePhase }: { tirePhase: TirePhase }) {
  return (
    <div className={`hood-tire-wheel hood-tire-wheel--${tirePhase}`}>
      <img
        src={TIRE_WHEEL_IMAGES[tirePhase]}
        alt={TIRE_BADGE_LABELS[tirePhase]}
        className="hood-tire-wheel__asset"
        width={TIRE_WHEEL_NATIVE_PX[tirePhase]}
        height={TIRE_WHEEL_NATIVE_PX[tirePhase]}
        draggable={false}
      />
    </div>
  );
}

type ReadoutPhase = 'idle' | 'counting' | 'secondary' | 'cta';

const readoutMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
};

function HoodTireReadoutNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <motion.div
      className="hood-tire-hub__screen-nav"
      {...readoutMotion}
      transition={{ ...readoutMotion.transition, delay: 0.2 }}
    >
      <button type="button" className="hood-tire-hub__btn hood-tire-hub__btn--back" onClick={onBack}>
        Back
      </button>
      <button
        type="button"
        className="hood-tire-hub__btn hood-tire-hub__btn--next"
        onClick={onNext}
        disabled={nextDisabled}
      >
        Next
      </button>
    </motion.div>
  );
}

function HoodTirePressureGauge({ completedTires }: { completedTires: ReadonlySet<TirePhase> }) {
  const checkIndex = getTireCheckImageIndex(completedTires.size);
  const src = TIRE_CHECK_SEQUENCE[checkIndex];

  return (
    <div className="hood-tire-pressure-gauge" aria-hidden={false}>
      <AnimatePresence mode="wait">
        <motion.img
          key={checkIndex}
          src={src}
          alt=""
          className="hood-tire-pressure-gauge__sequence"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}

function HoodTireHubReadout({
  tirePhase,
  counterActive,
  screenVisible,
  tabletShowsTireArt = false,
  onReadoutReady,
  onNavigateToTire,
  onFinishTireSequence,
  onReadoutBack,
  readoutConfig,
}: {
  tirePhase: TirePhase;
  counterActive: boolean;
  screenVisible: boolean;
  /** Mobile: show the active tire SVG in the tablet instead of the gauge Lottie. */
  tabletShowsTireArt?: boolean;
  onReadoutReady?: () => void;
  onNavigateToTire?: (target: TirePhase) => void;
  onFinishTireSequence?: () => void;
  onReadoutBack?: () => void;
  readoutConfig: TireReadoutConfig;
}) {
  const [readoutPhase, setReadoutPhase] = useState<ReadoutPhase>('idle');
  const onReadyRef = useRef(onReadoutReady);
  onReadyRef.current = onReadoutReady;
  const config = readoutConfig;
  const ctaConfig = TIRE_CTA_CONFIG[tirePhase];
  const hasCta = tireHasCta(tirePhase);

  useEffect(() => {
    setReadoutPhase('idle');
    if (!counterActive) return;

    const timers = [
      setTimeout(() => setReadoutPhase('counting'), 80),
      setTimeout(() => {
        setReadoutPhase('secondary');
        if (!hasCta) onReadyRef.current?.();
      }, HOOD_COUNTER_COUNT_MS + 200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [tirePhase, counterActive, hasCta]);

  useEffect(() => {
    if (readoutPhase === 'cta' && hasCta) onReadyRef.current?.();
  }, [readoutPhase, hasCta]);

  const counting =
    readoutPhase === 'counting' ||
    readoutPhase === 'secondary' ||
    (readoutPhase === 'cta' && hasCta);
  const showPressureGauge =
    readoutPhase === 'counting' || readoutPhase === 'secondary' || readoutPhase === 'cta';
  const showCta = readoutPhase === 'cta' && ctaConfig;
  const showStatsNav = readoutPhase === 'secondary';
  const showGaugeCheck = readoutPhase === 'secondary' || readoutPhase === 'cta';
  const gaugeCheckVariant = config.primaryValue === 0 ? 'fail' : 'success';
  const readoutInteractive = readoutPhase === 'secondary' || readoutPhase === 'cta';
  const nextTirePhase = getNextTirePhase(tirePhase);

  const handleCtaNext = () => {
    const target = ctaConfig?.nextTarget;
    if (target) onNavigateToTire?.(target);
    else onFinishTireSequence?.();
  };

  const handleStatsNext = () => {
    if (hasCta) {
      setReadoutPhase('cta');
      return;
    }
    if (nextTirePhase) onNavigateToTire?.(nextTirePhase);
    else onFinishTireSequence?.();
  };

  return (
    <motion.div
      className={`hood-tire-hub__screen${readoutInteractive ? ' hood-tire-hub__screen--interactive' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: screenVisible ? 1 : 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className="hood-tire-hub__screen-bezel">
        <div
          className={
            showPressureGauge
              ? 'hood-tire-hub__screen-glass hood-tire-hub__screen-glass--with-gauge'
              : 'hood-tire-hub__screen-glass'
          }
        >
          {showPressureGauge && (
            <div
              className={`hood-tire-hub__pressure-gauge${tabletShowsTireArt ? ' hood-tire-hub__pressure-gauge--tire-art' : ''}`}
              aria-hidden
            >
              {tabletShowsTireArt ? (
                <img
                  key={tirePhase}
                  src={TIRE_WHEEL_IMAGES[tirePhase]}
                  alt=""
                  className="hood-tire-hub__pressure-gauge-tire"
                  draggable={false}
                />
              ) : (
                <Lottie
                  key={tirePhase}
                  animationData={tireGaugeData}
                  loop={false}
                  autoplay
                  className="hood-tire-hub__pressure-gauge-lottie"
                  rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                />
              )}
              <AnimatePresence>
                {showGaugeCheck ? (
                  <motion.div
                    key="gauge-check"
                    className="hood-tire-hub__gauge-check"
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.35 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 22,
                    }}
                  >
                    <HoodTireCheckBadge variant={gaugeCheckVariant} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
          {readoutPhase === 'idle' ? null : (
            <div className="hood-tire-hub__screen-content">
              {showCta ? (
                <div className="hood-tire-hub__results hood-tire-hub__results--cta">
                  <motion.p className="hood-tire-hub__line hood-tire-hub__line--momentum" {...readoutMotion}>
                    {ctaConfig.message}
                  </motion.p>
                  <motion.a
                    href={ctaConfig.href}
                    className="hood-tire-hub__btn hood-tire-hub__btn--visit"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...readoutMotion}
                    transition={{ ...readoutMotion.transition, delay: 0.12 }}
                  >
                    {ctaConfig.linkLabel}
                  </motion.a>
                  <HoodTireReadoutNav
                    onBack={() => setReadoutPhase('secondary')}
                    onNext={handleCtaNext}
                    nextDisabled={!ctaConfig.nextTarget && !onFinishTireSequence}
                  />
                </div>
              ) : (
                <div className="hood-tire-hub__results">
                  <div className="hood-tire-hub__stat-block">
                    <p className="hood-tire-hub__line hood-tire-hub__line--primary">
                      <span className="hood-tire-hub__stat-value">
                        <HoodCountUp value={config.primaryValue} active={counting} />
                      </span>
                    </p>
                    <p className="hood-tire-hub__line hood-tire-hub__stat-label">{config.primaryLabel}</p>
                  </div>
                  {readoutPhase === 'secondary' && (
                    <motion.p className="hood-tire-hub__line hood-tire-hub__line--secondary" {...readoutMotion}>
                      {config.secondary.type === 'percent' ? (
                        <>
                          <span className="hood-tire-hub__stat-value hood-tire-hub__stat-value--inline">
                            <HoodCountUp value={config.secondary.value} active />
                          </span>
                          % {config.secondary.suffix}
                        </>
                      ) : config.secondary.type === 'fraction' ? (
                        <>
                          <span className="hood-tire-hub__stat-value hood-tire-hub__stat-value--inline">
                            <HoodCountUp value={config.secondary.completed} active />
                          </span>{' '}
                          of{' '}
                          <span className="hood-tire-hub__stat-value hood-tire-hub__stat-value--inline">
                            <HoodCountUp value={config.secondary.total} active />
                          </span>{' '}
                          {config.secondary.suffix}
                        </>
                      ) : config.secondary.type === 'overTotal' ? (
                        <>
                          of over{' '}
                          <span className="hood-tire-hub__stat-value hood-tire-hub__stat-value--inline">
                            <HoodCountUp value={config.secondary.total} active />
                          </span>{' '}
                          {config.secondary.suffix}
                        </>
                      ) : (
                        <>
                          <span className="hood-tire-hub__stat-value hood-tire-hub__stat-value--inline">
                            <HoodCountUp value={config.secondary.value} active />
                          </span>{' '}
                          {config.secondary.suffix}
                        </>
                      )}
                    </motion.p>
                  )}
                  {showStatsNav && (
                    <HoodTireReadoutNav
                      onBack={() => onReadoutBack?.()}
                      onNext={handleStatsNext}
                      nextDisabled={!hasCta && !nextTirePhase && !onFinishTireSequence}
                    />
                  )}
                </div>
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
  skipGroundIntro = false,
  slideGroundOut = false,
  completedTires,
  onIntroComplete,
  onGroundExitComplete,
  onReadoutReady,
  onNavigateToTire,
  onFinishTireSequence,
  onReadoutBack,
  tireReadoutConfig,
}: {
  phase: TirePhase;
  isRolling: boolean;
  rollTarget: TireRollTarget;
  playIntro: boolean;
  /** Ground already visible (e.g. hood-close overlay on standards). */
  skipGroundIntro?: boolean;
  slideGroundOut?: boolean;
  completedTires: ReadonlySet<TirePhase>;
  onIntroComplete: () => void;
  onGroundExitComplete?: () => void;
  onReadoutReady: () => void;
  onNavigateToTire: (target: TirePhase) => void;
  onFinishTireSequence?: () => void;
  onReadoutBack?: () => void;
  tireReadoutConfig: Record<TirePhase, TireReadoutConfig>;
}) {
  const [introStep, setIntroStep] = useState<TireIntroStep>(playIntro ? 'ground' : 'done');
  const groundExitReportedRef = useRef(false);
  const {
    offLeft,
    parkX,
    offRight,
    wheelW,
    readoutWidth,
    readoutBezelHeight,
    readoutGlassHeight,
    readoutGaugeSlot,
    readoutContentMin,
    readoutContentHeight,
    readoutScreenPadding,
    readoutBezelPadding,
    readoutGap,
    isMobile,
  } =
    useWheelLaneMetrics();
  const counterActive =
    !isRolling && (introStep === 'counter' || introStep === 'done');
  const screenVisible =
    isRolling ||
    introStep === 'wheel' ||
    introStep === 'counter' ||
    introStep === 'done';

  const swapping = isRolling && rollTarget !== null;
  const introWheelRolling = playIntro && introStep === 'wheel';
  const parked = !isRolling && introStep !== 'ground' && introStep !== 'wheel';
  const rolling = introWheelRolling || swapping;

  useEffect(() => {
    if (!slideGroundOut) {
      groundExitReportedRef.current = false;
    }
  }, [slideGroundOut]);

  useEffect(() => {
    if (slideGroundOut) return;
    if (!playIntro) {
      setIntroStep('done');
      return;
    }
    if (skipGroundIntro) {
      setIntroStep('wheel');
      const timers = [
        setTimeout(() => setIntroStep('counter'), HOOD_WHEEL_ROLL_IN_MS),
        setTimeout(() => {
          setIntroStep('done');
          onIntroComplete();
        }, HOOD_WHEEL_ROLL_IN_MS + 80),
      ];
      return () => timers.forEach(clearTimeout);
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
  }, [playIntro, skipGroundIntro, slideGroundOut, onIntroComplete]);

  const rollDuration =
    introWheelRolling ? HOOD_WHEEL_ROLL_IN_MS / 1000 : TIRE_ROLL_MS / 1000;
  const rollEase = [0.45, 0, 0.2, 1] as const;

  const hubStyle = {
    '--hood-wheel-park-x': `${parkX}px`,
    '--hood-wheel-half': `${wheelW / 2}px`,
    '--hood-readout-width': `${readoutWidth}px`,
    '--hood-readout-bezel-height': `${readoutBezelHeight}px`,
    '--hood-readout-glass-height': `${readoutGlassHeight}px`,
    '--hood-readout-gauge-slot': `${readoutGaugeSlot}px`,
    '--hood-readout-content-min-height': `${readoutContentMin}px`,
    '--hood-readout-content-height': `${readoutContentHeight}px`,
    '--hood-readout-screen-padding': `${readoutScreenPadding}px`,
    '--hood-readout-bezel-padding': readoutBezelPadding,
    '--hood-readout-gap': `${readoutGap}px`,
  } as CSSProperties;

  return (
    <div className="hood-tire-hub" style={hubStyle}>
      <div className="hood-tire-hub__black" aria-hidden />
      <motion.div
        key={slideGroundOut ? 'hood-ground-exit' : 'hood-ground-idle'}
        className="hood-tire-hub__arch-wrap"
        initial={{
          y: slideGroundOut ? '0%' : playIntro && !skipGroundIntro ? '100%' : '0%',
        }}
        animate={{ y: slideGroundOut ? '100%' : '0%' }}
        transition={{
          duration:
            slideGroundOut || (playIntro && !skipGroundIntro)
              ? HOOD_GROUND_RISE_MS / 1000
              : 0,
          ease: [0.4, 0, 0.2, 1],
        }}
        onAnimationComplete={() => {
          if (!slideGroundOut || groundExitReportedRef.current) return;
          groundExitReportedRef.current = true;
          onGroundExitComplete?.();
        }}
      >
        <HoodTireBaseArch />
      </motion.div>
      <div className="hood-tire-hub__sky-bg" aria-hidden>
        <Lottie
          animationData={wheelAlignmentServiceData}
          loop
          autoplay
          className="hood-tire-hub__sky-bg-player"
          rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
        />
      </div>
      <div className="hood-tire-hub__lane" aria-hidden={false}>
        {rolling && swapping && rollTarget && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--outgoing"
            style={{ width: wheelW }}
            initial={{ x: parkX, rotate: 0 }}
            animate={{ x: offRight, rotate: HOOD_WHEEL_ROLL_SPIN }}
            transition={{ duration: rollDuration, ease: rollEase }}
          >
            <HoodTireWheel tirePhase={phase} />
          </motion.div>
        )}
        {rolling && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--incoming"
            style={{ width: wheelW }}
            initial={{ x: offLeft, rotate: 0 }}
            animate={{ x: parkX, rotate: HOOD_WHEEL_ROLL_SPIN }}
            transition={{ duration: rollDuration, ease: rollEase }}
          >
            <HoodTireWheel tirePhase={swapping && rollTarget ? rollTarget : 'trendlens'} />
          </motion.div>
        )}
        {parked && (
          <div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--active"
            style={{ width: wheelW, transform: `translate3d(${Math.round(parkX)}px, 0, 0)` }}
          >
            <HoodTireWheel tirePhase={phase} />
          </div>
        )}
      </div>
      <div className="hood-tire-hub__readout-row">
        <div className="hood-tire-hub__readout hood-tire-hub__readout--interactive">
          <HoodTireHubReadout
            tirePhase={phase}
            counterActive={counterActive}
            screenVisible={screenVisible}
            tabletShowsTireArt={isMobile}
            onReadoutReady={onReadoutReady}
            onNavigateToTire={onNavigateToTire}
            onFinishTireSequence={onFinishTireSequence}
            onReadoutBack={onReadoutBack}
            readoutConfig={tireReadoutConfig[phase]}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Under the Hood arch — layer stack inside one SVG clip (back → front):
 * 1. Full engine  2. Dipstick  3. Frame overlay (black hole = transparent via mask)
 */
export type HoodNavTransition = 'tire-to-standards' | 'standards-to-tire';

const HOOD_ARCH_SLIDE_EASE = [0.4, 0, 0.2, 1] as const;

export function DashboardHoodArch({
  phase,
  report,
  onPhaseChange,
  onFinishTireSequence,
  onBackToJourney,
  onRequestStandardsToTireTransition,
  onRequestTireToStandardsTransition,
  hoodNavTransition = null,
  onNavTransitionMidpoint,
  onNavTransitionComplete,
}: {
  phase: HoodPhase;
  report: WrappedReport;
  onPhaseChange: (phase: HoodPhase) => void;
  onFinishTireSequence?: () => void;
  /** Returns to the final screen of the Your Journey GPS sequence. */
  onBackToJourney?: () => void;
  /** Starts the hood-close transition into kick-the-tires (from standards popup or nav). */
  onRequestStandardsToTireTransition?: () => void;
  /** Slides the tire ground down and returns to the standards scene. */
  onRequestTireToStandardsTransition?: () => void;
  hoodNavTransition?: HoodNavTransition | null;
  /** Fired when the outgoing arch (tire or standards) finishes sliding down. */
  onNavTransitionMidpoint?: () => void;
  /** Fired when the incoming arch finishes sliding up. */
  onNavTransitionComplete?: () => void;
}) {
  const tireReadoutConfig = useMemo(() => buildTireReadoutConfig(report), [report]);
  const hoodMessages = useMemo(() => getHoodStandardsMessages(report), [report]);
  const [popupIndex, setPopupIndex] = useState(HOOD_CHECKING_POPUP_INDEX);
  const [popupTyped, setPopupTyped] = useState(false);
  const [acesRisen, setAcesRisen] = useState(false);
  const [piesRisen, setPiesRisen] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [ipoRisen, setIpoRisen] = useState(false);
  const [ishopRisen, setIshopRisen] = useState(false);
  const [superspecRisen, setSuperspecRisen] = useState(false);
  const missingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const acesPiesTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const missingRisen = [ipoRisen, ishopRisen, superspecRisen];
  const missingComplete = ipoRisen && ishopRisen && superspecRisen;

  const [tireRolling, setTireRolling] = useState(false);
  const [tireRollTarget, setTireRollTarget] = useState<TireRollTarget>(null);
  const [tireIntroComplete, setTireIntroComplete] = useState(false);
  const [tireReadoutReady, setTireReadoutReady] = useState(false);
  const [completedTires, setCompletedTires] = useState<Set<TirePhase>>(() => new Set());
  const [standardsCloseStep, setStandardsCloseStep] = useState<
    'idle' | 'engine-out' | 'ground-in'
  >('idle');

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

  const clearAcesPiesTimers = useCallback(() => {
    acesPiesTimersRef.current.forEach(clearTimeout);
    acesPiesTimersRef.current = [];
  }, []);

  const scheduleAcesPiesRise = useCallback(() => {
    clearAcesPiesTimers();
    acesPiesTimersRef.current.push(setTimeout(() => setAcesRisen(true), HOOD_ACES_START_MS));
    acesPiesTimersRef.current.push(
      setTimeout(() => setPiesRisen(true), HOOD_ACES_START_MS + HOOD_PIES_STAGGER_MS),
    );
  }, [clearAcesPiesTimers]);

  const clearMissingTimers = useCallback(() => {
    missingTimersRef.current.forEach(clearTimeout);
    missingTimersRef.current = [];
  }, []);

  const beginReturnToStandards = useCallback(() => {
    clearMissingTimers();
    setShowMissing(false);
    setIpoRisen(false);
    setIshopRisen(false);
    setSuperspecRisen(false);
    setPopupIndex(HOOD_VIP_POPUP_INDEX);
    setPopupTyped(true);
    setAcesRisen(true);
    setPiesRisen(true);
    setTireIntroComplete(false);
    setTireReadoutReady(false);
    onRequestTireToStandardsTransition?.();
  }, [clearMissingTimers, onRequestTireToStandardsTransition]);

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
      if (prevTirePhase) {
        rollToTirePhase(prevTirePhase);
      } else {
        beginReturnToStandards();
      }
      return;
    }
    if (popupIndex === HOOD_MISSING_POPUP_INDEX) {
      clearMissingTimers();
      setShowMissing(false);
      setIpoRisen(false);
      setIshopRisen(false);
      setSuperspecRisen(false);
      setPopupIndex(HOOD_VIP_POPUP_INDEX);
      return;
    }
    if (popupIndex === HOOD_VIP_POPUP_INDEX) {
      setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
      setPopupTyped(false);
      return;
    }
    if (popupIndex > HOOD_CHECKING_POPUP_INDEX) {
      if (popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX) {
        clearAcesPiesTimers();
        setAcesRisen(false);
        setPiesRisen(false);
      }
      setPopupIndex((i) => i - 1);
      setPopupTyped(false);
    }
  }, [phase, prevTirePhase, popupIndex, clearMissingTimers, clearAcesPiesTimers, beginReturnToStandards, rollToTirePhase]);

  const handleNext = useCallback(() => {
    if (popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX) {
      setPopupIndex(HOOD_VIP_POPUP_INDEX);
      setPopupTyped(false);
      return;
    }
    if (popupIndex === HOOD_VIP_POPUP_INDEX && popupTyped) {
      setTireReadoutReady(false);
      setTireIntroComplete(false);
      onRequestStandardsToTireTransition?.();
    }
  }, [popupIndex, popupTyped, onRequestStandardsToTireTransition]);

  const handlePopupTypeComplete = useCallback(() => {
    setPopupTyped(true);
  }, []);

  const showStandardsControls = phase === 'standards';
  const forwardDisabled =
    popupIndex === HOOD_CHECKING_POPUP_INDEX ||
    (popupIndex >= HOOD_SUBSCRIBED_POPUP_INDEX && !popupTyped);
  const pairElevated = popupIndex >= 1 && !showMissing;
  const pairRisenTop = pairElevated ? HOOD_DIPSTICK_ELEVATED_TOP : HOOD_DIPSTICK_RISE_TOP;

  useEffect(() => {
    if (popupIndex !== HOOD_CHECKING_POPUP_INDEX || !popupTyped) return;
    scheduleAcesPiesRise();
  }, [popupIndex, popupTyped, scheduleAcesPiesRise]);

  useEffect(() => {
    if (popupIndex !== HOOD_CHECKING_POPUP_INDEX || !acesRisen) return;
    setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
    setPopupTyped(false);
  }, [popupIndex, acesRisen]);

  useEffect(
    () => () => {
      clearMissingTimers();
      clearAcesPiesTimers();
    },
    [clearMissingTimers, clearAcesPiesTimers],
  );

  const archSlideTransition = {
    duration: HOOD_PANEL_SLIDE_MS / 1000,
    ease: HOOD_ARCH_SLIDE_EASE,
  };
  const standardsHoodClosing =
    hoodNavTransition === 'standards-to-tire' && phase === 'standards';
  const standardsEnterUp =
    hoodNavTransition === 'tire-to-standards' && phase === 'standards';
  const tireSlideGroundOut =
    hoodNavTransition === 'tire-to-standards' && isTirePhase(phase);
  const tireSkipGroundIntro =
    hoodNavTransition === 'standards-to-tire' && isTirePhase(phase);

  useEffect(() => {
    if (hoodNavTransition !== 'standards-to-tire' || phase === 'standards') return;
    onNavTransitionComplete?.();
  }, [hoodNavTransition, phase, onNavTransitionComplete]);

  useEffect(() => {
    if (hoodNavTransition !== 'tire-to-standards') return;
    clearMissingTimers();
    setShowMissing(false);
    setIpoRisen(false);
    setIshopRisen(false);
    setSuperspecRisen(false);
    setPopupIndex(HOOD_VIP_POPUP_INDEX);
    setPopupTyped(true);
    setAcesRisen(true);
    setPiesRisen(true);
  }, [hoodNavTransition, clearMissingTimers]);

  useEffect(() => {
    if (standardsHoodClosing) {
      setStandardsCloseStep('engine-out');
      return;
    }
    setStandardsCloseStep('idle');
  }, [standardsHoodClosing]);

  const handleEngineExitComplete = useCallback(() => {
    setStandardsCloseStep((step) => (step === 'engine-out' ? 'ground-in' : step));
  }, []);

  const standardsBranch = (
    <motion.div
      key="hood-standards"
      className="dashboard-hood-arch__standards"
      initial={
        hoodNavTransition
          ? standardsEnterUp
            ? { y: '100%' }
            : false
          : { y: 0 }
      }
      animate={{ y: 0 }}
      exit={hoodNavTransition ? undefined : { y: '100%' }}
      transition={
        hoodNavTransition
          ? archSlideTransition
          : {
              duration: HOOD_STANDARDS_EXIT_MS / 1000,
              ease: HOOD_ARCH_SLIDE_EASE,
            }
      }
      onAnimationComplete={() => {
        if (!hoodNavTransition) return;
        if (standardsEnterUp) onNavTransitionComplete?.();
      }}
    >
            {!standardsHoodClosing && (
              <div className="hood-standards-popup-anchor">
                <HoodStandardsPopup
                  index={popupIndex}
                  hoodMessages={hoodMessages}
                  onTypeComplete={handlePopupTypeComplete}
                  onBackToJourney={onBackToJourney}
                  onNext={handleNext}
                  nextDisabled={forwardDisabled}
                  showNavButtons={showStandardsControls}
                />
              </div>
            )}
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
                  <motion.div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="hood-engine-stack"
                    animate={{
                      y:
                        standardsCloseStep === 'engine-out' ||
                        standardsCloseStep === 'ground-in'
                          ? '100%'
                          : '0%',
                    }}
                    transition={{
                      duration: HOOD_ENGINE_EXIT_MS / 1000,
                      ease: HOOD_ARCH_SLIDE_EASE,
                    }}
                    onAnimationComplete={handleEngineExitComplete}
                  >
                    <img
                      src={engineFullImage}
                      alt=""
                      className="hood-engine-img hood-engine-img--back"
                      draggable={false}
                    />
                    <div className="hood-dipstick-slot">
                      <div className="hood-standards-band">
                        <div className="hood-standards-dipsticks-group">
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
                                    src={acesDipstickImage}
                                    alt="ACES standard"
                                    risen={acesRisen}
                                    risenTop={pairRisenTop}
                                    className="hood-dipstick-img--aces"
                                  />
                                  <HoodDipstickRise
                                    src={piesDipstickImage}
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
                                      className={stick.className}
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                    <img
                      src={engineHoleFrameImage}
                      alt=""
                      className="hood-engine-img hood-engine-img--front"
                      draggable={false}
                    />
                  </motion.div>
                </foreignObject>
              </g>
            </svg>
            {standardsCloseStep === 'ground-in' && (
              <motion.div
                key="hood-ground-close"
                className="hood-standards-ground-close"
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                transition={{
                  duration: HOOD_GROUND_RISE_MS / 1000,
                  ease: [0.4, 0, 0.2, 1],
                }}
                onAnimationComplete={() => onNavTransitionMidpoint?.()}
              >
                <HoodTireBaseArch />
              </motion.div>
            )}
          </motion.div>
  );

  const tireBranch = (
    <motion.div
      key="hood-tire-hub"
      className="dashboard-hood-arch__tire-hub"
      initial={false}
      animate={{ y: 0 }}
    >
            <HoodTireHubScene
              phase={tirePhase}
              isRolling={tireRolling}
              rollTarget={tireRollTarget}
              playIntro={!tireIntroComplete}
              skipGroundIntro={tireSkipGroundIntro}
              slideGroundOut={tireSlideGroundOut}
              completedTires={completedTires}
              tireReadoutConfig={tireReadoutConfig}
              onIntroComplete={handleTireIntroComplete}
              onGroundExitComplete={onNavTransitionMidpoint}
              onReadoutReady={handleReadoutReady}
              onNavigateToTire={rollToTirePhase}
              onFinishTireSequence={onFinishTireSequence}
              onReadoutBack={handlePrev}
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
  );

  return (
    <div className="dashboard-hood-arch" aria-hidden={false}>
      {hoodNavTransition ? (
        phase === 'standards' ? standardsBranch : tireBranch
      ) : (
        <AnimatePresence mode="wait">
          {phase === 'standards' ? standardsBranch : tireBranch}
        </AnimatePresence>
      )}
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
