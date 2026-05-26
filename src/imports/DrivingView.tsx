import { useRef, useState, useEffect } from 'react';
import { motion, useAnimationFrame, animate } from 'motion/react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';

const BRAND_ORANGE = '#f3901d';
const SIGN_DURATION = 7.4;
const SIGN_GAP = 0.35;
const SIGN_START = 0.9;
const SIGN_COUNT = 4;
const DASHBOARD_START = SIGN_START + SIGN_COUNT * (SIGN_DURATION + SIGN_GAP) + 0.6;

function DashboardGauge({ onNext }: { onNext: () => void }) {
  const [gaugeValue, setGaugeValue] = useState(0);
  const centerX = 225;
  const centerY = 235;
  const needleAngle = -135 + (gaugeValue / 30) * 270 * 0.3;

  useEffect(() => {
    const controls = animate(0, 30, {
      duration: 2.5,
      delay: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (latest) => setGaugeValue(latest),
    });
    return () => controls.stop();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <div className="absolute top-[80px] left-0 right-0 bg-gradient-to-b from-gray-800/50 to-transparent p-6 border-b-2 border-[#f3901d]/30">
        <h2 className="text-[#f3901d] text-3xl font-bold text-center mb-1">Your Journey</h2>
        <p className="text-gray-400 text-lg text-center">Celebrating Growth & Innovation</p>
      </div>

      <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,520px)] text-center">
        <svg width="520" height="390" viewBox="0 0 520 390" className="w-full h-auto drop-shadow-2xl">
          <defs>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={BRAND_ORANGE} />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <filter id="orangeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={centerX} cy={centerY} r="178" fill="#151515" stroke="#343434" strokeWidth="3" />
          <circle cx={centerX} cy={centerY} r="145" fill="none" stroke="#080808" strokeWidth="34" />
          <path d="M 82 235 A 143 143 0 1 1 368 235" fill="none" stroke="#272727" strokeWidth="26" strokeLinecap="round" />
          <motion.path
            d="M 82 235 A 143 143 0 0 1 128 130"
            fill="none"
            stroke={BRAND_ORANGE}
            strokeWidth="26"
            strokeLinecap="round"
            filter="url(#orangeGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: gaugeValue / 30 }}
            transition={{ duration: 2.5, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />

          {Array.from({ length: 13 }).map((_, i) => {
            const tickAngle = -135 + (i / 12) * 270;
            const rad = (tickAngle * Math.PI) / 180;
            const outer = 152;
            const inner = i % 3 === 0 ? 124 : 136;
            return (
              <line
                key={i}
                x1={centerX + Math.cos(rad) * outer}
                y1={centerY + Math.sin(rad) * outer}
                x2={centerX + Math.cos(rad) * inner}
                y2={centerY + Math.sin(rad) * inner}
                stroke={i <= 4 ? BRAND_ORANGE : '#505050'}
                strokeWidth={i % 3 === 0 ? 4 : 2}
                strokeLinecap="round"
              />
            );
          })}

          <motion.line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2="92"
            stroke="#000"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
            initial={{ rotate: -135 }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 2.5, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />
          <motion.line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2="88"
            stroke="url(#needleGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ rotate: -135 }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 2.5, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />

          <circle cx={centerX} cy={centerY} r="27" fill="#242424" stroke={BRAND_ORANGE} strokeWidth="3" />
          <circle cx={centerX} cy={centerY} r="14" fill={BRAND_ORANGE} />
          <circle cx={centerX} cy={centerY} r="7" fill="#111" />

          <text x={centerX} y="318" textAnchor="middle" className="fill-[#f3901d] font-bold" fontSize="58">
            {Math.round(gaugeValue)}
          </text>
          <text x={centerX} y="346" textAnchor="middle" className="fill-gray-400 font-semibold" fontSize="19">
            YEARS
          </text>
        </svg>

        <p className="mt-2 text-gray-400 text-xl font-semibold uppercase tracking-wider">of Excellence</p>
      </div>
    </motion.div>
  );
}

function FuelGauge({ onNext }: { onNext: () => void }) {
  const [memberCount, setMemberCount] = useState(0);
  const fillPercent = (memberCount / 5000) * 0.75;

  useEffect(() => {
    const controls = animate(0, 5000, {
      duration: 3,
      delay: 0.5,
      onUpdate: (latest) => setMemberCount(latest),
    });
    return () => controls.stop();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-40"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="absolute top-[80px] left-0 right-0 bg-gradient-to-b from-gray-800/50 to-transparent p-6 border-b-2 border-[#f3901d]/30">
        <h2 className="text-[#f3901d] text-3xl font-bold text-center mb-1">Member Network</h2>
        <p className="text-gray-400 text-lg text-center">Our Growing Community</p>
      </div>

      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,520px)]">
        <svg width="520" height="380" viewBox="0 0 520 380" className="w-full h-auto drop-shadow-2xl">
          <defs>
            <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="50%" stopColor={BRAND_ORANGE} />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>

          <rect x="95" y="72" width="330" height="205" rx="18" fill="#151515" stroke="#343434" strokeWidth="3" />
          <rect x="122" y="102" width="276" height="126" rx="12" fill="#080808" stroke="#262626" strokeWidth="3" />

          <motion.rect
            x="128"
            y="108"
            width="264"
            height="114"
            rx="9"
            fill="url(#fuelGradient)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: fillPercent }}
            transition={{ duration: 3, delay: 0.5 }}
            style={{ transformOrigin: '128px 165px' }}
          />

          {Array.from({ length: 11 }).map((_, i) => {
            const x = 128 + i * 26.4;
            const major = i % 2 === 0;
            return (
              <line
                key={i}
                x1={x}
                y1="108"
                x2={x}
                y2="222"
                stroke={major ? '#454545' : '#333'}
                strokeWidth={major ? 2 : 1}
                opacity={major ? 0.9 : 0.55}
              />
            );
          })}

          <text x="128" y="258" textAnchor="middle" className="fill-gray-400 font-bold" fontSize="18">E</text>
          <text x="392" y="258" textAnchor="middle" className="fill-gray-400 font-bold" fontSize="18">F</text>
          <text x="260" y="316" textAnchor="middle" className="fill-[#f3901d] font-bold" fontSize="54">
            {Math.round(memberCount).toLocaleString()}
          </text>
          <text x="260" y="344" textAnchor="middle" className="fill-gray-400 font-semibold" fontSize="18">
            MEMBERS
          </text>
        </svg>
      </div>
    </motion.div>
  );
}

function SignOverhead({ signNumber, duration }: { signNumber: number; duration: number }) {
  const [zIndex, setZIndex] = useState(12);

  const signText = {
    1: 'Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.',
    2: 'This report captures your role in that progress — the events you attended, the insights you gained, the voices you amplified, and the initiatives you supported.',
    3: 'Your engagement matters. Your impact multiplies.',
    4: "Here's your year with Auto Care in motion.",
  }[signNumber];

  return (
    <motion.div
      className="absolute left-1/2 top-0 -translate-x-1/2 will-change-transform"
      style={{ zIndex, transformPerspective: 900 }}
      initial={{ y: '47vh', scale: 0.08, rotateX: 22, opacity: 0.15 }}
      animate={{ y: '-82vh', scale: 3.15, rotateX: 0, opacity: [0.15, 1, 1, 0.96] }}
      transition={{
        duration,
        ease: [0.18, 0.84, 0.18, 1],
      }}
      onUpdate={(latest) => {
        const scale = Number(latest.scale ?? 0);
        if (scale >= 0.34 && zIndex !== 36) {
          setZIndex(36);
        }
      }}
    >
      <div className="relative flex items-start justify-start -translate-x-[34%] [transform-style:preserve-3d]">
        <div className="relative w-[660px] bg-gray-800 border-[14px] border-gray-600 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <div className="absolute left-8 top-full w-8 h-[520px] bg-gradient-to-r from-gray-500 via-gray-700 to-gray-900 shadow-2xl" />
          <div className="absolute left-8 top-full w-8 h-[520px] translate-x-10 bg-gradient-to-r from-gray-500 via-gray-700 to-gray-900 shadow-2xl" />

          <div className="relative overflow-hidden rounded-md bg-black p-6 min-h-[150px] flex items-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(243,144,29,0.08)_1px,transparent_1px)] bg-[length:100%_8px] opacity-70" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/15 to-transparent"
              animate={{ y: ['-120%', '220%'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            />

            <p className="relative z-10 text-center text-[32px] leading-snug font-bold text-[#f3901d] drop-shadow-[0_0_12px_rgba(243,144,29,0.7)]">
              {signText}
            </p>
          </div>

          <div className="absolute top-3 left-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
          <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
        </div>
      </div>
    </motion.div>
  );
}

function getCurrentSign(time: number) {
  for (let i = 0; i < SIGN_COUNT; i += 1) {
    const start = SIGN_START + i * (SIGN_DURATION + SIGN_GAP);
    if (time >= start && time < start + SIGN_DURATION) {
      return i + 1;
    }
  }
  return null;
}

export function DrivingView() {
  const timeRef = useRef(0);
  const [currentSign, setCurrentSign] = useState<number | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<'years' | 'members' | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useAnimationFrame((_, delta) => {
    if (!isStarted) return;

    timeRef.current += delta * 0.001;
    const time = timeRef.current;

    setCurrentSign(getCurrentSign(time));

    if (time >= DASHBOARD_START && !currentDashboard) {
      setCurrentDashboard('years');
    }
  });

  const roadPath = {
    leftEdge: 'M 400 0 L 200 600',
    rightEdge: 'M 600 0 L 800 600',
    centerLine: 'M 500 0 L 500 600',
    surface: 'M 400 0 L 200 600 L 800 600 L 600 0 Z',
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu ☰</div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black z-50 flex items-center px-6">
        <button
          onClick={() => {
            setIsStarted(false);
            timeRef.current = 0;
            setCurrentSign(null);
            setCurrentDashboard(null);
          }}
          className="flex items-center gap-2 text-[#f3901d] hover:text-orange-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Restart</span>
        </button>

        {currentDashboard && (
          <>
            <div className="flex-1 text-center text-[#f3901d] font-bold text-lg">Instrument Panel</div>

            {currentDashboard === 'years' && (
              <button
                onClick={() => setCurrentDashboard('members')}
                className="flex items-center gap-2 text-[#f3901d] hover:text-orange-500 transition-colors"
              >
                <span className="font-semibold">Next</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}

            {currentDashboard === 'members' && <div className="w-20" />}
          </>
        )}
      </div>

      <div className="absolute top-[72px] bottom-24 left-0 right-0 overflow-hidden">
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

        {isStarted && (
          <div className="absolute inset-0">
            <div className="absolute inset-0">
              <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-blue-500 via-sky-400 to-sky-300" />
              <div className="absolute inset-0 top-1/2 h-1/2 bg-gradient-to-b from-green-700 via-green-600 to-green-800" />

              <svg className="absolute inset-0 z-10 w-full h-full" viewBox="0 0 1000 800" preserveAspectRatio="none">
                <path d="M0,350 Q200,250 400,300 T800,280 L1000,300 L1000,800 L0,800 Z" fill="#1e40af" opacity="0.4" />
                <path d="M0,380 Q250,300 500,340 T1000,330 L1000,800 L0,800 Z" fill="#1e3a8a" opacity="0.5" />
                <path d="M0,420 Q300,360 600,400 T1000,390 L1000,800 L0,800 Z" fill="#15803d" opacity="0.72" />
              </svg>

              <svg className="absolute inset-0 z-[24] w-full h-full pointer-events-none" viewBox="0 0 1000 800" preserveAspectRatio="none">
                <path d="M0,418 Q280,365 560,398 T1000,390 L1000,800 L0,800 Z" fill="#166534" opacity="0.96" />
              </svg>
            </div>

            {currentSign !== null && <SignOverhead key={currentSign} signNumber={currentSign} duration={SIGN_DURATION} />}

            {currentDashboard === 'years' && <DashboardGauge onNext={() => setCurrentDashboard('members')} />}
            {currentDashboard === 'members' && <FuelGauge onNext={() => {}} />}

            <div className="absolute inset-0 z-[25]">
              <div className="absolute top-1/2 bottom-0 left-0 right-0">
                <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
                  <path d={roadPath.surface} fill="#374151" />
                  <path d={roadPath.leftEdge} stroke="white" strokeWidth="8" fill="none" />
                  <path d={roadPath.rightEdge} stroke="white" strokeWidth="8" fill="none" />
                  <path d={roadPath.centerLine} stroke="#fbbf24" strokeWidth="6" strokeDasharray="40 30" fill="none">
                    <animate attributeName="stroke-dashoffset" from="0" to="70" dur="0.5s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
