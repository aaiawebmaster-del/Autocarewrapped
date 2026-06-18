import { useState, useEffect, useCallback, useRef, useLayoutEffect, Fragment, lazy, Suspense, type ReactNode } from 'react';
import { motion, AnimatePresence, LayoutGroup, animate, useMotionValue, useTransform } from 'motion/react';
import { JourneyCounterGauge } from './JourneyCounterGauge';
import { CommunityLogoGauge } from './CommunityLogoGauge';
import { LazyLottie } from './LazyLottie';
import { GpsUiControls } from './GpsUiControls';
import {
  GpsPopupContent,
  GpsAttendanceBottomBar,
  TURN_RIGHT_PATH,
} from './GpsNavPopupContent';
import {
  DashboardHoodArch,
  DashboardPanelArch,
  isTirePhase,
  type HoodNavTransition,
  type HoodPhase,
} from './MapSimulation';
import carStartSound from '../../assets/car-start-drive-off.mp3';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import { loadDrivingAnimation } from '@/lib/lazyLottieData';
import { useMobileViewport } from '@/lib/useMobileViewport';
import { DashboardPrndl } from './DashboardPrndl';
import { DashboardWideDecor } from './DashboardWideDecor';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';
import { buildJourneySections, type JourneySection } from '@/lib/buildJourneySections';
import {
  JOURNEY_CALCULATING_HOLD_MS,
  JOURNEY_NAV_MAP_ENTER_EVENT,
  JOURNEY_NAV_MAP_REPAINT_EVENT,
  JOURNEY_SCENE_SLIDE_MS,
  JOURNEY_SCENE_SLIDE_TRANSITION,
  JOURNEY_SCENE_TRANSITION,
} from '@/lib/journeySceneTiming';
import { prefersReducedMotion } from '@/lib/browserCompat';

const INTRO_WELCOME_GREETING = 'Welcome,';

const JourneyNavMapAnimation = lazy(() =>
  import('./JourneyNavMapAnimation').then((module) => ({
    default: module.JourneyNavMapAnimation,
  })),
);

const LazyFullDiagnosticsPanel = lazy(() =>
  import('./FullDiagnosticsPanel').then((module) => ({
    default: module.FullDiagnosticsPanel,
  })),
);

const STARS = Array.from({ length: 45 }, (_, i) => ({
  x: `${(i * 37 + 13) % 100}%`,
  y: `${(i * 23 + 7) % 45}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
  opacity: 0.35 + (i % 6) * 0.1,
}));

const SUN_RISE_BOTTOM_Y = 48;
const SUN_RISE_TOP_Y = -165;
const SKY_SUNRISE_DURATION_S = 20;

const FOLLOW_UP_SLIDE_TEXTS = [
  'Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.',
  'This report captures your role in that progress — the events you attended, the insights you gained, and the voices you amplified.',
  "Your engagement matters. Your impact multiplies.\n\nHere's your year with Auto Care in motion.",
];

/** Slide 0 = welcome; slides 1–3 = FOLLOW_UP_SLIDE_TEXTS */
const DRIVING_SLIDE_COUNT = 1 + FOLLOW_UP_SLIDE_TEXTS.length;
const SKY_SUNRISE_ANIMATION = { duration: SKY_SUNRISE_DURATION_S, ease: [0.35, 0, 0.25, 1] as const };
const INTRO_LAYOUT_TRANSITION = {
  duration: 1.35,
  ease: [0.22, 1, 0.36, 1] as const,
};
const INTRO_START_BUTTON_TRANSITION = {
  duration: 1.75,
  ease: [0.16, 1, 0.3, 1] as const,
};
const LICENSE_PLATE_EXIT_TRANSITION = {
  duration: 1.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

type Screen = 'journey' | 'hood' | 'diagnostics';

/** Bottom-center checkpoints (tires shares the hood screen with a different phase). */
type NavCheckpoint = 'journey' | 'hood' | 'tires' | 'diagnostics';

const NAV_ITEMS: { id: NavCheckpoint; label: string }[] = [
  { id: 'journey', label: 'Your Journey' },
  { id: 'hood', label: 'Under the Hood' },
  { id: 'tires', label: 'Kick the Tires' },
  { id: 'diagnostics', label: 'Full Diagnostics' },
];

function getActiveNavCheckpoint(
  screen: Screen | null,
  hoodPhase: HoodPhase,
): NavCheckpoint | null {
  if (!screen) return null;
  if (screen === 'hood') return isTirePhase(hoodPhase) ? 'tires' : 'hood';
  return screen;
}

const DIAGNOSTICS_TRANSITION_MS = 2000;

// ── Diagnostics handoff (after Kick the Tires) ─────────────────────────────────
function DiagnosticsTransition() {
  return (
    <motion.div
      className="diagnostics-flow diagnostics-flow--transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <p className="diagnostics-flow__message">completing your diagnostics</p>
    </motion.div>
  );
}

/** Placeholder until final scene art direction is provided */
function FinalScenePlaceholder() {
  return (
    <motion.div
      className="diagnostics-flow diagnostics-flow--final"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

// ── Full Diagnostics dashboard layout ─────────────────────────────────────────
function FullDiagnostics({
  onBackToStart,
  report,
}: {
  onBackToStart: () => void;
  report: WrappedReport;
}) {
  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Suspense fallback={null}>
        <LazyFullDiagnosticsPanel onBackToStart={onBackToStart} report={report} />
      </Suspense>
    </motion.div>
  );
}

// Left-pointing arrow from left-solid-full__1_.svg (viewBox 0 0 640 640)
const ARROW_PATH = 'M105.4 342.6C92.9 330.1 92.9 309.8 105.4 297.3L265.4 137.3C274.6 128.1 288.3 125.4 300.3 130.4C312.3 135.4 320 147.1 320 160L320 256L496 256C522.5 256 544 277.5 544 304L544 336C544 362.5 522.5 384 496 384L320 384L320 480C320 492.9 312.2 504.6 300.2 509.6C288.2 514.6 274.5 511.8 265.3 502.7L105.3 342.7z';
const ARROW_SIZE = 'clamp(28px, 3.5vw, 36px)';

function DashboardGasIcon() {
  return (
    <div className="dashboard-panel__indicator dashboard-panel__indicator--gas" aria-hidden>
      <svg viewBox="0 0 53.3783 42.6199" fill="none">
        <path d={svgPaths.p1d2c9100} fill="#F3901D" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

function DashboardTireWarningIcon() {
  return (
    <div className="dashboard-panel__indicator dashboard-panel__indicator--tire" aria-hidden>
      <svg viewBox="0 0 61 42.6612" fill="none">
        <path d={svgPaths.p3f6e2800} fill="#737373" />
      </svg>
    </div>
  );
}

function StartButton({
  onClick,
  inactive = false,
  reportYear,
}: {
  onClick?: () => void;
  inactive?: boolean;
  reportYear: number;
}) {
  return (
    <button
      type="button"
      className={[
        'landing-push-start',
        inactive ? 'landing-push-start--inactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={inactive ? undefined : onClick}
      aria-label="Push to start"
      disabled={inactive}
      tabIndex={inactive ? -1 : 0}
    >
      <span className="landing-push-start__glow" aria-hidden />
      <span className="landing-push-start__label">
        <span className="landing-push-start__year">{reportYear}</span>
        <span className="landing-push-start__divider" aria-hidden />
        <span className="landing-push-start__action">Start</span>
      </span>
    </button>
  );
}

type DialTilt = 'center' | 'left' | 'right';

function InfotainmentHeadunitFrame({
  className,
  contentClassName,
  children,
}: {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={['infotainment-headunit__frame', className].filter(Boolean).join(' ')}>
      <span className="infotainment-headunit__shade infotainment-headunit__shade--tl" aria-hidden />
      <span className="infotainment-headunit__shade infotainment-headunit__shade--tr" aria-hidden />
      <span className="infotainment-headunit__shade infotainment-headunit__shade--bl" aria-hidden />
      <span className="infotainment-headunit__shade infotainment-headunit__shade--br" aria-hidden />
      <span className="infotainment-headunit__facet infotainment-headunit__facet--tl" aria-hidden />
      <span className="infotainment-headunit__facet infotainment-headunit__facet--tr" aria-hidden />
      <span className="infotainment-headunit__facet infotainment-headunit__facet--bl" aria-hidden />
      <span className="infotainment-headunit__facet infotainment-headunit__facet--br" aria-hidden />
      <div
        className={['infotainment-headunit__frame-content', contentClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

function HeadunitNavButton({
  label,
  onClick,
  disabled,
  side,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  side: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      className={`infotainment-headunit__softkey infotainment-headunit__nav-btn infotainment-headunit__nav-btn--${side}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function HeadunitChevronNavButton({
  direction,
  onClick,
  disabled,
  ariaLabel,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const side = direction === 'left' ? 'left' : 'right';

  return (
    <button
      type="button"
      className={`infotainment-headunit__softkey infotainment-headunit__nav-btn infotainment-headunit__nav-btn--chevron infotainment-headunit__nav-btn--${side}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={
        ariaLabel ?? (direction === 'left' ? 'previous section' : 'next section')
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {direction === 'left' ? (
          <path d="M15 19l-7-7 7-7" />
        ) : (
          <path d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

function HeadunitDialButton({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: 'back' | 'next';
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);
  const tilt: DialTilt =
    hovered && !disabled ? (direction === 'back' ? 'left' : 'right') : 'center';

  return (
    <button
      type="button"
      className={`infotainment-headunit__dial-btn infotainment-headunit__dial-btn--${direction}`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={label}
    >
      <div
        className={`infotainment-console__dial infotainment-console__dial--nav infotainment-console__dial--tilt-${tilt}`}
        aria-hidden
      >
        <span className="infotainment-console__dial-ring" />
        <span className="infotainment-console__dial-cap infotainment-console__dial-cap--nav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
            {direction === 'back' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            )}
          </svg>
        </span>
      </div>
    </button>
  );
}

function InfotainmentHeadUnit({
  currentSlide,
  onBack,
  onNext,
  backDisabled,
  companyName,
  memberDisplayName,
}: {
  currentSlide: number;
  onBack: () => void;
  onNext: () => void;
  backDisabled: boolean;
  companyName: string;
  memberDisplayName?: string;
}) {
  return (
    <motion.div
      className="infotainment-headunit"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ ...INTRO_LAYOUT_TRANSITION, delay: 0.06 }}
    >
      <InfotainmentHeadunitFrame contentClassName="infotainment-headunit__layout">
        <div className="infotainment-headunit__side infotainment-headunit__side--left">
            <HeadunitNavButton
              label="Back"
              onClick={onBack}
              disabled={backDisabled}
              side="left"
            />
            <HeadunitDialButton
              direction="back"
              onClick={onBack}
              label="Previous slide"
            />
          </div>

          <div className="infotainment-headunit__main">
            <div className="infotainment-headunit__screen-well">
              <div className="infotainment-console__screen infotainment-console__screen--glossy">
                <span className="infotainment-headunit__clock" aria-hidden>
                  20:26 YR
                </span>
                <div className="pre-journey-stage__intro-panel">
                  <div className="infotainment-console__screen-glass" aria-hidden />
                  <div className="pre-journey-stage__intro-text">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlide}
                        className="intro-slide__copy"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.55, ease: INTRO_LAYOUT_TRANSITION.ease }}
                      >
                        {currentSlide === 0 ? (
                          <div className="intro-slide__welcome">
                            <p className="intro-slide__text">{INTRO_WELCOME_GREETING}</p>
                            <p className="intro-slide__text intro-slide__text--company">
                              {memberDisplayName ? `${memberDisplayName}, ${companyName}` : companyName}
                            </p>
                          </div>
                        ) : (
                          <p className="intro-slide__text">
                            {FOLLOW_UP_SLIDE_TEXTS[currentSlide - 1]}
                          </p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="infotainment-headunit__side infotainment-headunit__side--right">
            <HeadunitNavButton label="Next" onClick={onNext} side="right" />
            <HeadunitDialButton direction="next" onClick={onNext} label="Next slide" />
          </div>
      </InfotainmentHeadunitFrame>
    </motion.div>
  );
}

function PreJourneyStage({
  phase,
  currentSlide,
  onStart,
  onBack,
  onNext,
  companyName,
  memberDisplayName,
  reportYear,
}: {
  phase: 'landing' | 'intro';
  currentSlide: number;
  onStart: () => void;
  onBack: () => void;
  onNext: () => void;
  companyName: string;
  memberDisplayName?: string;
  reportYear: number;
}) {
  const showStartButton = phase === 'landing';

  return (
    <div
      className={[
        'pre-journey-stage',
        phase === 'intro' ? 'pre-journey-stage--intro' : 'pre-journey-stage--landing',
      ].join(' ')}
    >
      <div className="infotainment-console">
        {phase === 'landing' ? (
          <div className="infotainment-console__display">
            {showStartButton ? (
              <motion.div className="pre-journey-stage__start-float">
                <StartButton onClick={onStart} reportYear={reportYear} />
              </motion.div>
            ) : null}
          </div>
        ) : (
          <InfotainmentHeadUnit
            currentSlide={currentSlide}
            onBack={onBack}
            onNext={onNext}
            backDisabled={currentSlide === 0}
            companyName={companyName}
            memberDisplayName={memberDisplayName}
          />
        )}
      </div>
    </div>
  );
}

// Nav row sits 20px below the arch peak (which is at the panel's very top center).
const NAV_TOP = '20px';
// Text area: nav top (20px) + nav height (arrow size) + 45px gap (25px original + 20px extra)
const TEXT_TOP = 'calc(20px + clamp(28px, 3.5vw, 36px) + 45px)';
const COUNTER_MOBILE_BREAKPOINT = 640;

const DASHBOARD_VENT_SYNC_SELECTORS = [
  '.journey-counter-panel__frame',
  '.infotainment-headunit__main',
  '.infotainment-console__display',
  '.pre-journey-stage__intro-panel',
  '.pre-journey-stage__start-float',
  '.journey-layout__nav-message-panel',
] as const;

function useDashboardVentMetrics(
  panelRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const panel = panelRef.current;
    if (!panel) return;

    const resolveTarget = (): HTMLElement | null => {
      for (const selector of DASHBOARD_VENT_SYNC_SELECTORS) {
        const element = panel.querySelector(selector);
        if (element instanceof HTMLElement && element.getBoundingClientRect().height > 0) {
          return element;
        }
      }
      return null;
    };

    let observedTarget: HTMLElement | null = null;

    const update = () => {
      const root = panelRef.current;
      if (!root) return;

      const target = resolveTarget();

      if (target !== observedTarget) {
        if (observedTarget) {
          resizeObserver.unobserve(observedTarget);
        }
        observedTarget = target;
        if (target) {
          resizeObserver.observe(target);
        }
      }

      if (!target) {
        root.style.removeProperty('--dashboard-vent-height');
        root.style.removeProperty('--dashboard-vent-top');
        return;
      }

      const panelRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      root.style.setProperty('--dashboard-vent-height', `${Math.round(targetRect.height)}px`);
      root.style.setProperty('--dashboard-vent-top', `${Math.round(targetRect.top - panelRect.top)}px`);
    };

    const resizeObserver = new ResizeObserver(() => scheduleUpdate());
    let updateRafId = 0;

    const scheduleUpdate = () => {
      if (updateRafId) return;
      updateRafId = requestAnimationFrame(() => {
        updateRafId = 0;
        update();
      });
    };

    scheduleUpdate();
    resizeObserver.observe(panel);

    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    window.addEventListener('resize', scheduleUpdate);

    const syncTimers = [
      window.setTimeout(scheduleUpdate, 80),
      window.setTimeout(scheduleUpdate, 420),
    ];

    return () => {
      if (updateRafId) cancelAnimationFrame(updateRafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      syncTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [enabled, panelRef]);
}

function useIsCounterMobile() {
  const [isCounterMobile, setIsCounterMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COUNTER_MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsCounterMobile(mql.matches);
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isCounterMobile;
}

type CounterMobilePhase = 'gauge' | 'message';

const JOURNEY_END_GPS_PHASE = 4;

const JOURNEY_MAP_PANEL_MAX_HEIGHT = 520;
const DRIVING_FOOTER_HEIGHT_PX = 96;
const DRIVING_DEFAULT_DASHBOARD_HEIGHT_PX = 391;
const DRIVING_DEFAULT_BACKDROP_BOTTOM_PX =
  DRIVING_DEFAULT_DASHBOARD_HEIGHT_PX + DRIVING_FOOTER_HEIGHT_PX;

// ── GPS Nav sequence ───────────────────────────────────────────────────────────

function JourneyNavCornerNav({
  onBack,
  onNext,
  backLabel = 'back',
  nextLabel = 'next',
  nextDisabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="journey-nav-corner-nav">
      <button type="button" className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--back" onClick={onBack}>
        {backLabel}
      </button>
      <button
        type="button"
        className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--next"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function getJourneyNavStackPhases(visiblePopupPhase: number | null): number[] {
  if (visiblePopupPhase === 3) return [3];
  return [];
}

type ArrivalStep = 'arrived' | 'rerouting';

function JourneyNavArrivalOverlay({ step }: { step: ArrivalStep }) {
  const isRerouting = step === 'rerouting';

  return (
    <motion.div
      className="journey-nav-arrival"
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className={`journey-nav-arrival__card${isRerouting ? ' journey-nav-arrival__card--rerouting' : ''}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="journey-nav-arrival__content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="journey-nav-arrival__icon" aria-hidden>
              {isRerouting ? (
                <svg viewBox="0 0 640 640" className="journey-nav-arrival__route-icon" aria-hidden>
                  <path d={TURN_RIGHT_PATH} fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M8 12.5l2.5 2.5L16 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <p className="journey-nav-arrival__eyebrow">
              {isRerouting ? 'Re-routing to' : 'You have arrived'}
            </p>
            <p className="journey-nav-arrival__destination">
              {isRerouting ? 'AAPEX 2026' : 'AAPEX 2025'}
            </p>
            <p
              className={`journey-nav-arrival__detail${isRerouting ? ' journey-nav-arrival__detail--lead' : ''}`}
            >
              {isRerouting
                ? 'Being at AAPEX is the #1 way to not only stay connected and forge new business.'
                : 'Thank you for Attending AAPEX 2025'}
            </p>
            {isRerouting ? (
              <div className="journey-nav-arrival__actions">
                <a
                  href={EXTERNAL_CTA_LINKS.aapex2026}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="journey-nav-arrival__btn journey-nav-arrival__btn--aapex"
                >
                  AAPEX 2026
                </a>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type HoodEntryPhase =
  | 'sliding-dashboard'
  | 'fading-to-black'
  | 'hood-panel-rising'
  | 'hood-panel-falling';

/** Matches tire hub ground rise (`HOOD_PANEL_SLIDE_MS` in MapSimulation). */
const HOOD_ENTRY_DASHBOARD_EXIT_MS = 0.68;
const HOOD_ENTRY_PANEL_RISE_MS = 0.7;
const HOOD_BACKDROP_FADE_MS = 0.7;

function gpsAdvanceLabel(phase: number): string {
  if (phase === 2) return 'next';
  if (phase === 3) return 'next';
  return 'next';
}

const ATTENDANCE_CALCULATING_MS = 2500;
const EVENT_BAR_FILL_MS = 2000;
const GPS_POPUP_EXIT_MS = 500;

function GpsNavSection({
  onGoToHood,
  onGoBack,
  initialPhase = 1,
  uiSceneMotion,
  eventsMetrics,
}: {
  onGoToHood: () => void;
  onGoBack: () => void;
  initialPhase?: number;
  eventsMetrics: EventsMetrics;
  uiSceneMotion?: {
    initial: { opacity: number };
    animate: { opacity: number };
    exit: { opacity: number };
    transition: typeof JOURNEY_SCENE_TRANSITION;
  };
}) {
  const attendanceTarget = eventsMetrics.attendancePct;
  const webinarTarget = eventsMetrics.webinarCount;
  const [phase, setPhase] = useState(initialPhase);
  const [dotCount, setDotCount] = useState(1);
  const [barW, setBarW] = useState(initialPhase >= 2 ? attendanceTarget : 0);
  const [hoursCount, setHoursCount] = useState(
    initialPhase >= 3 ? webinarTarget : 0,
  );
  const [popupMinimized, setPopupMinimized] = useState(false);
  const [attendanceCalculating, setAttendanceCalculating] = useState(false);
  const [arrivalStep, setArrivalStep] = useState<ArrivalStep>('arrived');
  const [mapReplayKey, setMapReplayKey] = useState(0);
  const [leavingForHood, setLeavingForHood] = useState(false);
  const [visiblePopupPhase, setVisiblePopupPhase] = useState<number | null>(
    initialPhase >= 3 ? 3 : 2,
  );
  const [exitingToArrival, setExitingToArrival] = useState(false);
  const [attendanceBarCompact, setAttendanceBarCompact] = useState(initialPhase >= 3);

  useEffect(() => {
    if (exitingToArrival) return;
    if (phase === 3) setVisiblePopupPhase(3);
    else if (phase >= 2) setVisiblePopupPhase(2);
    else if (phase === 1 && initialPhase === 1) setVisiblePopupPhase(2);
    else setVisiblePopupPhase(null);
  }, [phase, exitingToArrival, initialPhase]);

  useEffect(() => {
    if (phase !== 1) return;
    setDotCount(1);
    const iv = setInterval(() => setDotCount(d => (d === 3 ? 1 : d + 1)), 400);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (initialPhase !== 1 || phase !== 1) return;
    const advanceTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_REPAINT_EVENT));
      setPhase(2);
    }, JOURNEY_CALCULATING_HOLD_MS);
    return () => window.clearTimeout(advanceTimer);
  }, [phase, initialPhase]);

  useEffect(() => {
    if (phase !== 2) {
      setAttendanceCalculating(false);
      return;
    }
    if (initialPhase >= 2 && mapReplayKey === 0) return;

    setAttendanceCalculating(true);
    setBarW(0);

    const revealTimer = window.setTimeout(() => {
      setAttendanceCalculating(false);
    }, ATTENDANCE_CALCULATING_MS);

    return () => window.clearTimeout(revealTimer);
  }, [phase, initialPhase, mapReplayKey]);

  useEffect(() => {
    if (phase !== 2 || attendanceCalculating) return;
    if (initialPhase >= 2 && mapReplayKey === 0) return;
    setBarW(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setBarW(Math.round((1 - Math.pow(1 - p, 3)) * attendanceTarget));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, initialPhase, mapReplayKey, attendanceTarget, attendanceCalculating]);

  useEffect(() => {
    if (phase >= 1) setPopupMinimized(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== 3) return;
    if (initialPhase >= 3 && mapReplayKey === 0) return;
    setHoursCount(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setHoursCount(Math.round((1 - Math.pow(1 - p, 3)) * webinarTarget));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, initialPhase, mapReplayKey, webinarTarget]);

  const handleGoToHoodWithTransition = () => {
    setLeavingForHood(true);
    setPopupMinimized(true);
    onGoToHood();
  };

  const handleRestartSequence = useCallback(() => {
    setArrivalStep('arrived');
    setPopupMinimized(false);
    setAttendanceBarCompact(initialPhase >= 3);
    setExitingToArrival(false);
    setLeavingForHood(false);
    setHoursCount(0);
    setAttendanceCalculating(false);
    setMapReplayKey((key) => key + 1);
    if (initialPhase >= 2) {
      setPhase(2);
      setBarW(0);
      return;
    }
    setPhase(1);
    setBarW(0);
  }, [initialPhase]);

  const handleNavBack = () => {
    if (phase === 3) {
      setAttendanceBarCompact(false);
      setPhase(2);
      return;
    }
    if (phase === 2) {
      onGoBack();
    }
  };

  const handleWebinarNext = () => {
    if (phase !== 3 || !webinarDetailsReady || exitingToArrival) return;
    setExitingToArrival(true);
    setVisiblePopupPhase(null);
  };

  const handleAdvance = () => {
    if (phase === 2) {
      setAttendanceBarCompact(true);
      setPhase(3);
      return;
    }
    if (phase === 3) {
      handleWebinarNext();
    }
  };

  const handleGpsPopupExitComplete = () => {
    if (!exitingToArrival) return;
    setExitingToArrival(false);
    setPhase(4);
  };

  const handleArrivalNavBack = () => {
    if (arrivalStep === 'rerouting') {
      setArrivalStep('arrived');
      return;
    }
    handleRestartSequence();
  };

  const handleArrivalNavNext = () => {
    if (arrivalStep === 'arrived') {
      setArrivalStep('rerouting');
      return;
    }
    handleGoToHoodWithTransition();
  };

  const attendanceDetailsReady = barW >= attendanceTarget;
  const webinarDetailsReady = hoursCount >= webinarTarget;
  const canAdvance =
    (phase === 2 && attendanceDetailsReady && !attendanceCalculating) ||
    (phase === 3 && webinarDetailsReady);
  const advanceLabel = gpsAdvanceLabel(phase);
  const popupRevealed = phase >= 2 && !exitingToArrival;
  const evtPct = Math.round(barW);
  const showArrivalOverlay = phase === 4 && !leavingForHood;
  const showAttendanceBar =
    phase >= 2 && phase < 4 && popupRevealed && !popupMinimized && !exitingToArrival;
  const showPopupStack = visiblePopupPhase === 3 && !popupMinimized;
  const stackedPopupPhases = showPopupStack
    ? getJourneyNavStackPhases(visiblePopupPhase)
    : [];
  const showNavControls = phase >= 1 && phase <= 4;
  const resolvePopupDetailsReady = (popupPhase: number) =>
    popupPhase === 2 ? attendanceDetailsReady : webinarDetailsReady;
  const showCornerNav =
    phase === 3 &&
    visiblePopupPhase !== null &&
    !exitingToArrival &&
    phase < 4 &&
    !attendanceBarCompact;
  const showArrivalNav = showArrivalOverlay;
  const uiMotion = uiSceneMotion ?? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: JOURNEY_SCENE_TRANSITION,
  };

  useEffect(() => {
    if (phase === 4) return;
    setArrivalStep('arrived');
  }, [phase]);

  return (
    <div className="journey-nav-stage-inner">
      <div className="journey-nav-slide-bg" aria-hidden>
        <Suspense fallback={null}>
          <JourneyNavMapAnimation key={mapReplayKey} />
        </Suspense>
      </div>

      {showNavControls && <GpsUiControls />}

      <AnimatePresence>
        {showArrivalOverlay && (
          <JourneyNavArrivalOverlay key="journey-nav-arrival" step={arrivalStep} />
        )}
      </AnimatePresence>

      <motion.div
        className="journey-nav-ui"
        {...uiMotion}
        animate={{ opacity: leavingForHood ? 0 : 1 }}
        transition={{ duration: GPS_POPUP_EXIT_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      >
        {showNavControls && (
        <AnimatePresence mode="wait" initial={false} onExitComplete={handleGpsPopupExitComplete}>
          {showPopupStack && (
            <motion.div
              key="journey-nav-popup-row"
              className="journey-nav-popup-row journey-nav-popup-row--route-aligned"
              initial={false}
              exit={{ opacity: 0 }}
              transition={{ duration: GPS_POPUP_EXIT_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            >
              <button
                type="button"
                className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--back journey-nav-popup-row__nav-spacer"
                tabIndex={-1}
                aria-hidden
                disabled
              >
                back
              </button>
              <p
                className="journey-nav-attendance-bar__value journey-nav-popup-row__nav-spacer"
                aria-hidden
              >
                {evtPct}%
              </p>
              <div className="journey-nav-popup-overlay">
                <LayoutGroup>
                  <div className="journey-nav-popup-stack">
                    <AnimatePresence mode="wait" initial={false}>
                      {stackedPopupPhases.map((popupPhase) => (
                        <motion.div
                          key={popupPhase}
                          className="gps-popup-stack__item"
                          layout={popupRevealed ? 'position' : false}
                          initial={
                            popupRevealed
                              ? popupPhase === 3
                                ? { opacity: 0, x: 0, y: -36, scale: 0.98 }
                                : { opacity: 0, x: 48, y: 0, scale: 0.96 }
                              : false
                          }
                          animate={
                            popupRevealed
                              ? { opacity: 1, x: 0, y: 0, scale: 1 }
                              : { opacity: 0, x: 0, y: 0, scale: 1 }
                          }
                          exit={
                            popupPhase === 3
                              ? { opacity: 0, y: -20, scale: 0.98 }
                              : { opacity: 0, x: 28, y: 0, scale: 0.94 }
                          }
                          transition={{
                            layout: {
                              duration: 0.48,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: { duration: GPS_POPUP_EXIT_MS / 1000 },
                            x: {
                              duration: GPS_POPUP_EXIT_MS / 1000,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            y: {
                              duration: popupPhase === 3 ? 0.48 : GPS_POPUP_EXIT_MS / 1000,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            scale: {
                              duration: GPS_POPUP_EXIT_MS / 1000,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          }}
                        >
                          <GpsPopupContent
                            phase={popupPhase}
                            isActive
                            dotCount={dotCount}
                            evtPct={evtPct}
                            barW={barW}
                            webinarHours={hoursCount}
                            detailsReady={resolvePopupDetailsReady(popupPhase)}
                            eventsMetrics={eventsMetrics}
                            onWebinarNext={handleWebinarNext}
                            webinarNextDisabled={!webinarDetailsReady}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </LayoutGroup>
              </div>
              <button
                type="button"
                className="journey-nav-corner-nav__btn journey-nav-corner-nav__btn--next journey-nav-popup-row__nav-spacer"
                tabIndex={-1}
                aria-hidden
                disabled
              >
                next
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        )}
        {showAttendanceBar && (
          <GpsAttendanceBottomBar
            evtPct={evtPct}
            barW={barW}
            detailsReady={attendanceDetailsReady}
            calculating={attendanceCalculating}
            eventsMetrics={eventsMetrics}
            compact={attendanceBarCompact}
            onBack={handleNavBack}
            onNext={handleAdvance}
            nextLabel={advanceLabel}
            nextDisabled={!canAdvance}
          />
        )}
        {showCornerNav && (
          <JourneyNavCornerNav
            onBack={handleNavBack}
            onNext={handleAdvance}
            nextLabel={advanceLabel}
            nextDisabled={!canAdvance}
          />
        )}
        {showArrivalNav && (
          <JourneyNavCornerNav
            onBack={handleArrivalNavBack}
            onNext={handleArrivalNavNext}
          />
        )}
      </motion.div>
    </div>
  );
}

function JourneySectionSubtitle({
  sectionIdx,
  subtitle,
}: {
  sectionIdx: number;
  subtitle: string;
}) {
  return (
    <header className="journey-layout__subtitle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={sectionIdx}
          className="journey-layout__subtitle-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {subtitle}
        </motion.p>
      </AnimatePresence>
    </header>
  );
}

function JourneyGaugeChevron({
  direction,
  onClick,
  ariaLabel,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`journey-gauge-chevron journey-gauge-chevron--${direction}`}
      onClick={onClick}
      aria-label={
        ariaLabel ?? (direction === 'left' ? 'previous section' : 'next section')
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3901D"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="journey-gauge-chevron__icon"
        aria-hidden
      >
        <path d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

function JourneyCounterMessagePanel({
  footerMessage,
  footerButton,
  isFirst,
  onBack,
  onNext,
}: {
  footerMessage?: string;
  footerButton?: { label: string; href: string };
  isFirst: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="journey-counter-panel__headunit infotainment-headunit">
      <InfotainmentHeadunitFrame
        className="journey-counter-panel__frame"
        contentClassName="journey-counter-panel__frame-body"
      >
        <div className="journey-counter-panel__screen-well">
          <div className="journey-counter-panel__screen">
            <div className="journey-counter-panel__screen-glass" aria-hidden />
            {footerMessage ? (
              <p className="journey-counter-panel__message">{footerMessage}</p>
            ) : null}
          </div>
        </div>
        <div className="journey-counter-panel__controls">
          <HeadunitChevronNavButton
            direction="left"
            onClick={onBack}
            disabled={isFirst}
            ariaLabel="Previous section"
          />
          {footerButton ? (
            <a
              className="journey-counter-panel__cta"
              href={footerButton.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {footerButton.label}
            </a>
          ) : (
            <span className="journey-counter-panel__cta-placeholder" aria-hidden />
          )}
          <HeadunitChevronNavButton
            direction="right"
            onClick={onNext}
            ariaLabel="Next section"
          />
        </div>
      </InfotainmentHeadunitFrame>
    </div>
  );
}

type CounterSection = Extract<JourneySection, { type: 'counter' }>;

function JourneySectionCounterGauge({
  section,
  sectionIdx,
  communities,
  counterMobilePhase,
  renderStatBelow,
  hideStatBelow,
}: {
  section: CounterSection;
  sectionIdx: number;
  communities?: string[];
  counterMobilePhase?: CounterMobilePhase;
  renderStatBelow?: (stat: ReactNode) => ReactNode;
  hideStatBelow?: boolean;
}) {
  const sharedProps = {
    key: sectionIdx,
    target: section.target,
    label: section.label,
    labelLines: section.labelLines,
    animationKey: sectionIdx,
    readoutMode: 'below' as const,
    circleSize: '100%',
    counterDialBox: true,
    wideSemicircle: true,
    hideStatBelow,
    renderStatBelow,
  };

  if (section.gaugeVariant === 'community-logo') {
    return (
      <CommunityLogoGauge
        {...sharedProps}
        communities={communities}
        href={section.footerButton?.href}
      />
    );
  }

  return (
    <JourneyCounterGauge
      {...sharedProps}
      variant={section.gaugeVariant ?? 'speedometer'}
    />
  );
}

// ── Your Journey content (rendered inside dashboard body area) ─────────────────
function YourJourney({
  onSectionChange,
  onGoToHood,
  initialSectionIdx = 0,
  initialGpsPhase = 1,
  journeySections,
  eventsMetrics,
  communities,
}: {
  onSectionChange?: (idx: number) => void;
  onGoToHood: () => void;
  initialSectionIdx?: number;
  initialGpsPhase?: number;
  journeySections: JourneySection[];
  eventsMetrics: EventsMetrics;
  communities?: string[];
}) {
  const [sectionIdx, setSectionIdx] = useState(initialSectionIdx);
  const [counterMobilePhase, setCounterMobilePhase] = useState<CounterMobilePhase>('gauge');
  const isCounterMobile = useIsCounterMobile();
  const skipSectionResetRef = useRef(true);

  const changeSectionIdx = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setSectionIdx((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onSectionChange?.(next);
        return next;
      });
    },
    [onSectionChange],
  );

  useEffect(() => {
    if (skipSectionResetRef.current) {
      skipSectionResetRef.current = false;
      return;
    }
    setCounterMobilePhase('gauge');
  }, [sectionIdx]);

  const section = journeySections[sectionIdx];
  const isFirst = sectionIdx === 0;
  const hasCounterMobileDetailStep =
    section.type === 'counter' &&
    Boolean(section.footerMessage || section.footerButton);

  const goToPrevCounterSection = () => {
    setCounterMobilePhase('gauge');
    changeSectionIdx((i) => i - 1);
  };

  const goToNextCounterSection = () => {
    setCounterMobilePhase('gauge');
    changeSectionIdx((i) => i + 1);
  };

  const handleCounterMobileRightChevron = () => {
    if (isCounterMobile && counterMobilePhase === 'gauge' && hasCounterMobileDetailStep) {
      setCounterMobilePhase('message');
      return;
    }
    goToNextCounterSection();
  };

  const handleCounterMobileLeftChevron = () => {
    if (isCounterMobile && counterMobilePhase === 'message') {
      setCounterMobilePhase('gauge');
      return;
    }
    if (!isFirst) goToPrevCounterSection();
  };

  // Counter ↔ map: pure horizontal carousel (mirror of map → committee exit).
  const counterSceneMotion = {
    initial: { opacity: 1, x: '100%', y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 1, x: '100%', y: 0 },
    transition: JOURNEY_SCENE_SLIDE_TRANSITION,
  };
  const mapSceneMotion = {
    initial: { opacity: 1, x: '-100%', y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 1, x: '-100%', y: 0 },
    transition: JOURNEY_SCENE_SLIDE_TRANSITION,
  };

  return (
    <div className="journey-scene-stage">
      <AnimatePresence mode="sync" initial={false}>
      {section.type === 'nav' ? (
      <motion.div
        key="journey-nav"
        layout={false}
        className="journey-layout journey-layout--nav journey-scene-layer"
        {...mapSceneMotion}
      >
        <main className="journey-layout__main journey-layout__main--nav">
          <div className="journey-layout__nav-stage">
            <GpsNavSection
              key={`${sectionIdx}-${initialGpsPhase}`}
              initialPhase={initialGpsPhase}
              eventsMetrics={eventsMetrics}
              onGoToHood={onGoToHood}
              onGoBack={() => changeSectionIdx((i) => i - 1)}
              uiSceneMotion={{
                initial: { opacity: 1 },
                animate: { opacity: 1 },
                exit: { opacity: 1 },
                transition: JOURNEY_SCENE_TRANSITION,
              }}
            />
          </div>
        </main>
      </motion.div>
      ) : (
    <motion.div
      key="journey-counter"
      layout={false}
      className={[
        'journey-layout',
        'journey-layout--counter',
        'journey-scene-layer',
        isCounterMobile ? 'journey-layout--counter-mobile' : '',
        isCounterMobile && counterMobilePhase === 'message'
          ? 'journey-layout--counter-mobile-message'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...counterSceneMotion}
    >
      <main className="journey-layout__main journey-layout__main--counter">
        <div className="journey-counter-panel">
          <div className="journey-counter-panel__body">
            <section className="journey-counter-panel__gauge" aria-label="Journey statistic">
              {isCounterMobile ? (
                <>
                  <JourneySectionSubtitle sectionIdx={sectionIdx} subtitle={section.subtitle} />
                  <JourneySectionCounterGauge
                    section={section}
                    sectionIdx={sectionIdx}
                    communities={communities}
                    hideStatBelow={counterMobilePhase === 'message'}
                    renderStatBelow={
                      counterMobilePhase === 'gauge'
                        ? (stat) => (
                            <div className="journey-counter-panel__stat-row">
                              <div className="journey-counter-panel__chev journey-counter-panel__chev--left">
                                {isFirst ? (
                                  <span className="journey-layout__chev-placeholder" aria-hidden />
                                ) : (
                                  <JourneyGaugeChevron
                                    direction="left"
                                    onClick={handleCounterMobileLeftChevron}
                                  />
                                )}
                              </div>
                              <div className="journey-counter-panel__stat-row-content">{stat}</div>
                              <div className="journey-counter-panel__chev journey-counter-panel__chev--right">
                                <JourneyGaugeChevron
                                  direction="right"
                                  onClick={handleCounterMobileRightChevron}
                                  ariaLabel={
                                    hasCounterMobileDetailStep ? 'view message' : 'next section'
                                  }
                                />
                              </div>
                            </div>
                          )
                        : undefined
                    }
                  />
                  <AnimatePresence mode="wait" initial={false}>
                    {counterMobilePhase === 'message' ? (
                      <motion.div
                        key="counter-mobile-message-detail"
                        className="journey-counter-panel__mobile-detail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <JourneyCounterMessagePanel
                          footerMessage={section.footerMessage}
                          footerButton={section.footerButton}
                          isFirst={isFirst}
                          onBack={handleCounterMobileLeftChevron}
                          onNext={goToNextCounterSection}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <JourneySectionSubtitle sectionIdx={sectionIdx} subtitle={section.subtitle} />
                  <JourneySectionCounterGauge
                    section={section}
                    sectionIdx={sectionIdx}
                    communities={communities}
                  />
                </>
              )}
            </section>
            {!isCounterMobile ? (
              <section className="journey-counter-panel__aside" aria-label="Journey message">
                <JourneyCounterMessagePanel
                  footerMessage={section.footerMessage}
                  footerButton={section.footerButton}
                  isFirst={isFirst}
                  onBack={() => changeSectionIdx((i) => i - 1)}
                  onNext={() => changeSectionIdx((i) => i + 1)}
                />
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}

// ── Dashboard panel ────────────────────────────────────────────────────────────
function DashboardPanel({
  currentSlide,
  onBack,
  onNext,
  onStart,
  report,
  journeySections,
  isJourney = false,
  isHood = false,
  isLanding = false,
  hoodPhase = 'standards',
  hoodSession = 0,
  onHoodPhaseChange,
  onGoToHood,
  hoodEntryPhase = null,
  hoodNavTransition = null,
  onDashboardExitComplete,
  onHoodPanelRiseComplete,
  onHoodPanelFallComplete,
  onHoodNavTransitionMidpoint,
  onHoodNavTransitionComplete,
  onRequestStandardsToTireTransition,
  onRequestTireToStandardsTransition,
  onFinishTireSequence,
  onBackToJourney,
  journeyInitialSectionIdx,
  journeyInitialGpsPhase,
  onPanelRef,
}: {
  currentSlide: number | null;
  onBack: () => void;
  onNext: () => void;
  onStart: () => void;
  report: WrappedReport;
  journeySections: JourneySection[];
  isJourney?: boolean;
  isHood?: boolean;
  isLanding?: boolean;
  hoodPhase?: HoodPhase;
  hoodSession?: number;
  onHoodPhaseChange: (phase: HoodPhase) => void;
  onGoToHood: () => void;
  hoodEntryPhase?: HoodEntryPhase | null;
  hoodNavTransition?: HoodNavTransition | null;
  onDashboardExitComplete?: () => void;
  onHoodPanelRiseComplete?: () => void;
  onHoodPanelFallComplete?: () => void;
  onHoodNavTransitionMidpoint?: () => void;
  onHoodNavTransitionComplete?: () => void;
  onRequestStandardsToTireTransition?: () => void;
  onRequestTireToStandardsTransition?: () => void;
  onFinishTireSequence?: () => void;
  onBackToJourney?: () => void;
  journeyInitialSectionIdx?: number;
  journeyInitialGpsPhase?: number;
  onPanelRef?: (node: HTMLDivElement | null) => void;
}) {
  const isFirstSlide = isLanding || currentSlide === 0;
  const showPreJourney = isLanding || (!isJourney && currentSlide !== null);
  const preJourneyPhase = isLanding ? 'landing' : 'intro';
  const [journeySectionIdx, setJourneySectionIdx] = useState(journeyInitialSectionIdx ?? 0);
  const journeySection = isJourney ? journeySections[journeySectionIdx] : null;
  const isMapScene = journeySection?.type === 'nav';
  const isCounterScene = journeySection?.type === 'counter';
  const usesPanelArch = !isHood;
  const showDashboardChrome = !isHood;
  const isDashboardExiting = hoodEntryPhase === 'sliding-dashboard' && !isHood;
  const isHoodPanelRising = isHood && hoodEntryPhase === 'hood-panel-rising';
  const isHoodPanelFalling = isHood && hoodEntryPhase === 'hood-panel-falling';
  const skipPanelEnterAnimation =
    isLanding ||
    showPreJourney ||
    usesPanelArch ||
    isHoodPanelRising ||
    (isHood && !isHoodPanelRising);
  const panelRef = useRef<HTMLDivElement>(null);
  const assignPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      onPanelRef?.(node);
    },
    [onPanelRef],
  );
  useDashboardVentMetrics(panelRef, showDashboardChrome);
  const [mapPanelHeight, setMapPanelHeight] = useState(JOURNEY_MAP_PANEL_MAX_HEIGHT);
  const journeySceneSlideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapEntryDispatchedRef = useRef(false);
  const [isJourneySceneSliding, setIsJourneySceneSliding] = useState(false);
  const journeyPanelActive = isJourney && (isCounterScene || isMapScene);
  const journeyPanelHeight = journeyPanelActive ? mapPanelHeight : undefined;

  const measureMapPanelHeight = useCallback(() => {
    const container = panelRef.current?.parentElement;
    if (!container) return JOURNEY_MAP_PANEL_MAX_HEIGHT;
    return Math.min(JOURNEY_MAP_PANEL_MAX_HEIGHT, container.clientHeight - 10);
  }, []);

  const beginJourneySceneSlide = useCallback(() => {
    setMapPanelHeight(measureMapPanelHeight());
    setIsJourneySceneSliding(true);
    if (journeySceneSlideTimerRef.current) {
      window.clearTimeout(journeySceneSlideTimerRef.current);
    }
    journeySceneSlideTimerRef.current = window.setTimeout(() => {
      journeySceneSlideTimerRef.current = null;
      setIsJourneySceneSliding(false);
    }, JOURNEY_SCENE_SLIDE_MS);
  }, [measureMapPanelHeight]);

  const dispatchMapEnterComplete = useCallback(() => {
    window.dispatchEvent(new CustomEvent(JOURNEY_NAV_MAP_ENTER_EVENT));
  }, []);

  const handleJourneySectionChange = useCallback(
    (idx: number) => {
      const prev = journeySectionIdx;
      const enteringMap =
        journeySections[idx]?.type === 'nav' &&
        journeySections[prev]?.type === 'counter' &&
        prev !== idx;
      const exitingMap =
        journeySections[idx]?.type === 'counter' &&
        journeySections[prev]?.type === 'nav' &&
        prev !== idx;
      if (enteringMap || exitingMap) {
        beginJourneySceneSlide();
      }
      if (enteringMap) {
        mapEntryDispatchedRef.current = true;
        requestAnimationFrame(() => {
          dispatchMapEnterComplete();
        });
      } else if (exitingMap) {
        mapEntryDispatchedRef.current = false;
      }
      setJourneySectionIdx(idx);
    },
    [journeySectionIdx, beginJourneySceneSlide, journeySections, dispatchMapEnterComplete],
  );

  useEffect(
    () => () => {
      if (journeySceneSlideTimerRef.current) {
        window.clearTimeout(journeySceneSlideTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isMapScene || isJourneySceneSliding || mapEntryDispatchedRef.current) return;
    dispatchMapEnterComplete();
  }, [dispatchMapEnterComplete, isMapScene, isJourneySceneSliding]);
  const panelAnimate = isDashboardExiting
    ? { y: '115%', opacity: 1 }
    : isHoodPanelFalling
      ? { y: '115%', opacity: 1 }
    : isHoodPanelRising
      ? { y: 0, opacity: 1 }
      : { y: 0, opacity: 1 };
  const panelTransition = isDashboardExiting
    ? {
        y: { duration: HOOD_ENTRY_DASHBOARD_EXIT_MS, ease: [0.45, 0, 0.75, 1] as const },
      }
    : isHoodPanelFalling
      ? {
          y: { duration: HOOD_ENTRY_PANEL_RISE_MS, ease: [0.4, 0, 0.2, 1] as const },
        }
    : isHoodPanelRising
      ? {
          y: { duration: HOOD_ENTRY_PANEL_RISE_MS, ease: [0.4, 0, 0.2, 1] as const },
        }
      : {
          y: {
            duration: skipPanelEnterAnimation ? 0 : 0.55,
            ease: JOURNEY_SCENE_TRANSITION.ease,
          },
          opacity: {
            duration: skipPanelEnterAnimation ? 0 : 0.55,
            ease: JOURNEY_SCENE_TRANSITION.ease,
          },
        };
  const panelHeightStyle =
    journeyPanelActive && journeyPanelHeight != null
      ? ({ height: `${journeyPanelHeight}px` } as const)
      : undefined;
  const dashboardExitingRef = useRef(false);
  const hoodPanelRisingRef = useRef(false);
  const hoodPanelFallingRef = useRef(false);
  useEffect(() => {
    dashboardExitingRef.current = isDashboardExiting;
  }, [isDashboardExiting]);
  useEffect(() => {
    hoodPanelRisingRef.current = isHoodPanelRising;
  }, [isHoodPanelRising]);
  useEffect(() => {
    hoodPanelFallingRef.current = isHoodPanelFalling;
  }, [isHoodPanelFalling]);

  useEffect(() => {
    if (isJourney) return;
    if (journeySceneSlideTimerRef.current) {
      window.clearTimeout(journeySceneSlideTimerRef.current);
      journeySceneSlideTimerRef.current = null;
    }
    setIsJourneySceneSliding(false);
    mapEntryDispatchedRef.current = false;
    setMapPanelHeight(JOURNEY_MAP_PANEL_MAX_HEIGHT);
    const node = panelRef.current;
    if (node) node.style.removeProperty('height');
  }, [isJourney]);

  useLayoutEffect(() => {
    if (!isJourney) return;
    const panel = panelRef.current;
    const container = panel?.parentElement;
    if (!container) return;

    const updateMapHeight = () => {
      setMapPanelHeight(measureMapPanelHeight());
    };

    updateMapHeight();
    const observer = new ResizeObserver(updateMapHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isJourney, measureMapPanelHeight]);

  useEffect(() => {
    const resetJourneySlide = () => {
      if (journeySceneSlideTimerRef.current) {
        window.clearTimeout(journeySceneSlideTimerRef.current);
        journeySceneSlideTimerRef.current = null;
      }
      setIsJourneySceneSliding(false);
      if (isJourney) {
        setMapPanelHeight(measureMapPanelHeight());
      }
    };

    window.addEventListener('resize', resetJourneySlide);
    return () => window.removeEventListener('resize', resetJourneySlide);
  }, [isJourney, measureMapPanelHeight]);

  return (
    <motion.div
      ref={assignPanelRef}
      layout={false}
      style={panelHeightStyle}
      className={[
        'dashboard-panel',
        isLanding ? 'dashboard-panel--landing' : '',
        usesPanelArch ? 'dashboard-panel--arch' : '',
        isHood ? 'dashboard-panel--hood' : '',
        journeyPanelActive ? 'dashboard-panel--journey-scene' : '',
        isJourneySceneSliding ? 'dashboard-panel--journey-scene-transition' : '',
        isDashboardExiting ? 'dashboard-panel--exiting' : '',
        isHoodPanelRising ? 'dashboard-panel--hood-rising' : '',
        isHoodPanelFalling ? 'dashboard-panel--exiting' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      initial={
        isHoodPanelRising
          ? { y: '100%', opacity: 1 }
          : isHoodPanelFalling
            ? { y: 0, opacity: 1 }
            : skipPanelEnterAnimation
              ? { y: 0, opacity: 1 }
              : { y: '100%', opacity: 0 }
      }
      animate={panelAnimate}
      transition={panelTransition}
      onAnimationComplete={() => {
        if (dashboardExitingRef.current) {
          dashboardExitingRef.current = false;
          onDashboardExitComplete?.();
          return;
        }
        if (hoodPanelRisingRef.current) {
          hoodPanelRisingRef.current = false;
          onHoodPanelRiseComplete?.();
          return;
        }
        if (hoodPanelFallingRef.current) {
          hoodPanelFallingRef.current = false;
          onHoodPanelFallComplete?.();
        }
      }}
    >
      {isHood ? (
        <div
          className={
            hoodPhase === 'standards'
              ? 'dashboard-hood-bg'
              : `dashboard-hood-bg dashboard-hood-bg--${hoodPhase}`
          }
        >
          <DashboardHoodArch
            key={hoodSession}
            phase={hoodPhase}
            report={report}
            onPhaseChange={onHoodPhaseChange}
            onFinishTireSequence={onFinishTireSequence}
            onBackToJourney={onBackToJourney}
            hoodNavTransition={hoodNavTransition}
            onNavTransitionMidpoint={onHoodNavTransitionMidpoint}
            onNavTransitionComplete={onHoodNavTransitionComplete}
            onRequestStandardsToTireTransition={onRequestStandardsToTireTransition}
            onRequestTireToStandardsTransition={onRequestTireToStandardsTransition}
          />
        </div>
      ) : (
        <DashboardPanelArch />
      )}

      {/* Wide decorative side panels — outside the 900px content shell */}
      {showDashboardChrome && (
        <div className="dashboard-wide-decor" aria-hidden>
          <DashboardWideDecor />
        </div>
      )}

      {/* Nav + body — centered primary content (max 900px) */}
      {showDashboardChrome && (
        <div className="dashboard-content-shell">
          <div className="dashboard-panel__nav" style={{ top: NAV_TOP }}>
            <div className="dashboard-panel__nav-flank dashboard-panel__nav-flank--left">
              <DashboardTireWarningIcon />
            </div>

            <div className="dashboard-panel__nav-cluster">
              <button
                type="button"
                className="dashboard-panel__signal dashboard-panel__signal--left"
                onClick={onBack}
                disabled={isFirstSlide}
                aria-label="previous"
              >
                <svg viewBox="0 0 640 640" fill="#F3901D" aria-hidden>
                  <path d={ARROW_PATH} />
                </svg>
              </button>

              <DashboardPrndl activeGear={isLanding ? 'P' : 'D'} />

              <button
                type="button"
                className="dashboard-panel__signal dashboard-panel__signal--right"
                onClick={onNext}
                disabled={isLanding}
                aria-label="next"
              >
                <svg viewBox="0 0 640 640" fill="#F3901D" aria-hidden>
                  <path d={ARROW_PATH} />
                </svg>
              </button>
            </div>

            <div className="dashboard-panel__nav-flank dashboard-panel__nav-flank--right">
              <DashboardGasIcon />
            </div>
          </div>

          {/* Body area — hidden on hood (grey arch only) */}
          {!isHood && (
            <div
              className={[
                'dashboard-panel__body',
                isLanding ? 'dashboard-body--landing' : '',
                showPreJourney ? 'dashboard-body--pre-journey' : '',
                isJourney ? 'dashboard-body--journey dashboard-body--journey-scene' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                isCounterScene || isMapScene
                  ? undefined
                  : {
                      position: 'absolute',
                      top: TEXT_TOP,
                      left: 0,
                      right: 0,
                      bottom: showPreJourney ? '8%' : isJourney ? '14%' : '26%',
                      overflow: isMapScene || showPreJourney ? 'visible' : 'hidden',
                    }
              }
            >
              <AnimatePresence mode="wait">
                {isJourney ? (
                  <motion.div
                    key="journey-body"
                    className="dashboard-panel__stage dashboard-panel__stage--journey"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <YourJourney
                      key={`journey-${journeyInitialSectionIdx ?? 0}-${journeyInitialGpsPhase ?? 1}`}
                      onSectionChange={handleJourneySectionChange}
                      onGoToHood={onGoToHood}
                      initialSectionIdx={journeyInitialSectionIdx}
                      initialGpsPhase={journeyInitialGpsPhase}
                      journeySections={journeySections}
                      eventsMetrics={report.events}
                      communities={report.journey.communities}
                    />
                  </motion.div>
                ) : showPreJourney ? (
                  <motion.div
                    key="pre-journey-body"
                    className="dashboard-panel__stage dashboard-panel__stage--pre-journey"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <PreJourneyStage
                      phase={preJourneyPhase}
                      currentSlide={currentSlide ?? 0}
                      onStart={onStart}
                      onBack={onBack}
                      onNext={onNext}
                      companyName={report.company.name}
                      memberDisplayName={undefined}
                      reportYear={report.reportYear}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
}

// ── Main DrivingView ──────────────────────────────────────────────────────────
function useDashboardPinnedBackdropBottom(
  rootRef: React.RefObject<HTMLDivElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  panelMounted: boolean,
) {
  const [bottomPx, setBottomPx] = useState(DRIVING_DEFAULT_BACKDROP_BOTTOM_PX);
  const bottomPxRef = useRef(DRIVING_DEFAULT_BACKDROP_BOTTOM_PX);

  useLayoutEffect(() => {
    if (!enabled) {
      bottomPxRef.current = DRIVING_DEFAULT_BACKDROP_BOTTOM_PX;
      setBottomPx(DRIVING_DEFAULT_BACKDROP_BOTTOM_PX);
      return;
    }

    let rafId = 0;

    const measure = () => {
      const root = rootRef.current;
      if (!root) return;

      const rootRect = root.getBoundingClientRect();
      const panel = panelRef.current;
      const nextBottom = panel
        ? Math.max(DRIVING_FOOTER_HEIGHT_PX, rootRect.bottom - panel.getBoundingClientRect().top)
        : DRIVING_DEFAULT_BACKDROP_BOTTOM_PX;

      if (nextBottom === bottomPxRef.current) return;
      bottomPxRef.current = nextBottom;
      setBottomPx(nextBottom);
    };

    const scheduleMeasure = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        measure();
      });
    };

    measure();

    const observer = new ResizeObserver(scheduleMeasure);
    const root = rootRef.current;
    if (root) observer.observe(root);
    if (panelRef.current) observer.observe(panelRef.current);

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [enabled, panelMounted, rootRef, panelRef]);

  return bottomPx;
}

export function DrivingView({
  report,
  embedded = false,
}: {
  report: WrappedReport;
  embedded?: boolean;
}) {
  const journeySections = buildJourneySections(report);
  const journeyNavSectionIndex = journeySections.length - 1;
  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [journeyResumeSectionIdx, setJourneyResumeSectionIdx] = useState<number | undefined>();
  const [journeyResumeGpsPhase, setJourneyResumeGpsPhase] = useState<number | undefined>();
  const [hoodPhase, setHoodPhase] = useState<HoodPhase>('standards');
  const [hoodSession, setHoodSession] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [diagnosticsStage, setDiagnosticsStage] = useState<
    'full' | 'transition' | 'final'
  >('full');
  const [hoodEntryPhase, setHoodEntryPhase] = useState<HoodEntryPhase | null>(null);
  const [hoodNavTransition, setHoodNavTransition] = useState<HoodNavTransition | null>(null);
  const [skyRunId, setSkyRunId] = useState(0);
  const [dashboardEpoch, setDashboardEpoch] = useState(0);
  const pendingCheckpointRef = useRef<NavCheckpoint | null>(null);
  const drivingRootRef = useRef<HTMLDivElement>(null);
  const dashboardPanelRef = useRef<HTMLDivElement | null>(null);
  const [dashboardPanelMounted, setDashboardPanelMounted] = useState(false);
  const assignDashboardPanelRef = useCallback((node: HTMLDivElement | null) => {
    dashboardPanelRef.current = node;
    const mounted = !!node;
    setDashboardPanelMounted((prev) => (prev === mounted ? prev : mounted));
  }, []);

  const screenOrder = NAV_ITEMS.map((n) => n.id);
  const activeNav = getActiveNavCheckpoint(currentScreen, hoodPhase);
  const currentIdx = activeNav ? screenOrder.indexOf(activeNav) : -1;

  const skyProgress = useMotionValue(0);

  const nightSkyOp = useTransform(skyProgress, [0, 0.7], [1, 0]);
  const starOp = useTransform(skyProgress, [0, 0.45], [1, 0]);
  const dawnWarmOp = useTransform(skyProgress, [0.1, 0.45, 0.75], [0, 0.65, 0]);
  const daySkyOp = useTransform(skyProgress, [0, 1], [0, 1]);
  const daySkyBrightOp = useTransform(skyProgress, [0.78, 1], [0, 0.55]);
  const sunOpacity = useTransform(skyProgress, [0, 0.08, 1], [0, 1, 1]);
  const sunYPx = useTransform(skyProgress, [0, 1], [SUN_RISE_BOTTOM_Y, SUN_RISE_TOP_Y]);
  const horizonGlowOp = useTransform(skyProgress, [0.12, 0.55, 1], [0, 1, 0.35]);

  useEffect(() => {
    if (skyRunId === 0) return;
    if (prefersReducedMotion()) {
      skyProgress.set(1);
      return;
    }
    skyProgress.set(0);
    const controls = animate(skyProgress, 1, SKY_SUNRISE_ANIMATION);
    return () => controls.stop();
  }, [skyRunId, skyProgress]);

  useEffect(() => {
    if (currentScreen === 'journey') {
      skyProgress.set(1);
    }
  }, [currentScreen, skyProgress]);

  useEffect(() => {
    const audio = new Audio(carStartSound);
    audio.preload = 'auto';

    const playStartup = () => {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      playStartup();
    } else {
      audio.addEventListener('canplaythrough', playStartup, { once: true });
    }

    return () => {
      audio.removeEventListener('canplaythrough', playStartup);
      audio.pause();
    };
  }, []);

  const handleRestart = () => {
    setIsStarted(false);
    setCurrentSlide(null);
    setCurrentScreen(null);
    setDiagnosticsStage('full');
    setJourneyResumeSectionIdx(undefined);
    setJourneyResumeGpsPhase(undefined);
    setHoodEntryPhase(null);
    setHoodNavTransition(null);
    setHoodPhase('standards');
    setDashboardEpoch((epoch) => epoch + 1);
    skyProgress.set(0);
  };

  const handleSkip = () => {
    setCurrentSlide(null);
    setCurrentScreen('journey');
    skyProgress.set(1);
  };

  const handleSlideBack = () => {
    if (currentSlide !== null && currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleSlideNext = () => {
    if (currentSlide === null) return;
    if (currentSlide < DRIVING_SLIDE_COUNT - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      skyProgress.set(1);
      setCurrentSlide(null);
      setCurrentScreen('journey');
    }
  };

  const enterHoodScreen = () => {
    if (!isStarted) setIsStarted(true);
    setCurrentSlide(null);
    setJourneyResumeSectionIdx(undefined);
    setJourneyResumeGpsPhase(undefined);
    setHoodPhase('standards');
    setHoodSession((n) => n + 1);
    setCurrentScreen('hood');
  };

  const goToCheckpoint = (checkpoint: NavCheckpoint) => {
    if (checkpoint === activeNav) return;
    if (hoodEntryPhase || hoodNavTransition) return;

    if (!isStarted) setIsStarted(true);
    setCurrentSlide(null);

    const onHood = currentScreen === 'hood';
    const onStandards = onHood && hoodPhase === 'standards';
    const onTires = onHood && isTirePhase(hoodPhase);

    if (onTires && checkpoint === 'hood') {
      setHoodNavTransition('tire-to-standards');
      return;
    }
    if (onStandards && checkpoint === 'tires') {
      setHoodNavTransition('standards-to-tire');
      return;
    }
    if (onHood && (checkpoint === 'journey' || checkpoint === 'diagnostics')) {
      pendingCheckpointRef.current = checkpoint;
      setHoodEntryPhase('hood-panel-falling');
      return;
    }

    if (checkpoint === 'journey') {
      setJourneyResumeSectionIdx(undefined);
      setJourneyResumeGpsPhase(undefined);
      setCurrentScreen('journey');
      return;
    }
    if (checkpoint === 'hood') {
      setJourneyResumeSectionIdx(undefined);
      setJourneyResumeGpsPhase(undefined);
      if (currentScreen === 'journey') {
        handleGoToHood();
      } else {
        enterHoodScreen();
        setHoodEntryPhase('hood-panel-rising');
      }
      return;
    }
    if (checkpoint === 'tires') {
      setJourneyResumeSectionIdx(undefined);
      setJourneyResumeGpsPhase(undefined);
      if (currentScreen === 'journey') {
        pendingCheckpointRef.current = 'tires';
        setHoodEntryPhase('sliding-dashboard');
        return;
      }
      setHoodPhase('trendlens');
      setHoodSession((n) => n + 1);
      setCurrentScreen('hood');
      if (!onHood) {
        setHoodEntryPhase('hood-panel-rising');
      }
      return;
    }
    setDiagnosticsStage('full');
    setCurrentScreen('diagnostics');
  };

  const beginDiagnosticsFromTires = useCallback(() => {
    if (!isStarted) setIsStarted(true);
    setCurrentSlide(null);
    setCurrentScreen('diagnostics');
    setDiagnosticsStage('transition');
  }, [isStarted]);

  useEffect(() => {
    if (diagnosticsStage !== 'transition') return;
    const timer = window.setTimeout(
      () => setDiagnosticsStage('full'),
      DIAGNOSTICS_TRANSITION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [diagnosticsStage]);

  const goToPrev = () => {
    if (currentIdx > 0) goToCheckpoint(screenOrder[currentIdx - 1]);
  };

  const goToNext = () => {
    if (currentIdx < screenOrder.length - 1) goToCheckpoint(screenOrder[currentIdx + 1]);
  };

  const handleDashboardExitComplete = useCallback(() => {
    setHoodEntryPhase('fading-to-black');
  }, []);

  const handleBackdropFadeComplete = useCallback(() => {
    const pending = pendingCheckpointRef.current;
    pendingCheckpointRef.current = null;
    if (pending === 'tires') {
      if (!isStarted) setIsStarted(true);
      setCurrentSlide(null);
      setJourneyResumeSectionIdx(undefined);
      setJourneyResumeGpsPhase(undefined);
      setHoodPhase('trendlens');
      setHoodSession((n) => n + 1);
      setCurrentScreen('hood');
    } else {
      enterHoodScreen();
    }
    setHoodEntryPhase('hood-panel-rising');
  }, []);

  const handleHoodPanelRiseComplete = useCallback(() => {
    setHoodEntryPhase(null);
  }, []);

  const handleHoodPanelFallComplete = useCallback(() => {
    const pending = pendingCheckpointRef.current;
    pendingCheckpointRef.current = null;
    setHoodEntryPhase(null);
    if (pending === 'journey') {
      setJourneyResumeSectionIdx(undefined);
      setJourneyResumeGpsPhase(undefined);
      setCurrentScreen('journey');
      return;
    }
    if (pending === 'diagnostics') {
      setDiagnosticsStage('full');
      setCurrentScreen('diagnostics');
    }
  }, []);

  const handleHoodNavTransitionMidpoint = useCallback(() => {
    if (hoodNavTransition === 'tire-to-standards') {
      setHoodPhase('standards');
      return;
    }
    if (hoodNavTransition === 'standards-to-tire') {
      setHoodPhase('trendlens');
    }
  }, [hoodNavTransition]);

  const handleHoodNavTransitionComplete = useCallback(() => {
    setHoodNavTransition(null);
  }, []);

  const beginStandardsToTireTransition = useCallback(() => {
    if (hoodEntryPhase || hoodNavTransition) return;
    setHoodNavTransition('standards-to-tire');
  }, [hoodEntryPhase, hoodNavTransition]);

  const beginTireToStandardsTransition = useCallback(() => {
    if (hoodEntryPhase || hoodNavTransition) return;
    setHoodNavTransition('tire-to-standards');
  }, [hoodEntryPhase, hoodNavTransition]);

  const handleGoToHood = useCallback(() => {
    setHoodEntryPhase('sliding-dashboard');
  }, []);

  const handleBackToJourneyEnd = useCallback(() => {
    setJourneyResumeSectionIdx(journeyNavSectionIndex);
    setJourneyResumeGpsPhase(JOURNEY_END_GPS_PHASE);
    setCurrentScreen('journey');
  }, []);

  const handleStart = useCallback(() => {
    setIsStarted(true);
    setCurrentSlide(0);
    setSkyRunId((n) => n + 1);
  }, []);

  const isHoodScreen = currentScreen === 'hood';
  const isDiagnosticsScreen = currentScreen === 'diagnostics';
  const isDiagnosticsFlow =
    isDiagnosticsScreen &&
    (diagnosticsStage === 'transition' || diagnosticsStage === 'final');
  const showLandingBackdrop = !isStarted;
  const isBackdropFadingToBlack = hoodEntryPhase === 'fading-to-black';
  const showDrivingBackdrop =
    isStarted && !isHoodScreen && !isDiagnosticsScreen && !isDiagnosticsFlow;
  const showSkyAndRoad =
    showLandingBackdrop || showDrivingBackdrop || isBackdropFadingToBlack;

  const showRoadLottie = showDrivingBackdrop && !prefersReducedMotion();
  const showFooterNav = currentScreen && diagnosticsStage === 'full';
  const isMobileViewport = useMobileViewport();
  const showDashboardPanel =
    !isDiagnosticsFlow &&
    !isBackdropFadingToBlack &&
    (!isStarted || currentSlide !== null || currentScreen === 'journey' || currentScreen === 'hood');

  const backdropBottomPx = useDashboardPinnedBackdropBottom(
    drivingRootRef,
    dashboardPanelRef,
    showSkyAndRoad,
    dashboardPanelMounted,
  );

  return (
    <div
      ref={drivingRootRef}
      className="relative w-full h-full overflow-hidden bg-black"
      style={
        {
          '--driving-backdrop-bottom': `${backdropBottomPx}px`,
        } as React.CSSProperties
      }
    >

      {/* ── Driving scene Lottie — band above dashboard ── */}
      {showSkyAndRoad && (
        <div
          className={`driving-view-backdrop${showDrivingBackdrop ? ' driving-view-backdrop--sequence' : ''}`}
          style={{
            bottom: backdropBottomPx,
            zIndex: 2,
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <div className="driving-view-backdrop__scene">
            <div className="driving-view-backdrop__compositor">
              <div className="driving-view-sky">
                <motion.div
                  className="driving-view-sky__layer driving-view-sky__layer--night"
                  style={{ opacity: nightSkyOp }}
                />
                <motion.div className="driving-view-sky__layer driving-view-sky__stars" style={{ opacity: starOp }}>
                  {STARS.map((s, i) => (
                    <div
                      key={i}
                      className="driving-view-sky__star"
                      style={{
                        left: s.x,
                        top: s.y,
                        width: s.size,
                        height: s.size,
                        opacity: s.opacity,
                      }}
                    />
                  ))}
                </motion.div>
                <motion.div
                  className="driving-view-sky__layer driving-view-sky__layer--dawn"
                  style={{ opacity: dawnWarmOp }}
                />
                <motion.div
                  className="driving-view-sky__layer driving-view-sky__layer--day"
                  style={{ opacity: daySkyOp }}
                />
                <motion.div
                  className="driving-view-sky__layer driving-view-sky__layer--day-bright"
                  style={{ opacity: daySkyBrightOp }}
                />
                <motion.div
                  className="driving-view-sky__horizon-glow"
                  style={{ opacity: horizonGlowOp }}
                />
                <motion.div
                  className="driving-view-sky__sun"
                  style={{
                    y: sunYPx,
                    opacity: sunOpacity,
                  }}
                />
              </div>
              {showRoadLottie && (
                <>
                  {!isMobileViewport && (
                    <LazyLottie
                      loadAnimation={loadDrivingAnimation}
                      active={showRoadLottie}
                      loop
                      autoplay
                      className="driving-view-backdrop__lottie-cutout"
                      style={{ width: '100%', height: '100%' }}
                      rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
                    />
                  )}
                  <LazyLottie
                    loadAnimation={loadDrivingAnimation}
                    active={showRoadLottie}
                    loop
                    autoplay
                    className="driving-view-backdrop__lottie"
                    style={{ width: '100%', height: '100%' }}
                    rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isBackdropFadingToBlack && (
        <motion.div
          className="absolute inset-0 bg-black"
          style={{ zIndex: 4, pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: HOOD_BACKDROP_FADE_MS, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={handleBackdropFadeComplete}
          aria-hidden
        />
      )}

      {/* ── Footer ── */}
      {!isDiagnosticsFlow && (
      <div className="driving-view-footer">
        <button
          type="button"
          onClick={handleRestart}
          className="driving-view-footer__restart"
        >
          <svg className="driving-view-footer__restart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="driving-view-footer__restart-label">Restart</span>
        </button>

        <div className="driving-view-footer__nav-slot">
          {showFooterNav && (
            <>
              <nav className="driving-view-footer__nav driving-view-footer__nav--labels" aria-label="Main sections">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={currentIdx === 0}
                  className="driving-view-footer__nav-arrow"
                  aria-label="Previous section"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToCheckpoint(item.id)}
                    className={[
                      'driving-view-footer__nav-label',
                      activeNav === item.id ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentIdx === screenOrder.length - 1}
                  className="driving-view-footer__nav-arrow"
                  aria-label="Next section"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>

              <nav
                className="driving-view-footer__nav driving-view-footer__nav--dots"
                aria-label="Main sections"
              >
                <div className="driving-view-footer__progress-track">
                  {NAV_ITEMS.map((item, idx) => (
                    <Fragment key={item.id}>
                      {idx > 0 && (
                        <span
                          className={[
                            'driving-view-footer__progress-segment',
                            currentIdx >= idx ? 'is-filled' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-hidden
                        />
                      )}
                      <button
                        type="button"
                        className={[
                          'driving-view-footer__progress-dot',
                          activeNav === item.id ? 'is-active' : '',
                          currentIdx > idx ? 'is-complete' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => goToCheckpoint(item.id)}
                        aria-label={item.label}
                        aria-current={activeNav === item.id ? 'step' : undefined}
                      />
                    </Fragment>
                  ))}
                </div>
              </nav>
            </>
          )}
        </div>

        {isStarted && currentSlide !== null && !currentScreen && (
          <button
            type="button"
            onClick={handleSkip}
            className="driving-view-footer__skip"
          >
            <span>Skip</span>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      )}

      {/* ── Main content area — dashboard panels and screens only ── */}
      <div className="absolute top-0 bottom-24 left-0 right-0" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 driving-view-stage">
          <AnimatePresence>
            {!isStarted && (
              <motion.div
                key="landing-hero"
                className="landing-hero"
                aria-hidden={false}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={LICENSE_PLATE_EXIT_TRANSITION}
              >
                <div
                  className="landing-license-plate"
                  role="img"
                  aria-label="DRIVEN-BY-YOU, your year in review"
                >
                  <div className="landing-license-plate__shadow" aria-hidden />
                  <div className="landing-license-plate__rim" aria-hidden />
                  <div className="landing-license-plate__surface">
                    <div className="landing-license-plate__header">
                      <span className="landing-license-plate__jurisdiction">AUTO CARE</span>
                      <div className="landing-license-plate__sticker" aria-hidden>
                        <span className="landing-license-plate__sticker-shine" />
                        <span className="landing-license-plate__sticker-month">June</span>
                        <span className="landing-license-plate__sticker-year">2026</span>
                      </div>
                    </div>
                    <div className="landing-license-plate__body">
                      <div className="landing-license-plate__copy">
                        <h1 className="landing-license-plate__title">DRIVEN-BY-YOU</h1>
                        <p className="landing-license-plate__subtitle">your year in review</p>
                      </div>
                    </div>
                  </div>
                  <div className="landing-license-plate__chrome" aria-hidden />
                  <span className="landing-license-plate__bolt landing-license-plate__bolt--tl" aria-hidden />
                  <span className="landing-license-plate__bolt landing-license-plate__bolt--tr" aria-hidden />
                  <span className="landing-license-plate__bolt-hole landing-license-plate__bolt-hole--bl" aria-hidden />
                  <span className="landing-license-plate__bolt-hole landing-license-plate__bolt-hole--br" aria-hidden />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showDashboardPanel && (
            <DashboardPanel
              key={`dashboard-${dashboardEpoch}-${
                currentScreen === 'hood'
                  ? `hood-${hoodSession}`
                  : currentScreen ?? 'pre-journey'
              }`}
              report={report}
              journeySections={journeySections}
              isLanding={!isStarted}
              currentSlide={currentSlide}
              onBack={handleSlideBack}
              onNext={handleSlideNext}
              onStart={handleStart}
              isJourney={currentScreen === 'journey'}
              isHood={currentScreen === 'hood'}
              hoodPhase={hoodPhase}
              hoodSession={hoodSession}
              onHoodPhaseChange={setHoodPhase}
              onGoToHood={handleGoToHood}
              hoodEntryPhase={hoodEntryPhase}
              hoodNavTransition={hoodNavTransition}
              onDashboardExitComplete={handleDashboardExitComplete}
              onHoodPanelRiseComplete={handleHoodPanelRiseComplete}
              onHoodPanelFallComplete={handleHoodPanelFallComplete}
              onHoodNavTransitionMidpoint={handleHoodNavTransitionMidpoint}
              onHoodNavTransitionComplete={handleHoodNavTransitionComplete}
              onRequestStandardsToTireTransition={beginStandardsToTireTransition}
              onRequestTireToStandardsTransition={beginTireToStandardsTransition}
              onFinishTireSequence={beginDiagnosticsFromTires}
              onBackToJourney={handleBackToJourneyEnd}
              journeyInitialSectionIdx={journeyResumeSectionIdx}
              journeyInitialGpsPhase={journeyResumeGpsPhase}
              onPanelRef={assignDashboardPanelRef}
            />
          )}

          {isDiagnosticsFlow && diagnosticsStage === 'transition' && <DiagnosticsTransition />}
          {isDiagnosticsFlow && diagnosticsStage === 'final' && <FinalScenePlaceholder />}
          {currentScreen === 'diagnostics' && diagnosticsStage === 'full' && (
            <FullDiagnostics onBackToStart={handleRestart} report={report} />
          )}
        </div>
      </div>
    </div>
  );
}
