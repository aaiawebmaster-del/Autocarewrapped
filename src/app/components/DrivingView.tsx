import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import Lottie from 'lottie-react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';
import carOnTrackData from '../../imports/Car_on_track.json';
import carDashData from '../../imports/Car_dashboard_HUD_UI.json';
import slide1DashboardData from '../../imports/slide_1_dashboard_view.json';
import MyAutocareOrgEngagementMobile from '../../imports/MyAutocareOrgEngagementMobile/MyAutocareOrgEngagementMobile';

const BRAND_ORANGE = '#f3901d';

const patchedDashData = (() => {
  const data = JSON.parse(JSON.stringify(carDashData));
  const infoLayer = data.layers?.find((l: any) => l.nm === 'info');
  if (infoLayer?.shapes) {
    ['Group 3', 'Group 4'].forEach((name: string) => {
      const grp = infoLayer.shapes.find((s: any) => s.nm === name);
      if (grp?.it) {
        const tr = grp.it[grp.it.length - 1];
        if (tr?.p?.k && Array.isArray(tr.p.k)) tr.p.k[0] -= 130;
      }
    });
  }
  return data;
})();

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: `${(i * 37 + 13) % 100}%`,
  y: `${(i * 23 + 7) % 78}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
  opacity: 0.35 + (i % 6) * 0.1,
}));

const SLIDE_TEXTS = [
  'Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.',
  'This report captures your role in that progress: the events you attended, the insights you gained, the voices you amplified, and the initiatives you supported.',
  'Your engagement matters. Your impact multiplies.',
  "Here's your year with Auto Care in motion.",
];

type Screen = 'journey' | 'hood' | 'diagnostics';

const NAV_ITEMS: { id: Screen; label: string }[] = [
  { id: 'journey', label: 'Your Journey' },
  { id: 'hood', label: 'Under the Hood' },
  { id: 'diagnostics', label: 'Full Diagnostics' },
];

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
        <div className="relative w-[360px] h-[370px] max-w-[92vw]">
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
              <clipPath id="uthFunnelClip"><path d="M 100 148 L 162 268 L 198 268 L 260 148 Z" /></clipPath>
            </defs>
            <rect x="0" y="266" width="360" height="104" fill="url(#uthSurf)" />
            <line x1="0" y1="266" x2="360" y2="266" stroke="#6a7a8a" strokeWidth="2.5" />
            {[282, 300, 320, 342].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="360" y2={y} stroke="#252e3a" strokeWidth="1" opacity="0.6" />
            ))}
            <path d="M 100 148 L 162 268 L 198 268 L 260 148 Z" fill="url(#uthFunnel)" />
            <motion.rect x="98" y={0} width="164" height={200} fill="url(#uthOil)" opacity={0.88} clipPath="url(#uthFunnelClip)" style={{ y: funnelOilTranslateY }} />
            <ellipse cx="180" cy="148" rx="80" ry="16" fill="#8090a0" />
            <ellipse cx="180" cy="148" rx="65" ry="10" fill="#354555" />
            <ellipse cx="180" cy="148" rx="57" ry="6" fill="#1a2835" />
            <path d="M 240 145 A 80 16 0 0 1 260 148" stroke="#b8cad8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 104 154 L 165 264" stroke="#9eaeba" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            <path d="M 256 154 L 196 264" stroke="#384858" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
            <ellipse cx="180" cy="268" rx="20" ry="5" fill="#0a0f18" />
            <rect x="174" y="268" width="12" height="26" fill="#4a5a6a" />
            <rect x="176" y="268" width="4" height="26" fill="#6a7a8a" opacity="0.4" />
            <motion.path d="M 258 60 Q 226 95 184 145" stroke="#f3901d" strokeWidth="13" strokeLinecap="round" fill="none" style={{ opacity: oilOp }} />
            <motion.path d="M 254 64 Q 222 98 181 148" stroke="#c07010" strokeWidth="6" strokeLinecap="round" fill="none" style={{ opacity: oilSecOp }} />
          </svg>

          <div className="absolute pointer-events-none" style={{ right: '8px', top: '0px', transform: 'rotate(-42deg)', transformOrigin: 'bottom left', width: '76px' }}>
            <div className="flex flex-col items-center">
              <div className="w-6 h-3 rounded-t-md bg-[#f3901d]" />
              <div className="w-6 h-5 bg-gray-700 border-x border-gray-600" />
              <div className="w-[68px] h-[88px] bg-[#2a3848] border border-gray-600 rounded-b-lg relative overflow-hidden flex items-center justify-center">
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

          <motion.div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: '148px', y: dipY, zIndex: 10 }}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-4 border-gray-300 bg-gray-600 flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              <div className="relative flex justify-center mt-0.5">
                <div className="absolute left-5 top-[2px] flex items-center"><div className="w-3 h-[1.5px] bg-gray-400 mr-1" /><span style={{ fontSize: '8px', color: '#d1d5db', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SUPER SPEC</span></div>
                <div className="absolute left-5 top-[38px] flex items-center"><div className="w-3 h-[1.5px] bg-gray-400 mr-1" /><span style={{ fontSize: '8px', color: '#d1d5db', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ISHOP</span></div>
                <div className="w-[7px] h-[72px] rounded-sm" style={{ background: 'linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%)', boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.4)' }} />
              </div>
              <div className="relative flex items-center justify-center">
                <motion.div className="absolute right-4 flex items-center gap-0.5" style={{ opacity: oilMarkOp }}><span style={{ fontSize: '8px', color: BRAND_ORANGE, fontWeight: 'bold', whiteSpace: 'nowrap' }}>50%</span><div className="w-3 h-[1.5px] bg-[#f3901d]" /></motion.div>
                <div className="w-[11px] h-[3px] rounded-full bg-[#f3901d]" />
              </div>
              <div className="relative flex justify-center">
                <div className="absolute left-5 top-[8px] flex items-center"><div className="w-3 h-[1.5px] bg-gray-500 mr-1" /><span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>PIES</span></div>
                <div className="absolute left-5 top-[50px] flex items-center"><div className="w-3 h-[1.5px] bg-gray-500 mr-1" /><span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ACES</span></div>
                <motion.div className="w-[7px] h-[72px] rounded-sm absolute" style={{ background: 'linear-gradient(180deg, #d08828 0%, #9e6018 55%, #7a4810 100%)', opacity: oilMarkOp }} />
                <motion.div className="w-[7px] h-[72px] rounded-sm absolute" style={{ background: 'linear-gradient(180deg, #d1d5db, #9ca3af)', opacity: cleanRodOp }} />
                <div className="w-[7px] h-[72px]" />
              </div>
              <div className="w-[5px] h-5 bg-gray-400 rounded-b-full" />
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center px-6" style={{ opacity: revealOp }}>
          <p className="text-[#f3901d] text-xl font-bold">You have 50% of the standards!</p>
          <p className="text-gray-500 text-xs mt-1 tracking-wide">Subscribe to more standards to fill up your dipstick</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FullDiagnostics() {
  return (
    <motion.div className="absolute inset-0 bg-black z-40 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
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

function DashboardHUD({ centered, currentSlide }: { centered: boolean; currentSlide: number | null }) {
  const gaugeVal = useMotionValue(0);
  const [yearsCount, setYearsCount] = useState(0);

  useEffect(() => {
    if (!centered) { gaugeVal.set(0); setYearsCount(0); return; }
    const controls = animate(gaugeVal, 30, { duration: 2.4, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] });
    const unsub = gaugeVal.on('change', v => setYearsCount(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [centered]);

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 overflow-hidden"
      animate={{ height: centered ? 'min(430px, 74vh)' : 'clamp(190px, 34vh, 230px)' }}
      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
      style={{
        zIndex: 20,
        borderTopLeftRadius: centered ? '0' : '50% 34px',
        borderTopRightRadius: centered ? '0' : '50% 34px',
        transition: 'border-top-left-radius 0.9s cubic-bezier(0.4,0,0.2,1), border-top-right-radius 0.9s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <AnimatePresence mode="wait">
        {!centered && (
          <motion.div key="corner" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <div className="absolute bottom-0 left-0 right-0" style={{ pointerEvents: 'none' }}>
              <Lottie animationData={slide1DashboardData} loop autoplay style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <AnimatePresence mode="wait">
              {currentSlide !== null && (
                <motion.div
                  key={currentSlide}
                  style={{
                    position: 'absolute',
                    bottom: 'clamp(54px, 10vh, 78px)',
                    left: 'clamp(58px, 18vw, 96px)',
                    right: 'clamp(16px, 5vw, 42px)',
                    maxWidth: '420px',
                    zIndex: 25,
                    pointerEvents: 'none',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    style={{
                      padding: '10px 12px 11px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.76), rgba(0,0,0,0.42))',
                      borderLeft: `3px solid ${BRAND_ORANGE}`,
                      boxShadow: '0 10px 24px rgba(0,0,0,0.32)',
                      backdropFilter: 'blur(3px)',
                    }}
                  >
                    <p
                      style={{
                        color: '#ffffff',
                        fontSize: 'clamp(13px, 2.9vw, 16px)',
                        fontWeight: 650,
                        lineHeight: 1.35,
                        margin: 0,
                        textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                      }}
                    >
                      {SLIDE_TEXTS[currentSlide]}
                    </p>
                    <div className="flex gap-1.5 mt-3" aria-hidden="true">
                      {SLIDE_TEXTS.map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: i === currentSlide ? '20px' : '5px',
                            height: '3px',
                            borderRadius: '99px',
                            background: i === currentSlide ? 'rgba(243,144,29,0.95)' : 'rgba(255,255,255,0.34)',
                            transition: 'width 0.3s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {centered && (
          <motion.div key="centered-dash" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <div
              className="absolute bottom-0 left-1/2"
              style={{
                width: 'clamp(1120px, 132vw, 1600px)',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={patchedDashData} loop autoplay initialSegment={[130, 360] as [number, number]} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            <motion.div
              className="absolute"
              style={{
                left: '50%',
                top: 'min(214px, 38vh)',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 25,
                pointerEvents: 'none',
                width: 'min(320px, 82vw)',
              }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div style={{ fontSize: 'clamp(9px, 2.3vw, 11px)', letterSpacing: '0.16em', color: '#8899aa', textTransform: 'uppercase', marginBottom: '4px' }}>
                You've been a Member for
              </div>
              <div style={{ fontSize: 'clamp(50px, 12vw, 80px)', fontWeight: 900, color: BRAND_ORANGE, lineHeight: 1, textShadow: '0 0 28px rgba(243,144,29,0.55), 0 0 60px rgba(243,144,29,0.25)' }}>
                {yearsCount}
              </div>
              <div style={{ fontSize: 'clamp(11px, 2.7vw, 13px)', letterSpacing: '0.28em', color: '#cccccc', marginTop: '6px', textTransform: 'uppercase' }}>
                Years
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function DrivingView() {
  const [currentSlide, setCurrentSlide] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [dashCentered, setDashCentered] = useState(false);

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
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu</div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 min-h-24 bg-black z-50 flex flex-wrap items-center px-4 py-3 gap-2">
        <button onClick={handleRestart} className="flex items-center gap-1.5 text-[#f3901d] hover:text-orange-400 transition-colors shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="font-semibold text-sm">Restart</span>
        </button>

        <div className="flex-1 min-w-[190px] flex items-center justify-center gap-2">
          {isStarted && currentSlide !== null && !currentScreen && (
            <>
              <button onClick={handleSlideBack} disabled={currentSlide === 0} className="flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium transition-colors" style={{ borderColor: currentSlide === 0 ? '#374151' : '#f3901d', color: currentSlide === 0 ? '#374151' : '#f3901d' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              <button onClick={handleSlideNext} className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#f3901d] text-[#f3901d] text-sm font-medium hover:bg-[#f3901d]/10 transition-colors">
                {currentSlide === SLIDE_TEXTS.length - 1 ? 'Enter' : 'Next'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {currentScreen && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <button onClick={goToPrev} disabled={currentIdx === 0} className="w-7 h-7 flex items-center justify-center text-[#f3901d] hover:text-orange-300 disabled:text-gray-700 disabled:cursor-default transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => setCurrentScreen(item.id)} className="transition-colors text-sm leading-tight" style={{ color: currentScreen === item.id ? BRAND_ORANGE : '#6b7280', fontWeight: currentScreen === item.id ? 'bold' : 'normal' }}>
                  {item.label}
                </button>
              ))}
              <button onClick={goToNext} disabled={currentIdx === screenOrder.length - 1} className="w-7 h-7 flex items-center justify-center text-[#f3901d] hover:text-orange-300 disabled:text-gray-700 disabled:cursor-default transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>

        {isStarted && currentSlide !== null && !currentScreen && (
          <button onClick={handleSkip} className="flex items-center gap-1 text-gray-500 hover:text-[#f3901d] transition-colors border border-gray-700 hover:border-[#f3901d]/50 rounded px-3 py-1.5 text-sm font-medium shrink-0">
            <span>Skip</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      <div className="absolute top-[72px] bottom-24 left-0 right-0 overflow-hidden">
        {!isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#27B0FA] md:bg-transparent">
            <div className="absolute inset-0 -top-[72px] md:top-0">
              <img src={imgMountainRoad} alt="Mountain road" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6 px-4">
              <div className="text-center">
                <h1 className="text-6xl font-extrabold text-black mb-2">Auto Care</h1>
                <h1 className="text-6xl font-extrabold text-black">WRAPPED</h1>
              </div>
              <div className="bg-black px-8 py-3"><p className="text-[#f3901d] font-bold text-lg">Your Year In Review</p></div>
              <button onClick={() => { setIsStarted(true); setCurrentSlide(0); }} className="mt-8 w-48 h-48 rounded-full bg-black border-8 border-[#f3901d] flex items-center justify-center text-white text-2xl font-bold hover:bg-gray-900 transition-all active:scale-95">
                Push to start
              </button>
            </div>
          </div>
        )}

        {isStarted && (
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{ zIndex: 0 }}>
              <motion.div className="absolute inset-0" style={{ opacity: nightSkyOp, background: 'linear-gradient(180deg, #000005 0%, #020818 45%, #060d22 75%, #0a1228 100%)' }} />
              <motion.div className="absolute inset-0" style={{ opacity: starOp }}>
                {STARS.map((s, i) => <div key={i} className="absolute rounded-full bg-white" style={{ left: s.x, top: s.y, width: s.size, height: s.size, opacity: s.opacity }} />)}
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: preDawnOp, background: 'linear-gradient(180deg, #0d0820 0%, #1e1040 35%, #32186a 65%, #4a2080 100%)' }} />
              <motion.div className="absolute inset-0" style={{ opacity: sunriseOp, background: 'linear-gradient(180deg, #060318 0%, #120820 25%, #2a1000 55%, #8b3a00 75%, #d96800 88%, #ff9020 95%, #ffc060 100%)' }} />
              <motion.div className="absolute left-0 right-0" style={{ opacity: horizonGlowOp, bottom: '68%', height: '16%', background: 'radial-gradient(ellipse 140% 100% at 50% 100%, rgba(255,140,40,0.6) 0%, rgba(255,80,0,0.25) 60%, transparent 100%)' }} />
              <motion.div className="absolute rounded-full" style={{ width: '70px', height: '70px', left: 'calc(50% - 35px)', bottom: '68%', y: sunYPx, opacity: sunOpacity, background: 'radial-gradient(circle, #fff8e0 0%, #ffd060 35%, #ffaa20 65%, #ff7000 100%)', boxShadow: '0 0 40px 16px rgba(255,160,40,0.55), 0 0 80px 32px rgba(255,120,0,0.25)' }} />
            </div>

            <div className="absolute inset-0" style={{ zIndex: 1 }}>
              <Lottie animationData={carOnTrackData} loop autoplay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} rendererSettings={{ preserveAspectRatio: 'xMidYMax slice' }} />
            </div>

            <DashboardHUD centered={dashCentered} currentSlide={currentSlide} />

            {currentScreen && currentScreen !== 'journey' && <div className="absolute inset-0 bg-gray-950" style={{ zIndex: 39 }} />}
            {currentScreen === 'hood' && <UnderTheHood key="hood" />}
            {currentScreen === 'diagnostics' && <FullDiagnostics />}
          </div>
        )}
      </div>
    </div>
  );
}
