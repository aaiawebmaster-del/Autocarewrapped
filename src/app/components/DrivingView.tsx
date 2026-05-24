import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';
import carOnTrackData from '../../imports/Car_on_track.json';
import carDashData from '../../imports/Car_dashboard_HUD_UI.json';
import slide1Data from '../../imports/slide_1.json';
import slide1DashboardData from '../../imports/slide_1_dashboard_view.json';
import MyAutocareOrgEngagementMobile from '../../imports/MyAutocareOrgEngagementMobile/MyAutocareOrgEngagementMobile';

const BRAND_ORANGE = '#f3901d';

// Patch the dashboard Lottie JSON at module load: move Group 3 & 4 left
// (they sit between the chrome cluster and the info panel; shifting them
//  clears space for the HTML slide-text overlay at the Groups 9/10 position)
const patchedDashData = (() => {
  const data = JSON.parse(JSON.stringify(carDashData));
  const infoLayer = data.layers?.find((l: any) => l.nm === 'info');
  if (infoLayer?.shapes) {
    ['Group 3', 'Group 4'].forEach((name: string) => {
      const grp = infoLayer.shapes.find((s: any) => s.nm === name);
      if (grp?.it) {
        const tr = grp.it[grp.it.length - 1]; // transform is last item
        if (tr?.p?.k && Array.isArray(tr.p.k)) tr.p.k[0] -= 130;
      }
    });
  }
  return data;
})();

// Deterministic star field — fixed positions so no flicker on re-render
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: `${(i * 37 + 13) % 100}%`,
  y: `${(i * 23 + 7) % 78}%`,
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

// ── Car dashboard HUD overlay ─────────────────────────────────────────────────
// Corner state  → slide_1.json (canvas 1170.6×860, rendered 500px wide)
//   Arrow element at canvas x≈106 → rendered x≈45px. Text sits at left:60px.
//   Container height 220px clips top of 367px rendered Lottie; indicator ring
//   lands at container y≈50px (below the 34px arch top).
// Centered state → patchedDashData (3218×860, rendered 1600px, centred on speedo)
function DashboardHUD({
  centered,
  currentSlide,
}: {
  centered: boolean;
  currentSlide: number | null;
}) {
  const gaugeVal = useMotionValue(0);
  const [yearsCount, setYearsCount] = useState(0);

  useEffect(() => {
    if (!centered) { gaugeVal.set(0); setYearsCount(0); return; }
    const controls = animate(gaugeVal, 30, {
      duration: 2.4,
      delay: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
    });
    const unsub = gaugeVal.on('change', v => setYearsCount(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [centered]);

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 overflow-hidden"
      animate={{ height: centered ? '430px' : '220px' }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
      style={{
        zIndex: 20,
        borderTopLeftRadius: centered ? '0' : '50% 34px',
        borderTopRightRadius: centered ? '0' : '50% 34px',
        transition: 'border-top-left-radius 0.9s cubic-bezier(0.4,0,0.2,1), border-top-right-radius 0.9s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <AnimatePresence mode="wait">

        {/* ── Corner state: slide_1_dashboard_view.json — full screen width ── */}
        {!centered && (
          <motion.div
            key="corner"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Full-width render — entrance animation plays from frame 0, then loops.
                Canvas 1624.7×860; at 390px viewport scale≈0.24, height≈206px.
                The text layer lives at canvas (363, 514) ≈ 22% from left, 83px from bottom. */}
            <div className="absolute bottom-0 left-0 right-0" style={{ pointerEvents: 'none' }}>
              <Lottie
                animationData={slide1DashboardData}
                loop
                autoplay
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* HTML text overlay — sits to the right of the arrow, over the Lottie text area.
                Positioned from bottom to stay aligned as Lottie height scales with viewport. */}
            <AnimatePresence mode="wait">
              {currentSlide !== null && (
                <motion.div
                  key={currentSlide}
                  style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '15%',
                    right: '10px',
                    maxWidth: '340px',
                    zIndex: 25,
                    pointerEvents: 'none',
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.35 }}
                >
                  <p
                    style={{
                      color: '#ffffff',
                      fontSize: 'clamp(11px, 2.5vw, 14px)',
                      lineHeight: 1.55,
                      margin: 0,
                      textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    }}
                  >
                    {SLIDE_TEXTS[currentSlide]}
                  </p>
                  <div className="flex gap-1.5 mt-3">
                    {SLIDE_TEXTS.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === currentSlide ? '16px' : '4px',
                          height: '2px',
                          borderRadius: '99px',
                          background: i === currentSlide ? 'rgba(243,144,29,0.9)' : 'rgba(255,255,255,0.3)',
                          transition: 'width 0.3s',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Centered state: patchedDashData with speed dial ── */}
        {centered && (
          <motion.div
            key="centered-dash"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* 1600px wide, shifted so speedo lands at 50vw */}
            <div
              className="absolute bottom-0"
              style={{ width: '1600px', left: 'calc(50vw - 800px)', pointerEvents: 'none' }}
            >
              <Lottie
                animationData={patchedDashData}
                loop
                autoplay
                initialSegment={[130, 360] as [number, number]}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* "30 YEARS" centered on the speed dial */}
            <motion.div
              className="absolute"
              style={{
                left: '50%',
                top: '214px',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 25,
                pointerEvents: 'none',
              }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div
                style={{ fontSize: '11px', letterSpacing: '0.22em', color: '#8899aa', textTransform: 'uppercase', marginBottom: '4px' }}
              >
                You've been a Member for
              </div>
              <div
                style={{
                  fontSize: 'clamp(52px, 10vw, 80px)',
                  fontWeight: 900,
                  color: BRAND_ORANGE,
                  lineHeight: 1,
                  textShadow: `0 0 28px rgba(243,144,29,0.55), 0 0 60px rgba(243,144,29,0.25)`,
                }}
              >
                {yearsCount}
              </div>
              <div
                style={{ fontSize: '13px', letterSpacing: '0.35em', color: '#cccccc', marginTop: '6px', textTransform: 'uppercase' }}
              >
                Years
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

// ── Main DrivingView ──────────────────────────────────────────────────────────
export function DrivingView() {
  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [dashCentered, setDashCentered] = useState(false);

  const screenOrder = NAV_ITEMS.map(n => n.id);
  const currentIdx = currentScreen ? screenOrder.indexOf(currentScreen) : -1;

  // Sky progress: 0 = night, 1 = full sunrise
  const skyProgress = useMotionValue(0);

  // Night sky: full opacity at start, fades out by 40%
  const nightSkyOp = useTransform(skyProgress, [0, 0.4], [1, 0]);
  // Stars: bright at start, fade by 35%
  const starOp = useTransform(skyProgress, [0, 0.32], [1, 0]);
  // Pre-dawn purple: peaks at 30%, gone by 65%
  const preDawnOp = useTransform(skyProgress, [0.08, 0.28, 0.52, 0.68], [0, 1, 1, 0]);
  // Sunrise warm gradient: builds from 40% onward
  const sunriseOp = useTransform(skyProgress, [0.38, 0.72], [0, 1]);
  // Sun disc opacity
  const sunOpacity = useTransform(skyProgress, [0.48, 0.78], [0, 1]);
  // Sun Y: starts below horizon (positive = down into road), rises up through sky
  const sunYPx = useTransform(skyProgress, [0.45, 0.92], [60, -180]);
  // Ambient horizon glow (orange haze at horizon as sun rises)
  const horizonGlowOp = useTransform(skyProgress, [0.35, 0.65], [0, 1]);

  // Animate sky from night → sunrise over 28 seconds once driving starts
  useEffect(() => {
    if (!isStarted) return;
    const controls = animate(skyProgress, 1, { duration: 28, ease: 'linear' });
    return () => controls.stop();
  }, [isStarted]);

  const handleRestart = () => {
    setIsStarted(false);
    setCurrentSlide(null);
    setCurrentScreen(null);
    setDashCentered(false);
    skyProgress.set(0);
  };

  const handleSkip = () => {
    setCurrentSlide(null);
    setCurrentScreen('journey');
    setDashCentered(true);
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
      // Past last slide → center the dashboard dial, enter journey
      setCurrentSlide(null);
      setDashCentered(true);
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

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 text-[#f3901d] hover:text-orange-400 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold text-sm">Restart</span>
        </button>

        {/* Center area — either slide controls or screen nav */}
        <div className="flex-1 flex items-center justify-center gap-2">

          {/* Slide Back / Next (during driving text sequence) */}
          {isStarted && currentSlide !== null && !currentScreen && (
            <>
              <button
                onClick={handleSlideBack}
                disabled={currentSlide === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium transition-colors"
                style={{
                  borderColor: currentSlide === 0 ? '#374151' : '#f3901d',
                  color: currentSlide === 0 ? '#374151' : '#f3901d',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={handleSlideNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#f3901d] text-[#f3901d] text-sm font-medium hover:bg-[#f3901d]/10 transition-colors"
              >
                {currentSlide === SLIDE_TEXTS.length - 1 ? 'Enter' : 'Next'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Screen nav (during dashboard) */}
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

        {/* Skip (only during slide sequence) */}
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
                onClick={() => { setIsStarted(true); setCurrentSlide(0); }}
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

            {/* ── Sky layers — fill full content area, behind the road ── */}
            <div className="absolute inset-0" style={{ zIndex: 0 }}>
              {/* Night sky base */}
              <motion.div
                className="absolute inset-0"
                style={{
                  opacity: nightSkyOp,
                  background: 'linear-gradient(180deg, #000005 0%, #020818 45%, #060d22 75%, #0a1228 100%)',
                }}
              />

              {/* Star field */}
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

              {/* Pre-dawn purple/indigo */}
              <motion.div
                className="absolute inset-0"
                style={{
                  opacity: preDawnOp,
                  background: 'linear-gradient(180deg, #0d0820 0%, #1e1040 35%, #32186a 65%, #4a2080 100%)',
                }}
              />

              {/* Sunrise warm gradient — builds from horizon upward */}
              <motion.div
                className="absolute inset-0"
                style={{
                  opacity: sunriseOp,
                  background: 'linear-gradient(180deg, #060318 0%, #120820 25%, #2a1000 55%, #8b3a00 75%, #d96800 88%, #ff9020 95%, #ffc060 100%)',
                }}
              />

              {/* Horizon glow haze — sits right at the horizon (~70% from bottom) */}
              <motion.div
                className="absolute left-0 right-0"
                style={{
                  opacity: horizonGlowOp,
                  bottom: '68%',
                  height: '16%',
                  background: 'radial-gradient(ellipse 140% 100% at 50% 100%, rgba(255,140,40,0.6) 0%, rgba(255,80,0,0.25) 60%, transparent 100%)',
                }}
              />

              {/* Sun disc — rises from horizon into sky */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: '70px',
                  height: '70px',
                  left: 'calc(50% - 35px)',
                  bottom: '68%',
                  y: sunYPx,
                  opacity: sunOpacity,
                  background: 'radial-gradient(circle, #fff8e0 0%, #ffd060 35%, #ffaa20 65%, #ff7000 100%)',
                  boxShadow: '0 0 40px 16px rgba(255,160,40,0.55), 0 0 80px 32px rgba(255,120,0,0.25)',
                }}
              />
            </div>

            {/* ── Road Lottie — full content area, transparent sky lets gradient show through ──
                xMidYMax slice: fills full width on all screen sizes, aligns road to bottom.
                On portrait mobile: horizon at ~29% from top.
                On landscape desktop: horizon at ~24% from top (canvas crops from top). ── */}
            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <Lottie
                animationData={carOnTrackData}
                loop
                autoplay
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
              />
            </div>

            {/* ── Car dashboard HUD: always visible during driving ── */}
            <DashboardHUD centered={dashCentered} currentSlide={currentSlide} />

            {/* Solid backdrop — only for hood/diagnostics (not journey, which uses the live dash) */}
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
