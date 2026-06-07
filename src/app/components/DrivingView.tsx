import { useState, useEffect, useCallback, useRef, useLayoutEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, LayoutGroup, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import drivingAnimationData from '../../imports/driving-animation-background.json';
import { JourneyCounterGauge } from './JourneyCounterGauge';
import { CommunityLogoGauge } from './CommunityLogoGauge';
import { JourneyNavMapAnimation } from './JourneyNavMapAnimation';
import {
  GpsPopupContent,
  BAR_FILL_MAX,
  WEBINAR_HOURS_MAX,
  TURN_RIGHT_PATH,
} from './GpsNavPopupContent';
import {
  DashboardHoodArch,
  DashboardPanelArch,
  isTirePhase,
  type HoodNavTransition,
  type HoodPhase,
} from './MapSimulation';
import hourglassIcon from '../../assets/hourglass-duotone-solid-full.png';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import { FullDiagnosticsPanel } from './FullDiagnosticsPanel';

const BRAND_ORANGE = '#f3901d';

const INTRO_WELCOME_GREETING = 'Welcome,';
const INTRO_WELCOME_COMPANY = 'Dayco Incorporated';

const STARS = Array.from({ length: 90 }, (_, i) => ({
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

// ── Under the Hood: oil pour + dipstick animation ─────────────────────────────
function UnderTheHood({ embedded = false }: { embedded?: boolean }) {
  const oilOp = useMotionValue(0);
  const funnelLevel = useMotionValue(0);
  const dipY = useMotionValue(-330);
  const revealOp = useMotionValue(0);
  const oilMarkOp = useMotionValue(0);

  const cleanRodOp = useTransform(oilMarkOp, v => 1 - v);
  const oilSecOp = useTransform(oilOp, v => v * 0.6);
  const funnelOilTranslateY = useTransform(funnelLevel, v => 268 - v * 120);

  useEffect(() => {
    let stopped = false;
    (async () => {
      await new Promise<void>(r => setTimeout(r, 600));
      if (stopped) return;

      animate(oilOp, 1, { duration: 0.4 });
      await animate(funnelLevel, 0.55, { duration: 2.4, ease: [0.4, 0, 1, 1] });
      if (stopped) return;

      await animate(oilOp, 0, { duration: 0.4 });
      await new Promise<void>(r => setTimeout(r, 700));
      if (stopped) return;

      await animate(dipY, 0, { duration: 1.5, ease: [0.4, 0, 0.2, 1] });
      if (stopped) return;
      await new Promise<void>(r => setTimeout(r, 800));

      await animate(dipY, -195, { duration: 1.2, ease: [0.4, 0, 0.2, 1] });
      if (stopped) return;

      animate(oilMarkOp, 1, { duration: 0.7 });
      await animate(revealOp, 1, { duration: 0.9, delay: 0.3 });
    })();
    return () => { stopped = true; };
  }, []);

  const animationBlock = (
    <div className={`flex flex-col items-center justify-center gap-3 ${embedded ? 'h-full w-full py-2' : 'flex-1'}`}>
        <div className={`uth-animation-stage${embedded ? ' uth-animation-stage--embedded' : ''}`}>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 370">
            <defs>
              <linearGradient id="uthSurf" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#4a5568" />
                <stop offset="100%" stopColor="#1a202c" />
              </linearGradient>
              <linearGradient id="uthFunnel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5a6a7a" />
                <stop offset="40%" stopColor="#90a3b2" />
                <stop offset="70%" stopColor="#6a7a8a" />
                <stop offset="100%" stopColor="#4a5a6a" />
              </linearGradient>
              <linearGradient id="uthOil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f3a040" />
                <stop offset="100%" stopColor="#a05818" />
              </linearGradient>
              <clipPath id="uthFunnelClip">
                <path d="M 100 148 L 162 268 L 198 268 L 260 148 Z" />
              </clipPath>
            </defs>

            <rect x="0" y="266" width="360" height="104" fill="url(#uthSurf)" />
            <line x1="0" y1="266" x2="360" y2="266" stroke="#6a7a8a" strokeWidth="2.5" />
            {[282, 300, 320, 342].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="360" y2={y} stroke="#252e3a" strokeWidth="1" opacity="0.6" />
            ))}

            <path d="M 100 148 L 162 268 L 198 268 L 260 148 Z" fill="url(#uthFunnel)" />

            <motion.rect
              x="98" y={0} width="164" height={200}
              fill="url(#uthOil)" opacity={0.88}
              clipPath="url(#uthFunnelClip)"
              style={{ y: funnelOilTranslateY }}
            />

            <ellipse cx="180" cy="148" rx="80" ry="16" fill="#8090a0" />
            <ellipse cx="180" cy="148" rx="65" ry="10" fill="#354555" />
            <ellipse cx="180" cy="148" rx="57" ry="6" fill="#1a2835" />
            <path d="M 240 145 A 80 16 0 0 1 260 148" stroke="#b8cad8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 104 154 L 165 264" stroke="#9eaeba" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            <path d="M 256 154 L 196 264" stroke="#384858" strokeWidth="2" strokeLinecap="round" opacity="0.25" />

            <ellipse cx="180" cy="268" rx="20" ry="5" fill="#0a0f18" />
            <rect x="174" y="268" width="12" height="26" fill="#4a5a6a" />
            <rect x="176" y="268" width="4" height="26" fill="#6a7a8a" opacity="0.4" />

            <motion.path
              d="M 258 60 Q 226 95 184 145"
              stroke="#f3901d"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
              style={{ opacity: oilOp }}
            />
            <motion.path
              d="M 254 64 Q 222 98 181 148"
              stroke="#c07010"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              style={{ opacity: oilSecOp }}
            />
          </svg>

          <div
            className="absolute pointer-events-none"
            style={{
              right: '8px',
              top: '0px',
              transform: 'rotate(-42deg)',
              transformOrigin: 'bottom left',
              width: '76px',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-6 h-3 rounded-t-md bg-[#f3901d]" />
              <div className="w-6 h-5 bg-gray-700 border-x border-gray-600" />
              <div
                className="w-[68px] h-[88px] bg-[#2a3848] border border-gray-600 rounded-b-lg relative overflow-hidden flex items-center justify-center"
              >
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f3901d]/20" />
                <div className="relative z-10 bg-gray-100 rounded text-center px-1 py-0.5">
                  <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#1a1a2e' }}>Data</div>
                  <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#1a1a2e' }}>Standards</div>
                  <div style={{ fontSize: '6px', color: '#c97010' }}>autocare</div>
                </div>
                <div className="absolute left-1.5 top-1 bottom-1 w-[3px] bg-white/10 rounded-full" />
              </div>
            </div>
          </div>

          <motion.div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ top: '148px', y: dipY, zIndex: 10 }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full border-4 border-gray-300 bg-gray-600 flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>

              <div className="relative flex justify-center mt-0.5">
                <div className="absolute left-5 top-[2px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-400 mr-1" />
                  <span style={{ fontSize: '8px', color: '#d1d5db', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SUPER SPEC</span>
                </div>
                <div className="absolute left-5 top-[38px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-400 mr-1" />
                  <span style={{ fontSize: '8px', color: '#d1d5db', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ISHOP</span>
                </div>
                <div
                  className="w-[7px] h-[72px] rounded-sm"
                  style={{
                    background: 'linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%)',
                    boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.4)',
                  }}
                />
              </div>

              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute right-4 flex items-center gap-0.5"
                  style={{ opacity: oilMarkOp }}
                >
                  <span style={{ fontSize: '8px', color: BRAND_ORANGE, fontWeight: 'bold', whiteSpace: 'nowrap' }}>50%</span>
                  <div className="w-3 h-[1.5px] bg-[#f3901d]" />
                </motion.div>
                <div className="w-[11px] h-[3px] rounded-full bg-[#f3901d]" />
              </div>

              <div className="relative flex justify-center">
                <div className="absolute left-5 top-[8px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-500 mr-1" />
                  <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PIES</span>
                </div>
                <div className="absolute left-5 top-[50px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-500 mr-1" />
                  <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ACES</span>
                </div>
                <motion.div
                  className="w-[7px] h-[72px] rounded-sm absolute"
                  style={{
                    background: 'linear-gradient(180deg, #d08828 0%, #9e6018 55%, #7a4810 100%)',
                    opacity: oilMarkOp,
                  }}
                />
                <motion.div
                  className="w-[7px] h-[72px] rounded-sm absolute"
                  style={{
                    background: 'linear-gradient(180deg, #d1d5db, #9ca3af)',
                    opacity: cleanRodOp,
                  }}
                />
                <div className="w-[7px] h-[72px]" />
              </div>

              <div className="w-[5px] h-5 bg-gray-400 rounded-b-full" />
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center px-4" style={{ opacity: revealOp }}>
          <p className={`text-[#f3901d] font-bold ${embedded ? 'text-base' : 'text-xl'}`}>you have 50% of the standards!</p>
          <p className="text-gray-500 text-xs mt-1 tracking-wide">Subscribe to more standards to fill up your dipstick</p>
        </motion.div>
    </div>
  );

  if (embedded) {
    return (
      <motion.div
        className="uth-embedded h-full w-full flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="shrink-0 text-center py-1">
          <h2 className="text-[#f3901d] text-lg font-bold">Under the Hood</h2>
          <p className="text-gray-400 text-xs mt-0.5">Your Standards Inventory</p>
        </div>
        {animationBlock}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-[80px] px-6 py-4 bg-gray-800/30 text-center shrink-0">
        <h2 className="text-[#f3901d] text-2xl font-bold">Under the Hood</h2>
        <p className="text-gray-400 text-sm mt-0.5">Your Standards Inventory</p>
      </div>
      {animationBlock}
    </motion.div>
  );
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
function FullDiagnostics({ onBackToStart }: { onBackToStart: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <FullDiagnosticsPanel onBackToStart={onBackToStart} />
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
}: {
  onClick?: () => void;
  inactive?: boolean;
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
        <span className="landing-push-start__year">2026</span>
        <span className="landing-push-start__divider" aria-hidden />
        <span className="landing-push-start__action">Start</span>
      </span>
    </button>
  );
}

function PreJourneyStage({
  phase,
  currentSlide,
  onStart,
  onBack,
  onNext,
}: {
  phase: 'landing' | 'intro';
  currentSlide: number;
  onStart: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const startFloatRef = useRef<HTMLDivElement>(null);
  const isMobileLayout = useIsCounterMobile();
  const startLeftRatio = phase === 'intro' && !isMobileLayout ? 0.21 : 0.5;
  const showStartButton = !(isMobileLayout && phase === 'intro');
  const [startButtonLeftPx, setStartButtonLeftPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const startFloat = startFloatRef.current;
    if (!stage || !startFloat || !showStartButton) return;

    const syncStartPosition = () => {
      const stageWidth = stage.clientWidth;
      const buttonWidth = startFloat.offsetWidth;
      setStartButtonLeftPx(stageWidth * startLeftRatio - buttonWidth / 2);
    };

    syncStartPosition();
    const observer = new ResizeObserver(syncStartPosition);
    observer.observe(stage);
    observer.observe(startFloat);
    return () => observer.disconnect();
  }, [startLeftRatio, showStartButton]);

  return (
    <div
      ref={stageRef}
      className={[
        'pre-journey-stage',
        phase === 'intro' ? 'pre-journey-stage--intro' : 'pre-journey-stage--landing',
      ].join(' ')}
    >
      {showStartButton ? (
        <motion.div
          ref={startFloatRef}
          className="pre-journey-stage__start-float"
          initial={false}
          animate={{
            left: startButtonLeftPx ?? '50%',
            x: startButtonLeftPx == null ? '-50%' : 0,
            y: '-50%',
          }}
          style={{ top: '50%' }}
          transition={INTRO_START_BUTTON_TRANSITION}
        >
          <StartButton onClick={onStart} inactive={phase === 'intro'} />
        </motion.div>
      ) : null}
      <AnimatePresence>
        {phase === 'intro' ? (
          <motion.div
            className="pre-journey-stage__intro-col"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ ...INTRO_LAYOUT_TRANSITION, delay: 0.08 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="pre-journey-stage__intro-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: INTRO_LAYOUT_TRANSITION.ease }}
              >
                <div className="intro-slide__back">
                  <button
                    type="button"
                    className="intro-slide__back-btn"
                    onClick={onBack}
                    disabled={currentSlide === 0}
                    aria-label="previous slide"
                  >
                    <svg viewBox="0 0 640 640" fill="#F3901D" aria-hidden>
                      <path d={TURN_RIGHT_PATH} />
                    </svg>
                  </button>
                  <span className="intro-slide__back-label">back</span>
                </div>
                <div className="pre-journey-stage__intro-text">
                  {currentSlide === 0 ? (
                    <div className="intro-slide__welcome">
                      <p className="intro-slide__text">{INTRO_WELCOME_GREETING}</p>
                      <p className="intro-slide__text intro-slide__text--company">
                        {INTRO_WELCOME_COMPANY}
                      </p>
                    </div>
                  ) : (
                    <p className="intro-slide__text">
                      {FOLLOW_UP_SLIDE_TEXTS[currentSlide - 1]}
                    </p>
                  )}
                </div>
                <div className="intro-slide__next">
                  <button
                    type="button"
                    className="intro-slide__next-btn"
                    onClick={onNext}
                    aria-label="next slide"
                  >
                    <svg viewBox="0 0 640 640" fill="#F3901D" aria-hidden>
                      <path d={TURN_RIGHT_PATH} />
                    </svg>
                  </button>
                  <span className="intro-slide__next-label">next</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Nav row sits 20px below the arch peak (which is at the panel's very top center).
const NAV_TOP = '20px';
// Text area: nav top (20px) + nav height (arrow size) + 45px gap (25px original + 20px extra)
const TEXT_TOP = 'calc(20px + clamp(28px, 3.5vw, 36px) + 45px)';
const COUNTER_MOBILE_BREAKPOINT = 640;

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
type JourneySection =
  | {
      type: 'counter';
      subtitle: string;
      target: number;
      label: string;
      labelLines?: string[];
      /** Speedometer (default), fuel, battery, or AWDA community logo button. */
      gaugeVariant?: 'speedometer' | 'fuel' | 'battery' | 'community-logo';
      footerMessage?: string;
      footerButton?: { label: string; href: string };
    }
  | {
      type: 'nav';
      navMessage: string;
      navButton?: { label: string; href: string };
      webinarsMessage: string;
      webinarsButton: { label: string; href: string };
    };

const JOURNEY_SECTIONS: JourneySection[] = [
  {
    type: 'counter',
    subtitle: 'Membership Tenure',
    target: 56,
    label: 'years',
    footerMessage:
      "Thank you for your longstanding support! You're continuing a legacy of industry participation",
  },
  {
    type: 'counter',
    subtitle: 'Active Contacts',
    target: 87,
    label: 'active contacts',
    gaugeVariant: 'fuel',
    footerMessage:
      "Your organization is killing it! Don't forget you've got unlimited seats available in your membership",
    footerButton: { label: 'sign up team members', href: 'https://my.autocare.org' },
  },
  {
    type: 'counter',
    subtitle: 'Community Membership',
    target: 88,
    label: 'community members',
    gaugeVariant: 'community-logo',
    footerMessage:
      "WOW! You're one of our most active participants in Auto Care communities, driving our industry forward.",
    footerButton: { label: 'explore all communities', href: 'https://autocare.org/' },
  },
  {
    type: 'counter',
    subtitle: 'Committee Membership',
    target: 1,
    label: 'committee members',
    gaugeVariant: 'battery',
    footerMessage:
      'Do you want to influence the future of our industry, solve challenges and capitalize on opportunities?',
    footerButton: {
      label: 'explore our committees',
      href: 'https://autocare.org/committees',
    },
  },
  {
    type: 'nav',
    navMessage:
      "We'd love to see more of you! Our Events are the easiest way to get fresh education, make new connections, and reinforce business relationships.",
    navButton: { label: 'see upcoming events', href: 'https://autocare.org/events' },
    webinarsMessage:
      'Are there other employees who could benefit from our robust library of on-demand content?',
    webinarsButton: { label: 'browse webinar library', href: 'https://autocare.org/education' },
  },
];

/** Last journey section (GPS / events nav) and arrived phase before Under the Hood. */
const JOURNEY_NAV_SECTION_INDEX = JOURNEY_SECTIONS.length - 1;
const JOURNEY_END_GPS_PHASE = 4;

const JOURNEY_COUNTER_PANEL_HEIGHT = 419;
const JOURNEY_MAP_PANEL_MAX_HEIGHT = 520;
const DRIVING_FOOTER_HEIGHT_PX = 96;
const DRIVING_DEFAULT_DASHBOARD_HEIGHT_PX = 316;
const DRIVING_DEFAULT_BACKDROP_BOTTOM_PX =
  DRIVING_DEFAULT_DASHBOARD_HEIGHT_PX + DRIVING_FOOTER_HEIGHT_PX;
const JOURNEY_SCENE_TRANSITION = {
  duration: 0.55,
  ease: [0.4, 0, 0.2, 1] as const,
};
const JOURNEY_SCENE_MS = Math.round(JOURNEY_SCENE_TRANSITION.duration * 1000);
const JOURNEY_SCENE_SLIDE_TRANSITION = {
  duration: 0.95,
  ease: [0.22, 1, 0.36, 1] as const,
};
const JOURNEY_SCENE_SLIDE_MS = Math.round(JOURNEY_SCENE_SLIDE_TRANSITION.duration * 1000);

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
  if (visiblePopupPhase === 2) return [2];
  if (visiblePopupPhase === 3) return [3];
  return [];
}

function JourneyNavCalculatingOverlay({
  dotCount,
  fading,
}: {
  dotCount: number;
  fading: boolean;
}) {
  return (
    <motion.div
      className="journey-nav-calculating"
      aria-live="polite"
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="journey-nav-calculating__card">
        <div className="journey-nav-calculating__icon" aria-hidden>
          <img
            src={hourglassIcon}
            alt=""
            className="gps-icon-turn gps-icon-hourglass--loading"
            width={32}
            height={32}
          />
        </div>
        <div className="journey-nav-calculating__text">
          <p className="journey-nav-calculating__title">
            {`calculating${'.'.repeat(dotCount)}`}
          </p>
          <p className="journey-nav-calculating__subtitle">event attendance</p>
        </div>
      </div>
    </motion.div>
  );
}

type ArrivalStep = 'arrived' | 'rerouting';

function JourneyNavArrivalOverlay({
  step,
  onNext,
  onBack,
  onRestartSequence,
}: {
  step: ArrivalStep;
  onNext: () => void;
  onBack: () => void;
  onRestartSequence: () => void;
}) {
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
                ? 'Being at aapex is the #1 way to not only stay connected and forge new business.'
                : 'Thank you for Attending AAPEX 2025'}
            </p>
            <div className="journey-nav-arrival__actions">
              {isRerouting ? (
                <>
                  <button
                    type="button"
                    className="journey-nav-arrival__btn journey-nav-arrival__btn--back"
                    onClick={onBack}
                  >
                    back
                  </button>
                  <a
                    href="https://AAPEXshows.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="journey-nav-arrival__btn journey-nav-arrival__btn--aapex"
                  >
                    AAPEX 2026
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="journey-nav-arrival__btn journey-nav-arrival__btn--back"
                    onClick={onRestartSequence}
                  >
                    back
                  </button>
                  <button
                    type="button"
                    className="journey-nav-arrival__btn journey-nav-arrival__btn--next"
                    onClick={onNext}
                  >
                    next
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JourneyNavHoodNextPopup({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      className="journey-nav-hood-next"
      initial={{ opacity: 0, y: 56, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <button type="button" className="journey-nav-hood-next__btn" onClick={onNext}>
        next
      </button>
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

const CALCULATING_VISIBLE_MS = 3000;
const CALCULATING_FADE_MS = 500;
const EVENT_BAR_FILL_MS = 2000;
const GPS_POPUP_EXIT_MS = 500;

function GpsNavSection({
  onGoToHood,
  onGoBack,
  initialPhase = 1,
  uiSceneMotion,
}: {
  onGoToHood: () => void;
  onGoBack: () => void;
  initialPhase?: number;
  uiSceneMotion?: {
    initial: { opacity: number };
    animate: { opacity: number };
    exit: { opacity: number };
    transition: typeof JOURNEY_SCENE_TRANSITION;
  };
}) {
  const [phase, setPhase] = useState(initialPhase);
  const [dotCount, setDotCount] = useState(1);
  const [barW, setBarW] = useState(initialPhase >= 2 ? BAR_FILL_MAX : 0);
  const [hoursCount, setHoursCount] = useState(
    initialPhase >= 3 ? WEBINAR_HOURS_MAX : 0,
  );
  const [popupMinimized, setPopupMinimized] = useState(false);
  const [calculatingFadeOut, setCalculatingFadeOut] = useState(false);
  const [arrivalStep, setArrivalStep] = useState<ArrivalStep>('arrived');
  const [mapReplayKey, setMapReplayKey] = useState(0);
  const [leavingForHood, setLeavingForHood] = useState(false);
  const [visiblePopupPhase, setVisiblePopupPhase] = useState<number | null>(
    initialPhase >= 3 ? 3 : 2,
  );
  const [exitingToArrival, setExitingToArrival] = useState(false);

  useEffect(() => {
    if (exitingToArrival) return;
    if (phase === 3) setVisiblePopupPhase(3);
    else if (phase >= 2) setVisiblePopupPhase(2);
    else if (phase === 1 && initialPhase === 1) setVisiblePopupPhase(2);
    else setVisiblePopupPhase(null);
  }, [phase, exitingToArrival, initialPhase]);

  useEffect(() => {
    if (phase !== 1) return;
    setCalculatingFadeOut(false);
    setDotCount(1);
    const iv = setInterval(() => setDotCount(d => (d === 3 ? 1 : d + 1)), 400);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (initialPhase !== 1 || phase !== 1) return;
    const fadeTimer = window.setTimeout(() => setCalculatingFadeOut(true), CALCULATING_VISIBLE_MS);
    const advanceTimer = window.setTimeout(
      () => {
        window.dispatchEvent(new CustomEvent('journey-nav-map-repaint'));
        setPhase(2);
      },
      CALCULATING_VISIBLE_MS + CALCULATING_FADE_MS,
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [phase, initialPhase]);

  useEffect(() => {
    if (phase !== 2) return;
    if (initialPhase >= 2 && mapReplayKey === 0) return;
    setBarW(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / EVENT_BAR_FILL_MS, 1);
      setBarW(Math.round((1 - Math.pow(1 - p, 3)) * BAR_FILL_MAX));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, initialPhase, mapReplayKey]);

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
      setHoursCount(Math.round((1 - Math.pow(1 - p, 3)) * WEBINAR_HOURS_MAX));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, initialPhase, mapReplayKey]);

  const handleGoToHoodWithTransition = () => {
    setLeavingForHood(true);
    setPopupMinimized(true);
    onGoToHood();
  };

  const handleRestartSequence = useCallback(() => {
    setArrivalStep('arrived');
    setPopupMinimized(false);
    setExitingToArrival(false);
    setLeavingForHood(false);
    setHoursCount(0);
    setCalculatingFadeOut(false);
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
      setPhase(2);
      return;
    }
    if (phase === 2) {
      onGoBack();
    }
  };

  const handleAdvance = () => {
    if (phase === 2) {
      setPhase(3);
      return;
    }
    if (phase === 3 && !exitingToArrival) {
      setExitingToArrival(true);
      setVisiblePopupPhase(null);
    }
  };

  const handleGpsPopupExitComplete = () => {
    if (!exitingToArrival) return;
    setExitingToArrival(false);
    setPhase(4);
  };

  const attendanceDetailsReady = barW >= BAR_FILL_MAX;
  const webinarDetailsReady = hoursCount >= WEBINAR_HOURS_MAX;
  const canAdvance =
    (phase === 2 && attendanceDetailsReady) || (phase === 3 && webinarDetailsReady);
  const advanceLabel = gpsAdvanceLabel(phase);
  const showCornerNav =
    phase >= 2 && visiblePopupPhase !== null && !exitingToArrival && phase < 4;
  const evtPct = Math.round(barW);
  const showCalculating = phase === 1 && initialPhase === 1;
  const showArrivalOverlay = phase === 4 && !leavingForHood;
  const showHoodNextPopup = phase === 4 && arrivalStep === 'rerouting' && !leavingForHood;
  const showPopupStack = visiblePopupPhase !== null && !popupMinimized;
  const popupRevealed = phase >= 2 && !exitingToArrival;
  const stackedPopupPhases = showPopupStack
    ? getJourneyNavStackPhases(visiblePopupPhase)
    : [];
  const showNavControls = phase >= 1 && phase < 4;
  const resolvePopupDetailsReady = (popupPhase: number) =>
    popupPhase === 2 ? attendanceDetailsReady : webinarDetailsReady;
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
        <JourneyNavMapAnimation key={mapReplayKey} />
      </div>

      {showCalculating && (
        <JourneyNavCalculatingOverlay dotCount={dotCount} fading={calculatingFadeOut} />
      )}

      <AnimatePresence>
        {showArrivalOverlay && (
          <JourneyNavArrivalOverlay
            key="journey-nav-arrival"
            step={arrivalStep}
            onNext={() => setArrivalStep('rerouting')}
            onBack={() => setArrivalStep('arrived')}
            onRestartSequence={handleRestartSequence}
          />
        )}
      </AnimatePresence>

      {showHoodNextPopup && (
        <JourneyNavHoodNextPopup onNext={handleGoToHoodWithTransition} />
      )}

      <motion.div
        className="journey-nav-ui"
        {...uiMotion}
        animate={{ opacity: phase < 4 ? 1 : 0 }}
        transition={{ duration: GPS_POPUP_EXIT_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      >
        {showNavControls && (
        <AnimatePresence mode="wait" initial={false} onExitComplete={handleGpsPopupExitComplete}>
          {showPopupStack && (
            <motion.div
              key="journey-nav-popup-row"
              className={[
                'journey-nav-popup-row',
                popupRevealed ? '' : 'journey-nav-popup-row--pregame',
              ]
                .filter(Boolean)
                .join(' ')}
              initial={false}
              exit={{ opacity: 0 }}
              transition={{ duration: GPS_POPUP_EXIT_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            >
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
                            popupRevealed ? { opacity: 0, x: 48, y: 0, scale: 0.96 } : false
                          }
                          animate={
                            popupRevealed
                              ? { opacity: 1, x: 0, y: 0, scale: 1 }
                              : { opacity: 0, x: 0, y: 0, scale: 1 }
                          }
                          exit={{ opacity: 0, x: 28, y: 0, scale: 0.94 }}
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
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </LayoutGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
        {showCornerNav && (
          <JourneyNavCornerNav
            onBack={handleNavBack}
            onNext={handleAdvance}
            nextLabel={advanceLabel}
            nextDisabled={!canAdvance}
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

type CounterSection = Extract<JourneySection, { type: 'counter' }>;

function JourneySectionCounterGauge({
  section,
  sectionIdx,
  counterMobilePhase,
  renderStatBelow,
  hideStatBelow,
}: {
  section: CounterSection;
  sectionIdx: number;
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
    hideStatBelow,
    renderStatBelow,
  };

  if (section.gaugeVariant === 'community-logo') {
    return (
      <CommunityLogoGauge
        {...sharedProps}
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
}: {
  onSectionChange?: (idx: number) => void;
  onGoToHood: () => void;
  initialSectionIdx?: number;
  initialGpsPhase?: number;
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

  const section = JOURNEY_SECTIONS[sectionIdx];
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

  // Nav + counter scenes — horizontal slide between committee and map
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
        className="journey-layout journey-layout--nav journey-scene-layer"
        {...mapSceneMotion}
      >
        <main className="journey-layout__main journey-layout__main--nav">
          <div className="journey-layout__nav-stage">
            <GpsNavSection
              key={`${sectionIdx}-${initialGpsPhase}`}
              initialPhase={initialGpsPhase}
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
                        <div className="journey-counter-panel__stat-row">
                          <div className="journey-counter-panel__chev journey-counter-panel__chev--left">
                            <JourneyGaugeChevron
                              direction="left"
                              onClick={handleCounterMobileLeftChevron}
                              ariaLabel="back to gauge readout"
                            />
                          </div>
                          {section.footerMessage ? (
                            <p className="journey-counter-panel__message journey-counter-panel__message--mobile-stat">
                              {section.footerMessage}
                            </p>
                          ) : null}
                          <div className="journey-counter-panel__chev journey-counter-panel__chev--right">
                            <JourneyGaugeChevron
                              direction="right"
                              onClick={goToNextCounterSection}
                            />
                          </div>
                        </div>
                        {section.footerButton ? (
                          <div className="journey-counter-panel__footer journey-counter-panel__footer--mobile-inline">
                            <a
                              className="journey-layout__counter-cta"
                              href={section.footerButton.href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {section.footerButton.label}
                            </a>
                          </div>
                        ) : (
                          <div
                            className="journey-counter-panel__footer journey-counter-panel__footer--mobile-inline"
                            aria-hidden
                          >
                            <span className="journey-counter-panel__footer-placeholder" />
                          </div>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <JourneySectionSubtitle sectionIdx={sectionIdx} subtitle={section.subtitle} />
                  <JourneySectionCounterGauge section={section} sectionIdx={sectionIdx} />
                </>
              )}
            </section>
            {!isCounterMobile ? (
              <section className="journey-counter-panel__aside" aria-label="Journey message">
                <div className="journey-counter-panel__message-row">
                  <div className="journey-counter-panel__chev journey-counter-panel__chev--left">
                    {isFirst ? (
                      <span className="journey-layout__chev-placeholder" aria-hidden />
                    ) : (
                      <JourneyGaugeChevron
                        direction="left"
                        onClick={() => changeSectionIdx((i) => i - 1)}
                      />
                    )}
                  </div>
                  {section.footerMessage ? (
                    <p className="journey-counter-panel__message">{section.footerMessage}</p>
                  ) : null}
                  <div className="journey-counter-panel__chev journey-counter-panel__chev--right">
                    <JourneyGaugeChevron
                      direction="right"
                      onClick={() => changeSectionIdx((i) => i + 1)}
                    />
                  </div>
                </div>
                {section.footerButton ? (
                  <div className="journey-counter-panel__footer">
                    <a
                      className="journey-layout__counter-cta"
                      href={section.footerButton.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {section.footerButton.label}
                    </a>
                  </div>
                ) : (
                  <div className="journey-counter-panel__footer" aria-hidden>
                    <span className="journey-counter-panel__footer-placeholder" />
                  </div>
                )}
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
  const journeySection = isJourney ? JOURNEY_SECTIONS[journeySectionIdx] : null;
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
  const [mapPanelHeight, setMapPanelHeight] = useState(JOURNEY_MAP_PANEL_MAX_HEIGHT);
  const journeyResizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResizingJourneyPanel, setIsResizingJourneyPanel] = useState(false);
  const [journeyResizeTarget, setJourneyResizeTarget] = useState<'counter' | 'map' | null>(
    null,
  );
  const journeyPanelActive = isJourney && (isCounterScene || isMapScene);
  const journeyPanelLayout: 'counter' | 'map' | null = !isJourney
    ? null
    : isResizingJourneyPanel && journeyResizeTarget != null
      ? journeyResizeTarget
      : isMapScene
        ? 'map'
        : 'counter';
  const applyMapPanelLayout = journeyPanelLayout === 'map';
  const applyCounterPanelLayout = journeyPanelLayout === 'counter';
  const isJourneySceneTransition =
    isResizingJourneyPanel &&
    (journeyResizeTarget === 'map' || journeyResizeTarget === 'counter');
  const journeyPanelHeight = journeyPanelActive
    ? journeyPanelLayout === 'map'
      ? mapPanelHeight
      : JOURNEY_COUNTER_PANEL_HEIGHT
    : undefined;

  const measureMapPanelHeight = useCallback(() => {
    const container = panelRef.current?.parentElement;
    if (!container) return JOURNEY_MAP_PANEL_MAX_HEIGHT;
    return Math.min(JOURNEY_MAP_PANEL_MAX_HEIGHT, container.clientHeight - 10);
  }, []);

  const beginJourneyPanelResize = useCallback(
    (target: 'counter' | 'map') => {
      if (target === 'map') {
        setMapPanelHeight(measureMapPanelHeight());
      }
      setJourneyResizeTarget(target);
      setIsResizingJourneyPanel(true);
      if (journeyResizeTimerRef.current) {
        window.clearTimeout(journeyResizeTimerRef.current);
      }
      journeyResizeTimerRef.current = window.setTimeout(() => {
        journeyResizeTimerRef.current = null;
        setIsResizingJourneyPanel(false);
        setJourneyResizeTarget(null);
      }, JOURNEY_SCENE_SLIDE_MS + 80);
    },
    [measureMapPanelHeight],
  );

  const handleJourneySectionChange = useCallback(
    (idx: number) => {
      const prev = journeySectionIdx;
      const enteringMap =
        JOURNEY_SECTIONS[idx]?.type === 'nav' &&
        JOURNEY_SECTIONS[prev]?.type === 'counter' &&
        prev !== idx;
      const exitingMap =
        JOURNEY_SECTIONS[idx]?.type === 'counter' &&
        JOURNEY_SECTIONS[prev]?.type === 'nav' &&
        prev !== idx;
      if (enteringMap) {
        beginJourneyPanelResize('map');
      } else if (exitingMap) {
        beginJourneyPanelResize('counter');
      }
      setJourneySectionIdx(idx);
    },
    [journeySectionIdx, beginJourneyPanelResize],
  );

  useEffect(
    () => () => {
      if (journeyResizeTimerRef.current) {
        window.clearTimeout(journeyResizeTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isMapScene || isResizingJourneyPanel) return;
    window.dispatchEvent(new CustomEvent('journey-nav-map-enter-complete'));
  }, [isMapScene, isResizingJourneyPanel]);
  const panelAnimate = isDashboardExiting
    ? { y: '115%', opacity: 1 }
    : isHoodPanelFalling
      ? { y: '115%', opacity: 1 }
    : isHoodPanelRising
      ? { y: 0, opacity: 1 }
      : journeyPanelActive && journeyPanelHeight != null
        ? { y: 0, opacity: 1, height: journeyPanelHeight }
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
          height: journeyPanelActive
            ? isResizingJourneyPanel
              ? JOURNEY_SCENE_SLIDE_TRANSITION
              : { duration: 0 }
            : JOURNEY_SCENE_TRANSITION,
        };
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

  useLayoutEffect(() => {
    if (!isJourney) return;
    const panel = panelRef.current;
    const container = panel?.parentElement;
    if (!container) return;

    const updateMapHeight = () => {
      if (isResizingJourneyPanel) return;
      setMapPanelHeight(measureMapPanelHeight());
    };

    updateMapHeight();
    const observer = new ResizeObserver(updateMapHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isJourney, isResizingJourneyPanel, measureMapPanelHeight]);

  return (
    <motion.div
      ref={assignPanelRef}
      layout={journeyPanelActive ? false : undefined}
      className={[
        'dashboard-panel',
        isLanding ? 'dashboard-panel--landing' : '',
        usesPanelArch ? 'dashboard-panel--arch' : '',
        isHood ? 'dashboard-panel--hood' : '',
        applyMapPanelLayout ? 'dashboard-panel--map' : '',
        applyCounterPanelLayout ? 'dashboard-panel--counter' : '',
        journeyPanelActive ? 'dashboard-panel--journey-resize' : '',
        isJourneySceneTransition ? 'dashboard-panel--journey-scene-transition' : '',
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

      {/* Nav row — hidden on Under the Hood */}
      {showDashboardChrome && (
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

          <span className="dashboard-panel__clock">5:55 PM</span>
          <span className="dashboard-panel__weather">53° F</span>

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
      )}

      {/* Body area — hidden on hood (grey arch only) */}
      {!isHood && (
      <div
        className={[
          'dashboard-panel__body',
          isLanding ? 'dashboard-body--landing' : '',
          showPreJourney ? 'dashboard-body--pre-journey' : '',
          isJourney
            ? `dashboard-body--journey${applyMapPanelLayout ? ' dashboard-body--journey-nav' : ''}${applyCounterPanelLayout ? ' dashboard-body--journey-counter' : ''}`
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          isCounterScene || isMapScene
            ? undefined
            : {
                position: 'absolute',
                top: TEXT_TOP,
                left: '8%',
                right: '8%',
                bottom: showPreJourney ? '26%' : isJourney ? '14%' : '26%',
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
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
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

  useLayoutEffect(() => {
    if (!enabled) return;

    let frameId = 0;

    const measure = () => {
      const root = rootRef.current;
      if (!root) return;

      const rootRect = root.getBoundingClientRect();
      const panel = panelRef.current;

      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        setBottomPx(Math.max(DRIVING_FOOTER_HEIGHT_PX, rootRect.bottom - panelRect.top));
        return;
      }

      setBottomPx(DRIVING_FOOTER_HEIGHT_PX);
    };

    measure();

    const tick = () => {
      measure();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    const observer = new ResizeObserver(measure);
    const root = rootRef.current;
    if (root) observer.observe(root);
    if (panelRef.current) observer.observe(panelRef.current);

    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled, panelMounted, rootRef, panelRef]);

  return bottomPx;
}

export function DrivingView() {
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
  const pendingCheckpointRef = useRef<NavCheckpoint | null>(null);
  const drivingRootRef = useRef<HTMLDivElement>(null);
  const dashboardPanelRef = useRef<HTMLDivElement | null>(null);
  const [dashboardPanelMounted, setDashboardPanelMounted] = useState(false);
  const assignDashboardPanelRef = useCallback((node: HTMLDivElement | null) => {
    dashboardPanelRef.current = node;
    setDashboardPanelMounted(!!node);
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
    skyProgress.set(0);
    const controls = animate(skyProgress, 1, SKY_SUNRISE_ANIMATION);
    return () => controls.stop();
  }, [skyRunId, skyProgress]);

  useEffect(() => {
    if (currentScreen === 'journey') {
      skyProgress.set(1);
    }
  }, [currentScreen, skyProgress]);

  const handleRestart = () => {
    setIsStarted(false);
    setCurrentSlide(null);
    setCurrentScreen(null);
    setDiagnosticsStage('full');
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
    setJourneyResumeSectionIdx(JOURNEY_NAV_SECTION_INDEX);
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

  const showFooterNav = currentScreen && diagnosticsStage === 'full';
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
              <Lottie
                animationData={drivingAnimationData}
                loop
                autoplay
                className="driving-view-backdrop__lottie-cutout"
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
                aria-hidden
              />
              <Lottie
                animationData={drivingAnimationData}
                loop
                autoplay
                className="driving-view-backdrop__lottie"
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
              />
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
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black z-50 flex items-center px-4 gap-2">

        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 text-[#f3901d] hover:text-orange-400 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold text-sm">Restart</span>
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">

          {showFooterNav && (
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrev}
                disabled={currentIdx === 0}
                className="w-7 h-7 flex items-center justify-center text-[#f3901d] hover:text-orange-300 disabled:text-gray-700 disabled:cursor-default transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToCheckpoint(item.id)}
                  className="transition-colors text-sm whitespace-nowrap"
                  style={{
                    color: activeNav === item.id ? BRAND_ORANGE : '#6b7280',
                    fontWeight: activeNav === item.id ? 'bold' : 'normal',
                    letterSpacing: activeNav === item.id ? '0.02em' : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={goToNext}
                disabled={currentIdx === screenOrder.length - 1}
                className="w-7 h-7 flex items-center justify-center text-[#f3901d] hover:text-orange-300 disabled:text-gray-700 disabled:cursor-default transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {isStarted && currentSlide !== null && !currentScreen && (
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-gray-500 hover:text-[#f3901d] transition-colors border border-gray-700 hover:border-[#f3901d]/50 rounded px-3 py-1.5 text-sm font-medium shrink-0"
          >
            <span>Skip</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              key={
                currentScreen === 'hood'
                  ? `hood-panel-${hoodSession}`
                  : currentScreen === 'journey'
                    ? 'dashboard-journey'
                    : currentScreen === 'diagnostics'
                      ? 'dashboard-diagnostics'
                      : 'dashboard-pre-journey'
              }
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
            <FullDiagnostics onBackToStart={handleRestart} />
          )}
        </div>
      </div>
    </div>
  );
}
