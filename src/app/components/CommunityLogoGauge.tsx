import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate } from 'motion/react';
import { AwdaCommunityLogoMark } from './AwdaCommunityLogoMark';
import { ImportVehicleCommunityLogoMark } from './ImportVehicleCommunityLogoMark';
import { showDualCommunityLogos } from '@/lib/communityLogos';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';

type CommunityLogoGaugeProps = {
  target: number;
  label: string;
  communities?: string[];
  animationKey?: string | number;
  duration?: number;
  delay?: number;
  circleSize?: string;
  valueFontSize?: string;
  labelFontSize?: string;
  className?: string;
  onCountComplete?: () => void;
  readoutMode?: 'dial' | 'below';
  counterDialBox?: boolean;
  hideStatBelow?: boolean;
  renderStatBelow?: (stat: ReactNode) => ReactNode;
  href?: string;
};

const AWDA_COMMUNITY_HREF = EXTERNAL_CTA_LINKS.exploreAllCommunities;
const IMPORT_VEHICLE_COMMUNITY_HREF = EXTERNAL_CTA_LINKS.exploreAllCommunities;

function CommunityLogoButton({
  href,
  ariaLabel,
  aspect,
  logoClassName,
  children,
}: {
  href: string;
  ariaLabel: string;
  aspect: string;
  logoClassName?: string;
  children: ReactNode;
}) {
  return (
    <a
      className="community-logo-gauge__button"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      style={{ ['--community-logo-aspect' as string]: aspect }}
    >
      <span className="community-logo-gauge__chrome" aria-hidden />
      <span className="community-logo-gauge__face">
        <span className={['community-logo-gauge__logo', logoClassName].filter(Boolean).join(' ')}>
          {children}
        </span>
        <span className="community-logo-gauge__gloss" aria-hidden />
        <span className="community-logo-gauge__shine" aria-hidden />
      </span>
    </a>
  );
}

export function CommunityLogoGauge({
  target,
  label,
  communities,
  animationKey,
  duration = 2400,
  delay = 0,
  circleSize = '100%',
  valueFontSize,
  labelFontSize,
  className,
  onCountComplete,
  readoutMode = 'below',
  counterDialBox = false,
  hideStatBelow = false,
  renderStatBelow,
  href = AWDA_COMMUNITY_HREF,
}: CommunityLogoGaugeProps) {
  const [gaugeValue, setGaugeValue] = useState(0);
  const onCountCompleteRef = useRef(onCountComplete);
  onCountCompleteRef.current = onCountComplete;
  const dualLogos = showDualCommunityLogos(communities);

  const displayValue =
    target >= 1000 ? Math.round(gaugeValue).toLocaleString() : String(Math.round(gaugeValue));
  const resolvedValueFontSize =
    valueFontSize ?? (target >= 1000 ? 'clamp(14px, 3vw, 22px)' : 'clamp(22px, 4.5vw, 36px)');
  const resolvedLabelFontSize = labelFontSize ?? 'clamp(9px, 1.4vw, 12px)';

  const titleCaseLabel = (text: string) =>
    text.replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    setGaugeValue(0);
    const controls = animate(0, target, {
      duration: duration / 1000,
      delay: delay / 1000,
      ease: [0.22, 1.05, 0.36, 1],
      onUpdate: (latest) => setGaugeValue(latest),
      onComplete: () => onCountCompleteRef.current?.(),
    });
    return () => controls.stop();
  }, [target, duration, delay, animationKey]);

  const rootClassName = [
    'community-logo-gauge',
    dualLogos ? 'community-logo-gauge--dual' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const dialSlotClassName = [
    'journey-counter-gauge__dial-slot',
    counterDialBox ? 'journey-counter-gauge__dial-slot--counter' : '',
    counterDialBox && !dualLogos ? 'journey-counter-gauge__dial-slot--community-logo' : '',
    dualLogos ? 'journey-counter-gauge__dial-slot--dual-logos' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderBelowStat = () => {
    if (readoutMode !== 'below' || hideStatBelow) return null;

    const stat = (
      <p className="journey-speedometer-gauge__stat-below" aria-live="polite">
        <span
          className="journey-speedometer-gauge__stat-value"
          style={
            counterDialBox && valueFontSize == null
              ? undefined
              : { fontSize: resolvedValueFontSize }
          }
        >
          {displayValue}
        </span>
        <span
          className="journey-speedometer-gauge__stat-label"
          style={
            counterDialBox && labelFontSize == null
              ? undefined
              : { fontSize: labelFontSize ?? resolvedLabelFontSize }
          }
        >
          {titleCaseLabel(label)}
        </span>
      </p>
    );

    return renderStatBelow ? renderStatBelow(stat) : stat;
  };

  return (
    <div
      className={rootClassName}
      style={{
        width: '100%',
        maxWidth: circleSize,
        ...(counterDialBox ? {} : { height: 'fit-content' as const }),
        flexShrink: 0,
        margin: 0,
      }}
    >
      <div className={dialSlotClassName}>
        {dualLogos ? (
          <div className="community-logo-gauge__stack">
            <CommunityLogoButton
              href={href || AWDA_COMMUNITY_HREF}
              ariaLabel="AWDA Warehouse Distributors community"
              aspect="300 / 126"
            >
              <AwdaCommunityLogoMark />
            </CommunityLogoButton>
            <CommunityLogoButton
              href={IMPORT_VEHICLE_COMMUNITY_HREF}
              ariaLabel="Import Vehicle Community"
              aspect="300 / 126"
              logoClassName="community-logo-gauge__logo--import-vehicle"
            >
              <ImportVehicleCommunityLogoMark />
            </CommunityLogoButton>
          </div>
        ) : (
          <CommunityLogoButton
            href={href}
            ariaLabel="AWDA Warehouse Distributors community"
            aspect="300 / 126"
          >
            <AwdaCommunityLogoMark />
          </CommunityLogoButton>
        )}
      </div>
      {renderBelowStat()}
    </div>
  );
}
