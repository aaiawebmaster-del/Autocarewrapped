import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import carOnTrackData from '../../imports/Car_on_track.json';
import { JourneyCounterGauge } from './JourneyCounterGauge';
import {
  DashboardMapArch,
  DashboardHoodArch,
  isTirePhase,
  type HoodPhase,
} from './MapSimulation';
import imgAapexLogo from '../../assets/aapex-logo.png';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import { FullDiagnosticsPanel } from './FullDiagnosticsPanel';

const BRAND_ORANGE = '#f3901d';

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: `${(i * 37 + 13) % 100}%`,
  y: `${(i * 23 + 7) % 45}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
  opacity: 0.35 + (i % 6) * 0.1,
}));

const SLIDE_TEXTS = [
  'Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.',
  'This report captures your role in that progress — the events you attended, the insights you gained, the voices you amplified, and the initiatives you supported.',
  "Your engagement matters. Your impact multiplies.\n\nHere's your year with Auto Care in motion.",
];

const DRIVING_SLIDE_COUNT = SLIDE_TEXTS.length;
const SUN_RISE_BOTTOM_Y = 60;
const SUN_RISE_TOP_Y = -220;
const SKY_STEP_ANIMATION = { duration: 0.85, ease: [0.4, 0, 0.2, 1] as const };

/** 3 slides → sky/sun progress 0, ½, 1 */
function skyProgressForSlide(slideIndex: number) {
  if (DRIVING_SLIDE_COUNT <= 1) return 1;
  return slideIndex / (DRIVING_SLIDE_COUNT - 1);
}

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

// Lottie canvas: 1600×1080. Horizon (sky/tree boundary) ≈ y=486 → r=0.45.
// With xMidYMax slice in a viewport-sized container:
//   - portrait/square (vw < 1.481*vh): scales by height, horizon at 0.45*vh from top
//     → bottom: 0.55*vh = 55vh
//   - landscape/wide (vw > 1.481*vh): scales by width, anim height = 1080/1600*vw = 0.675vw
//     → horizon from viewport top = 0.45*0.675vw − (0.675vw − vh) = vh − 0.37125vw
//     → bottom: 0.37125vw ≈ 37vw
// Combined: bottom: max(55vh, 37vw)
const HORIZON_BOTTOM = 'max(55vh, 37vw)';

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
function FullDiagnostics() {
  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <FullDiagnosticsPanel />
    </motion.div>
  );
}

// Left-pointing arrow from left-solid-full__1_.svg (viewBox 0 0 640 640)
const ARROW_PATH = 'M105.4 342.6C92.9 330.1 92.9 309.8 105.4 297.3L265.4 137.3C274.6 128.1 288.3 125.4 300.3 130.4C312.3 135.4 320 147.1 320 160L320 256L496 256C522.5 256 544 277.5 544 304L544 336C544 362.5 522.5 384 496 384L320 384L320 480C320 492.9 312.2 504.6 300.2 509.6C288.2 514.6 274.5 511.8 265.3 502.7L105.3 342.7z';
// Right-turn signal from turn-right-solid-full.svg (viewBox 0 0 640 640)
const TURN_RIGHT_PATH = 'M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C429.4 160.1 415.7 157.4 403.7 162.4C391.7 167.4 384 179.1 384 192L384 256L224 256C135.6 256 64 327.6 64 416L64 480C64 497.7 78.3 512 96 512L160 512C177.7 512 192 497.7 192 480L192 416C192 398.3 206.3 384 224 384L384 384L384 448C384 460.9 391.8 472.6 403.8 477.6C415.8 482.6 429.5 479.8 438.7 470.7L566.7 342.7z';
const ARROW_SIZE = 'clamp(28px, 3.5vw, 36px)';

// Nav row sits 20px below the arch peak (which is at the panel's very top center).
const NAV_TOP = '20px';
// Text area: nav top (20px) + nav height (arrow size) + 45px gap (25px original + 20px extra)
const TEXT_TOP = 'calc(20px + clamp(28px, 3.5vw, 36px) + 45px)';
type JourneySection =
  | {
      type: 'counter';
      subtitle: string;
      target: number;
      label: string;
      labelLines?: string[];
    }
  | { type: 'nav'; subtitle: string };

const JOURNEY_SECTIONS: JourneySection[] = [
  { type: 'counter', subtitle: "you've been a member for:", target: 46, label: 'years' },
  { type: 'counter', subtitle: 'you have 937 active contacts.', target: 937, label: 'contacts' },
  {
    type: 'counter',
    subtitle: 'you have 1 contact in a leadership committee.',
    target: 1,
    label: 'Active Contacts',
  },
  { type: 'nav', subtitle: 'events you attended this year:' },
];

// ── GPS Nav sequence ───────────────────────────────────────────────────────────
const BAR_FILL_MAX = 179; // 179/240 ≈ 73%

function JourneyNavChevron({
  direction,
  onClick,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`journey-nav-chevron journey-nav-chevron--${direction}`}
      onClick={onClick}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3901D"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="journey-nav-chevron-icon"
      >
        <path d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

type GpsPopupProps = {
  phase: number;
  dotCount: number;
  evtPct: number;
  barW: number;
};

function GpsPopupContent({ phase, dotCount, evtPct, barW }: GpsPopupProps) {
  const popupMotion = {
    initial: { opacity: 0, scale: 0.92, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  };

  if (phase === 1) {
    const title = `calculating${'.'.repeat(dotCount)}`;
    return (
      <motion.div className="gps-event-popup" {...popupMotion}>
        <p className="gps-event-popup__title">{title}</p>
        <p className="gps-event-popup__subtitle">event attendance</p>
      </motion.div>
    );
  }

  if (phase === 2) {
    return (
      <motion.div className="gps-event-popup" {...popupMotion}>
        <div className="gps-event-popup__headline">
          <p className="gps-event-popup__title">{evtPct}%</p>
          <div className="gps-event-popup__bar-track">
            <div className="gps-event-popup__bar-fill" style={{ width: `${(barW / BAR_FILL_MAX) * 100}%` }} />
          </div>
        </div>
        <p className="gps-event-popup__subtitle">event attendance</p>
      </motion.div>
    );
  }

  if (phase === 3) {
    return (
      <motion.div className="gps-event-popup" {...popupMotion}>
        <div className="gps-event-popup__row-icon">
          <WebinarTurnIcon size={36} />
          <p className="gps-event-popup__title" style={{ margin: 0 }}>54 Hours</p>
        </div>
        <p className="gps-event-popup__subtitle">of webinars attended</p>
      </motion.div>
    );
  }

  if (phase === 4) {
    return (
      <motion.div className="gps-event-popup gps-arrived-popup" {...popupMotion}>
        <p className="gps-arrived-popup__title">YOU ARRIVED</p>
        <img src={imgAapexLogo} alt="aapex — ready for every shift" className="gps-arrived-popup__logo" />
      </motion.div>
    );
  }

  return null;
}

function gpsAdvanceLabel(phase: number): string {
  if (phase === 2) return 'Continue to webinars';
  if (phase === 3) return 'Continue to arrival';
  if (phase === 4) return 'Continue to Under the Hood';
  return 'Continue';
}

function GpsNavSection({ onGoToHood }: { onGoToHood: () => void }) {
  const [phase, setPhase] = useState(1);
  const [dotCount, setDotCount] = useState(1);
  const [barW, setBarW] = useState(0);
  const [webinarsReady, setWebinarsReady] = useState(false);
  const [popupMinimized, setPopupMinimized] = useState(false);

  useEffect(() => {
    if (phase !== 1) return;
    setDotCount(1);
    const iv = setInterval(() => setDotCount(d => (d === 3 ? 1 : d + 1)), 400);
    return () => clearInterval(iv);
  }, [phase]);

  // Calculating → event attendance auto-advances after dot animation (3 cycles × 400ms)
  useEffect(() => {
    if (phase !== 1) return;
    const t = setTimeout(() => setPhase(2), 3600);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 2) return;
    setBarW(0);
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 2000, 1);
      setBarW(Math.round((1 - Math.pow(1 - p, 3)) * BAR_FILL_MAX));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase >= 1) setPopupMinimized(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== 3) {
      setWebinarsReady(false);
      return;
    }
    const t = setTimeout(() => setWebinarsReady(true), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleAdvance = () => {
    if (phase === 2) setPhase(3);
    else if (phase === 3) setPhase(4);
    else if (phase === 4) {
      setPopupMinimized(true);
      onGoToHood();
    }
  };

  const canAdvance = phase === 2 || (phase === 3 && webinarsReady) || phase === 4;
  const advanceLabel = gpsAdvanceLabel(phase);
  const evtPct = Math.round((barW / BAR_FILL_MAX) * 73);
  const popupProps: GpsPopupProps = { phase, dotCount, evtPct, barW };
  const showPopup = phase >= 1 && !popupMinimized;

  return (
    <div className="gps-popup-stage-wrapper">
      <div className="gps-popup-stage">
        <AnimatePresence mode="wait">
          {showPopup && (
            <motion.div
              key={phase}
              className="gps-popup-stage__content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <GpsPopupContent {...popupProps} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {canAdvance && (
        <JourneyNavChevron direction="right" onClick={handleAdvance} label={advanceLabel} />
      )}
    </div>
  );
}

const WEBINAR_TURN_PATH =
  'M3.26 11.93A1 1 0 0 0 4 13h6v7a1 1 0 0 0 2 0V6.41l4.29 4.3a1 1 0 1 0 1.42-1.42l-6-6a1 1 0 0 0-1.42 0L4.26 9.29a1 1 0 0 0 0 1.42l-1 1.22z';

function WebinarTurnIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="gps-icon-turn"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#5eb8e8"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={WEBINAR_TURN_PATH} />
    </svg>
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
  disabled = false,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`journey-gauge-chevron journey-gauge-chevron--${direction}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous section' : 'Next section'}
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

/** Shared PRNDL column — same layout on counter and map screens */
function JourneyPrndlColumn() {
  return (
    <div className="journey-layout__prndl-inner">
      {['P', 'R', 'N', 'D', 'L'].map((letter) => (
        <span
          key={letter}
          style={{
            color: letter === 'D' ? '#F3901D' : '#BFD1DD',
            fontSize: letter === 'D' ? 'clamp(30px, 3.2vw, 40px)' : 'clamp(24px, 2.5vw, 30px)',
            fontWeight: letter === 'D' ? 'bold' : '300',
            lineHeight: 1.1,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

// ── Your Journey content (rendered inside dashboard body area) ─────────────────
function YourJourney({
  onSectionChange,
  onGoToHood,
}: {
  onSectionChange?: (idx: number) => void;
  onGoToHood: () => void;
}) {
  const [sectionIdx, setSectionIdx] = useState(0);

  useEffect(() => {
    onSectionChange?.(sectionIdx);
  }, [sectionIdx, onSectionChange]);
  const section = JOURNEY_SECTIONS[sectionIdx];
  const isFirst = sectionIdx === 0;

  // Nav section: PRNDL + subtitle + map popup row
  if (section.type === 'nav') {
    return (
      <motion.div
        className="journey-layout journey-layout--nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <aside className="journey-layout__prndl">
          <JourneyPrndlColumn />
        </aside>
        <main className="journey-layout__main">
          <JourneySectionSubtitle sectionIdx={sectionIdx} subtitle={section.subtitle} />
          <div className="journey-layout__nav-stage">
            <div className="journey-nav-popup-row">
              <JourneyNavChevron
                direction="left"
                onClick={() => setSectionIdx((i) => i - 1)}
                label="Previous journey section"
              />
              <GpsNavSection key={sectionIdx} onGoToHood={onGoToHood} />
            </div>
          </div>
        </main>
      </motion.div>
    );
  }

  // Counter section: PRNDL + subtitle + gauge with chevrons
  return (
    <motion.div
      className="journey-layout journey-layout--counter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <aside className="journey-layout__prndl">
        <JourneyPrndlColumn />
      </aside>
      <main className="journey-layout__main journey-layout__main--counter">
        <div className="journey-layout__counter-cluster">
          <JourneySectionSubtitle sectionIdx={sectionIdx} subtitle={section.subtitle} />
          <div className="journey-layout__gauge-row">
            <div className="journey-layout__gauge-slot journey-layout__gauge-slot--left">
              {isFirst ? (
                <span className="journey-layout__chev-placeholder" aria-hidden />
              ) : (
                <JourneyGaugeChevron direction="left" onClick={() => setSectionIdx((i) => i - 1)} />
              )}
            </div>
            <div className="journey-layout__gauge-slot journey-layout__gauge-slot--center">
              <JourneyCounterGauge
                key={sectionIdx}
                target={section.target}
                label={section.label}
                labelLines={section.labelLines}
                animationKey={sectionIdx}
              />
            </div>
            <div className="journey-layout__gauge-slot journey-layout__gauge-slot--right">
              <JourneyGaugeChevron direction="right" onClick={() => setSectionIdx((i) => i + 1)} />
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

// ── Dashboard panel ────────────────────────────────────────────────────────────
function DashboardPanel({
  currentSlide,
  onBack,
  onNext,
  isJourney = false,
  isHood = false,
  isLanding = false,
  landingCenter,
  hoodPhase = 'standards',
  hoodSession = 0,
  onHoodPhaseChange,
  onGoToHood,
  onFinishTireSequence,
}: {
  currentSlide: number | null;
  onBack: () => void;
  onNext: () => void;
  isJourney?: boolean;
  isHood?: boolean;
  isLanding?: boolean;
  landingCenter?: ReactNode;
  hoodPhase?: HoodPhase;
  hoodSession?: number;
  onHoodPhaseChange: (phase: HoodPhase) => void;
  onGoToHood: () => void;
  onFinishTireSequence?: () => void;
}) {
  const isFirstSlide = isLanding || currentSlide === 0;
  const [journeySectionIdx, setJourneySectionIdx] = useState(0);
  const journeySection = isJourney ? JOURNEY_SECTIONS[journeySectionIdx] : null;
  const isMapScene = journeySection?.type === 'nav';
  const isCounterScene = journeySection?.type === 'counter';
  const showDashboardChrome = !isHood;
  const [panelEntered, setPanelEntered] = useState(false);

  return (
    <motion.div
      className={[
        'dashboard-panel',
        isHood ? 'dashboard-panel--hood' : '',
        isMapScene ? 'dashboard-panel--map' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      initial={isLanding || panelEntered ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: isLanding ? 0 : 0.55, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (!panelEntered && !isLanding) setPanelEntered(true);
      }}
    >
      {isMapScene ? (
        <div className="dashboard-map-bg">
          <DashboardMapArch showNavCursor={false} />
        </div>
      ) : isHood ? (
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
          />
        </div>
      ) : (
        <svg
          className="dashboard-panel__arch"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 1889 540"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
        >
          <path className="dashboard-panel__arch-fill" d={svgPaths.p33654d00} fill="black" />
        </svg>
      )}

      {/* Nav row — hidden on Under the Hood */}
      {showDashboardChrome && (
      <div
        className="dashboard-panel__nav"
        style={{
          position: 'absolute',
          top: NAV_TOP,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(10px, 2.5vw, 24px)',
          padding: '0 12px',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Left turn signal — navigate back */}
        <button
            onClick={onBack}
            disabled={isFirstSlide}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isFirstSlide ? 0.25 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <svg
              viewBox="0 0 640 640"
              style={{ width: ARROW_SIZE, height: ARROW_SIZE, display: 'block' }}
              fill="#F3901D"
            >
              <path d={ARROW_PATH} />
            </svg>
        </button>

        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 20px)', flexShrink: 0 }}>
          5:55 PM
        </span>
        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 20px)', flexShrink: 0 }}>
          53° F
        </span>

        {/* Right turn signal — navigate next (mirrored) */}
        <button
          onClick={onNext}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg
            viewBox="0 0 640 640"
            style={{ width: ARROW_SIZE, height: ARROW_SIZE, display: 'block', transform: 'scaleX(-1)' }}
            fill="#F3901D"
          >
            <path d={ARROW_PATH} />
          </svg>
        </button>
      </div>
      )}

      {/* Body area — hidden on hood (grey arch only) */}
      {!isHood && (
      <div
        className={
          isJourney
            ? `dashboard-body--journey${isMapScene ? ' dashboard-body--journey-nav' : ''}${isCounterScene ? ' dashboard-body--journey-counter' : ''}`
            : undefined
        }
        style={{
          position: 'absolute',
          top: TEXT_TOP,
          left: '8%',
          right: '8%',
          bottom: '14%',
          overflow: 'hidden',
        }}
      >
        {isLanding ? (
          <div
            className="landing-dashboard__body"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', height: '100%' }}
          >
            <JourneyPrndlColumn />
            <div
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
              }}
            >
              {landingCenter}
            </div>
          </div>
        ) : isJourney ? (
          <YourJourney onSectionChange={setJourneySectionIdx} onGoToHood={onGoToHood} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', height: '100%' }}>
            <JourneyPrndlColumn />

            {/* Slide text */}
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                {currentSlide !== null && (
                  <motion.div
                    key={currentSlide}
                    className="intro-slide__motion"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="intro-slide__row">
                      <div className="intro-slide__text-scroll">
                        <p className="intro-slide__text">{SLIDE_TEXTS[currentSlide]}</p>
                      </div>
                      <div className="intro-slide__next">
                        <button
                          type="button"
                          className="intro-slide__next-btn"
                          onClick={onNext}
                          aria-label="Next slide"
                        >
                          <svg viewBox="0 0 640 640" fill="#F3901D" aria-hidden>
                            <path d={TURN_RIGHT_PATH} />
                          </svg>
                        </button>
                        <span className="intro-slide__next-label">next</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Status icons row — gas + tires; hidden on Under the Hood */}
      {showDashboardChrome && (
      <div
        className="dashboard-panel__status"
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '8%',
          right: '8%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ width: '53px', height: '42px' }}>
          <svg viewBox="0 0 53.3783 42.6199" style={{ width: '100%', height: '100%' }} fill="none">
            <path d={svgPaths.p1d2c9100} fill="#F3901D" fillOpacity="0.5" />
          </svg>
        </div>

        {!isLanding && (
          <div style={{ width: '124px', height: '42px' }}>
            <svg viewBox="0 0 125.522 42.6612" style={{ width: '100%', height: '100%' }} fill="none">
              <path d={svgPaths.p3f6e2800} fill="#737373" />
              <path d={svgPaths.p36592bb2} fill="#737373" />
            </svg>
          </div>
        )}
      </div>
      )}

    </motion.div>
  );
}

// ── Main DrivingView ──────────────────────────────────────────────────────────
export function DrivingView() {
  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [hoodPhase, setHoodPhase] = useState<HoodPhase>('standards');
  const [hoodSession, setHoodSession] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [diagnosticsStage, setDiagnosticsStage] = useState<
    'full' | 'transition' | 'final'
  >('full');

  const screenOrder = NAV_ITEMS.map((n) => n.id);
  const activeNav = getActiveNavCheckpoint(currentScreen, hoodPhase);
  const currentIdx = activeNav ? screenOrder.indexOf(activeNav) : -1;

  const skyProgress = useMotionValue(0);

  const nightSkyOp = useTransform(skyProgress, [0, 0.7], [1, 0]);
  const starOp = useTransform(skyProgress, [0, 0.45], [1, 0]);
  const dawnWarmOp = useTransform(skyProgress, [0.1, 0.45, 0.75], [0, 0.85, 0]);
  const daySkyOp = useTransform(skyProgress, [0, 1], [0, 1]);
  const sunOpacity = useTransform(skyProgress, [0, 0.08, 1], [0, 1, 1]);
  const sunYPx = useTransform(skyProgress, [0, 1], [SUN_RISE_BOTTOM_Y, SUN_RISE_TOP_Y]);
  const horizonGlowOp = useTransform(skyProgress, [0.12, 0.55, 1], [0, 1, 0.35]);

  const animateSkyTo = useCallback(
    (target: number) => {
      const controls = animate(skyProgress, target, SKY_STEP_ANIMATION);
      return () => controls.stop();
    },
    [skyProgress],
  );

  useEffect(() => {
    if (!isStarted || currentScreen) return;
    if (currentSlide === null) return;
    return animateSkyTo(skyProgressForSlide(currentSlide));
  }, [currentSlide, currentScreen, isStarted, animateSkyTo]);

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
    if (currentSlide < SLIDE_TEXTS.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      animate(skyProgress, 1, SKY_STEP_ANIMATION);
      setCurrentSlide(null);
      setCurrentScreen('journey');
    }
  };

  const enterHoodScreen = () => {
    if (!isStarted) setIsStarted(true);
    setCurrentSlide(null);
    setHoodPhase('standards');
    setHoodSession((n) => n + 1);
    setCurrentScreen('hood');
  };

  const goToCheckpoint = (checkpoint: NavCheckpoint) => {
    if (!isStarted) setIsStarted(true);
    setCurrentSlide(null);
    if (checkpoint === 'journey') {
      setCurrentScreen('journey');
      return;
    }
    if (checkpoint === 'hood') {
      setHoodPhase('standards');
      setHoodSession((n) => n + 1);
      setCurrentScreen('hood');
      return;
    }
    if (checkpoint === 'tires') {
      setHoodPhase('trendlens');
      setHoodSession((n) => n + 1);
      setCurrentScreen('hood');
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

  const handleGoToHood = () => {
    enterHoodScreen();
  };

  const isHoodScreen = currentScreen === 'hood';
  const isDiagnosticsScreen = currentScreen === 'diagnostics';
  const isDiagnosticsFlow =
    isDiagnosticsScreen &&
    (diagnosticsStage === 'transition' || diagnosticsStage === 'final');
  const showLandingBackdrop = !isStarted;
  const showDrivingBackdrop =
    isStarted && !isHoodScreen && !isDiagnosticsScreen && !isDiagnosticsFlow;
  const showSkyAndRoad = showLandingBackdrop || showDrivingBackdrop;
  const showFooterNav = currentScreen && diagnosticsStage === 'full';

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">

      {/* ── Sky gradient layers — landing (darkest) + driving slides ── */}
      {showSkyAndRoad && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: nightSkyOp,
              background: 'linear-gradient(180deg, #000005 0%, #020818 45%, #060d22 75%, #0a1228 100%)',
            }}
          />

          <motion.div className="absolute inset-0" style={{ opacity: starOp }}>
            {STARS.map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
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
            className="absolute inset-0"
            style={{
              opacity: dawnWarmOp,
              background:
                'linear-gradient(180deg, #0d0820 0%, #2a1848 30%, #6a3820 60%, #c86818 80%, #ffb040 100%)',
            }}
          />

          <motion.div
            className="absolute inset-0"
            style={{
              opacity: daySkyOp,
              background:
                'linear-gradient(180deg, #1e5a8a 0%, #3d8fd4 28%, #6bb8e8 55%, #9dd4f5 78%, #c8ebfc 100%)',
            }}
          />

          {/* Horizon glow — anchored at the Lottie horizon line */}
          <motion.div
            className="absolute left-0 right-0"
            style={{
              opacity: horizonGlowOp,
              bottom: HORIZON_BOTTOM,
              height: '12vh',
              background: 'radial-gradient(ellipse 120% 100% at 50% 100%, rgba(255,140,40,0.55) 0%, rgba(255,80,0,0.22) 60%, transparent 100%)',
            }}
          />

          {/* Sun — rises from just below horizon upward */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '70px',
              height: '70px',
              left: 'calc(50% - 35px)',
              bottom: HORIZON_BOTTOM,
              y: sunYPx,
              opacity: sunOpacity,
              background: 'radial-gradient(circle, #fff8e0 0%, #ffd060 35%, #ffaa20 65%, #ff7000 100%)',
              boxShadow: '0 0 40px 16px rgba(255,160,40,0.55), 0 0 80px 32px rgba(255,120,0,0.25)',
            }}
          />
        </div>
      )}

      {/* ── Road Lottie — landing + driving; keep mounted to avoid unmount crashes ── */}
      {showSkyAndRoad && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            zIndex: 3,
            pointerEvents: 'none',
          }}
          aria-hidden={false}
        >
          <Lottie
            animationData={carOnTrackData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
          />
        </div>
      )}

      {/* ── Menu bar ── */}
      {!isDiagnosticsFlow && (
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu ☰</div>
      </div>
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
      <div className="absolute top-[72px] bottom-24 left-0 right-0" style={{ zIndex: 10 }}>

        {/* Landing — dashboard chrome + title over darkest sky/road */}
        {!isStarted && (
          <div className="absolute inset-0">
            <div className="landing-hero" aria-hidden={false}>
              <h1 className="landing-hero__title">Driven by You</h1>
              <p className="landing-hero__subtitle">your year in review</p>
            </div>
            <DashboardPanel
              isLanding
              currentSlide={null}
              onBack={() => {}}
              onNext={() => {}}
              onHoodPhaseChange={setHoodPhase}
              onGoToHood={handleGoToHood}
              landingCenter={
                <button
                  type="button"
                  onClick={() => {
                    skyProgress.set(0);
                    setIsStarted(true);
                    setCurrentSlide(0);
                  }}
                  className="landing-push-start"
                >
                  Push to start
                </button>
              }
            />
          </div>
        )}

        {/* Driving scene — only panels/screens, background is at viewport level */}
        {isStarted && (
          <div className="absolute inset-0">

            {isHoodScreen && (
              <div className="hood-scene-black" aria-hidden />
            )}

            {isHoodScreen && hoodPhase === 'standards' && (
              <motion.h1
                className="hood-scene-title"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              >
                Under the Hood
              </motion.h1>
            )}

            {/* Dashboard panel — slides, journey, and hood (not diagnostics) */}
            {(currentSlide !== null || currentScreen === 'journey' || currentScreen === 'hood') && (
              <DashboardPanel
                currentSlide={currentSlide}
                onBack={handleSlideBack}
                onNext={handleSlideNext}
                isJourney={currentScreen === 'journey'}
                isHood={currentScreen === 'hood'}
                hoodPhase={hoodPhase}
                hoodSession={hoodSession}
                onHoodPhaseChange={setHoodPhase}
                onGoToHood={handleGoToHood}
                onFinishTireSequence={beginDiagnosticsFromTires}
              />
            )}

            {isDiagnosticsFlow && diagnosticsStage === 'transition' && (
              <DiagnosticsTransition />
            )}
            {isDiagnosticsFlow && diagnosticsStage === 'final' && <FinalScenePlaceholder />}
            {currentScreen === 'diagnostics' && diagnosticsStage === 'full' && (
              <FullDiagnostics />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
