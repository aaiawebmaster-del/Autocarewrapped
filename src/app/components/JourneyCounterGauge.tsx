import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, animate } from 'motion/react';
import gasPumpIconUrl from '../../assets/gas-pump-solid.png';

const BRAND_ORANGE = '#f3901d';

export const JOURNEY_GAUGE_SIZE = 'clamp(200px, 32vw, 280px)';
export const JOURNEY_GAUGE_VALUE_FONT = '35px';
export const JOURNEY_GAUGE_LABEL_FONT = 'clamp(11px, 1.6vw, 14px)';
/** Compact readout sizing for Full Diagnostics 4-up stat row (~50% of journey dial scale). */
export const DIAGNOSTICS_GAUGE_VALUE_FONT = 'clamp(11px, 2.2vw, 19px)';
export const DIAGNOSTICS_GAUGE_LABEL_FONT = 'clamp(7px, 1.2vw, 10px)';

const GAUGE_MIN_ANGLE = -135;
const GAUGE_MAX_ANGLE = 135;
const GAUGE_SWEEP = GAUGE_MAX_ANGLE - GAUGE_MIN_ANGLE;

/** Bottom semicircle — empty (E) left to full (F) right, 180° sweep. */
const FUEL_MIN_ANGLE = 180;
const FUEL_MAX_ANGLE = 360;
const FUEL_SWEEP = FUEL_MAX_ANGLE - FUEL_MIN_ANGLE;
const FUEL_LABEL_FONT_SIZE = 14;

const BATTERY_WARNING_DELAY_MS = 750;

function valueToAngle(value: number) {
  const clamped = Math.max(0, Math.min(100, value));
  return GAUGE_MIN_ANGLE + (clamped / 100) * GAUGE_SWEEP;
}

function fuelPercentToAngle(percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  return FUEL_MIN_ANGLE + (clamped / 100) * FUEL_SWEEP;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

function GaugeDialSlot({
  children,
  counterDialBox = false,
}: {
  children: ReactNode;
  /** Fixed square dial area on journey counter slides — keeps layout stable across variants. */
  counterDialBox?: boolean;
}) {
  return (
    <div
      className={['journey-counter-gauge__dial-slot', counterDialBox ? 'journey-counter-gauge__dial-slot--counter' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

type JourneyCounterGaugeProps = {
  target: number;
  label: string;
  /** Multi-line label under the count (e.g. committee contact). */
  labelLines?: string[];
  /** Re-run count-up when this changes (e.g. journey slide index). */
  animationKey?: string | number;
  duration?: number;
  delay?: number;
  circleSize?: string;
  valueFontSize?: string;
  labelFontSize?: string;
  /** @deprecated Speedometer is always shown; kept for call-site compatibility. */
  showGaugeBackground?: boolean;
  className?: string;
  /** Fires once when the count-up animation reaches the target. */
  onCountComplete?: () => void;
  /** Where to show the animated count — center of dial or below the dial. */
  readoutMode?: 'dial' | 'below';
  variant?: 'speedometer' | 'fuel' | 'battery';
  /** Use a fixed dial box (journey counter slides) so fuel/speedometer/battery do not shift layout. */
  counterDialBox?: boolean;
  /** Hide the below-dial stat readout (e.g. mobile message phase). */
  hideStatBelow?: boolean;
  /** Wrap the below-dial stat readout (e.g. mobile chevrons). */
  renderStatBelow?: (stat: ReactNode) => ReactNode;
};

export function JourneyCounterGauge({
  target,
  label,
  labelLines,
  animationKey,
  duration = 2400,
  delay = 0,
  circleSize = JOURNEY_GAUGE_SIZE,
  valueFontSize,
  labelFontSize,
  className,
  onCountComplete,
  readoutMode = 'dial',
  variant = 'speedometer',
  counterDialBox = false,
  hideStatBelow = false,
  renderStatBelow,
}: JourneyCounterGaugeProps) {
  const uid = useId().replace(/:/g, '');
  const [gaugeValue, setGaugeValue] = useState(0);
  const [batteryWarningActive, setBatteryWarningActive] = useState(false);
  const onCountCompleteRef = useRef(onCountComplete);
  onCountCompleteRef.current = onCountComplete;

  const displayValue = target >= 1000 ? Math.round(gaugeValue).toLocaleString() : String(Math.round(gaugeValue));
  const needleAngle = valueToAngle(gaugeValue);
  const fillPercent = Math.min(Math.max(target, 0), 100);
  const needleTarget =
    variant === 'fuel'
      ? fillPercent
      : variant === 'battery'
        ? 0
        : Math.min(Math.max(target, 0), 100);
  const fuelFillAngle = fuelPercentToAngle(gaugeValue);

  const resolvedValueFontSize =
    valueFontSize ?? (target >= 1000 ? 'clamp(14px, 3vw, 22px)' : 'clamp(22px, 4.5vw, 36px)');
  const resolvedLabelFontSize = labelFontSize ?? 'clamp(9px, 1.4vw, 12px)';

  const titleCaseLabel = (text: string) =>
    text.replace(/\b\w/g, (char) => char.toUpperCase());

  const cx = 120;
  const cy = 120;
  const outerR = 96;
  const trackR = 78;
  const tickOuterR = 88;
  const tickMajorInnerR = 74;
  const tickMinorInnerR = 80;
  const labelR = 66;
  /** Needle tip sits on the active arc (same radius as track). */
  const needleTipR = trackR;
  const needleTailInset = 10;

  useEffect(() => {
    setGaugeValue(0);
    const controls = animate(0, needleTarget, {
      duration: duration / 1000,
      delay: delay / 1000,
      ease: [0.22, 1.05, 0.36, 1],
      onUpdate: (latest) => setGaugeValue(latest),
      onComplete: () => onCountCompleteRef.current?.(),
    });
    return () => controls.stop();
  }, [target, duration, delay, animationKey, needleTarget]);

  useEffect(() => {
    if (variant !== 'battery') {
      setBatteryWarningActive(false);
      return;
    }
    setBatteryWarningActive(false);
    const timer = window.setTimeout(() => setBatteryWarningActive(true), BATTERY_WARNING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [variant, animationKey]);

  const rootClassName = [
    variant === 'fuel'
      ? 'journey-fuel-gauge'
      : variant === 'battery'
        ? 'journey-battery-gauge'
        : 'journey-speedometer-gauge',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shellStyle = {
    width: '100%',
    maxWidth: circleSize,
    height: 'fit-content' as const,
    flexShrink: 0,
    margin: 0,
  };

  const renderBelowStat = () => {
    if (readoutMode !== 'below' || hideStatBelow) return null;

    const stat = (
      <p className="journey-speedometer-gauge__stat-below" aria-live="polite">
        <span
          className="journey-speedometer-gauge__stat-value"
          style={{ fontSize: resolvedValueFontSize }}
        >
          {displayValue}
        </span>{' '}
        <span className="journey-speedometer-gauge__stat-label" style={labelFontSize ? { fontSize: resolvedLabelFontSize } : undefined}>
          {titleCaseLabel(label)}
        </span>
      </p>
    );

    return renderStatBelow ? renderStatBelow(stat) : stat;
  };

  const statBelow = renderBelowStat();

  if (variant === 'fuel') {
    const fuelCx = 120;
    const fuelCy = 120;
    const fuelOuterR = 96;
    const fuelTrackR = 78;
    const fuelTickOuterR = 88;
    const fuelTickInnerR = 70;
    const fuelLabelR = 68;
    const fuelTrackStart = polarToCartesian(fuelCx, fuelCy, fuelTrackR, FUEL_MIN_ANGLE);
    const fuelTrackEnd = polarToCartesian(fuelCx, fuelCy, fuelTrackR, FUEL_MAX_ANGLE);
    const fuelTrackD = `M ${fuelTrackStart.x} ${fuelTrackStart.y} A ${fuelTrackR} ${fuelTrackR} 0 1 1 ${fuelTrackEnd.x} ${fuelTrackEnd.y}`;
    const fuelFillPoint = polarToCartesian(fuelCx, fuelCy, fuelTrackR, fuelFillAngle);
    const fuelFillSweep = fuelFillAngle - FUEL_MIN_ANGLE;
    const fuelFillLargeArc = fuelFillSweep >= 180 ? 1 : 0;
    const fuelFillD = `M ${fuelTrackStart.x} ${fuelTrackStart.y} A ${fuelTrackR} ${fuelTrackR} 0 ${fuelFillLargeArc} 1 ${fuelFillPoint.x} ${fuelFillPoint.y}`;

    return (
      <div className={rootClassName} style={shellStyle}>
        <GaugeDialSlot counterDialBox={counterDialBox}>
          <div className="journey-fuel-gauge__dial">
          <svg
            className="journey-fuel-gauge__svg"
            viewBox="0 0 240 240"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${uid}-fuel-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a3a3a" />
                <stop offset="45%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              <linearGradient id={`${uid}-fuel-fill`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e85d04" />
                <stop offset="100%" stopColor={BRAND_ORANGE} />
              </linearGradient>
              <filter id={`${uid}-fuel-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={fuelCx}
              cy={fuelCy}
              r={fuelOuterR}
              fill={`url(#${uid}-fuel-bezel)`}
              stroke="#444"
              strokeWidth="1.5"
            />
            <circle cx={fuelCx} cy={fuelCy} r={fuelOuterR - 6} fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1" />

            <path d={fuelTrackD} fill="none" stroke="#0c0c0c" strokeWidth="14" strokeLinecap="round" />
            <path d={fuelTrackD} fill="none" stroke="#222" strokeWidth="10" strokeLinecap="round" />

            {gaugeValue > 0.5 && (
              <motion.path
                key={`fuel-${animationKey ?? target}`}
                d={fuelFillD}
                fill="none"
                stroke={`url(#${uid}-fuel-fill)`}
                strokeWidth="8"
                strokeLinecap="round"
                filter={`url(#${uid}-fuel-glow)`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
                transition={{ duration: 0.35 }}
              />
            )}

            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = fuelPercentToAngle(tick);
              const isMajor = tick % 50 === 0;
              const outer = polarToCartesian(fuelCx, fuelCy, fuelTickOuterR, angle);
              const inner = polarToCartesian(fuelCx, fuelCy, isMajor ? fuelTickInnerR : fuelTickInnerR + 6, angle);
              return (
                <line
                  key={tick}
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke={tick >= 75 ? '#e85d04' : isMajor ? '#ccc' : '#555'}
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            <text
              x={polarToCartesian(fuelCx, fuelCy, fuelLabelR, FUEL_MIN_ANGLE).x}
              y={polarToCartesian(fuelCx, fuelCy, fuelLabelR, FUEL_MIN_ANGLE).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#888"
              fontSize={FUEL_LABEL_FONT_SIZE}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              E
            </text>
            <text
              x={polarToCartesian(fuelCx, fuelCy, fuelLabelR, FUEL_MAX_ANGLE).x}
              y={polarToCartesian(fuelCx, fuelCy, fuelLabelR, FUEL_MAX_ANGLE).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={gaugeValue >= 75 ? '#e85d04' : '#888'}
              fontSize={FUEL_LABEL_FONT_SIZE}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              F
            </text>
          </svg>
          <div className="journey-fuel-gauge__pump-icon" aria-hidden>
            <img
              src={gasPumpIconUrl}
              alt=""
              draggable={false}
            />
          </div>
          </div>
        </GaugeDialSlot>
        {statBelow}
      </div>
    );
  }

  if (variant === 'battery') {
    const cx = 120;
    const cy = 120;
    const outerR = 96;
    const bodyW = 112;
    const bodyH = 78;
    const segmentCount = 4;
    const segmentGap = 6;
    const segmentH = (bodyH - segmentGap * (segmentCount + 1)) / segmentCount;
    const terminalW = 12;
    const terminalH = 9;
    const terminalGap = 3;
    const bodyLeft = -bodyW / 2;
    const bodyTop = -bodyH / 2;
    const terminalY = bodyTop - terminalGap - terminalH;
    const terminalLeftX = -terminalW - 4;
    const terminalRightX = 4;

    return (
      <div className={rootClassName} style={shellStyle}>
        <GaugeDialSlot counterDialBox={counterDialBox}>
          <div className="journey-battery-gauge__dial">
            <svg
              className="journey-speedometer-gauge__svg journey-battery-gauge__svg"
              viewBox="0 0 240 240"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <defs>
                <linearGradient id={`${uid}-battery-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3a3a3a" />
                  <stop offset="50%" stopColor="#1a1a1a" />
                  <stop offset="100%" stopColor="#080808" />
                </linearGradient>
              </defs>

              <circle
                cx={cx}
                cy={cy}
                r={outerR}
                fill={`url(#${uid}-battery-bezel)`}
                stroke="#444"
                strokeWidth="1.5"
              />
              <circle cx={cx} cy={cy} r={outerR - 8} fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1" />

              <g transform={`translate(${cx}, ${cy})`}>
                <rect
                  x={terminalLeftX}
                  y={terminalY}
                  width={terminalW}
                  height={terminalH}
                  rx="1.5"
                  fill="#555"
                  stroke="#666"
                  strokeWidth="1"
                />
                <rect
                  x={terminalRightX}
                  y={terminalY}
                  width={terminalW}
                  height={terminalH}
                  rx="1.5"
                  fill="#555"
                  stroke="#666"
                  strokeWidth="1"
                />
                <rect
                  x={bodyLeft}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  rx="8"
                  fill="#141414"
                  stroke={batteryWarningActive ? '#ef4444' : '#444'}
                  strokeWidth="2"
                />
                {Array.from({ length: segmentCount }, (_, i) => (
                  <rect
                    key={i}
                    x={bodyLeft + segmentGap}
                    y={bodyTop + segmentGap + i * (segmentH + segmentGap)}
                    width={bodyW - segmentGap * 2}
                    height={segmentH}
                    rx="2"
                    fill="#252525"
                    stroke="#333"
                    strokeWidth="1"
                  />
                ))}
              </g>
            </svg>

            {batteryWarningActive ? (
              <motion.div
                className="journey-battery-gauge__warning"
                role="img"
                aria-label="Low battery warning"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0.35, 1, 0.35], scale: 1 }}
                transition={{
                  opacity: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' },
                  scale: { duration: 0.25 },
                }}
              >
                <svg viewBox="0 0 48 48" className="journey-battery-gauge__warning-icon" aria-hidden>
                  <path
                    d="M24 4 L44 42 H4 Z"
                    fill="#dc2626"
                    stroke="#fef08a"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <text
                    x="24"
                    y="34"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="22"
                    fontWeight="800"
                    fontFamily="system-ui, sans-serif"
                  >
                    !
                  </text>
                </svg>
              </motion.div>
            ) : null}
          </div>
        </GaugeDialSlot>
        {statBelow}
      </div>
    );
  }

  return (
    <div className={rootClassName} style={shellStyle}>
      <GaugeDialSlot counterDialBox={counterDialBox}>
      <svg
        className="journey-speedometer-gauge__svg"
        viewBox="0 0 240 240"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${uid}-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="45%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={`${uid}-needle`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff8c42" />
            <stop offset="100%" stopColor={BRAND_ORANGE} />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer bezel */}
        <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-bezel)`} stroke="#444" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={outerR - 6} fill="none" stroke="#2a2a2a" strokeWidth="1" />

        {/* Track groove */}
        <path
          d={`M ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).x} ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).y} A ${trackR} ${trackR} 0 1 1 ${polarToCartesian(cx, cy, trackR, GAUGE_MAX_ANGLE).x} ${polarToCartesian(cx, cy, trackR, GAUGE_MAX_ANGLE).y}`}
          fill="none"
          stroke="#0c0c0c"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).x} ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).y} A ${trackR} ${trackR} 0 1 1 ${polarToCartesian(cx, cy, trackR, GAUGE_MAX_ANGLE).x} ${polarToCartesian(cx, cy, trackR, GAUGE_MAX_ANGLE).y}`}
          fill="none"
          stroke="#222"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Active arc */}
        {gaugeValue > 0.5 && (
          <motion.path
            key={`arc-${animationKey ?? target}`}
            d={`M ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).x} ${polarToCartesian(cx, cy, trackR, GAUGE_MIN_ANGLE).y} A ${trackR} ${trackR} 0 0 1 ${polarToCartesian(cx, cy, trackR, needleAngle).x} ${polarToCartesian(cx, cy, trackR, needleAngle).y}`}
            fill="none"
            stroke={BRAND_ORANGE}
            strokeWidth="8"
            strokeLinecap="round"
            filter={`url(#${uid}-glow)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Tick marks 0–100 */}
        {Array.from({ length: 51 }, (_, i) => {
          const value = i * 2;
          const angle = valueToAngle(value);
          const isMajor = value % 10 === 0;
          const innerR = isMajor ? tickMajorInnerR : tickMinorInnerR;
          const outer = polarToCartesian(cx, cy, tickOuterR, angle);
          const inner = polarToCartesian(cx, cy, innerR, angle);
          const inOrangeZone = value >= 80;
          return (
            <line
              key={value}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={isMajor ? (inOrangeZone ? '#e85d04' : '#ccc') : '#555'}
              strokeWidth={isMajor ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Scale numbers */}
        {[0, 20, 40, 60, 80, 100].map((value) => {
          const angle = valueToAngle(value);
          const pos = polarToCartesian(cx, cy, labelR, angle);
          return (
            <text
              key={value}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={value >= 80 ? '#e85d04' : '#888'}
              fontSize="9"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              {value}
            </text>
          );
        })}

        {/* Needle — same angle & radius as motion.path arc endpoint */}
        <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
          <line
            x1={cx}
            y1={cy + needleTailInset}
            x2={cx}
            y2={cy - needleTipR}
            stroke={`url(#${uid}-needle)`}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Hub cap */}
        <circle cx={cx} cy={cy} r="14" fill="#1a1a1a" stroke="#444" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="8" fill={BRAND_ORANGE} />
        <circle cx={cx} cy={cy} r="3.5" fill="#111" />
        </svg>
      </GaugeDialSlot>

      {readoutMode === 'dial' ? (
        <div className="journey-speedometer-gauge__readout" aria-live="polite">
          <span
            className="journey-speedometer-gauge__value"
            style={{ fontSize: resolvedValueFontSize }}
          >
            {displayValue}
          </span>
        </div>
      ) : null}

      {readoutMode === 'below' ? (
        renderBelowStat()
      ) : labelLines && labelLines.length > 0 ? (
        <div className="journey-speedometer-gauge__labels">
          {labelLines.map((line) => (
            <span
              key={line}
              className="journey-speedometer-gauge__label"
              style={{ fontSize: labelFontSize ?? resolvedLabelFontSize }}
            >
              {line}
            </span>
          ))}
        </div>
      ) : readoutMode === 'dial' ? (
        <span
          className="journey-speedometer-gauge__label journey-speedometer-gauge__label--below"
          style={{ fontSize: labelFontSize ?? resolvedLabelFontSize }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
