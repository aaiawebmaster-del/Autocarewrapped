import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Lottie from 'lottie-react';
import journeyCircleData from '../../imports/Animation_-_1779761385872.json';

export const JOURNEY_GAUGE_SIZE = 'clamp(140px, 22vw, 220px)';
/** Slightly smaller twin layout (e.g. Full Diagnostics top row). */
export const DIAGNOSTICS_GAUGE_SIZE = 'clamp(110px, 16vw, 180px)';

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
  className?: string;
};

export function JourneyCounterGauge({
  target,
  label,
  labelLines,
  animationKey,
  duration = 2200,
  delay = 0,
  circleSize = JOURNEY_GAUGE_SIZE,
  className,
}: JourneyCounterGaugeProps) {
  const [count, setCount] = useState(0);
  const displayValue = target >= 1000 ? count.toLocaleString() : String(count);
  const valueFontSize =
    target >= 1000 ? 'clamp(28px, 5vw, 56px)' : 'clamp(40px, 7vw, 80px)';

  useEffect(() => {
    setCount(0);
    let frame = 0;
    const startAt = performance.now() + delay;
    const tick = (now: number) => {
      if (now < startAt) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startAt) / duration, 1);
      setCount(Math.round((1 - (1 - progress) ** 3) * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay, animationKey]);

  return (
    <div
      className={className}
      style={{ position: 'relative', width: circleSize, height: circleSize, flexShrink: 0 }}
    >
      <Lottie animationData={journeyCircleData} loop autoplay style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={animationKey ?? `${target}-${label}`}
            style={{
              color: '#ffffff',
              fontSize: valueFontSize,
              fontWeight: 'normal',
              lineHeight: 1,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
        {labelLines && labelLines.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
              maxWidth: '92%',
              textAlign: 'center',
            }}
          >
            {labelLines.map((line) => (
              <span
                key={line}
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(9px, 1.6vw, 14px)',
                  fontWeight: 'normal',
                  lineHeight: 1.15,
                }}
              >
                {line}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#ffffff', fontSize: 'clamp(14px, 2vw, 22px)', fontWeight: 'normal' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
