import { useRef, useState, useEffect } from 'react';
import { motion, useAnimationFrame, animate, useMotionValue, useTransform } from 'motion/react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';
import MyAutocareOrgEngagementMobile from '../../imports/MyAutocareOrgEngagementMobile/MyAutocareOrgEngagementMobile';

const BRAND_ORANGE = '#f3901d';
const SIGN_DURATION = 8.5;
const SIGN_GAP = 0.15;
const SIGN_START = 0.9;
const SIGN_COUNT = 4;
const DASHBOARD_START = SIGN_START + SIGN_COUNT * (SIGN_DURATION + SIGN_GAP) + 0.6;

type Screen = 'journey' | 'hood' | 'diagnostics';

const NAV_ITEMS: { id: Screen; label: string }[] = [
  { id: 'journey', label: 'Your Journey' },
  { id: 'hood', label: 'Under the Hood' },
  { id: 'diagnostics', label: 'Full Diagnostics' },
];

// ── Years Speedometer Gauge ───────────────────────────────────────────────────
function DashboardGauge() {
  const gaugeMotion = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const TARGET = 30;
  const cx = 225, cy = 235;

  // All gauge visuals driven by a single motion value — no drift between dial and number
  const pathLength = useTransform(gaugeMotion, v => v / TARGET);
  const needleRotate = useTransform(gaugeMotion, v => -135 + (v / TARGET) * 270 * 0.3);

  useEffect(() => {
    const controls = animate(gaugeMotion, TARGET, {
      duration: 2.5,
      delay: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
    });
    const unsub = gaugeMotion.on('change', v => setDisplayValue(v));
    return () => { controls.stop(); unsub(); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-40 flex flex-col"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {/* Header — no border-b separator */}
      <div className="mt-[80px] px-6 py-4 bg-gray-800/30 text-center shrink-0">
        <h2 className="text-[#f3901d] text-2xl font-bold">Your Journey</h2>
        <p className="text-gray-400 text-sm mt-0.5">Celebrating Growth &amp; Innovation</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-3">
          {/* "You've been a Member for" appears above the count */}
          <div className="text-gray-400 text-sm tracking-widest uppercase mb-2">You've been a Member for</div>
          <div className="text-[#f3901d] font-bold" style={{ fontSize: '78px', lineHeight: 1 }}>
            {Math.round(displayValue)}
          </div>
          <div className="text-gray-300 tracking-[0.4em] text-base mt-1">YEARS</div>
        </div>

        {/* Dial — smaller, no text inside */}
        <svg width="260" height="196" viewBox="0 0 520 390" className="drop-shadow-2xl">
          <defs>
            <linearGradient id="ng" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={BRAND_ORANGE} />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <filter id="og" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r="178" fill="#151515" stroke="#343434" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="145" fill="none" stroke="#080808" strokeWidth="34" />
          <path d="M 82 235 A 143 143 0 1 1 368 235" fill="none" stroke="#272727" strokeWidth="26" strokeLinecap="round" />

          <motion.path
            d="M 82 235 A 143 143 0 0 1 128 130"
            fill="none" stroke={BRAND_ORANGE} strokeWidth="26" strokeLinecap="round"
            filter="url(#og)"
            style={{ pathLength }}
          />

          {Array.from({ length: 13 }).map((_, i) => {
            const angle = (-135 + (i / 12) * 270) * Math.PI / 180;
            const outer = 152, inner = i % 3 === 0 ? 124 : 136;
            return (
              <line key={i}
                x1={cx + Math.cos(angle) * outer} y1={cy + Math.sin(angle) * outer}
                x2={cx + Math.cos(angle) * inner} y2={cy + Math.sin(angle) * inner}
                stroke={i <= 4 ? BRAND_ORANGE : '#505050'}
                strokeWidth={i % 3 === 0 ? 4 : 2} strokeLinecap="round"
              />
            );
          })}

          <motion.line x1={cx} y1={cy} x2={cx} y2="92"
            stroke="#000" strokeWidth="8" strokeLinecap="round" opacity="0.3"
            style={{ rotate: needleRotate, transformOrigin: `${cx}px ${cy}px` }}
          />
          <motion.line x1={cx} y1={cy} x2={cx} y2="88"
            stroke="url(#ng)" strokeWidth="5" strokeLinecap="round"
            style={{ rotate: needleRotate, transformOrigin: `${cx}px ${cy}px` }}
          />

          <circle cx={cx} cy={cy} r="27" fill="#242424" stroke={BRAND_ORANGE} strokeWidth="3" />
          <circle cx={cx} cy={cy} r="14" fill={BRAND_ORANGE} />
          <circle cx={cx} cy={cy} r="7" fill="#111" />
        </svg>
      </div>
    </motion.div>
  );
}

// ── Under the Hood: oil pour + dipstick animation ─────────────────────────────
function UnderTheHood() {
  const oilOp = useMotionValue(0);
  const funnelLevel = useMotionValue(0);
  const dipY = useMotionValue(-330);
  const revealOp = useMotionValue(0);
  const oilMarkOp = useMotionValue(0);

  // All derived values at top level (Rules of Hooks)
  const cleanRodOp = useTransform(oilMarkOp, v => 1 - v);
  const oilSecOp = useTransform(oilOp, v => v * 0.6);
  // Oil fill rect: starts below funnel clip (y=268), rises as level fills
  const funnelOilTranslateY = useTransform(funnelLevel, v => 268 - v * 120);

  useEffect(() => {
    let stopped = false;
    (async () => {
      await new Promise<void>(r => setTimeout(r, 600));
      if (stopped) return;

      // Oil pours in
      animate(oilOp, 1, { duration: 0.4 });
      await animate(funnelLevel, 0.55, { duration: 2.4, ease: [0.4, 0, 1, 1] });
      if (stopped) return;

      // Bottle retreats
      await animate(oilOp, 0, { duration: 0.4 });
      await new Promise<void>(r => setTimeout(r, 700));
      if (stopped) return;

      // Dipstick descends
      await animate(dipY, 0, { duration: 1.5, ease: [0.4, 0, 0.2, 1] });
      if (stopped) return;
      await new Promise<void>(r => setTimeout(r, 800));

      // Dipstick rises — reveal position
      await animate(dipY, -195, { duration: 1.2, ease: [0.4, 0, 0.2, 1] });
      if (stopped) return;

      // Reveal oil marks and text
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

          {/* ── Scene SVG: surface, funnel, oil fill, oil stream ── */}
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

            {/* Metallic surface */}
            <rect x="0" y="266" width="360" height="104" fill="url(#uthSurf)" />
            <line x1="0" y1="266" x2="360" y2="266" stroke="#6a7a8a" strokeWidth="2.5" />
            {[282, 300, 320, 342].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="360" y2={y} stroke="#252e3a" strokeWidth="1" opacity="0.6" />
            ))}

            {/* Funnel body (trapezoid) */}
            <path d="M 100 148 L 162 268 L 198 268 L 260 148 Z" fill="url(#uthFunnel)" />

            {/* Oil accumulating in funnel — rises as funnelLevel increases */}
            <motion.rect
              x="98" y={0} width="164" height={200}
              fill="url(#uthOil)" opacity={0.88}
              clipPath="url(#uthFunnelClip)"
              style={{ y: funnelOilTranslateY }}
            />

            {/* Funnel mouth top ellipse (metallic ring) */}
            <ellipse cx="180" cy="148" rx="80" ry="16" fill="#8090a0" />
            <ellipse cx="180" cy="148" rx="65" ry="10" fill="#354555" />
            <ellipse cx="180" cy="148" rx="57" ry="6" fill="#1a2835" />
            {/* Mouth highlight arc */}
            <path d="M 240 145 A 80 16 0 0 1 260 148" stroke="#b8cad8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Left sheen */}
            <path d="M 104 154 L 165 264" stroke="#9eaeba" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            {/* Right shadow */}
            <path d="M 256 154 L 196 264" stroke="#384858" strokeWidth="2" strokeLinecap="round" opacity="0.25" />

            {/* Funnel hole in surface */}
            <ellipse cx="180" cy="268" rx="20" ry="5" fill="#0a0f18" />
            {/* Funnel stem */}
            <rect x="174" y="268" width="12" height="26" fill="#4a5a6a" />
            <rect x="176" y="268" width="4" height="26" fill="#6a7a8a" opacity="0.4" />

            {/* ── Oil stream from bottle nozzle → funnel mouth ── */}
            {/* Bottle nozzle position (bottle upper-right, tilted): approx (262, 62) → funnel (180, 148) */}
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

          {/* ── Bottle (HTML overlay, fixed pour angle) ── */}
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

          {/* ── Dipstick ── */}
          {/*
            When y=0: handle sits at top=148px (funnel mouth level).
            Starts at y=-330 (completely above container), dips to y=0 (into funnel),
            then pulls back to y=-195 (markings visible above funnel).
          */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ top: '148px', y: dipY, zIndex: 10 }}
          >
            <div className="flex flex-col items-center">
              {/* Handle ring */}
              <div
                className="w-8 h-8 rounded-full border-4 border-gray-300 bg-gray-600 flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>

              {/* Clean rod: SUPER SPEC + ISHOP */}
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

              {/* 50% oil mark line */}
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

              {/* Oil-stained rod: PIES + ACES */}
              <div className="relative flex justify-center">
                <div className="absolute left-5 top-[8px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-500 mr-1" />
                  <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PIES</span>
                </div>
                <div className="absolute left-5 top-[50px] flex items-center">
                  <div className="w-3 h-[1.5px] bg-gray-500 mr-1" />
                  <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ACES</span>
                </div>
                {/* Oil-stained version (fades in on reveal) */}
                <motion.div
                  className="w-[7px] h-[72px] rounded-sm absolute"
                  style={{
                    background: 'linear-gradient(180deg, #d08828 0%, #9e6018 55%, #7a4810 100%)',
                    opacity: oilMarkOp,
                  }}
                />
                {/* Clean version (fades out on reveal) */}
                <motion.div
                  className="w-[7px] h-[72px] rounded-sm absolute"
                  style={{
                    background: 'linear-gradient(180deg, #d1d5db, #9ca3af)',
                    opacity: cleanRodOp,
                  }}
                />
                <div className="w-[7px] h-[72px]" />
              </div>

              {/* Tip */}
              <div className="w-[5px] h-5 bg-gray-400 rounded-b-full" />
            </div>
          </motion.div>
        </div>

        {/* Reveal text */}
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

// ── Sign overhead animation ────────────────────────────────────────────────────
function SignOverhead({ signNumber, duration }: { signNumber: number; duration: number }) {
  const [zIdx, setZIdx] = useState(12);

  const signText: Record<number, string> = {
    1: 'Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.',
    2: 'This report captures your role in that progress — the events you attended, the insights you gained, the voices you amplified, and the initiatives you supported.',
    3: 'Your engagement matters. Your impact multiplies.',
    4: "Here's your year with Auto Care in motion.",
  };

  const times       = [0,      0.06,    0.09,   0.27,   0.72,   0.84,   1.0];
  const yFrames     = ['57vh', '54.5vh','54vh',  '21vh', '6vh',  '-5vh', '-95vh'];
  const xFrames     = ['0vw',  '0vw',   '0vw',  '0vw',  '-3vw', '-9vw', '-18vw'];
  const scaleFrames = [0.05,   0.07,    0.09,   0.44,   0.90,   1.85,   4.4];
  const rotXFrames  = [30,     25,      22,     12,     3,      1,      0];
  const opacFrames  = [0,      0,       1,      1,      1,      1,      0.5];

  return (
    <motion.div
      className="absolute left-1/2 top-0 -translate-x-1/2 will-change-transform"
      style={{ zIndex: zIdx, perspective: '1200px' }}
      initial={{
        y: yFrames[0], x: xFrames[0],
        scale: scaleFrames[0], rotateX: rotXFrames[0], opacity: opacFrames[0],
      }}
      animate={{
        y: yFrames, x: xFrames,
        scale: scaleFrames, rotateX: rotXFrames, opacity: opacFrames,
      }}
      transition={{ duration, times, ease: 'linear' }}
      onUpdate={(latest) => {
        if (Number(latest.scale ?? 0) >= 0.28 && zIdx !== 36) setZIdx(36);
      }}
    >
      <div className="relative w-[660px] bg-gray-800 border-[14px] border-gray-600 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.65)]">
        <div
          className="absolute top-full"
          style={{
            left: '14px',
            width: '22px',
            height: '820px',
            background: 'linear-gradient(180deg, #b0b0b0 0%, #787878 18%, #484848 50%, #1e1e1e 100%)',
            transformOrigin: 'top center',
            transform: 'skewX(-26deg)',
            boxShadow: '-5px 6px 18px rgba(0,0,0,0.7)',
          }}
        />
        <div className="relative overflow-hidden rounded-md bg-black p-6 min-h-[150px] flex items-center">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(243,144,29,0.08)_1px,transparent_1px)] bg-[length:100%_8px] opacity-70" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/15 to-transparent"
            animate={{ y: ['-120%', '220%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          />
          <p className="relative z-10 text-center text-[32px] leading-snug font-bold text-[#f3901d] drop-shadow-[0_0_12px_rgba(243,144,29,0.7)]">
            {signText[signNumber]}
          </p>
        </div>
        <div className="absolute top-3 left-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
        <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
      </div>
    </motion.div>
  );
}

function getCurrentSign(time: number) {
  for (let i = 0; i < SIGN_COUNT; i++) {
    const start = SIGN_START + i * (SIGN_DURATION + SIGN_GAP);
    if (time >= start && time < start + SIGN_DURATION) return i + 1;
  }
  return null;
}

// ── Main DrivingView ──────────────────────────────────────────────────────────
export function DrivingView() {
  const timeRef = useRef(0);
  const [currentSign, setCurrentSign] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const screenOrder = NAV_ITEMS.map(n => n.id);
  const currentIdx = currentScreen ? screenOrder.indexOf(currentScreen) : -1;

  const handleRestart = () => {
    setIsStarted(false);
    timeRef.current = 0;
    setCurrentSign(null);
    setCurrentScreen(null);
  };

  const handleSkip = () => {
    setCurrentSign(null);
    setCurrentScreen('journey');
  };

  const goToPrev = () => {
    if (currentIdx > 0) setCurrentScreen(screenOrder[currentIdx - 1]);
  };

  const goToNext = () => {
    if (currentIdx < screenOrder.length - 1) setCurrentScreen(screenOrder[currentIdx + 1]);
  };

  useAnimationFrame((_, delta) => {
    if (!isStarted) return;
    timeRef.current += delta * 0.001;
    const time = timeRef.current;
    setCurrentSign(getCurrentSign(time));
    if (time >= DASHBOARD_START && !currentScreen) setCurrentScreen('journey');
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* ── Menu bar ── */}
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu ☰</div>
      </div>

      {/* ── Footer ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black z-50 flex items-center px-6">
        {/* Left: Restart + Skip */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-[#f3901d] hover:text-orange-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold text-sm">Restart</span>
          </button>

          {isStarted && !currentScreen && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-gray-400 hover:text-[#f3901d] transition-colors border border-gray-700 hover:border-[#f3901d]/50 rounded px-3 py-1.5 text-sm font-medium"
            >
              <span>Skip</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Navigation row (visible when a screen is active) */}
        <div className="flex-1 flex items-center justify-center">
          {currentScreen && (
            <div className="flex items-center gap-3">
              {/* Prev arrow */}
              <button
                onClick={goToPrev}
                disabled={currentIdx === 0}
                className="w-7 h-7 flex items-center justify-center text-[#f3901d] hover:text-orange-300 disabled:text-gray-700 disabled:cursor-default transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Nav labels */}
              {NAV_ITEMS.map((item, i) => (
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

              {/* Next arrow */}
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

        <div className="shrink-0 w-8" />
      </div>

      {/* ── Main content area ── */}
      <div className="absolute top-[72px] bottom-24 left-0 right-0 overflow-hidden">
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
                onClick={() => setIsStarted(true)}
                className="mt-8 w-48 h-48 rounded-full bg-black border-8 border-[#f3901d] flex items-center justify-center text-white text-2xl font-bold hover:bg-gray-900 transition-all active:scale-95"
              >
                Push to start
              </button>
            </div>
          </div>
        )}

        {/* Driving scene */}
        {isStarted && (
          <div className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 750" preserveAspectRatio="none">
              <defs>
                <linearGradient id="drvSkyG" x1="0" y1="0" x2="0" y2="750" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#0f2460" />
                  <stop offset="45%"  stopColor="#1d4ed8" />
                  <stop offset="78%"  stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
                <linearGradient id="drvGndG" x1="0" y1="425" x2="0" y2="750" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#86efac" />
                  <stop offset="14%"  stopColor="#16a34a" />
                  <stop offset="58%"  stopColor="#15803d" />
                  <stop offset="100%" stopColor="#052e16" />
                </linearGradient>
                <linearGradient id="drvRoadG" x1="0" y1="430" x2="0" y2="750" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>

              <rect x="0" y="0" width="1000" height="750" fill="url(#drvSkyG)" />
              <path d="M 0 480 Q 500 380 1000 480 L 1000 750 L 0 750 Z" fill="url(#drvGndG)" />
              <path d="M 0 480 Q 500 380 1000 480 L 1000 506 Q 500 406 0 506 Z" fill="#bbf7d0" opacity="0.20" />
              <path d="M 470 430 L 165 750 L 835 750 L 530 430 Z" fill="url(#drvRoadG)" />
              <line x1="470" y1="430" x2="165" y2="750" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
              <line x1="530" y1="430" x2="835" y2="750" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
              <line x1="500" y1="430" x2="500" y2="750" stroke="#fbbf24" strokeWidth="5" strokeDasharray="34 26" strokeLinecap="butt">
                <animate attributeName="stroke-dashoffset" from="0" to="60" dur="0.4s" repeatCount="indefinite" />
              </line>
            </svg>

            {currentSign !== null && (
              <SignOverhead key={currentSign} signNumber={currentSign} duration={SIGN_DURATION} />
            )}

            {/* Solid backdrop — prevents driving scene bleeding during screen transitions */}
            {currentScreen && (
              <div className="absolute inset-0 bg-gray-950" style={{ zIndex: 39 }} />
            )}

            {currentScreen === 'journey' && <DashboardGauge />}
            {currentScreen === 'hood' && <UnderTheHood key="hood" />}
            {currentScreen === 'diagnostics' && <FullDiagnostics />}
          </div>
        )}
      </div>
    </div>
  );
}
