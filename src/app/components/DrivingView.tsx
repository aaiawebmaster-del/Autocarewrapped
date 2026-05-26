import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';
import carOnTrackData from '../../imports/Car_on_track.json';
import journeyCircleData from '../../imports/Animation_-_1779761385872.json';
import Frame7 from '../../imports/Frame7/Frame7';
import Frame8 from '../../imports/Frame8/Frame8';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import MyAutocareOrgEngagementMobile from '../../imports/MyAutocareOrgEngagementMobile/MyAutocareOrgEngagementMobile';

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
  'Your engagement matters. Your impact multiplies.',
  "Here's your year with Auto Care in motion.",
];

type Screen = 'journey' | 'hood' | 'diagnostics';

const NAV_ITEMS: { id: Screen; label: string }[] = [
  { id: 'journey', label: 'Your Journey' },
  { id: 'hood', label: 'Under the Hood' },
  { id: 'diagnostics', label: 'Full Diagnostics' },
];

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
function UnderTheHood() {
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

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="relative w-[360px] h-[370px]">

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

        <motion.div className="text-center px-6" style={{ opacity: revealOp }}>
          <p className="text-[#f3901d] text-xl font-bold">you have 50% of the standards!</p>
          <p className="text-gray-500 text-xs mt-1 tracking-wide">Subscribe to more standards to fill up your dipstick</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Full Diagnostics: Figma import ────────────────────────────────────────────
function FullDiagnostics() {
  return (
    <motion.div
      className="absolute inset-0 bg-black z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-[80px] px-6 py-4 bg-gray-800/30 text-center shrink-0">
        <h2 className="text-[#f3901d] text-2xl font-bold">Full Diagnostics</h2>
        <p className="text-gray-400 text-sm mt-0.5">Your Complete Standards Profile</p>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="relative overflow-hidden" style={{ width: '268px', height: '568px' }}>
          <MyAutocareOrgEngagementMobile />
        </div>
      </div>
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
  | { type: 'counter'; subtitle: string; target: number; label: string }
  | { type: 'nav'; subtitle: string };

const JOURNEY_SECTIONS: JourneySection[] = [
  { type: 'counter', subtitle: "you've been a member for:", target: 46, label: 'years' },
  { type: 'counter', subtitle: 'you have 937 active contacts.', target: 937, label: 'contacts' },
  { type: 'nav', subtitle: 'events you attended this year:' },
];

// ── GPS Nav sequence ───────────────────────────────────────────────────────────
// Frame7: map with nav arrow (phase 0). Frame8: map background for phases 1-3.
// Popup coordinates match Frame8-12 Figma (all absolute within 566×261 frame).
const NAV_FRAME_W = 566;
const NAV_FRAME_H = 261;
const POP_L = 66, POP_T = 70, POP_W = 414, POP_H = 156;
const BAR_L = 215, BAR_T = 99, BAR_W_TRACK = 240, BAR_H = 48;
const BAR_FILL_MAX = 179; // 179/240 ≈ 73%

function GpsNavSection() {
  const [phase, setPhase] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [barW, setBarW] = useState(0);

  // Phase 0 → 1 after 800ms; 3 dot rotations = 9×400ms = 3600ms; events 2s + hold 1.5s; webinars
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 800 + 3600),
      setTimeout(() => setPhase(3), 800 + 3600 + 2000 + 1500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  // Dot cycling: 1→2→3→1→2→3 (3 full rotations = 9 steps × 400ms)
  useEffect(() => {
    if (phase !== 1) return;
    setDotCount(1);
    const iv = setInterval(() => setDotCount(d => d === 3 ? 1 : d + 1), 400);
    return () => clearInterval(iv);
  }, [phase]);

  // Bar fill: animates 0→BAR_FILL_MAX over 2 seconds (ease-out cubic)
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

  const evtPct = Math.round((barW / BAR_FILL_MAX) * 73);

  // Shared inline style helper (frame-absolute coordinates)
  const txt = (l: number, t: number, sz: number, bold: boolean): React.CSSProperties => ({
    position: 'absolute', left: l, top: t, transform: 'translateY(-50%)',
    fontSize: sz, fontWeight: bold ? 700 : 400, color: 'black',
    fontFamily: "'Istok Web', sans-serif", lineHeight: 1,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ zoom: 0.95, position: 'relative', width: NAV_FRAME_W, height: NAV_FRAME_H, overflow: 'hidden', flexShrink: 0, borderRadius: 10 }}>

        {/* Phase 0: Frame7 — map with embedded nav arrow */}
        <AnimatePresence>
          {phase === 0 && (
            <motion.div key="f7" className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <Frame7 />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phases 1-3: Frame8 as persistent map background */}
        <AnimatePresence>
          {phase > 0 && (
            <motion.div key="f8" className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <Frame8 />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permanent orange cover — hides Frame8's static popup text during all popup phases */}
        {phase > 0 && (
          <div style={{
            position: 'absolute', left: POP_L, top: POP_T, width: POP_W, height: POP_H,
            background: '#e47d1d', borderRadius: 34, boxShadow: '0px 4px 4px rgba(0,0,0,0.25)',
          }} />
        )}

        {/* Animated popup content — all positioned in frame coordinates */}
        <AnimatePresence mode="wait">
          {/* Calculating — dots cycle 1→2→3 three times */}
          {phase === 1 && (
            <motion.div key="calc" className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={txt(100, 123, 50, true)}>calculating{'.'.repeat(dotCount)}</div>
              <div style={txt(95, 186.5, 40, false)}>event attendance</div>
            </motion.div>
          )}

          {/* Events — counter 0→73%, bar grows 0→179px */}
          {phase === 2 && (
            <motion.div key="events" className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={txt(100, 123, 50, true)}>{evtPct}%</div>
              <div style={txt(95, 186.5, 40, false)}>event attendance</div>
              {/* Bar track + animated fill — exact Figma Frame10 coordinates */}
              <div style={{ position: 'absolute', left: BAR_L, top: BAR_T, width: BAR_W_TRACK, height: BAR_H, background: '#3b263b', borderRadius: 41, overflow: 'hidden' }}>
                <div style={{ width: barW, height: '100%', background: '#007ac3', borderRadius: 41 }} />
              </div>
            </motion.div>
          )}

          {/* Webinars */}
          {phase === 3 && (
            <motion.div key="webinars" className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div style={{ ...txt(100, 123, 50, true), display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                {/* Navigation turn icon matching image-5 reference */}
                <svg width="38" height="38" viewBox="0 0 24 24" fill="black">
                  <path d="M3.26 11.93A1 1 0 0 0 4 13h6v7a1 1 0 0 0 2 0V6.41l4.29 4.3a1 1 0 1 0 1.42-1.42l-6-6a1 1 0 0 0-1.42 0L4.26 9.29a1 1 0 0 0 0 1.42l-1 1.22z" />
                </svg>
                54 Hours
              </div>
              <div style={txt(95, 186.5, 40, false)}>of webinars attended</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ── Your Journey content (rendered inside dashboard body area) ─────────────────
function YourJourney() {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [count, setCount] = useState(0);

  const section = JOURNEY_SECTIONS[sectionIdx];
  const isFirst = sectionIdx === 0;

  useEffect(() => {
    if (section.type !== 'counter') return;
    setCount(0);
    let frame: number;
    const start = performance.now();
    const duration = 2200;
    const target = section.target;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sectionIdx]);

  const circleSize = 'clamp(140px, 22vw, 220px)';
  const chevW = 'clamp(24px, 4vw, 40px)';

  const ChevLeft = () => (
    <button onClick={() => setSectionIdx(i => i - 1)}
      style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#F3901D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ width: chevW, height: chevW }}>
        <path d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );

  const ChevRight = () => (
    <button onClick={() => setSectionIdx(i => i + 1)}
      style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#F3901D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ width: chevW, height: chevW }}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  const Spacer = () => <div style={{ width: `calc(${chevW} + 16px)`, flexShrink: 0 }} />;

  // Nav section: PRNDL + back chevron + map
  if (section.type === 'nav') {
    return (
      <motion.div
        className="flex h-full"
        style={{ gap: '12px', alignItems: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      >
        {/* PRNDL column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          {['P', 'R', 'N', 'D', 'L'].map((letter) => (
            <span key={letter} style={{
              color: letter === 'D' ? '#F3901D' : '#BFD1DD',
              fontSize: letter === 'D' ? 'clamp(30px, 3.2vw, 40px)' : 'clamp(24px, 2.5vw, 30px)',
              fontWeight: letter === 'D' ? 'bold' : '300',
              lineHeight: 1.1,
            }}>{letter}</span>
          ))}
        </div>

        {/* Back chevron — left of map */}
        <button
          onClick={() => setSectionIdx(i => i - 1)}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', flexShrink: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#F3901D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ width: chevW, height: chevW }}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Map */}
        <div style={{ flex: 1, height: '100%' }}>
          <GpsNavSection key={sectionIdx} />
        </div>
      </motion.div>
    );
  }

  // Counter section: PRNDL inline + title/subtitle + circle with chevrons
  return (
    <motion.div
      className="flex h-full"
      style={{ gap: '20px', paddingTop: '4px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* PRNDL column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        {['P', 'R', 'N', 'D', 'L'].map((letter) => (
          <span key={letter} style={{
            color: letter === 'D' ? '#F3901D' : '#BFD1DD',
            fontSize: letter === 'D' ? 'clamp(30px, 3.2vw, 40px)' : 'clamp(24px, 2.5vw, 30px)',
            fontWeight: letter === 'D' ? 'bold' : '300',
            lineHeight: 1.1,
          }}>{letter}</span>
        ))}
      </div>

      {/* Content: title row + circle */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ color: '#F3901D', fontSize: '25px', fontWeight: 'bold', margin: 0 }}>Your Journey</p>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '25px', fontWeight: '300', lineHeight: 1 }}>|</span>
          <AnimatePresence mode="wait">
            <motion.p key={sectionIdx} style={{ color: '#ffffff', fontSize: '25px', fontWeight: 'bold', margin: 0 }}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}>
              {section.subtitle}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Counter with chevrons */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
          {isFirst ? <Spacer /> : <ChevLeft />}
          <div key={sectionIdx} style={{ position: 'relative', width: circleSize, height: circleSize }}>
            <Lottie animationData={journeyCircleData} loop autoplay style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <AnimatePresence mode="wait">
                <motion.span key={sectionIdx}
                  style={{ color: '#ffffff', fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 'normal', lineHeight: 1 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {count}
                </motion.span>
              </AnimatePresence>
              <span style={{ color: '#ffffff', fontSize: 'clamp(14px, 2vw, 22px)', fontWeight: 'normal' }}>
                {section.label}
              </span>
            </div>
          </div>
          <ChevRight />
        </div>
      </div>
    </motion.div>
  );
}

// ── Dashboard panel ────────────────────────────────────────────────────────────
function DashboardPanel({
  currentSlide,
  onBack,
  onNext,
  isJourney = false,
}: {
  currentSlide: number | null;
  onBack: () => void;
  onNext: () => void;
  isJourney?: boolean;
}) {
  const isFirstSlide = currentSlide === 0;

  return (
    <motion.div
      style={{
        position: 'absolute',
        bottom: '-3px',
        left: 0,
        right: 0,
        height: 'clamp(300px, calc(58vh - 72px), 520px)',
        zIndex: 20,
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '40px', opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 1889 540"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <path d={svgPaths.p33654d00} fill="black" />
      </svg>

      {/* Nav row — 20px below arch inner corners */}
      <div
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

      {/* Body area */}
      <div
        style={{
          position: 'absolute',
          top: TEXT_TOP,
          left: '8%',
          right: '8%',
          bottom: '12%',
          overflow: 'hidden',
        }}
      >
        {isJourney ? (
          <YourJourney />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', height: '100%' }}>
            {/* PRNDL — slide mode only */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              {['P', 'R', 'N', 'D', 'L'].map((letter) => (
                <span key={letter} style={{
                  color: letter === 'D' ? '#F3901D' : '#BFD1DD',
                  fontSize: letter === 'D' ? 'clamp(30px, 3.2vw, 40px)' : 'clamp(24px, 2.5vw, 30px)',
                  fontWeight: letter === 'D' ? 'bold' : '300',
                  lineHeight: 1.1,
                }}>{letter}</span>
              ))}
            </div>

            {/* Slide text */}
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                {currentSlide !== null && (
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                      <p style={{
                        color: '#ffffff',
                        fontSize: 'clamp(26px, 3vw, 30px)',
                        lineHeight: 1.25,
                        margin: 0,
                        textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                        flex: 1,
                      }}>
                        {SLIDE_TEXTS[currentSlide]}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '10px' }}>
                        <button onClick={onNext} style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          <svg viewBox="0 0 640 640" style={{ width: 'clamp(100px, 15vw, 200px)', height: 'clamp(100px, 15vw, 200px)' }} fill="#F3901D">
                            <path d={TURN_RIGHT_PATH} />
                          </svg>
                        </button>
                        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.08em' }}>next</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Status icons row */}
      <div
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

        <div style={{ width: '124px', height: '42px' }}>
          <svg viewBox="0 0 125.522 42.6612" style={{ width: '100%', height: '100%' }} fill="none">
            <path d={svgPaths.p3f6e2800} fill="#737373" />
            <path d={svgPaths.p36592bb2} fill="#737373" />
          </svg>
        </div>
      </div>

    </motion.div>
  );
}

// ── Main DrivingView ──────────────────────────────────────────────────────────
export function DrivingView() {
  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const screenOrder = NAV_ITEMS.map(n => n.id);
  const currentIdx = currentScreen ? screenOrder.indexOf(currentScreen) : -1;

  const skyProgress = useMotionValue(0);

  const nightSkyOp = useTransform(skyProgress, [0, 0.4], [1, 0]);
  const starOp = useTransform(skyProgress, [0, 0.32], [1, 0]);
  const preDawnOp = useTransform(skyProgress, [0.08, 0.28, 0.52, 0.68], [0, 1, 1, 0]);
  const sunriseOp = useTransform(skyProgress, [0.38, 0.72], [0, 1]);
  const sunOpacity = useTransform(skyProgress, [0.48, 0.78], [0, 1]);
  // Sun rises from horizon (y=60, just below) to well above (y=-220)
  const sunYPx = useTransform(skyProgress, [0.45, 0.92], [60, -220]);
  const horizonGlowOp = useTransform(skyProgress, [0.35, 0.65], [0, 1]);

  useEffect(() => {
    if (!isStarted) return;
    const controls = animate(skyProgress, 1, { duration: 6, ease: 'linear' });
    return () => controls.stop();
  }, [isStarted]);

  const handleRestart = () => {
    setIsStarted(false);
    setCurrentSlide(null);
    setCurrentScreen(null);
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
      setCurrentSlide(null);
      setCurrentScreen('journey');
    }
  };

  const goToPrev = () => {
    if (currentIdx > 0) setCurrentScreen(screenOrder[currentIdx - 1]);
  };

  const goToNext = () => {
    if (currentIdx < screenOrder.length - 1) setCurrentScreen(screenOrder[currentIdx + 1]);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">

      {/* ── Sky gradient layers — full viewport, behind everything ── */}
      {isStarted && (
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
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
              opacity: preDawnOp,
              background: 'linear-gradient(180deg, #0d0820 0%, #1e1040 35%, #32186a 65%, #4a2080 100%)',
            }}
          />

          <motion.div
            className="absolute inset-0"
            style={{
              opacity: sunriseOp,
              background: 'linear-gradient(180deg, #060318 0%, #120820 25%, #2a1000 55%, #8b3a00 75%, #d96800 88%, #ff9020 95%, #ffc060 100%)',
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

      {/* ── Road Lottie — full viewport, bottom-aligned, edge-to-edge ── */}
      {isStarted && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 3, pointerEvents: 'none' }}
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
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu ☰</div>
      </div>

      {/* ── Footer ── */}
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

          {currentScreen && (
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
                  onClick={() => setCurrentScreen(item.id)}
                  className="transition-colors text-sm"
                  style={{
                    color: currentScreen === item.id ? BRAND_ORANGE : '#6b7280',
                    fontWeight: currentScreen === item.id ? 'bold' : 'normal',
                    letterSpacing: currentScreen === item.id ? '0.02em' : undefined,
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

      {/* ── Main content area — dashboard panels and screens only ── */}
      <div className="absolute top-[72px] bottom-24 left-0 right-0" style={{ zIndex: 10 }}>

        {/* Start screen */}
        {!isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#27B0FA] md:bg-transparent">
            <div className="absolute inset-0 -top-[72px] md:top-0">
              <img src={imgMountainRoad} alt="Mountain road" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="text-center">
                <h1 className="text-6xl font-extrabold text-black mb-2">Auto Care</h1>
                <h1 className="text-6xl font-extrabold text-black">WRAPPED</h1>
              </div>
              <div className="bg-black px-8 py-3">
                <p className="text-[#f3901d] font-bold text-lg">Your Year In Review</p>
              </div>
              <button
                onClick={() => { setIsStarted(true); setCurrentSlide(0); }}
                className="mt-8 w-48 h-48 rounded-full bg-black border-8 border-[#f3901d] flex items-center justify-center text-white text-2xl font-bold hover:bg-gray-900 transition-all active:scale-95"
              >
                Push to start
              </button>
            </div>
          </div>
        )}

        {/* Driving scene — only panels/screens, background is at viewport level */}
        {isStarted && (
          <div className="absolute inset-0">

            {/* Dashboard panel — visible during slides AND journey mode */}
            <AnimatePresence>
              {(currentSlide !== null || currentScreen === 'journey') && (
                <DashboardPanel
                  currentSlide={currentSlide}
                  onBack={handleSlideBack}
                  onNext={handleSlideNext}
                  isJourney={currentScreen === 'journey'}
                />
              )}
            </AnimatePresence>

            {/* Solid backdrop for hood/diagnostics */}
            {currentScreen && currentScreen !== 'journey' && (
              <div className="absolute inset-0 bg-gray-950" style={{ zIndex: 39 }} />
            )}

            {currentScreen === 'hood' && <UnderTheHood key="hood" />}
            {currentScreen === 'diagnostics' && <FullDiagnostics />}
          </div>
        )}
      </div>
    </div>
  );
}
