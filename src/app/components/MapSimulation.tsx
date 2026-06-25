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
import { debugSessionLog } from '@/lib/debugSessionLog';
import {
  getHoodTypewriterDurationMs,
  HOOD_TYPEWRITER_CHAR_DELAY_MS,
  playHoodStandardsBackClickSound,
  playHoodStandardsForwardClickSound,
  startHoodStandardsDataProcessingBeep,
  stopHoodStandardsDataProcessingBeep,
} from '@/lib/hoodStandardsClickSound';
import { useMobileViewport } from '@/lib/useMobileViewport';
import { isTireHubMobileStack, useTireHubMobileStack } from '@/lib/viewportLayout';
import { LazyLottie } from './LazyLottie';
import {
  loadCarBatteryAnimation,
  loadTireGaugeAnimation,
  loadWheelAlignmentAnimation,
} from '@/lib/lazyLottieData';
import { HoodStandardsMetallicBackground } from './HoodStandardsMetallicBackground';
import { HoodDemandIndexProductListScroll } from './HoodDemandIndexProductListScroll';
import { HoodAcademyCourseList } from './HoodAcademyCourseList';
import gpsMapTexture from '../../assets/gps-map-dark.png';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import tireTrendlensImage from '../../assets/tire-trendlens.svg?url';
import tireDemandindexImage from '../../assets/tire-demandindex.svg?url';
import tireFactbookImage from '../../assets/tire-factbook.svg?url';
import factbookTizraTileImage from '../../assets/factbook-2027-tizra-tile-600x460.png?url';
import trendlensLogoImage from '../../assets/trendlens-logo.svg?url';
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
import {
  buildTireReadoutConfig,
  getHoodStandardsMessages,
  getAcademyCtaMessage,
  getInitialTirePhase,
  getNextTirePhaseForReport,
  getPrevTirePhaseForReport,
  isTirePhaseEmpty,
  type TireReadoutConfig,
} from '@/lib/contentVariants';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';
import type { StandardsProtocolLogo } from '@/lib/standardsDatabaseIcons';
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
const HOOD_GROUND_RISE_MS = HOOD_PANEL_SLIDE_MS;
const HOOD_CROSSFADE_TO_BLACK_MS = 480;
const HOOD_TIRE_CONTENT_FADE_MS = 420;
const HOOD_WHEEL_ROLL_IN_MS = 900;
const HOOD_COUNTER_COUNT_MS = 1200;
const HOOD_WHEEL_MAX_PX = 272; /* ~15% smaller than 320px */
const HOOD_READOUT_GAP_PX = 20;
const HOOD_READOUT_WIDTH_DESKTOP = 340;
const HOOD_READOUT_WIDTH_MOBILE_RATIO = 0.9;
const HOOD_READOUT_MIN_WIDTH = 272;
const HOOD_READOUT_GAUGE_SLOT_PX = 162;
/** Fixed content area below gauge — same on every tire so the screen never resizes. */
const HOOD_READOUT_CONTENT_SLOT_PX = 156;
const HOOD_READOUT_SCREEN_CONTENT_PX = 211;
const HOOD_READOUT_BEZEL_HEIGHT_PX =
  168 + HOOD_READOUT_GAUGE_SLOT_PX + HOOD_READOUT_CONTENT_SLOT_PX;
const HOOD_READOUT_GLASS_HEIGHT_PX =
  108 + HOOD_READOUT_GAUGE_SLOT_PX + HOOD_READOUT_CONTENT_SLOT_PX;

/** Mirrors --driving-content-gutter: clamp(12px, 3vw, 20px) */
function drivingContentGutterPx(viewportWidth: number): number {
  return Math.max(12, Math.min(viewportWidth * 0.03, 20));
}

/** Scale tablet chrome proportionally from the 340×486 design width. */
function hoodReadoutDimensions(widthPx: number, uncapped = false) {
  const readoutWidth = uncapped
    ? Math.max(HOOD_READOUT_MIN_WIDTH, widthPx)
    : Math.min(
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
      'See the full list of product groups to see what your company is eligible to subscribe to.',
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
const HOOD_MOBILE_TABLET_VERTICAL_PAD_PX = 24;
const HOOD_MOBILE_READOUT_EXTRA_HEIGHT_PX = 75;
const HOOD_DESKTOP_TABLET_MARGIN_PX = 30;
const HOOD_MOBILE_TIRE_TABLET_GAP_PX = 16;
const HOOD_MOBILE_TIRE_TOP_PAD_PX = 12;
const HOOD_MOBILE_TIRE_LANE_MAX_PX = 190;
const HOOD_MOBILE_TIRE_LANE_VW_RATIO = 0.42;
const HOOD_MOBILE_TABLET_TIRE_VW_RATIO = 0.5;
const HOOD_MOBILE_TABLET_TIRE_MAX_PX = 215;
const DRIVING_FOOTER_PX = 96;
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
      typeof window !== 'undefined' &&
      isTireHubMobileStack(window.innerWidth),
  });

  useLayoutEffect(() => {
    let rafId = 0;
    const update = () => {
      const laneW = window.innerWidth;
      const isMobile = isTireHubMobileStack(laneW);
      const contentGutter = drivingContentGutterPx(laneW);

      if (isMobile) {
        const stageH = window.innerHeight - DRIVING_FOOTER_PX;
        const maxBezelH = Math.max(
          0,
          stageH - HOOD_MOBILE_TABLET_VERTICAL_PAD_PX * 2,
        );

        let readoutWidth = Math.round(laneW * HOOD_READOUT_WIDTH_MOBILE_RATIO);
        let readout = hoodReadoutDimensions(readoutWidth, true);
        if (maxBezelH > 0 && readout.readoutBezelHeight > maxBezelH) {
          const shrinkScale = maxBezelH / readout.readoutBezelHeight;
          readoutWidth = Math.max(
            HOOD_READOUT_MIN_WIDTH,
            Math.round(readoutWidth * shrinkScale),
          );
          readout = hoodReadoutDimensions(readoutWidth, true);
        }

        const wheelW = Math.min(Math.round(laneW * 0.5), HOOD_WHEEL_MAX_PX);
        const parkX = Math.round((laneW - wheelW) / 2);

        setMetrics((prev) => {
          const next = {
            laneW,
            wheelW,
            offLeft: -wheelW,
            parkX,
            offRight: laneW,
            readoutGap: HOOD_READOUT_GAP_PX,
            isMobile,
            ...readout,
          };
          if (
            prev.laneW === next.laneW &&
            prev.wheelW === next.wheelW &&
            prev.parkX === next.parkX &&
            prev.isMobile === next.isMobile &&
            prev.readoutWidth === next.readoutWidth
          ) {
            return prev;
          }
          return next;
        });
        return;
      }

      const wheelW = Math.min(laneW * 0.82, HOOD_WHEEL_MAX_PX);
      const stageH = window.innerHeight - DRIVING_FOOTER_PX;
      const maxBezelH = Math.max(0, stageH - HOOD_DESKTOP_TABLET_MARGIN_PX * 2);
      let readoutWidth = HOOD_READOUT_WIDTH_DESKTOP;
      let groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      const maxGroupWidth = laneW - contentGutter * 2;
      if (groupWidth > maxGroupWidth) {
        readoutWidth = maxGroupWidth - HOOD_READOUT_GAP_PX - wheelW;
        groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      }
      let readout = hoodReadoutDimensions(readoutWidth);
      if (maxBezelH > 0 && readout.readoutBezelHeight > maxBezelH) {
        const shrinkScale = maxBezelH / readout.readoutBezelHeight;
        readoutWidth = Math.max(
          HOOD_READOUT_MIN_WIDTH,
          Math.round(readoutWidth * shrinkScale),
        );
        readout = hoodReadoutDimensions(readoutWidth);
        groupWidth = readout.readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      }
      readoutWidth = readout.readoutWidth;
      groupWidth = readoutWidth + HOOD_READOUT_GAP_PX + wheelW;
      const groupLeft = Math.round(
        Math.max(
          contentGutter,
          Math.min((laneW - groupWidth) / 2, laneW - groupWidth - contentGutter),
        ),
      );
      const parkX = groupLeft + readoutWidth + HOOD_READOUT_GAP_PX;

      setMetrics((prev) => {
        const next = {
          laneW,
          wheelW,
          offLeft: -wheelW,
          parkX,
          offRight: laneW,
          readoutGap: HOOD_READOUT_GAP_PX,
          isMobile,
          ...readout,
        };
        if (
          prev.laneW === next.laneW &&
          prev.wheelW === next.wheelW &&
          prev.parkX === next.parkX &&
          prev.isMobile === next.isMobile &&
          prev.readoutWidth === next.readoutWidth
        ) {
          return prev;
        }
        return next;
      });
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return metrics;
}

const CLIP_ID = 'dashboard-map-arch-clip';

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
const CATALOG_ASSESSMENT_HREF = EXTERNAL_CTA_LINKS.catalogAssessmentTool;
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

const HOOD_CHECKING_ADVANCE_MS = 600;
const HOOD_DATABASE_ICON_REVEAL_MS = 300;
const HOOD_DATABASE_ICON_REVEAL_INITIAL_MS = 120;

function HoodTypewriterText({
  text,
  onComplete,
  onTypingStart,
  charDelayMs = HOOD_TYPEWRITER_CHAR_DELAY_MS,
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

    if (text.length > 0) {
      startHoodStandardsDataProcessingBeep(
        getHoodTypewriterDurationMs(text.length, charDelayMs),
      );
    } else {
      stopHoodStandardsDataProcessingBeep();
    }

    return () => stopHoodStandardsDataProcessingBeep();
  }, [text, scrollContainerRef, charDelayMs]);

  useEffect(() => {
    if (count >= text.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        // #region agent log
        fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:HoodTypewriterText.complete',message:'Typewriter complete',data:{textLen:text.length,count},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        stopHoodStandardsDataProcessingBeep();
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
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= 0) {
      el.scrollTop = 0;
      return;
    }
    el.scrollTop = overflow;
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
  orientation = 'vertical',
  dormant = false,
  lowBattery = false,
}: {
  targetProgress: number;
  animateFill: boolean;
  showFull: boolean;
  orientation?: 'vertical' | 'horizontal' | 'horizontal-lr';
  /** Hide shell while checking — keeps layout slot without showing empty battery outline. */
  dormant?: boolean;
  /** Blinking red low-battery label when the user has no database subscriptions. */
  lowBattery?: boolean;
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
  const showLowBatteryLabel = lowBattery && fillProgress < 12;
  const isHorizontalLr = orientation === 'horizontal-lr';
  const isHorizontalRotated = orientation === 'horizontal';
  const isHorizontal = isHorizontalLr || isHorizontalRotated;
  const fillStyle = isHorizontalLr
    ? { width: `${fillProgress}%`, height: '100%' }
    : { height: `${fillProgress}%` };

  return (
    <div
      className={[
        'hood-standards-gauge',
        isHorizontalRotated ? 'hood-standards-gauge--horizontal' : '',
        isHorizontalLr ? 'hood-standards-gauge--horizontal-lr' : '',
        dormant ? 'hood-standards-gauge--dormant' : '',
        showLowBatteryLabel ? 'hood-standards-gauge--low-battery' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={
        showLowBatteryLabel
          ? 'Low battery — no database subscriptions'
          : fillProgress > 0
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
            style={fillStyle}
          >
            {labelPct >= 12 && !showLowBatteryLabel && (
              <span className="hood-standards-gauge__label">{labelPct}%</span>
            )}
          </div>
          {showLowBatteryLabel ? (
            <span
              className={[
                'hood-standards-gauge__label',
                'hood-standards-gauge__label--low-battery',
                'hood-standards-gauge__label--low-battery-well',
                isHorizontal
                  ? 'hood-standards-gauge__label--low-battery-inline'
                  : 'hood-standards-gauge__label--low-battery-stacked',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isHorizontal ? (
                'Low Battery'
              ) : (
                <>
                  <span>Low</span>
                  <span>Battery</span>
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HoodStandardsProtocolLogos({
  protocolLogos,
  showLogos = true,
  hideLabel = false,
  layout = 'stack',
}: {
  protocolLogos: StandardsProtocolLogo[];
  showLogos?: boolean;
  hideLabel?: boolean;
  layout?: 'stack' | 'pair';
}) {
  return (
    <div
      className={[
        'hood-standards-popup__protocol-block',
        layout === 'pair' ? 'hood-standards-popup__protocol-block--pair' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!hideLabel ? (
        <span className="hood-standards-popup__protocol-label">Subscriptions</span>
      ) : null}
      <div
        className={[
          'hood-standards-popup__protocol-row',
          layout === 'pair' ? 'hood-standards-popup__protocol-row--pair' : '',
          showLogos ? '' : 'hood-standards-popup__protocol-row--empty',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={showLogos ? 'ACES and PIES access' : undefined}
        aria-hidden={showLogos ? undefined : true}
      >
        {showLogos
          ? protocolLogos.map((logo) => (
              <div
                key={logo.id}
                className={[
                  'hood-standards-protocol-logo',
                  logo.active
                    ? 'hood-standards-protocol-logo--active'
                    : 'hood-standards-protocol-logo--inactive',
                ].join(' ')}
              >
                <img
                  className="hood-standards-protocol-logo__image"
                  src={logo.src}
                  alt={logo.label}
                  title={`${logo.label}${logo.active ? ' access' : ' — no subscription'}`}
                  draggable={false}
                />
                {!logo.active && (
                  <span className="hood-standards-protocol-logo__x" aria-hidden>
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M5 5L19 19" />
                      <path d="M19 5L5 19" />
                    </svg>
                  </span>
                )}
              </div>
            ))
          : null}
      </div>
    </div>
  );
}

function HoodStandardsDatabaseAccess({
  icons,
  layout = 'row',
  visibleCount,
}: {
  icons: ReturnType<typeof getHoodStandardsMessages>['databaseAccessIcons'];
  layout?: 'row' | 'grid' | 'stack';
  /** When set, logos appear one-by-one up to this count (stack layout reserves all slots). */
  visibleCount?: number;
}) {
  if (icons.length === 0) return null;

  const revealAll = visibleCount === undefined;
  const revealedCount = revealAll ? icons.length : Math.min(visibleCount, icons.length);

  if (layout === 'grid') {
    return (
      <div className="hood-standards-popup__database-panel">
        <span className="hood-standards-popup__database-label">Database Access:</span>
        <div className="hood-standards-popup__database-grid" aria-label="Database access">
          {icons.map((icon) => (
            <img
              key={icon.id}
              className="hood-standards-popup__database-grid-icon"
              src={icon.src}
              alt={icon.label}
              title={icon.label}
              draggable={false}
            />
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'stack') {
    return (
      <div className="hood-standards-popup__database-panel hood-standards-popup__database-panel--copy">
        <span className="hood-standards-popup__database-label">Database Access:</span>
        <div className="hood-standards-popup__nav-icons hood-standards-popup__nav-icons--copy" aria-label="Database access">
          {icons.map((icon, iconIndex) => (
            <img
              key={icon.id}
              className={[
                'hood-standards-popup__nav-icon',
                'hood-standards-popup__nav-icon--copy',
                iconIndex < revealedCount
                  ? 'hood-standards-popup__nav-icon--revealed'
                  : 'hood-standards-popup__nav-icon--pending',
              ].join(' ')}
              src={icon.src}
              alt={icon.label}
              title={icon.label}
              draggable={false}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hood-standards-popup__database-row">
      <span className="hood-standards-popup__database-label">Database Access:</span>
      <div className="hood-standards-popup__nav-icons" aria-hidden>
        {icons.map((icon) => (
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
  );
}

function HoodStandardsPopup({
  index,
  onTypeComplete,
  onBack,
  onNext,
  nextDisabled = false,
  showNavButtons = false,
  hoodMessages,
  isMobileViewport = false,
  mobileSubscribedSlide = 0,
}: {
  index: number;
  onTypeComplete?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  showNavButtons?: boolean;
  hoodMessages: ReturnType<typeof getHoodStandardsMessages>;
  isMobileViewport?: boolean;
  mobileSubscribedSlide?: 0 | 1;
}) {
  const textAreaRef = useRef<HTMLDivElement>(null);
  const isMissing = index === HOOD_MISSING_POPUP_INDEX;
  const databaseAccessIcons = hoodMessages.databaseAccessIcons;
  const protocolLogos = hoodMessages.protocolLogos;
  const showProtocolLogos = index >= HOOD_SUBSCRIBED_POPUP_INDEX;
  const showProtocolColumn = index >= HOOD_CHECKING_POPUP_INDEX;
  const [gaugeFillStarted, setGaugeFillStarted] = useState(false);
  const [databaseRevealActive, setDatabaseRevealActive] = useState(false);
  const [databaseVisibleCount, setDatabaseVisibleCount] = useState(0);
  const gaugeTarget =
    index === HOOD_CHECKING_POPUP_INDEX ? 0 : hoodMessages.subscribedPct;
  const gaugeAnimateFill =
    index === HOOD_SUBSCRIBED_POPUP_INDEX && gaugeFillStarted;
  const gaugeShowFull = index > HOOD_SUBSCRIBED_POPUP_INDEX;
  const isSubscribedMobileFlow =
    isMobileViewport && index === HOOD_SUBSCRIBED_POPUP_INDEX;
  const showMobileMetricsLayout =
    isMobileViewport &&
    (index === HOOD_CHECKING_POPUP_INDEX ||
      (index === HOOD_SUBSCRIBED_POPUP_INDEX && mobileSubscribedSlide === 0));
  const showMobileDatabaseSlide = isSubscribedMobileFlow && mobileSubscribedSlide === 1;
  const message = showMobileDatabaseSlide
    ? hoodMessages.subscribedDatabase
    : getHoodPopupMessage(index, hoodMessages);
  const textSlideKey = isSubscribedMobileFlow
    ? `subscribed-mobile-${mobileSubscribedSlide}`
    : String(index);
  const showDatabasePanel =
    databaseAccessIcons.length > 0 &&
    (!isSubscribedMobileFlow || showMobileDatabaseSlide);
  const hasNoSubscriptions = hoodMessages.subscribedPct === 0;
  const useCatalogAssessmentCta = hasNoSubscriptions;
  const hasNoDatabaseAccess = databaseAccessIcons.length === 0;
  const gaugeOrientation =
    showMobileMetricsLayout && !hasNoSubscriptions
      ? ('horizontal-lr' as const)
      : ('vertical' as const);
  const embedProtocolLogosInGauge =
    showMobileMetricsLayout && gaugeOrientation === 'vertical';

  useEffect(() => {
    setGaugeFillStarted(false);
  }, [index]);

  useEffect(() => {
    if (!isSubscribedMobileFlow) return;
    if (showMobileDatabaseSlide && databaseAccessIcons.length > 0) {
      setDatabaseRevealActive(true);
      setDatabaseVisibleCount(0);
      return;
    }
    if (showMobileMetricsLayout) {
      setDatabaseRevealActive(false);
      setDatabaseVisibleCount(0);
    }
  }, [
    isSubscribedMobileFlow,
    showMobileDatabaseSlide,
    showMobileMetricsLayout,
    databaseAccessIcons.length,
  ]);

  useEffect(() => {
    if (!databaseRevealActive) return;
    if (databaseVisibleCount >= databaseAccessIcons.length) return;
    const delay =
      databaseVisibleCount === 0
        ? HOOD_DATABASE_ICON_REVEAL_INITIAL_MS
        : HOOD_DATABASE_ICON_REVEAL_MS;
    const timer = window.setTimeout(() => {
      setDatabaseVisibleCount((count) => count + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [databaseRevealActive, databaseVisibleCount, databaseAccessIcons.length]);

  useEffect(() => {
    if (index < HOOD_VIP_POPUP_INDEX || databaseAccessIcons.length === 0) return;
    if (isSubscribedMobileFlow) return;
    setDatabaseRevealActive(true);
    setDatabaseVisibleCount(databaseAccessIcons.length);
  }, [index, databaseAccessIcons.length, isSubscribedMobileFlow]);

  const handleGaugeTypingStart = useCallback(() => {
    if (index === HOOD_SUBSCRIBED_POPUP_INDEX) {
      setGaugeFillStarted(true);
    }
  }, [index]);

  const handleTypingStart = useCallback(() => {
    handleGaugeTypingStart();
    if (databaseAccessIcons.length > 0 && !isSubscribedMobileFlow) {
      setDatabaseRevealActive(true);
    }
  }, [handleGaugeTypingStart, databaseAccessIcons.length, isSubscribedMobileFlow]);

  const handleTypeComplete = useCallback(() => {
    onTypeComplete?.();
  }, [onTypeComplete]);

  const handleBackClick = useCallback(() => {
    playHoodStandardsBackClickSound();
    if (index === HOOD_SUBSCRIBED_POPUP_INDEX) {
      const durationMs = getHoodTypewriterDurationMs(message.length);
      window.setTimeout(() => {
        startHoodStandardsDataProcessingBeep(durationMs);
      }, 0);
    }
    onBack?.();
  }, [index, message.length, onBack]);

  const handleNextClick = useCallback(() => {
    playHoodStandardsForwardClickSound();
    onNext?.();
  }, [onNext]);

  const handleCtaClick = useCallback(() => {
    playHoodStandardsForwardClickSound();
  }, []);

  return (
    <motion.div
      className="hood-standards-popup-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className={[
          'hood-standards-popup',
          showMobileMetricsLayout ? 'hood-standards-popup--mobile-metrics' : '',
          showMobileDatabaseSlide ? 'hood-standards-popup--mobile-database' : '',
          hasNoDatabaseAccess ? 'hood-standards-popup--no-databases' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="status"
        aria-live="polite"
      >
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
              <div className="hood-standards-popup__main">
                <div className="hood-standards-popup__metrics-column">
                  {showProtocolColumn && !embedProtocolLogosInGauge ? (
                    <HoodStandardsProtocolLogos
                      protocolLogos={protocolLogos}
                      showLogos={showProtocolLogos}
                      hideLabel={index === HOOD_CHECKING_POPUP_INDEX}
                      layout={showMobileMetricsLayout ? 'pair' : 'stack'}
                    />
                  ) : null}
                  <div
                    className={[
                      'hood-standards-popup__gauge-column',
                      embedProtocolLogosInGauge
                        ? 'hood-standards-popup__gauge-column--with-logos'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {embedProtocolLogosInGauge && showProtocolColumn ? (
                      <HoodStandardsProtocolLogos
                        protocolLogos={protocolLogos}
                        showLogos={showProtocolLogos}
                        hideLabel={index === HOOD_CHECKING_POPUP_INDEX}
                        layout="stack"
                      />
                    ) : null}
                    <HoodStandardsGauge
                      targetProgress={gaugeTarget}
                      animateFill={gaugeAnimateFill}
                      showFull={gaugeShowFull}
                      orientation={gaugeOrientation}
                      dormant={index === HOOD_CHECKING_POPUP_INDEX}
                      lowBattery={hasNoSubscriptions && index >= HOOD_SUBSCRIBED_POPUP_INDEX}
                    />
                  </div>
                </div>
                <div className="hood-standards-popup__copy-column">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={textSlideKey}
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
                        onTypingStart={handleTypingStart}
                        scrollContainerRef={textAreaRef}
                        showCursorAfterComplete={showNavButtons}
                      />
                    </motion.div>
                  </AnimatePresence>
                  {showDatabasePanel ? (
                    <HoodStandardsDatabaseAccess
                      icons={databaseAccessIcons}
                      layout="stack"
                      visibleCount={databaseVisibleCount}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {showNavButtons && (
            <div className="hood-standards-device__controls">
              <button
                type="button"
                className="hood-standards-device__btn hood-standards-device__btn--back"
                onClick={handleBackClick}
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
                    onClick={handleCtaClick}
                  >
                    SEE ALL SUBSCRIPTIONS
                  </a>
                ) : (
                  <a
                    href={EXPLORE_VIP_HREF}
                    className="hood-standards-device__btn hood-standards-device__btn--cta"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCtaClick}
                  >
                    EXPLORE VIP
                  </a>
                )}
                <a
                  href={useCatalogAssessmentCta ? CATALOG_ASSESSMENT_HREF : SEE_LATEST_RELEASES_HREF}
                  className="hood-standards-device__btn hood-standards-device__btn--cta"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCtaClick}
                >
                  {useCatalogAssessmentCta ? 'CATALOG ASSESSMENT TOOL' : 'SEE LATEST RELEASES'}
                </a>
              </div>
              <button
                type="button"
                className="hood-standards-device__btn hood-standards-device__btn--next"
                onClick={handleNextClick}
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

type TireIntroStep = 'ground' | 'wheel' | 'counter' | 'done';
type TireIntroMode = 'full' | 'ground-only' | 'content-only' | 'none';

type HoodCrossfadeStep =
  | 'idle'
  | 'standards-fade-to-black'
  | 'tire-ground-rise'
  | 'tire-content-in'
  | 'tire-content-fade-out'
  | 'tire-ground-drop'
  | 'standards-reveal';
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
  protocolLogos,
  className,
  animateOnMount = true,
}: {
  subscribedPct: number;
  databaseAccessIcons: ReturnType<typeof getHoodStandardsMessages>['databaseAccessIcons'];
  protocolLogos: ReturnType<typeof getHoodStandardsMessages>['protocolLogos'];
  className?: string;
  animateOnMount?: boolean;
}) {
  const isMobile = useMobileViewport();
  const [gaugeFillStarted, setGaugeFillStarted] = useState(false);
  const hasNoSubscriptions = subscribedPct === 0;
  const gaugeOrientation =
    isMobile && !hasNoSubscriptions
      ? ('horizontal-lr' as const)
      : ('vertical' as const);

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
      className={[
        'hood-standards-popup',
        'hood-standards-summary',
        hasNoSubscriptions ? 'hood-standards-summary--no-subscriptions' : '',
        className,
      ]
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
            <div className="hood-standards-popup__main hood-standards-popup__main--summary">
              <div
                className={[
                  'hood-standards-popup__metrics-column',
                  'hood-standards-popup__metrics-column--stacked',
                  hasNoSubscriptions
                    ? 'hood-standards-popup__metrics-column--no-subscriptions'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="hood-standards-popup__subscription-stack">
                  <span className="hood-standards-popup__protocol-label hood-standards-popup__protocol-label--summary-head">
                    Subscriptions
                  </span>
                  <div className="hood-standards-popup__gauge-column">
                    <HoodStandardsGauge
                      targetProgress={subscribedPct}
                      animateFill={gaugeFillStarted}
                      showFull={!animateOnMount}
                      orientation={gaugeOrientation}
                      lowBattery={subscribedPct === 0}
                    />
                  </div>
                </div>
                <HoodStandardsProtocolLogos
                  protocolLogos={protocolLogos}
                  hideLabel
                  layout={hasNoSubscriptions ? 'stack' : 'pair'}
                />
              </div>
              <HoodStandardsDatabaseAccess icons={databaseAccessIcons} layout="grid" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HOOD_TABLET_TIRE_ROLL_EASE = [0.22, 1, 0.36, 1] as const;

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

type MobileTabletTireRollMode = 'hidden' | 'enter' | 'parked' | 'exit';

function measureMobileTabletTireTravelX(node: HTMLElement): number {
  const stageWidth = node.clientWidth;
  if (stageWidth <= 0) return 140;

  const hub = node.closest('.hood-tire-hub');
  const tireSizeRaw = hub
    ? getComputedStyle(hub).getPropertyValue('--hood-mobile-tablet-tire-size').trim()
    : '';
  const tireSize = parseFloat(tireSizeRaw) || HOOD_MOBILE_TABLET_TIRE_MAX_PX;
  return Math.round(stageWidth / 2 + tireSize / 2);
}

function HoodMobileTabletTire({
  tirePhase,
  rollMode,
  onRollComplete,
}: {
  tirePhase: TirePhase;
  rollMode: MobileTabletTireRollMode;
  onRollComplete?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const enterReportedRef = useRef(false);
  const rollTravelXRef = useRef(140);
  const [travelX, setTravelX] = useState(140);
  const [rollReady, setRollReady] = useState(rollMode !== 'enter');
  const duration = HOOD_WHEEL_ROLL_IN_MS / 1000;
  const rollTransition = { duration, ease: HOOD_TABLET_TIRE_ROLL_EASE };
  /** Keep roll-in rotation when parked — resetting 720→0 replays a visible spin. */
  const parkedRotate = HOOD_WHEEL_ROLL_SPIN;

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const measure = () => {
      const nextTravelX = measureMobileTabletTireTravelX(node);
      if (nextTravelX <= 0) return;
      rollTravelXRef.current = nextTravelX;
      if (rollMode !== 'enter' || enterReportedRef.current) {
        setTravelX(nextTravelX);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [rollMode, tirePhase]);

  useLayoutEffect(() => {
    if (rollMode !== 'enter') {
      setRollReady(true);
      return;
    }
    enterReportedRef.current = false;
    const node = stageRef.current;
    if (!node) {
      setRollReady(false);
      return;
    }
    const nextTravelX = measureMobileTabletTireTravelX(node);
    rollTravelXRef.current = nextTravelX;
    setTravelX(nextTravelX);
    setRollReady(nextTravelX > 0);
  }, [rollMode, tirePhase]);

  if (rollMode === 'hidden') {
    return (
      <div
        ref={stageRef}
        className="hood-tire-hub__mobile-tire-stage hood-tire-hub__mobile-tire-stage--viewport"
        aria-hidden
      />
    );
  }

  const isActiveRoll = rollMode === 'enter' || rollMode === 'exit';

  return (
    <div
      ref={stageRef}
      className="hood-tire-hub__mobile-tire-stage hood-tire-hub__mobile-tire-stage--viewport"
      aria-hidden
    >
      {rollReady ? (
        <motion.div
          key={tirePhase}
          className="hood-tire-hub__mobile-tire-roll-wrap"
          style={{ transformOrigin: '50% 50%' }}
          initial={
            rollMode === 'enter'
              ? { x: -travelX, rotate: 0 }
              : rollMode === 'exit'
                ? { x: 0, rotate: parkedRotate }
                : false
          }
          animate={
            isActiveRoll
              ? rollMode === 'enter'
                ? { x: 0, rotate: parkedRotate }
                : { x: travelX, rotate: parkedRotate * 2 }
              : { x: 0, rotate: parkedRotate }
          }
          transition={
            isActiveRoll
              ? rollTransition
              : { duration: 0, x: { duration: 0 }, rotate: { duration: 0 } }
          }
          onAnimationComplete={() => {
            if (rollMode === 'enter') {
              if (enterReportedRef.current) return;
              enterReportedRef.current = true;
              onRollComplete?.();
              return;
            }
            if (rollMode === 'exit') {
              onRollComplete?.();
            }
          }}
        >
          <img
            src={TIRE_WHEEL_IMAGES[tirePhase]}
            alt=""
            className="hood-tire-hub__pressure-gauge-tire"
            draggable={false}
          />
        </motion.div>
      ) : null}
    </div>
  );
}

type ReadoutPhase = 'idle' | 'counting' | 'secondary' | 'tire-exit' | 'cta';

const readoutMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
};

function HoodTireReadoutNav({
  onBack,
  onNext,
  nextDisabled,
  reserved = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  /** Occupies nav slot without interaction while stats count up. */
  reserved?: boolean;
}) {
  if (reserved) {
    return (
      <div className="hood-tire-hub__screen-nav hood-tire-hub__screen-nav--reserved" aria-hidden>
        <button type="button" className="hood-tire-hub__btn hood-tire-hub__btn--back" tabIndex={-1} disabled>
          Back
        </button>
        <button type="button" className="hood-tire-hub__btn hood-tire-hub__btn--next" tabIndex={-1} disabled>
          Next
        </button>
      </div>
    );
  }

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
  introWheelActive = false,
  isRolling = false,
  rollTarget = null,
  onReadoutReady,
  onMobileWheelIntroComplete,
  onNavigateToTire,
  onFinishTireSequence,
  onReadoutBack,
  readoutConfig,
  report,
}: {
  tirePhase: TirePhase;
  counterActive: boolean;
  screenVisible: boolean;
  /** Mobile: show the active tire SVG in the tablet instead of the gauge Lottie. */
  tabletShowsTireArt?: boolean;
  /** Mobile first-load intro: tire roll drives scene intro timing. */
  introWheelActive?: boolean;
  isRolling?: boolean;
  rollTarget?: TireRollTarget;
  onReadoutReady?: () => void;
  onMobileWheelIntroComplete?: () => void;
  onNavigateToTire?: (target: TirePhase) => void;
  onFinishTireSequence?: () => void;
  onReadoutBack?: () => void;
  readoutConfig: TireReadoutConfig;
  report: WrappedReport;
}) {
  const [readoutPhase, setReadoutPhase] = useState<ReadoutPhase>('idle');
  const [tireRollComplete, setTireRollComplete] = useState(false);
  const onReadyRef = useRef(onReadoutReady);
  onReadyRef.current = onReadoutReady;
  const config = readoutConfig;
  const baseCtaConfig = TIRE_CTA_CONFIG[tirePhase];
  const ctaConfig =
    tirePhase === 'academy' && baseCtaConfig
      ? {
          ...baseCtaConfig,
          message: getAcademyCtaMessage(report.products.academyUsers),
        }
      : baseCtaConfig;
  const hasCta = tireHasCta(tirePhase);
  const showCta = readoutPhase === 'cta' && ctaConfig;
  const showMobileGaugeSlot = tabletShowsTireArt && screenVisible;

  const mobileTireRollMode: MobileTabletTireRollMode = (() => {
    if (!tabletShowsTireArt) return 'parked';
    if (isRolling) return 'hidden';
    if (readoutPhase === 'tire-exit') return 'exit';
    if (!tireRollComplete) return 'enter';
    return 'parked';
  })();

  const handleMobileTireRollComplete = useCallback(() => {
    setTireRollComplete(true);
    if (introWheelActive) {
      onMobileWheelIntroComplete?.();
    }
  }, [introWheelActive, onMobileWheelIntroComplete]);

  const handleMobileTireExitComplete = useCallback(() => {
    setReadoutPhase('cta');
  }, []);

  useEffect(() => {
    setReadoutPhase('idle');
    if (!counterActive) return;
    if (tabletShowsTireArt && !tireRollComplete) return;

    const timers = [
      setTimeout(() => setReadoutPhase('counting'), 80),
      setTimeout(() => {
        setReadoutPhase('secondary');
        if (!hasCta) onReadyRef.current?.();
      }, HOOD_COUNTER_COUNT_MS + 200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [tirePhase, counterActive, hasCta, tabletShowsTireArt, tireRollComplete]);

  useEffect(() => {
    setTireRollComplete(false);
    setReadoutPhase('idle');
  }, [tirePhase]);

  useEffect(() => {
    if (!tabletShowsTireArt || !isRolling) return;
    setTireRollComplete(false);
    setReadoutPhase('idle');
  }, [isRolling, tabletShowsTireArt]);

  useEffect(() => {
    if (readoutPhase === 'cta' && hasCta) onReadyRef.current?.();
  }, [readoutPhase, hasCta]);

  const counting =
    readoutPhase === 'counting' ||
    readoutPhase === 'secondary' ||
    readoutPhase === 'tire-exit' ||
    (readoutPhase === 'cta' && hasCta);
  const showDesktopGauge =
    readoutPhase === 'counting' || readoutPhase === 'secondary' || readoutPhase === 'cta';
  const showGaugeSlot = tabletShowsTireArt ? showMobileGaugeSlot : showDesktopGauge;
  const showPressureGauge = showDesktopGauge;
  const showFactbookCtaArt = showCta && tirePhase === 'factbook';
  const showTrendlensCtaArt = showCta && tirePhase === 'trendlens';
  const showDemandIndexCtaList = showCta && tirePhase === 'demandindex';
  const showAcademyCtaList = showCta && tirePhase === 'academy';
  const showCtaListVisual = showDemandIndexCtaList || showAcademyCtaList;
  const showCtaGaugeVisual =
    showFactbookCtaArt || showTrendlensCtaArt || showCtaListVisual;
  const gaugeCheckVariant = config.primaryValue === 0 ? 'fail' : 'success';
  const showStatsCheck =
    !showCtaGaugeVisual &&
    ((tabletShowsTireArt &&
      (readoutPhase === 'secondary' || readoutPhase === 'tire-exit')) ||
      (!tabletShowsTireArt &&
        (readoutPhase === 'secondary' || readoutPhase === 'cta')));
  const readoutInteractive = readoutPhase === 'secondary' || readoutPhase === 'cta';
  const showStatsSlide =
    (tabletShowsTireArt ? showMobileGaugeSlot : showPressureGauge) && !showCta;
  const showReadoutFooter =
    readoutInteractive || (showStatsSlide && readoutPhase !== 'idle');
  const nextTirePhase = getNextTirePhaseForReport(tirePhase, report);

  const handleCtaNext = () => {
    const target = ctaConfig?.nextTarget;
    if (target) onNavigateToTire?.(target);
    else onFinishTireSequence?.();
  };

  const handleStatsNext = () => {
    if (hasCta) {
      if (tabletShowsTireArt) {
        setReadoutPhase('tire-exit');
        return;
      }
      setReadoutPhase('cta');
      return;
    }
    if (nextTirePhase) onNavigateToTire?.(nextTirePhase);
    else onFinishTireSequence?.();
  };

  const showStatsContent =
    (readoutPhase !== 'idle' || (tabletShowsTireArt && showStatsSlide)) && !showCta;
  const statsContentReserved = tabletShowsTireArt && showStatsSlide && readoutPhase === 'idle';

  return (
    <motion.div
      className={`hood-tire-hub__screen${readoutInteractive ? ' hood-tire-hub__screen--interactive' : ''}`}
      initial={tabletShowsTireArt ? false : { opacity: 0 }}
      animate={{ opacity: screenVisible ? 1 : 0 }}
      transition={{ duration: tabletShowsTireArt ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className="hood-tire-hub__screen-bezel">
        <div
          className={
            showGaugeSlot
              ? `hood-tire-hub__screen-glass hood-tire-hub__screen-glass--with-gauge${
                  showStatsSlide ? ' hood-tire-hub__screen-glass--stats-slide' : ''
                }${
                  showReadoutFooter ? ' hood-tire-hub__screen-glass--with-nav' : ''
                }${showCta ? ' hood-tire-hub__screen-glass--cta-slide' : ''}`
              : 'hood-tire-hub__screen-glass'
          }
        >
          <AnimatePresence>
            {showStatsCheck ? (
              <motion.div
                key="screen-check"
                className="hood-tire-hub__screen-check"
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
          {showGaugeSlot && (
            <div
              className={`hood-tire-hub__pressure-gauge${
                showCtaGaugeVisual
                  ? ' hood-tire-hub__pressure-gauge--cta-slot'
                  : tabletShowsTireArt
                    ? ' hood-tire-hub__pressure-gauge--tire-art'
                    : ''
              }${showCtaListVisual ? ' hood-tire-hub__pressure-gauge--product-list' : ''}`}
              aria-hidden={showCtaListVisual ? undefined : true}
            >
              {showFactbookCtaArt ? (
                <img
                  src={factbookTizraTileImage}
                  alt=""
                  className="hood-tire-hub__pressure-gauge-cta-art"
                  draggable={false}
                />
              ) : showTrendlensCtaArt ? (
                <img
                  src={trendlensLogoImage}
                  alt=""
                  className="hood-tire-hub__pressure-gauge-cta-art"
                  draggable={false}
                />
              ) : showDemandIndexCtaList ? (
                <HoodDemandIndexProductListScroll
                  active={showDemandIndexCtaList && screenVisible}
                />
              ) : showAcademyCtaList ? (
                <HoodAcademyCourseList />
              ) : tabletShowsTireArt ? (
                <HoodMobileTabletTire
                  tirePhase={tirePhase}
                  rollMode={mobileTireRollMode}
                  onRollComplete={
                    mobileTireRollMode === 'exit'
                      ? handleMobileTireExitComplete
                      : handleMobileTireRollComplete
                  }
                />
              ) : (
                <LazyLottie
                  key={tirePhase}
                  loadAnimation={loadTireGaugeAnimation}
                  active={showGaugeSlot && screenVisible}
                  loop={false}
                  autoplay
                  className="hood-tire-hub__pressure-gauge-lottie"
                  rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                />
              )}
            </div>
          )}
          {showStatsContent ? (
            <div
              className={`hood-tire-hub__screen-content${
                statsContentReserved ? ' hood-tire-hub__screen-content--reserved' : ''
              }`}
              aria-hidden={statsContentReserved}
            >
              <div className="hood-tire-hub__results">
                <div className="hood-tire-hub__stat-block">
                  <p className="hood-tire-hub__line hood-tire-hub__line--primary">
                    <span className="hood-tire-hub__stat-value">
                      {statsContentReserved ? (
                        <span aria-hidden>&nbsp;</span>
                      ) : (
                        <HoodCountUp value={config.primaryValue} active={counting} />
                      )}
                    </span>
                  </p>
                  <p className="hood-tire-hub__line hood-tire-hub__stat-label">
                    {statsContentReserved ? <span aria-hidden>&nbsp;</span> : config.primaryLabel}
                  </p>
                </div>
                {readoutPhase === 'counting' ? (
                  <p
                    className="hood-tire-hub__line hood-tire-hub__line--secondary hood-tire-hub__line--secondary--reserved"
                    aria-hidden
                  >
                    &nbsp;
                  </p>
                ) : readoutPhase === 'secondary' || readoutPhase === 'tire-exit' ? (
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
                ) : null}
              </div>
            </div>
          ) : null}
          {readoutInteractive ? (
            <div className="hood-tire-hub__screen-footer">
              {showCta && ctaConfig ? (
                <motion.p className="hood-tire-hub__line hood-tire-hub__line--momentum" {...readoutMotion}>
                  {ctaConfig.message}
                </motion.p>
              ) : null}
              {showCta && ctaConfig ? (
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
              ) : null}
              <HoodTireReadoutNav
                onBack={
                  showCta
                    ? () => setReadoutPhase('secondary')
                    : () => onReadoutBack?.()
                }
                onNext={showCta ? handleCtaNext : handleStatsNext}
                nextDisabled={
                  showCta
                    ? !ctaConfig?.nextTarget && !onFinishTireSequence
                    : !hasCta && !nextTirePhase && !onFinishTireSequence
                }
              />
            </div>
          ) : showStatsSlide ? (
            <div className="hood-tire-hub__screen-footer hood-tire-hub__screen-footer--reserved">
              <HoodTireReadoutNav
                onBack={() => onReadoutBack?.()}
                onNext={handleStatsNext}
                reserved
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function HoodTireHubScene({
  phase,
  isRolling,
  rollTarget,
  introMode = 'full',
  slideGroundOut = false,
  contentFadeOut = false,
  completedTires,
  onIntroComplete,
  onGroundRiseComplete,
  onContentFadeComplete,
  onGroundExitComplete,
  onReadoutReady,
  onNavigateToTire,
  onFinishTireSequence,
  onReadoutBack,
  tireReadoutConfig,
  report,
}: {
  phase: TirePhase;
  isRolling: boolean;
  rollTarget: TireRollTarget;
  introMode?: TireIntroMode;
  slideGroundOut?: boolean;
  contentFadeOut?: boolean;
  completedTires: ReadonlySet<TirePhase>;
  onIntroComplete: () => void;
  onGroundRiseComplete?: () => void;
  onContentFadeComplete?: () => void;
  onGroundExitComplete?: () => void;
  onReadoutReady: () => void;
  onNavigateToTire: (target: TirePhase) => void;
  onFinishTireSequence?: () => void;
  onReadoutBack?: () => void;
  tireReadoutConfig: Record<TirePhase, TireReadoutConfig>;
  report: WrappedReport;
}) {
  const [introStep, setIntroStep] = useState<TireIntroStep>(
    introMode === 'none' ? 'done' : introMode === 'content-only' ? 'wheel' : 'ground',
  );
  const groundRiseReportedRef = useRef(false);
  const groundExitReportedRef = useRef(false);
  const contentFadeReportedRef = useRef(false);
  const mobileIntroCompleteRef = useRef(false);
  const onIntroCompleteRef = useRef(onIntroComplete);
  onIntroCompleteRef.current = onIntroComplete;
  const {
    laneW,
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
  const introWheelRolling = introMode !== 'none' && introStep === 'wheel';
  const parked = !isRolling && introStep !== 'ground' && introStep !== 'wheel';
  const rolling = introWheelRolling || swapping;
  const playGroundIntro = introMode === 'full' || introMode === 'ground-only';
  const mobileTabletIntro =
    isMobile && (introMode === 'content-only' || introMode === 'full');
  const introWheelActive =
    mobileTabletIntro && introStep === 'wheel' && !mobileIntroCompleteRef.current;

  const finishMobileWheelIntro = useCallback(() => {
    if (mobileIntroCompleteRef.current) return;
    mobileIntroCompleteRef.current = true;
    setIntroStep('counter');
    window.setTimeout(() => {
      setIntroStep('done');
      onIntroCompleteRef.current();
    }, 80);
  }, []);

  useEffect(() => {
    if (!slideGroundOut) {
      groundExitReportedRef.current = false;
    }
  }, [slideGroundOut]);

  useEffect(() => {
    if (!contentFadeOut) {
      contentFadeReportedRef.current = false;
    }
  }, [contentFadeOut]);

  useEffect(() => {
    if (!playGroundIntro) {
      groundRiseReportedRef.current = false;
    }
  }, [playGroundIntro]);

  useEffect(() => {
    if (slideGroundOut || contentFadeOut) return;
    if (introMode === 'none') {
      mobileIntroCompleteRef.current = false;
      setIntroStep('done');
      return;
    }
    if (introMode === 'ground-only') {
      mobileIntroCompleteRef.current = false;
      setIntroStep('ground');
      return;
    }
    if (introMode === 'content-only') {
      if (!mobileIntroCompleteRef.current) {
        setIntroStep('wheel');
      }
      if (isMobile) {
        return;
      }
      const timers = [
        setTimeout(() => setIntroStep('counter'), HOOD_WHEEL_ROLL_IN_MS),
        setTimeout(() => {
          setIntroStep('done');
          onIntroCompleteRef.current();
        }, HOOD_WHEEL_ROLL_IN_MS + 80),
      ];
      return () => timers.forEach(clearTimeout);
    }
    mobileIntroCompleteRef.current = false;
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
          onIntroCompleteRef.current();
        },
        HOOD_GROUND_RISE_MS + HOOD_WHEEL_ROLL_IN_MS + 80,
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introMode, slideGroundOut, contentFadeOut, isMobile]);

  const rollDuration =
    introWheelRolling ? HOOD_WHEEL_ROLL_IN_MS / 1000 : TIRE_ROLL_MS / 1000;
  const rollEase = [0.45, 0, 0.2, 1] as const;

  const hubStyle = {
    '--hood-wheel-park-x': `${parkX}px`,
    '--hood-wheel-half': `${wheelW / 2}px`,
    '--hood-readout-width': `${readoutWidth}px`,
    '--hood-readout-bezel-height': `${readoutBezelHeight + (isMobile ? HOOD_MOBILE_READOUT_EXTRA_HEIGHT_PX : 0)}px`,
    '--hood-readout-glass-height': `${readoutGlassHeight}px`,
    '--hood-readout-gauge-slot': `${readoutGaugeSlot}px`,
    '--hood-readout-content-min-height': `${readoutContentMin}px`,
    '--hood-readout-content-height': `${readoutContentHeight}px`,
    '--hood-readout-screen-padding': `${readoutScreenPadding}px`,
    '--hood-readout-bezel-padding': readoutBezelPadding,
    '--hood-readout-gap': `${readoutGap}px`,
    ...(isMobile
      ? {
          '--hood-readout-width': '100%',
          '--hood-mobile-tablet-vertical-pad': `${HOOD_MOBILE_TABLET_VERTICAL_PAD_PX}px`,
          '--hood-mobile-tire-tablet-gap': `${HOOD_MOBILE_TIRE_TABLET_GAP_PX}px`,
          '--hood-mobile-tire-lane-h': `${Math.min(Math.round(laneW * HOOD_MOBILE_TIRE_LANE_VW_RATIO), HOOD_MOBILE_TIRE_LANE_MAX_PX)}px`,
          '--hood-mobile-tablet-tire-size': `${Math.min(Math.round(laneW * HOOD_MOBILE_TABLET_TIRE_VW_RATIO), HOOD_MOBILE_TABLET_TIRE_MAX_PX)}px`,
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      className={`hood-tire-hub${isMobile ? ' hood-tire-hub--mobile-stack' : ''}`}
      style={hubStyle}
    >
      <div className="hood-tire-hub__black" aria-hidden />
      <motion.div
        key={slideGroundOut ? 'hood-ground-exit' : 'hood-ground-idle'}
        className="hood-tire-hub__arch-wrap"
        initial={{
          y: slideGroundOut ? '0%' : playGroundIntro ? '100%' : '0%',
        }}
        animate={{ y: slideGroundOut ? '100%' : '0%' }}
        transition={{
          duration:
            slideGroundOut || playGroundIntro
              ? HOOD_GROUND_RISE_MS / 1000
              : 0,
          ease: [0.4, 0, 0.2, 1],
        }}
        onAnimationComplete={() => {
          if (slideGroundOut) {
            if (groundExitReportedRef.current) return;
            groundExitReportedRef.current = true;
            onGroundExitComplete?.();
            return;
          }
          if (introMode === 'ground-only' && !groundRiseReportedRef.current) {
            groundRiseReportedRef.current = true;
            onGroundRiseComplete?.();
          }
        }}
      >
        <HoodTireBaseArch />
      </motion.div>
      <div className="hood-tire-hub__sky-bg" aria-hidden>
        <LazyLottie
          loadAnimation={loadWheelAlignmentAnimation}
          active={screenVisible}
          loop
          autoplay
          className="hood-tire-hub__sky-bg-player"
          rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
        />
      </div>
      <motion.div
        className="hood-tire-hub__content"
        animate={{ opacity: contentFadeOut ? 0 : 1 }}
        transition={{ duration: HOOD_TIRE_CONTENT_FADE_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={() => {
          if (!contentFadeOut || contentFadeReportedRef.current) return;
          contentFadeReportedRef.current = true;
          onContentFadeComplete?.();
        }}
      >
      <div className="hood-tire-hub__lane" aria-hidden={isMobile}>
        {!isMobile && rolling && swapping && rollTarget && (
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
        {!isMobile && rolling && (
          <motion.div
            className="hood-tire-hub__wheel-track hood-tire-hub__wheel-track--incoming"
            style={{ width: wheelW }}
            initial={{ x: offLeft, rotate: 0 }}
            animate={{ x: parkX, rotate: HOOD_WHEEL_ROLL_SPIN }}
            transition={{ duration: rollDuration, ease: rollEase }}
          >
            <HoodTireWheel tirePhase={swapping && rollTarget ? rollTarget : phase} />
          </motion.div>
        )}
        {!isMobile && parked && (
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
            introWheelActive={introWheelActive}
            isRolling={isRolling}
            rollTarget={rollTarget}
            onReadoutReady={onReadoutReady}
            onMobileWheelIntroComplete={finishMobileWheelIntro}
            onNavigateToTire={onNavigateToTire}
            onFinishTireSequence={onFinishTireSequence}
            onReadoutBack={onReadoutBack}
            readoutConfig={tireReadoutConfig[phase]}
            report={report}
          />
        </div>
      </div>
      </motion.div>
    </div>
  );
}

/**
 * Under the Hood standards — device tablet above a bottom-pinned engine Lottie backdrop.
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
  const isMobile = useMobileViewport();
  const isTireHubMobile = useTireHubMobileStack();
  const [popupIndex, setPopupIndex] = useState(HOOD_CHECKING_POPUP_INDEX);
  const skipCheckingAutoAdvanceRef = useRef(false);
  const [popupTyped, setPopupTyped] = useState(false);
  const [subscribedMobileSlide, setSubscribedMobileSlide] = useState<0 | 1>(0);

  const [tireRolling, setTireRolling] = useState(false);
  const [tireRollTarget, setTireRollTarget] = useState<TireRollTarget>(null);
  const [tireIntroComplete, setTireIntroComplete] = useState(false);
  const [completedTires, setCompletedTires] = useState<Set<TirePhase>>(() => new Set());
  const [crossStep, setCrossStep] = useState<HoodCrossfadeStep>('idle');
  const tireRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoodArchRenderCountRef = useRef(0);
  hoodArchRenderCountRef.current += 1;
  if (hoodArchRenderCountRef.current % 120 === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:DashboardHoodArch.renderStorm',message:'High render count',data:{renders:hoodArchRenderCountRef.current,hoodNavTransition,crossStep,phase,popupIndex},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{});
    // #endregion
  }

  const tirePhase = phase === 'standards' ? getInitialTirePhase(report) : phase;
  const prevTirePhase = getPrevTirePhaseForReport(tirePhase, report);

  const handleReadoutReady = useCallback(() => {
    if (isTirePhase(phase)) {
      setCompletedTires((prev) => new Set(prev).add(phase));
    }
  }, [phase]);

  const handleTireIntroComplete = useCallback(() => {
    setTireIntroComplete(true);
    if (hoodNavTransition === 'standards-to-tire') {
      setCrossStep('idle');
      onNavTransitionComplete?.();
    }
  }, [hoodNavTransition, onNavTransitionComplete]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:hoodNavTransitionEffect',message:'hoodNavTransition effect',data:{hoodNavTransition,crossStep,phase,popupIndex,popupTyped},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!hoodNavTransition) {
      setCrossStep('idle');
      return;
    }
    if (hoodNavTransition === 'standards-to-tire') {
      setCrossStep('standards-fade-to-black');
      return;
    }
    setCrossStep('tire-content-fade-out');
  }, [hoodNavTransition]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:crossStepChange',message:'crossStep changed',data:{crossStep,hoodNavTransition,phase,popupIndex,showStandardsScene:phase==='standards'||crossStep==='standards-fade-to-black',showTireScene:isTirePhase(phase)||crossStep==='tire-content-fade-out'||crossStep==='tire-ground-drop'},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [crossStep, hoodNavTransition, phase, popupIndex]);

  const rollToTirePhase = useCallback(
    (target: TirePhase) => {
      if (tireRollTimerRef.current) {
        window.clearTimeout(tireRollTimerRef.current);
      }
      setTireRollTarget(target);
      setTireRolling(true);
      tireRollTimerRef.current = window.setTimeout(() => {
        tireRollTimerRef.current = null;
        onPhaseChange(target);
        setTireRolling(false);
        setTireRollTarget(null);
      }, TIRE_ROLL_MS);
    },
    [onPhaseChange],
  );

  useEffect(() => {
    return () => {
      if (tireRollTimerRef.current) {
        window.clearTimeout(tireRollTimerRef.current);
      }
    };
  }, []);

  const beginReturnToStandards = useCallback(() => {
    setPopupIndex(HOOD_VIP_POPUP_INDEX);
    setPopupTyped(true);
    setTireIntroComplete(false);
    onRequestTireToStandardsTransition?.();
  }, [onRequestTireToStandardsTransition]);

  useEffect(() => {
    if (popupIndex !== HOOD_SUBSCRIBED_POPUP_INDEX && phase === 'standards') {
      setSubscribedMobileSlide(0);
    }
  }, [popupIndex, phase]);

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
      setPopupIndex(HOOD_VIP_POPUP_INDEX);
      return;
    }
    if (popupIndex === HOOD_VIP_POPUP_INDEX) {
      setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
      setPopupTyped(false);
      setSubscribedMobileSlide(0);
      return;
    }
    if (
      popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX &&
      isMobile &&
      subscribedMobileSlide === 1
    ) {
      setSubscribedMobileSlide(0);
      setPopupTyped(true);
      return;
    }
    if (popupIndex > HOOD_CHECKING_POPUP_INDEX) {
      setPopupIndex((i) => i - 1);
      setPopupTyped(false);
    }
  }, [phase, prevTirePhase, popupIndex, beginReturnToStandards, rollToTirePhase, isMobile, subscribedMobileSlide]);

  const handleNext = useCallback(() => {
    if (popupIndex === HOOD_CHECKING_POPUP_INDEX && popupTyped) {
      skipCheckingAutoAdvanceRef.current = true;
      setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
      setPopupTyped(false);
      return;
    }
    if (popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX) {
      if (isMobile && subscribedMobileSlide === 0) {
        setSubscribedMobileSlide(1);
        setPopupTyped(false);
        return;
      }
      if (isMobile && subscribedMobileSlide === 1) {
        setTireIntroComplete(false);
        onRequestStandardsToTireTransition?.();
        return;
      }
      setPopupIndex(HOOD_VIP_POPUP_INDEX);
      setPopupTyped(false);
      setSubscribedMobileSlide(0);
      return;
    }
    if (popupIndex === HOOD_VIP_POPUP_INDEX && popupTyped) {
      setTireIntroComplete(false);
      onRequestStandardsToTireTransition?.();
    }
  }, [popupIndex, popupTyped, onRequestStandardsToTireTransition, isMobile, subscribedMobileSlide]);

  const handlePopupTypeComplete = useCallback(() => {
    setPopupTyped(true);
  }, []);

  const handleDeviceBack = useCallback(() => {
    if (
      popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX &&
      isMobile &&
      subscribedMobileSlide === 1
    ) {
      setSubscribedMobileSlide(0);
      setPopupTyped(true);
      return;
    }
    if (popupIndex === HOOD_SUBSCRIBED_POPUP_INDEX) {
      onBackToJourney?.();
      return;
    }
    if (popupIndex === HOOD_VIP_POPUP_INDEX) {
      setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
      setPopupTyped(false);
      setSubscribedMobileSlide(0);
      return;
    }
    onBackToJourney?.();
  }, [popupIndex, isMobile, subscribedMobileSlide, onBackToJourney]);

  const showStandardsControls = phase === 'standards';
  const forwardDisabled =
    (popupIndex === HOOD_CHECKING_POPUP_INDEX && !popupTyped) ||
    (popupIndex >= HOOD_SUBSCRIBED_POPUP_INDEX && !popupTyped);

  useEffect(() => {
    if (hoodNavTransition) return;
    if (skipCheckingAutoAdvanceRef.current) return;
    if (popupIndex !== HOOD_CHECKING_POPUP_INDEX || !popupTyped) return;
    const timer = setTimeout(() => {
      setPopupIndex(HOOD_SUBSCRIBED_POPUP_INDEX);
      setPopupTyped(false);
    }, HOOD_CHECKING_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [popupIndex, popupTyped, hoodNavTransition]);

  const crossfadeTransition = {
    duration: HOOD_CROSSFADE_TO_BLACK_MS / 1000,
    ease: HOOD_ARCH_SLIDE_EASE,
  };

  const handleStandardsFadeToBlackComplete = useCallback(() => {
    onNavTransitionMidpoint?.();
    setCrossStep('tire-ground-rise');
  }, [onNavTransitionMidpoint]);

  const handleTireGroundRiseComplete = useCallback(() => {
    setCrossStep('tire-content-in');
  }, []);

  const handleTireContentFadeComplete = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:handleTireContentFadeComplete',message:'Tire content fade complete',data:{phase,crossStep,hoodNavTransition},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    setCrossStep('tire-ground-drop');
  }, [phase, crossStep, hoodNavTransition]);

  const handleTireGroundDropComplete = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:handleTireGroundDropComplete',message:'Tire ground drop complete',data:{phase,crossStep,hoodNavTransition},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    onNavTransitionMidpoint?.();
    setCrossStep('standards-reveal');
  }, [onNavTransitionMidpoint, phase, crossStep, hoodNavTransition]);

  const handleStandardsRevealComplete = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dacadc'},body:JSON.stringify({sessionId:'dacadc',location:'MapSimulation.tsx:handleStandardsRevealComplete',message:'Standards reveal complete',data:{phase,crossStep,hoodNavTransition,popupIndex,popupTyped},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setCrossStep('idle');
    onNavTransitionComplete?.();
  }, [onNavTransitionComplete, phase, crossStep, hoodNavTransition, popupIndex, popupTyped]);

  const showStandardsScene =
    phase === 'standards' || crossStep === 'standards-fade-to-black';
  const showTireScene =
    isTirePhase(phase) ||
    crossStep === 'tire-content-fade-out' ||
    crossStep === 'tire-ground-drop';
  const hideStandardsDevice = crossStep === 'standards-fade-to-black';
  const tireIntroMode: TireIntroMode =
    hoodNavTransition === 'standards-to-tire'
      ? crossStep === 'tire-ground-rise'
        ? 'ground-only'
        : crossStep === 'tire-content-in'
          ? 'content-only'
          : 'none'
      : isTireHubMobile
        ? !tireIntroComplete
          ? 'content-only'
          : 'none'
        : !tireIntroComplete
          ? 'full'
          : 'none';

  useEffect(() => {
    if (hoodNavTransition !== 'tire-to-standards') return;
    setPopupIndex(HOOD_VIP_POPUP_INDEX);
    setPopupTyped(true);
  }, [hoodNavTransition]);

  useEffect(() => {
    if (hoodNavTransition !== 'standards-to-tire') return;
    setTireIntroComplete(false);
    setTireRolling(false);
    setTireRollTarget(null);
    if (tireRollTimerRef.current) {
      window.clearTimeout(tireRollTimerRef.current);
      tireRollTimerRef.current = null;
    }
  }, [hoodNavTransition]);

  const standardsBranch = (
    <motion.div
      key="hood-standards"
      className="dashboard-hood-arch__standards"
      initial={false}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        duration: HOOD_STANDARDS_EXIT_MS / 1000,
        ease: HOOD_ARCH_SLIDE_EASE,
      }}
    >
      <div className="hood-standards-scene" aria-hidden>
        <HoodStandardsMetallicBackground />
        <div className="hood-standards-scene__content">
          <div className="hood-standards-scene__animation-slot">
            <div className="hood-standards-scene__battery-bg">
              <LazyLottie
                loadAnimation={loadCarBatteryAnimation}
                active={phase === 'standards' && crossStep === 'idle'}
                loop
                autoplay
                className="hood-standards-scene__battery-player"
                rendererSettings={{ preserveAspectRatio: 'xMidYMax meet' }}
              />
            </div>
          </div>
          {!hideStandardsDevice && (
            <div className="hood-standards-popup-anchor">
              <HoodStandardsPopup
                index={popupIndex}
                hoodMessages={hoodMessages}
                onTypeComplete={handlePopupTypeComplete}
                onBack={handleDeviceBack}
                onNext={handleNext}
                nextDisabled={forwardDisabled}
                showNavButtons={showStandardsControls}
                isMobileViewport={isMobile}
                mobileSubscribedSlide={subscribedMobileSlide}
              />
            </div>
          )}
        </div>
      </div>
      {crossStep === 'standards-fade-to-black' ? (
        <motion.div
          key="hood-crossfade-to-black"
          className="hood-crossfade__veil"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={crossfadeTransition}
          onAnimationComplete={handleStandardsFadeToBlackComplete}
          aria-hidden
        />
      ) : null}
      {crossStep === 'standards-reveal' ? (
        <motion.div
          key="hood-crossfade-reveal"
          className="hood-crossfade__veil"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={crossfadeTransition}
          onAnimationComplete={handleStandardsRevealComplete}
          aria-hidden
        />
      ) : null}
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
        introMode={tireIntroMode}
        contentFadeOut={crossStep === 'tire-content-fade-out'}
        slideGroundOut={crossStep === 'tire-ground-drop'}
        completedTires={completedTires}
        tireReadoutConfig={tireReadoutConfig}
        report={report}
        onIntroComplete={handleTireIntroComplete}
        onGroundRiseComplete={handleTireGroundRiseComplete}
        onContentFadeComplete={handleTireContentFadeComplete}
        onGroundExitComplete={handleTireGroundDropComplete}
        onReadoutReady={handleReadoutReady}
        onNavigateToTire={rollToTirePhase}
        onFinishTireSequence={onFinishTireSequence}
        onReadoutBack={handlePrev}
      />
    </motion.div>
  );

  return (
    <div className="dashboard-hood-arch" aria-hidden={false}>
      {hoodNavTransition ? (
        <>
          {showStandardsScene ? standardsBranch : null}
          {showTireScene ? tireBranch : null}
        </>
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
