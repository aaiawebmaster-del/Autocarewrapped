import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';
import carOnTrackData from '../../imports/Car_on_track.json';
import svgPaths from '../../imports/FrameDesktop/svg-4mwluzb7sj';
import MyAutocareOrgEngagementMobile from '../../imports/MyAutocareOrgEngagementMobile/MyAutocareOrgEngagementMobile';

const BRAND_ORANGE = '#f3901d';

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

// ── Dashboard panel: Figma-derived arch with slide navigation ─────────────────
// Arch SVG (p33654d00): corners at y=159.652/540 = 29.56% from panel top.
// All interactive content must start below 29.56% so it is inside the filled arch.
// Panel height is responsive: ~50% of viewport, putting the arch peak near screen center.
function DashboardPanel({
  currentSlide,
  onBack,
  onNext,
}: {
  currentSlide: number | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFirstSlide = currentSlide === 0;

  return (
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // Responsive height so arch peak reaches ~screen center.
        // Corner depth = 29.56% of this height — all content positioned below that.
        height: 'clamp(220px, calc(50vh - 72px), 420px)',
        zIndex: 20,
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '40px', opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Central-peak arch background — transparent above 29.56% at the edges */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 1889 540"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d={svgPaths.p33654d00} fill="black" />
      </svg>

      {/* ── Nav row: [◀] [time] [temp] [▶] ──────────────────────────────────────
          Positioned at 34% from panel top (safely below 29.56% arch corner depth).
          whiteSpace: nowrap ensures the row never wraps regardless of screen width. */}
      <div
        style={{
          position: 'absolute',
          top: '34%',
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
        {/* Left turn-signal — navigation back */}
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
            viewBox="0 0 102.092 69"
            style={{ width: 'clamp(28px, 4vw, 44px)', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
            fill="none"
          >
            <path d={svgPaths.p3d084200} fill="#F3901D" />
          </svg>
        </button>

        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 20px)', flexShrink: 0 }}>
          5:55 PM
        </span>
        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 20px)', flexShrink: 0 }}>
          53° F
        </span>

        {/* Right turn-signal — navigation next */}
        <button
          onClick={onNext}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg
            viewBox="0 0 102.092 69"
            style={{ width: 'clamp(28px, 4vw, 44px)', height: 'auto', display: 'block' }}
            fill="none"
          >
            <path d={svgPaths.p3d084200} fill="#F3901D" />
          </svg>
        </button>
      </div>

      {/* ── Slide text — below the nav row ── */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '8%',
          right: '8%',
          bottom: '12%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            {currentSlide !== null && (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  style={{
                    color: '#ffffff',
                    fontSize: 'clamp(13px, 3vw, 16px)',
                    lineHeight: 1.55,
                    margin: 0,
                    textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    wordBreak: 'break-word',
                  }}
                >
                  {SLIDE_TEXTS[currentSlide]}
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {SLIDE_TEXTS.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === currentSlide ? '16px' : '4px',
                        height: '2px',
                        borderRadius: '99px',
                        background: i === currentSlide
                          ? 'rgba(243,144,29,0.9)'
                          : 'rgba(255,255,255,0.3)',
                        transition: 'width 0.3s',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Status icons — fuel pump left, warning icons right ── */}
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
        <div style={{ width: '34px', height: '27px' }}>
          <svg viewBox="0 0 53.3783 42.6199" style={{ width: '100%', height: '100%' }} fill="none">
            <path d={svgPaths.p1d2c9100} fill="#F3901D" fillOpacity="0.5" />
          </svg>
        </div>
        <div style={{ width: '80px', height: '27px' }}>
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
  const sunYPx = useTransform(skyProgress, [0.45, 0.92], [60, -180]);
  const horizonGlowOp = useTransform(skyProgress, [0.35, 0.65], [0, 1]);

  useEffect(() => {
    if (!isStarted) return;
    const controls = animate(skyProgress, 1, { duration: 28, ease: 'linear' });
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

        {/* Center area */}
        <div className="flex-1 flex items-center justify-center gap-2">

          {/* Screen nav (after slide sequence) */}
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

        {/* Skip (only during slide sequence — arrows in panel handle back/next) */}
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

            {/* ── Sky layers ── */}
            <div className="absolute inset-0" style={{ zIndex: 0 }}>
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

              <motion.div
                className="absolute left-0 right-0"
                style={{
                  opacity: horizonGlowOp,
                  bottom: '68%',
                  height: '16%',
                  background: 'radial-gradient(ellipse 140% 100% at 50% 100%, rgba(255,140,40,0.6) 0%, rgba(255,80,0,0.25) 60%, transparent 100%)',
                }}
              />

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

            {/* ── Road Lottie ── */}
            {/* Wrapper scales by height (aspectRatio 2:1 matches ~canvas ratio).
                translateY pushes the animation down by D = (1−r)·content_h − panel_h − 50,
                where r≈0.3 (horizon fraction from canvas top), keeping the horizon
                exactly 50px above the dashboard panel top at every viewport height.
                content_h = 100vh−168px  →  0.7·content_h = 70vh−117.6px
                The sky gradient behind fills any horizontal gaps on wide screens. */}
            <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: `translateX(-50%) translateY(max(0px, calc(70vh - 167.6px - clamp(220px, calc(50vh - 72px), 420px))))`,
                  height: '100%',
                  aspectRatio: '2 / 1',
                }}
              >
                <Lottie
                  animationData={carOnTrackData}
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                  rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }}
                />
              </div>
            </div>

            {/* ── Dashboard panel (slide sequence) ── */}
            <AnimatePresence>
              {currentSlide !== null && (
                <DashboardPanel
                  currentSlide={currentSlide}
                  onBack={handleSlideBack}
                  onNext={handleSlideNext}
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
