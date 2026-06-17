import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, animate } from 'motion/react';
import gasPumpIconUrl from '../../assets/gas-pump-solid.png';

const BRAND_ORANGE = '#f3901d';

export const JOURNEY_GAUGE_SIZE = 'clamp(200px, 32vw, 280px)';
export const JOURNEY_GAUGE_WIDE_SIZE = 'min(100%, clamp(18rem, 64vw, 25rem))';
export const JOURNEY_GAUGE_VALUE_FONT = '35px';
export const JOURNEY_GAUGE_LABEL_FONT = 'clamp(11px, 1.6vw, 14px)';
/** Compact readout sizing for Full Diagnostics 4-up stat row (~50% of journey dial scale). */
export const DIAGNOSTICS_GAUGE_VALUE_FONT = 'clamp(11px, 2.2vw, 19px)';
export const DIAGNOSTICS_GAUGE_LABEL_FONT = 'clamp(7px, 1.2vw, 10px)';

/** Bottom arc — 0 left, 100 right (standard dashboard speedometer sweep). */
const SPEEDO_MIN_ANGLE = 180;
const SPEEDO_MAX_ANGLE = 360;
const SPEEDO_SWEEP = SPEEDO_MAX_ANGLE - SPEEDO_MIN_ANGLE;

/** Bottom semicircle — empty (E) left to full (F) right, 180° sweep. */
const FUEL_MIN_ANGLE = 180;
const FUEL_MAX_ANGLE = 360;
const FUEL_SWEEP = FUEL_MAX_ANGLE - FUEL_MIN_ANGLE;
const FUEL_LABEL_FONT_SIZE = 14;
const BATTERY_WARNING_DELAY_MS = 750;
const LOW_FUEL_CONTACTS_THRESHOLD = 15;

function parseViewBoxHeight(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/);
  return Number(parts[3]) || 240;
}

function getGaugeWarningCenterPercent(cy: number, radius: number, viewBox: string, wide: boolean) {
  const centerY = wide ? getSemicircleContentCenterY(cy, radius) : cy;
  return `${(centerY / parseViewBoxHeight(viewBox)) * 100}%`;
}

function speedoValueToAngle(value: number) {
  const clamped = Math.max(0, Math.min(100, value));
  return SPEEDO_MIN_ANGLE + (clamped / 100) * SPEEDO_SWEEP;
}

/** Needle SVG points up (−90°); rotate to sit on the bottom arc angle. */
function speedoNeedleRotation(angle: number) {
  return angle + 90;
}

function speedoLabelRotation(value: number, angle: number) {
  if (value === 0) return 90;
  if (value === 100) return -90;
  return angle + 90;
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

function gaugeArcLargeFlag(startAngle: number, endAngle: number) {
  return Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
}

function buildGaugeArcD(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  largeArc = gaugeArcLargeFlag(startAngle, endAngle),
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const sweep = endAngle >= startAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function buildSpeedometerNeedleD(
  cx: number,
  cy: number,
  tipR: number,
  tailInset: number,
  scale = 1,
) {
  const tipY = cy - tipR;
  const tailY = cy + tailInset;
  const bladeHalf = 1.35 * scale;
  const hubHalf = 4.8 * scale;
  return [
    `M ${cx - bladeHalf} ${tailY}`,
    `L ${cx} ${tipY}`,
    `L ${cx + bladeHalf} ${tailY}`,
    `L ${cx + hubHalf} ${tailY + 4.5 * scale}`,
    `L ${cx - hubHalf} ${tailY + 4.5 * scale}`,
    'Z',
  ].join(' ');
}

function buildSemicircleWedgeD(cx: number, cy: number, radius: number) {
  const start = polarToCartesian(cx, cy, radius, 180);
  const end = polarToCartesian(cx, cy, radius, 360);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} L ${start.x} ${start.y} Z`;
}

function buildSemicircleChordD(cx: number, cy: number, radius: number) {
  const start = polarToCartesian(cx, cy, radius, 180);
  const end = polarToCartesian(cx, cy, radius, 360);
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function buildSemicircleBezelBaseBandD(
  cx: number,
  cy: number,
  outerR: number,
  faceR: number,
) {
  const outerLeft = polarToCartesian(cx, cy, outerR, 180);
  const outerRight = polarToCartesian(cx, cy, outerR, 360);
  const innerLeft = polarToCartesian(cx, cy, faceR, 180);
  const innerRight = polarToCartesian(cx, cy, faceR, 360);
  return `M ${outerLeft.x} ${outerLeft.y} L ${outerRight.x} ${outerRight.y} L ${innerRight.x} ${innerRight.y} L ${innerLeft.x} ${innerLeft.y} Z`;
}

function buildSemicircleBezelLipD(cx: number, cy: number, outerR: number, lipDepth: number) {
  const outerLeft = polarToCartesian(cx, cy, outerR, 180);
  const outerRight = polarToCartesian(cx, cy, outerR, 360);
  const lipY = cy + lipDepth;
  return `M ${outerLeft.x} ${outerLeft.y} L ${outerRight.x} ${outerRight.y} L ${outerRight.x} ${lipY} L ${outerLeft.x} ${lipY} Z`;
}

/** Vertical center of a semicircle dome (flat base at cy). */
function getSemicircleContentCenterY(cy: number, radius: number) {
  return cy - (4 * radius) / (3 * Math.PI);
}

function buildWideHousingClipD(
  cx: number,
  cy: number,
  radius: number,
  vbW: number,
  vbH: number,
) {
  const start = polarToCartesian(cx, cy, radius, 180);
  const end = polarToCartesian(cx, cy, radius, 360);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} L ${vbW + 8} ${vbH + 8} L -8 ${vbH + 8} Z`;
}

type GaugeLayout = {
  vb: string;
  cx: number;
  cy: number;
  outerR: number;
  faceR: number;
  trackR: number;
  tickOuterR: number;
  tickMajorInnerR: number;
  tickMinorInnerR: number;
  labelR: number;
  scaleNumeralSize: number;
  fuelLabelFontSize: number;
  needleTipR: number;
  needleTailInset: number;
  wide: boolean;
  housingClipD: string;
};

function getGaugeLayout(wide: boolean): GaugeLayout {
  if (wide) {
    const cx = 250;
    const cy = 246;
    return {
      vb: '0 0 500 254',
      cx,
      cy,
      outerR: 230,
      faceR: 206,
      trackR: 184,
      tickOuterR: 196,
      tickMajorInnerR: 164,
      tickMinorInnerR: 174,
      labelR: 138,
      scaleNumeralSize: 16,
      fuelLabelFontSize: 18,
      needleTipR: 184,
      needleTailInset: 14,
      wide: true,
      housingClipD: buildWideHousingClipD(cx, cy, 236, 500, 254),
    };
  }

  const cx = 120;
  const cy = 120;
  return {
    vb: '0 0 240 240',
    cx,
    cy,
    outerR: 96,
    faceR: 86,
    trackR: 76,
    tickOuterR: 82,
    tickMajorInnerR: 68,
    tickMinorInnerR: 74,
    labelR: 58,
    scaleNumeralSize: 9,
    fuelLabelFontSize: FUEL_LABEL_FONT_SIZE,
    needleTipR: 76,
    needleTailInset: 12,
    wide: false,
    housingClipD: 'M 22 122 A 98 98 0 0 1 218 122 L 232 240 L 8 240 Z',
  };
}

type WideGaugeHousingProps = {
  semicircleBezelD: string;
  semicircleFaceD: string;
  semicircleBezelBaseD: string;
  semicircleFaceBaseD: string;
  semicircleBezelBaseBandD: string;
  semicircleBezelLipD: string;
  bezelGradientId: string;
  bezelBaseLipGradientId: string;
  faceFill: string;
  accentGradientId?: string;
  showAccent?: boolean;
};

function WideGaugeHousingPaths({
  semicircleBezelD,
  semicircleFaceD,
  semicircleBezelBaseD,
  semicircleFaceBaseD,
  semicircleBezelBaseBandD,
  semicircleBezelLipD,
  bezelGradientId,
  bezelBaseLipGradientId,
  faceFill,
  accentGradientId,
  showAccent = false,
}: WideGaugeHousingProps) {
  return (
    <>
      <path
        d={semicircleBezelD}
        fill={`url(#${bezelGradientId})`}
        stroke="#444"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {showAccent && accentGradientId ? (
        <path
          d={semicircleBezelD}
          fill="none"
          stroke={`url(#${accentGradientId})`}
          strokeWidth="2"
          opacity="0.55"
          strokeLinejoin="round"
        />
      ) : null}
      <path d={semicircleBezelBaseBandD} fill={`url(#${bezelGradientId})`} stroke="none" />
      <path d={semicircleBezelLipD} fill={`url(#${bezelBaseLipGradientId})`} stroke="none" />
      <path
        d={semicircleBezelBaseD}
        fill="none"
        stroke="#444"
        strokeWidth="2"
        strokeLinecap="butt"
      />
      {showAccent && accentGradientId ? (
        <path
          d={semicircleBezelBaseD}
          fill="none"
          stroke={`url(#${accentGradientId})`}
          strokeWidth="1.5"
          opacity="0.55"
          strokeLinecap="butt"
        />
      ) : null}
      <path
        d={semicircleFaceD}
        fill={faceFill}
        stroke="#2a2a2a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d={semicircleFaceBaseD}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="1.25"
        strokeLinecap="butt"
      />
    </>
  );
}

function GaugeDialSlot({
  children,
  counterDialBox = false,
  wideSemicircle = false,
}: {
  children: ReactNode;
  /** Fixed dial area on journey counter slides — keeps layout stable across variants. */
  counterDialBox?: boolean;
  /** Wide 2:1 semicircle housing (journey counter slides only). */
  wideSemicircle?: boolean;
}) {
  return (
    <div
      className={[
        'journey-counter-gauge__dial-slot',
        counterDialBox ? 'journey-counter-gauge__dial-slot--counter' : '',
        wideSemicircle ? 'journey-counter-gauge__dial-slot--wide' : '',
      ]
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
  /** Wide semicircle dial on journey counter slides (~2× width, same height). */
  wideSemicircle?: boolean;
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
  wideSemicircle = false,
  hideStatBelow = false,
  renderStatBelow,
}: JourneyCounterGaugeProps) {
  const uid = useId().replace(/:/g, '');
  const [gaugeValue, setGaugeValue] = useState(0);
  const [batteryWarningActive, setBatteryWarningActive] = useState(false);
  const [fuelWarningActive, setFuelWarningActive] = useState(false);
  const onCountCompleteRef = useRef(onCountComplete);
  onCountCompleteRef.current = onCountComplete;

  const displayValue = target >= 1000 ? Math.round(gaugeValue).toLocaleString() : String(Math.round(gaugeValue));
  const needleAngle = speedoValueToAngle(gaugeValue);
  const fillPercent = Math.min(Math.max(target, 0), 100);
  const batterySegmentCount = 4;
  const needleTarget =
    variant === 'fuel'
      ? fillPercent
      : variant === 'battery'
        ? Math.min(Math.max(target, 0), batterySegmentCount)
        : Math.min(Math.max(target, 0), 100);
  const fuelFillAngle = fuelPercentToAngle(gaugeValue);

  const layout = getGaugeLayout(wideSemicircle);
  const {
    vb,
    cx,
    cy,
    outerR,
    faceR,
    trackR,
    tickOuterR,
    tickMajorInnerR,
    tickMinorInnerR,
    labelR,
    scaleNumeralSize,
    fuelLabelFontSize,
    needleTipR,
    needleTailInset,
    wide,
    housingClipD,
  } = layout;

  const resolvedValueFontSize =
    valueFontSize ??
    (wideSemicircle
      ? target >= 1000
        ? 'clamp(18px, 3.5vw, 28px)'
        : 'clamp(28px, 5vw, 44px)'
      : target >= 1000
        ? 'clamp(14px, 3vw, 22px)'
        : 'clamp(22px, 4.5vw, 36px)');
  const resolvedLabelFontSize = labelFontSize ?? 'clamp(9px, 1.4vw, 12px)';

  const titleCaseLabel = (text: string) =>
    text.replace(/\b\w/g, (char) => char.toUpperCase());

  const gaugeArcD = buildGaugeArcD(cx, cy, trackR, SPEEDO_MIN_ANGLE, SPEEDO_MAX_ANGLE, 0);
  const semicircleBezelD = buildSemicircleWedgeD(cx, cy, outerR);
  const semicircleFaceD = buildSemicircleWedgeD(cx, cy, faceR);
  const semicircleBezelBaseD = buildSemicircleChordD(cx, cy, outerR);
  const semicircleFaceBaseD = buildSemicircleChordD(cx, cy, faceR);
  const semicircleBezelBaseBandD = wide
    ? buildSemicircleBezelBaseBandD(cx, cy, outerR, faceR)
    : '';
  const semicircleBezelLipD = wide ? buildSemicircleBezelLipD(cx, cy, outerR, 3) : '';
  const bezelBaseLipGradientCoords = wide
    ? {
        x1: cx - outerR,
        y1: cy - 2,
        x2: cx - outerR,
        y2: cy + 4,
      }
    : null;

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
    if (variant !== 'battery' || target > 0) {
      setBatteryWarningActive(false);
      return;
    }
    setBatteryWarningActive(false);
    const timer = window.setTimeout(() => setBatteryWarningActive(true), BATTERY_WARNING_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setBatteryWarningActive(false);
    };
  }, [variant, animationKey, target]);

  useEffect(() => {
    if (variant !== 'fuel' || target >= LOW_FUEL_CONTACTS_THRESHOLD) {
      setFuelWarningActive(false);
      return;
    }
    setFuelWarningActive(false);
    const timer = window.setTimeout(() => setFuelWarningActive(true), BATTERY_WARNING_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setFuelWarningActive(false);
    };
  }, [variant, animationKey, target]);

  const rootClassName = [
    variant === 'fuel'
      ? 'journey-fuel-gauge'
      : variant === 'battery'
        ? 'journey-battery-gauge'
        : 'journey-speedometer-gauge',
    variant === 'battery' && batteryWarningActive ? 'journey-battery-gauge--warning-active' : '',
    variant === 'fuel' && fuelWarningActive ? 'journey-fuel-gauge--warning-active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shellStyle = {
    width: '100%',
    maxWidth: wideSemicircle ? JOURNEY_GAUGE_WIDE_SIZE : circleSize,
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
    const fuelTrackStart = polarToCartesian(cx, cy, trackR, FUEL_MIN_ANGLE);
    const fuelTrackEnd = polarToCartesian(cx, cy, trackR, FUEL_MAX_ANGLE);
    const fuelTrackD = `M ${fuelTrackStart.x} ${fuelTrackStart.y} A ${trackR} ${trackR} 0 1 1 ${fuelTrackEnd.x} ${fuelTrackEnd.y}`;
    const fuelFillPoint = polarToCartesian(cx, cy, trackR, fuelFillAngle);
    const fuelFillSweep = fuelFillAngle - FUEL_MIN_ANGLE;
    const fuelFillLargeArc = fuelFillSweep >= 180 ? 1 : 0;
    const fuelFillD = `M ${fuelTrackStart.x} ${fuelTrackStart.y} A ${trackR} ${trackR} 0 ${fuelFillLargeArc} 1 ${fuelFillPoint.x} ${fuelFillPoint.y}`;
    const warningCenterY = getGaugeWarningCenterPercent(cy, faceR, vb, wide);

    return (
      <div className={rootClassName} style={shellStyle}>
        <GaugeDialSlot counterDialBox={counterDialBox} wideSemicircle={wideSemicircle}>
          <div
            className="journey-fuel-gauge__dial"
            style={{ ['--gauge-warning-center-y' as string]: warningCenterY }}
          >
          <svg
            className="journey-fuel-gauge__svg"
            viewBox={vb}
            preserveAspectRatio="xMidYMax meet"
            aria-hidden
          >
            <defs>
              <clipPath id={`${uid}-fuel-housing`}>
                <path d={housingClipD} />
              </clipPath>
              <linearGradient id={`${uid}-fuel-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a3a3a" />
                <stop offset="45%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              {wide && bezelBaseLipGradientCoords ? (
                <linearGradient
                  id={`${uid}-fuel-bezel-base-lip`}
                  gradientUnits="userSpaceOnUse"
                  x1={bezelBaseLipGradientCoords.x1}
                  y1={bezelBaseLipGradientCoords.y1}
                  x2={bezelBaseLipGradientCoords.x2}
                  y2={bezelBaseLipGradientCoords.y2}
                >
                  <stop offset="0%" stopColor="#5a5a5a" />
                  <stop offset="45%" stopColor="#2a2a2a" />
                  <stop offset="100%" stopColor="#080808" />
                </linearGradient>
              ) : null}
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

            <g clipPath={`url(#${uid}-fuel-housing)`}>
              {wide ? (
                <WideGaugeHousingPaths
                  semicircleBezelD={semicircleBezelD}
                  semicircleFaceD={semicircleFaceD}
                  semicircleBezelBaseD={semicircleBezelBaseD}
                  semicircleFaceBaseD={semicircleFaceBaseD}
                  semicircleBezelBaseBandD={semicircleBezelBaseBandD}
                  semicircleBezelLipD={semicircleBezelLipD}
                  bezelGradientId={`${uid}-fuel-bezel`}
                  bezelBaseLipGradientId={`${uid}-fuel-bezel-base-lip`}
                  faceFill="#0a0a0a"
                />
              ) : (
                <>
                  <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-fuel-bezel)`} stroke="#444" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy} r={outerR - 6} fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1" />
                </>
              )}

            <path d={fuelTrackD} fill="none" stroke="#0c0c0c" strokeWidth={wide ? 16 : 14} strokeLinecap="round" />
            <path d={fuelTrackD} fill="none" stroke="#222" strokeWidth={wide ? 12 : 10} strokeLinecap="round" />

            {gaugeValue > 0.5 && (
              <motion.path
                key={`fuel-${animationKey ?? target}`}
                d={fuelFillD}
                fill="none"
                stroke={`url(#${uid}-fuel-fill)`}
                strokeWidth={wide ? 10 : 8}
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
              const outer = polarToCartesian(cx, cy, tickOuterR, angle);
              const inner = polarToCartesian(cx, cy, isMajor ? tickMajorInnerR : tickMajorInnerR + 6, angle);
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
              x={polarToCartesian(cx, cy, labelR, FUEL_MIN_ANGLE).x}
              y={polarToCartesian(cx, cy, labelR, FUEL_MIN_ANGLE).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#888"
              fontSize={fuelLabelFontSize}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              E
            </text>
            <text
              x={polarToCartesian(cx, cy, labelR, FUEL_MAX_ANGLE).x}
              y={polarToCartesian(cx, cy, labelR, FUEL_MAX_ANGLE).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={gaugeValue >= 75 ? '#e85d04' : '#888'}
              fontSize={fuelLabelFontSize}
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              F
            </text>
            </g>
          </svg>
          <div
            className="journey-fuel-gauge__center-stack"
            style={{ ['--gauge-warning-center-y' as string]: warningCenterY }}
          >
            <div className="journey-fuel-gauge__pump-icon" aria-hidden>
              <img
                src={gasPumpIconUrl}
                alt=""
                draggable={false}
              />
            </div>
            {fuelWarningActive ? (
              <div
                className="journey-fuel-gauge__warning"
                role="img"
                aria-label="Low fuel warning"
              >
                <span className="journey-fuel-gauge__warning-label">Low Fuel</span>
              </div>
            ) : null}
          </div>
          </div>
        </GaugeDialSlot>
        {statBelow}
      </div>
    );
  }

  if (variant === 'battery') {
    const batteryScale = wide ? 2 : 1;
    const bodyW = 112 * batteryScale;
    const bodyH = 78 * batteryScale;
    const segmentCount = batterySegmentCount;
    const filledSegments = Math.round(gaugeValue);
    const segmentGap = 6 * batteryScale;
    const segmentH = (bodyH - segmentGap * (segmentCount + 1)) / segmentCount;
    const terminalW = 12 * batteryScale;
    const terminalH = 9 * batteryScale;
    const terminalGap = 3 * batteryScale;
    const bodyLeft = -bodyW / 2;
    const bodyTop = -bodyH / 2;
    const terminalY = bodyTop - terminalGap - terminalH;
    const terminalLeftX = -terminalW - 4 * batteryScale;
    const terminalRightX = 4 * batteryScale;
    const batteryCy = wide ? getSemicircleContentCenterY(cy, faceR) : cy;
    const warningCenterY = getGaugeWarningCenterPercent(cy, faceR, vb, wide);

    return (
      <div className={rootClassName} style={shellStyle}>
        <GaugeDialSlot counterDialBox={counterDialBox} wideSemicircle={wideSemicircle}>
          <div
            className="journey-battery-gauge__dial"
            style={{ ['--gauge-warning-center-y' as string]: warningCenterY }}
          >
            <svg
              className="journey-speedometer-gauge__svg journey-battery-gauge__svg"
              viewBox={vb}
              preserveAspectRatio={wide ? 'xMidYMax meet' : 'xMidYMid meet'}
              aria-hidden
            >
              <defs>
                <clipPath id={`${uid}-battery-housing`}>
                  <path d={housingClipD} />
                </clipPath>
                <linearGradient id={`${uid}-battery-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3a3a3a" />
                  <stop offset="50%" stopColor="#1a1a1a" />
                  <stop offset="100%" stopColor="#080808" />
                </linearGradient>
                {wide && bezelBaseLipGradientCoords ? (
                  <linearGradient
                    id={`${uid}-battery-bezel-base-lip`}
                    gradientUnits="userSpaceOnUse"
                    x1={bezelBaseLipGradientCoords.x1}
                    y1={bezelBaseLipGradientCoords.y1}
                    x2={bezelBaseLipGradientCoords.x2}
                    y2={bezelBaseLipGradientCoords.y2}
                  >
                    <stop offset="0%" stopColor="#5a5a5a" />
                    <stop offset="45%" stopColor="#2a2a2a" />
                    <stop offset="100%" stopColor="#080808" />
                  </linearGradient>
                ) : null}
              </defs>

              <g clipPath={`url(#${uid}-battery-housing)`}>
                {wide ? (
                  <WideGaugeHousingPaths
                    semicircleBezelD={semicircleBezelD}
                    semicircleFaceD={semicircleFaceD}
                    semicircleBezelBaseD={semicircleBezelBaseD}
                    semicircleFaceBaseD={semicircleFaceBaseD}
                    semicircleBezelBaseBandD={semicircleBezelBaseBandD}
                    semicircleBezelLipD={semicircleBezelLipD}
                    bezelGradientId={`${uid}-battery-bezel`}
                    bezelBaseLipGradientId={`${uid}-battery-bezel-base-lip`}
                    faceFill="#0a0a0a"
                  />
                ) : (
                  <>
                    <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-battery-bezel)`} stroke="#444" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r={outerR - 8} fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1" />
                  </>
                )}

              <g transform={`translate(${cx}, ${batteryCy})`}>
                <rect
                  x={terminalLeftX}
                  y={terminalY}
                  width={terminalW}
                  height={terminalH}
                  rx={1.5 * batteryScale}
                  fill="#555"
                  stroke="#666"
                  strokeWidth="1"
                />
                <rect
                  x={terminalRightX}
                  y={terminalY}
                  width={terminalW}
                  height={terminalH}
                  rx={1.5 * batteryScale}
                  fill="#555"
                  stroke="#666"
                  strokeWidth="1"
                />
                <motion.rect
                  x={bodyLeft}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  rx={8 * batteryScale}
                  fill="#141414"
                  stroke="#444"
                  strokeWidth="2"
                  animate={
                    batteryWarningActive
                      ? { stroke: ['#444', '#ef4444', '#fca5a5', '#ef4444', '#444'] }
                      : { stroke: '#444' }
                  }
                  transition={
                    batteryWarningActive
                      ? { stroke: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' } }
                      : { duration: 0.2 }
                  }
                />
                {Array.from({ length: segmentCount }, (_, i) => {
                  const isFilled = i >= segmentCount - filledSegments;
                  return (
                    <rect
                      key={i}
                      x={bodyLeft + segmentGap}
                      y={bodyTop + segmentGap + i * (segmentH + segmentGap)}
                      width={bodyW - segmentGap * 2}
                      height={segmentH}
                      rx={2 * batteryScale}
                      fill={isFilled ? BRAND_ORANGE : '#252525'}
                      stroke={isFilled ? '#e07a10' : '#333'}
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
              </g>
            </svg>

            {batteryWarningActive ? (
              <div
                className="journey-battery-gauge__warning"
                role="img"
                aria-label="Low battery warning"
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
                    y="35"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="26"
                    fontWeight="800"
                    fontFamily="system-ui, sans-serif"
                  >
                    !
                  </text>
                </svg>
              </div>
            ) : null}
          </div>
        </GaugeDialSlot>
        {statBelow}
      </div>
    );
  }

  return (
    <div className={rootClassName} style={shellStyle}>
      <GaugeDialSlot counterDialBox={counterDialBox} wideSemicircle={wideSemicircle}>
      <svg
        className="journey-speedometer-gauge__svg"
        viewBox={vb}
        preserveAspectRatio={wide ? 'xMidYMax meet' : 'xMidYMid meet'}
        aria-hidden
      >
        <defs>
          <clipPath id={`${uid}-speedo-housing`}>
            <path d={housingClipD} />
          </clipPath>
          <linearGradient id={`${uid}-bezel`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="40%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={`${uid}-bezel-accent`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#444" />
            <stop offset="50%" stopColor={BRAND_ORANGE} />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>
          {wide && bezelBaseLipGradientCoords ? (
            <linearGradient
              id={`${uid}-bezel-base-lip`}
              gradientUnits="userSpaceOnUse"
              x1={bezelBaseLipGradientCoords.x1}
              y1={bezelBaseLipGradientCoords.y1}
              x2={bezelBaseLipGradientCoords.x2}
              y2={bezelBaseLipGradientCoords.y2}
            >
              <stop offset="0%" stopColor="#5a5a5a" />
              <stop offset="45%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#080808" />
            </linearGradient>
          ) : null}
          <radialGradient id={`${uid}-face`} cx="50%" cy="88%" r="65%">
            <stop offset="0%" stopColor="#1c1c1c" />
            <stop offset="55%" stopColor="#101010" />
            <stop offset="100%" stopColor="#060606" />
          </radialGradient>
          <linearGradient id={`${uid}-needle`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff8c42" />
            <stop offset="100%" stopColor={BRAND_ORANGE} />
          </linearGradient>
          <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={`${uid}-arc-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g clipPath={`url(#${uid}-speedo-housing)`}>
          {wide ? (
            <WideGaugeHousingPaths
              semicircleBezelD={semicircleBezelD}
              semicircleFaceD={semicircleFaceD}
              semicircleBezelBaseD={semicircleBezelBaseD}
              semicircleFaceBaseD={semicircleFaceBaseD}
              semicircleBezelBaseBandD={semicircleBezelBaseBandD}
              semicircleBezelLipD={semicircleBezelLipD}
              bezelGradientId={`${uid}-bezel`}
              bezelBaseLipGradientId={`${uid}-bezel-base-lip`}
              faceFill={`url(#${uid}-face)`}
              accentGradientId={`${uid}-bezel-accent`}
              showAccent
            />
          ) : (
            <>
              <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-bezel)`} stroke="#444" strokeWidth="1.5" />
              <circle
                cx={cx}
                cy={cy}
                r={outerR}
                fill="none"
                stroke={`url(#${uid}-bezel-accent)`}
                strokeWidth="2"
                opacity="0.55"
              />
              <circle cx={cx} cy={cy} r={faceR} fill={`url(#${uid}-face)`} stroke="#2a2a2a" strokeWidth="1" />
            </>
          )}

          {/* High-range zone tint */}
          <path
            d={buildGaugeArcD(cx, cy, trackR + 1, speedoValueToAngle(80), SPEEDO_MAX_ANGLE)}
            fill="none"
            stroke="rgba(243, 144, 29, 0.12)"
            strokeWidth={wide ? 20 : 16}
            strokeLinecap="butt"
          />

          {/* Scale channel */}
          <path d={gaugeArcD} fill="none" stroke="#0c0c0c" strokeWidth={wide ? 16 : 14} strokeLinecap="round" />
          <path d={gaugeArcD} fill="none" stroke="#222" strokeWidth={wide ? 12 : 10} strokeLinecap="round" />

          {/* Active arc — same radius & angle as needle tip */}
          {gaugeValue > 0.5 && (
            <motion.path
              key={`arc-${animationKey ?? target}`}
              d={buildGaugeArcD(cx, cy, trackR, SPEEDO_MIN_ANGLE, needleAngle)}
              fill="none"
              stroke={BRAND_ORANGE}
              strokeWidth={wide ? 10 : 8}
              strokeLinecap="round"
              filter={`url(#${uid}-arc-glow)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Tick marks */}
          {Array.from({ length: 51 }, (_, i) => {
            const value = i * 2;
            const angle = speedoValueToAngle(value);
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

          {/* Scale numerals — 0 & 100 upright toward bottom of dial */}
          {[0, 20, 40, 60, 80, 100].map((value) => {
            const angle = speedoValueToAngle(value);
            const pos = polarToCartesian(cx, cy, labelR, angle);
            const rotate = speedoLabelRotation(value, angle);
            return (
              <text
                key={value}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={value >= 80 ? '#e85d04' : '#888'}
                fontSize={scaleNumeralSize}
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                transform={`rotate(${rotate}, ${pos.x}, ${pos.y})`}
              >
                {value}
              </text>
            );
          })}

          {/* Subtle upper lens highlight */}
          <path
            d={buildGaugeArcD(cx, cy, faceR - 8, 250, 290)}
            fill="none"
            stroke={`url(#${uid}-glass)`}
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Needle — tip lands on orange arc endpoint */}
          <g
            style={{
              transform: `rotate(${speedoNeedleRotation(needleAngle)}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            <path
              d={buildSpeedometerNeedleD(cx, cy, needleTipR, needleTailInset, wide ? 1.35 : 1)}
              fill={`url(#${uid}-needle)`}
              stroke="#8a3d08"
              strokeWidth="0.35"
              strokeLinejoin="round"
            />
            <ellipse
              cx={cx}
              cy={cy + needleTailInset + 3}
              rx={wide ? 7.5 : 5.5}
              ry={wide ? 3 : 2.2}
              fill="#1a1a1a"
              stroke="#333"
              strokeWidth="0.5"
            />
          </g>

          <circle cx={cx} cy={cy} r={wide ? 18 : 14} fill="#1a1a1a" stroke="#444" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={wide ? 10 : 8} fill={BRAND_ORANGE} />
          <circle cx={cx} cy={cy} r={wide ? 4.5 : 3.5} fill="#111" />
        </g>
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
