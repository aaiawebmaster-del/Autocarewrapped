import { useRef, useState, useEffect } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform, animate } from 'motion/react';
import imgMountainRoad from '../../imports/Screen1/061eac1a3db513915e4c53f4dae9a70e92d32dbb.png';

function DashboardGauge({ onNext }: { onNext: () => void }) {
  const [gaugeValue, setGaugeValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, 30, {
      duration: 2.5,
      delay: 1,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (latest) => setGaugeValue(latest)
    });
    return () => controls.stop();
  }, []);

  // Convert value to angle (0-30 maps to about 30% of semicircle)
  const angle = -135 + (gaugeValue / 30) * 270 * 0.3; // 30% of 270 degree range

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Dashboard Panel */}
      <div className="absolute top-[80px] left-0 right-0 bg-gradient-to-b from-gray-800/50 to-transparent p-6 border-b-2 border-[#f3901d]/30">
        <h2 className="text-[#f3901d] text-3xl font-bold text-center mb-1">Your Journey</h2>
        <p className="text-gray-400 text-lg text-center">Celebrating Growth & Innovation</p>
      </div>

      {/* Speedometer Gauge */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="450" height="350" viewBox="0 0 450 350" className="drop-shadow-2xl">
          {/* Outer bezel */}
          <circle cx="225" cy="250" r="180" fill="#1a1a1a" stroke="#333" strokeWidth="2" />

          {/* Gauge tick marks */}
          {Array.from({ length: 13 }).map((_, i) => {
            const angle = -135 + (i / 12) * 270;
            const rad = (angle * Math.PI) / 180;
            const x1 = 225 + Math.cos(rad) * 140;
            const y1 = 250 + Math.sin(rad) * 140;
            const x2 = 225 + Math.cos(rad) * (i % 3 === 0 ? 120 : 130);
            const y2 = 250 + Math.sin(rad) * (i % 3 === 0 ? 120 : 130);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i <= (12 * 0.3) ? "#f3901d" : "#444"}
                strokeWidth={i % 3 === 0 ? "3" : "2"}
              />
            );
          })}

          {/* Gauge arc background */}
          <path
            d="M 75 180 A 160 160 0 1 1 375 180"
            fill="none"
            stroke="#222"
            strokeWidth="35"
          />

          {/* Active arc */}
          <motion.path
            d="M 75 180 A 160 160 0 0 1 375 180"
            fill="none"
            stroke="#f3901d"
            strokeWidth="35"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.3 * (gaugeValue / 30) }}
            transition={{ duration: 2.5, delay: 1, ease: [0.34, 1.56, 0.64, 1] }}
          />

          {/* Needle and center assembly */}
          <g>
            {/* Needle shadow */}
            <motion.line
              x1="225"
              y1="250"
              x2="225"
              y2="110"
              stroke="#000"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ rotate: -135 }}
              animate={{ rotate: angle }}
              transition={{ duration: 2.5, delay: 1, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: '225px 250px' }}
              opacity="0.3"
            />

            {/* Needle */}
            <motion.line
              x1="225"
              y1="250"
              x2="225"
              y2="105"
              stroke="url(#needleGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ rotate: -135 }}
              animate={{ rotate: angle }}
              transition={{ duration: 2.5, delay: 1, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: '225px 250px' }}
            />

            {/* Center hub */}
            <circle cx="225" cy="250" r="25" fill="#2a2a2a" stroke="#f3901d" strokeWidth="3" />
            <circle cx="225" cy="250" r="15" fill="#f3901d" />
            <circle cx="225" cy="250" r="8" fill="#1a1a1a" />
          </g>

          {/* Value display */}
          <text
            x="225"
            y="240"
            textAnchor="middle"
            className="fill-[#f3901d] font-bold"
            style={{ fontSize: '60px' }}
          >
            {Math.round(gaugeValue)}
          </text>
          <text
            x="225"
            y="270"
            textAnchor="middle"
            className="fill-gray-400 font-semibold"
            style={{ fontSize: '20px' }}
          >
            YEARS
          </text>

          {/* Gradient definition */}
          <defs>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3901d" />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
          </defs>
        </svg>

        <div className="text-center mt-8">
          <p className="text-gray-400 text-xl font-semibold uppercase tracking-wider">of Excellence</p>
        </div>
      </div>
    </motion.div>
  );
}

function FuelGauge({ onNext }: { onNext: () => void }) {
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, 5000, {
      duration: 3,
      delay: 0.5,
      onUpdate: (latest) => setMemberCount(latest)
    });
    return () => controls.stop();
  }, []);

  // Convert to fill percentage (simulating ~75% full)
  const fillPercent = (memberCount / 5000) * 0.75;

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 z-40"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Dashboard Panel */}
      <div className="absolute top-[80px] left-0 right-0 bg-gradient-to-b from-gray-800/50 to-transparent p-6 border-b-2 border-[#f3901d]/30">
        <h2 className="text-[#f3901d] text-3xl font-bold text-center mb-1">Member Network</h2>
        <p className="text-gray-400 text-lg text-center">Our Growing Community</p>
      </div>

      {/* Fuel Gauge */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="450" height="350" viewBox="0 0 450 350" className="drop-shadow-2xl">
          {/* Outer bezel */}
          <rect x="100" y="80" width="250" height="180" rx="15" fill="#1a1a1a" stroke="#333" strokeWidth="2" />

          {/* Fuel tank outline */}
          <rect x="120" y="100" width="210" height="140" rx="10" fill="#0a0a0a" stroke="#222" strokeWidth="3" />

          {/* Empty markers */}
          <line x1="125" y1="110" x2="125" y2="230" stroke="#333" strokeWidth="2" />
          <line x1="145" y1="110" x2="145" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="165" y1="110" x2="165" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="185" y1="110" x2="185" y2="230" stroke="#333" strokeWidth="2" />
          <line x1="205" y1="110" x2="205" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="225" y1="110" x2="225" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="245" y1="110" x2="245" y2="230" stroke="#333" strokeWidth="2" />
          <line x1="265" y1="110" x2="265" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="285" y1="110" x2="285" y2="230" stroke="#333" strokeWidth="1" opacity="0.5" />
          <line x1="305" y1="110" x2="305" y2="230" stroke="#333" strokeWidth="2" />
          <line x1="325" y1="110" x2="325" y2="230" stroke="#333" strokeWidth="2" />

          {/* Fuel level fill */}
          <motion.rect
            x="125"
            y="110"
            width="200"
            height="120"
            rx="8"
            fill="url(#fuelGradient)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: fillPercent }}
            transition={{ duration: 3, delay: 0.5 }}
            style={{ transformOrigin: '125px 170px' }}
          />

          {/* E and F labels */}
          <text x="110" y="255" className="fill-gray-400 font-bold" fontSize="18">E</text>
          <text x="330" y="255" className="fill-gray-400 font-bold" fontSize="18">F</text>

          {/* Member count */}
          <text
            x="225"
            y="300"
            textAnchor="middle"
            className="fill-[#f3901d] font-bold"
            fontSize="50"
          >
            {Math.round(memberCount).toLocaleString()}
          </text>
          <text
            x="225"
            y="325"
            textAnchor="middle"
            className="fill-gray-400 font-semibold"
            fontSize="18"
          >
            MEMBERS
          </text>

          {/* Gradient definition */}
          <defs>
            <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="50%" stopColor="#f3901d" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

function SignOverhead({ signNumber }: { signNumber: number }) {
  const [zIndex, setZIndex] = useState(5);

  const signText = {
    1: "Because of members like you, the auto care industry continues to grow stronger, smarter, and more connected.",
    2: "This report captures your role in that progress — the events you attended, the insights you gained, the voices you amplified, and the initiatives you supported.",
    3: "Your engagement matters. Your impact multiplies.",
    4: "Here's your year with Auto Care in motion."
  }[signNumber];

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ zIndex }}
      initial={{ y: '30vh', scale: 0.15 }}
      animate={{ y: '-80vh', scale: 3.5 }}
      transition={{
        duration: 12,
        ease: [0.6, 0, 0.4, 1] // More pronounced slowdown in the middle for readability
      }}
      onUpdate={(latest) => {
        const scale = latest.scale as number;

        // When sign gets large enough (poles have crossed horizon), switch to front
        // At small scale (0.15-0.5), sign is far/behind. At larger scale (>0.5), it's closer/in front
        if (scale >= 0.5 && zIndex === 5) {
          setZIndex(35);
        }
      }}
    >
      {/* Sign structure from left side */}
      <div className="relative flex items-start justify-start -translate-x-[40%]">
        {/* Sign board - positioned on left side of road */}
        <div className="relative bg-gray-800 border-[16px] border-gray-600 shadow-2xl p-3 w-[700px]">
          {/* Single support pole on left side */}
          <div className="absolute left-4 top-full w-10 h-[500px] bg-gradient-to-r from-gray-600 to-gray-800" />

          {/* LED screen effect */}
          <div className="bg-black rounded-lg p-6 relative overflow-hidden">
            {/* Scan line effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Text content */}
            <p className="text-[#f3901d] text-4xl md:text-2xl leading-relaxed font-bold relative z-10 drop-shadow-[0_0_12px_rgba(243,144,29,0.6)] text-center">
              {signText}
            </p>
          </div>

          {/* Corner lights */}
          <div className="absolute top-3 left-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
          <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
        </div>
      </div>
    </motion.div>
  );
}

export function DrivingView() {
  const timeRef = useRef(0);
  const [roadCurve, setRoadCurve] = useState(0);
  const [roadTilt, setRoadTilt] = useState(0);
  const [currentSign, setCurrentSign] = useState<number | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<'years' | 'members' | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useAnimationFrame((t, delta) => {
    if (!isStarted) return;

    timeRef.current += delta * 0.001;
    const time = timeRef.current;

    // Show signs with 2 second gap between them (12s duration each)
    if (time > 1.3 && time < 13.3) {
      setCurrentSign(1);
    } else if (time >= 15.3 && time < 27.3) {
      setCurrentSign(2);
    } else if (time >= 29.3 && time < 41.3) {
      setCurrentSign(4);
    } else {
      setCurrentSign(null);
    }

    // Show dashboard after last sign starts exiting
    if (time >= 38 && !currentDashboard) {
      setCurrentDashboard('years');
    }

    // Straight road - no curves
    setRoadCurve(0);
    setRoadTilt(0);
  });

  // Straight road path - narrower road
  const roadPath = {
    leftEdge: `M 400 0 L 200 600`,
    rightEdge: `M 600 0 L 800 600`,
    centerLine: `M 500 0 L 500 600`,
    surface: `M 400 0 L 200 600 L 800 600 L 600 0 Z`,
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Fixed Header */}
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-4 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-white text-sm font-bold">auto care</span>
          <span className="text-[#f3901d] text-xs font-bold">ASSOCIATION</span>
        </div>
        <div className="text-[#f3901d] font-semibold">Menu ☰</div>
      </div>

      {/* Fixed Bottom Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black z-50 flex items-center px-6">
        <button
          onClick={() => {
            setIsStarted(false);
            timeRef.current = 0;
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
            <div className="flex-1 text-center text-[#f3901d] font-bold text-lg">
              Instrument Panel
            </div>

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

            {currentDashboard === 'members' && (
              <div className="w-20"></div>
            )}
          </>
        )}
      </div>

      {/* Content Area - Between header and footer */}
      <div className="absolute top-[72px] bottom-24 left-0 right-0 overflow-hidden">
        {/* Start Screen */}
        {!isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#27B0FA] md:bg-transparent">
            {/* Background with mountain image */}
            <div className="absolute inset-0 -top-[72px] md:top-0">
              <img
                src={imgMountainRoad}
                alt="Mountain road"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content */}
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

        {/* Driving Animation */}
        {isStarted && (
          <div className="absolute inset-0">
            {/* Fixed Sky and Horizon */}
            <div className="absolute inset-0">
              {/* Sky - upper half */}
              <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-blue-500 via-sky-400 to-sky-300" />

              {/* Ground/Landscape - lower half */}
              <div className="absolute inset-0 top-1/2 h-1/2 bg-gradient-to-b from-green-700 via-green-600 to-green-800" />

              {/* Fixed Mountain Silhouettes - Stable Horizon */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 1000 800" preserveAspectRatio="none">
                  {/* Far mountains */}
                  <path
                    d="M0,350 Q200,250 400,300 T800,280 L1000,300 L1000,800 L0,800 Z"
                    fill="#1e40af"
                    opacity="0.4"
                  />
                  {/* Mid mountains */}
                  <path
                    d="M0,380 Q250,300 500,340 T1000,330 L1000,800 L0,800 Z"
                    fill="#1e3a8a"
                    opacity="0.5"
                  />
                  {/* Near hills */}
                  <path
                    d="M0,420 Q300,360 600,400 T1000,390 L1000,800 L0,800 Z"
                    fill="#15803d"
                    opacity="0.7"
                  />
                </svg>
              </div>
            </div>

            {/* Overhead Digital Signs - Start behind horizon, then come forward */}
            {currentSign !== null && (
              <SignOverhead key={currentSign} signNumber={currentSign} />
            )}

            {/* Dashboard Gauges */}
            {currentDashboard === 'years' && <DashboardGauge onNext={() => setCurrentDashboard('members')} />}
            {currentDashboard === 'members' && <FuelGauge onNext={() => {}} />}

            {/* Road - No tilt, straight ahead */}
            <div className="absolute inset-0 z-20">
              {/* Straight Road - Top aligned with horizon (50%) */}
              <div className="absolute top-1/2 bottom-0 left-0 right-0">
                <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
                  {/* Road surface */}
                  <path
                    d={roadPath.surface}
                    fill="#374151"
                  />

                  {/* Road edge - white lines */}
                  <path
                    d={roadPath.leftEdge}
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                  />
                  <path
                    d={roadPath.rightEdge}
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                  />

                  {/* Yellow center line */}
                  <path
                    d={roadPath.centerLine}
                    stroke="#fbbf24"
                    strokeWidth="6"
                    strokeDasharray="40 30"
                    fill="none"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="70"
                      dur="0.5s"
                      repeatCount="indefinite"
                    />
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
