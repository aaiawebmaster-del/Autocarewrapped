import type { ReactNode } from 'react';
import { CommunityLogoImageMark } from './CommunityLogoImageMark';
import {
  communityLogoAspect,
  resolveCommunityLogos,
  type CommunityLogoAsset,
} from '@/lib/communityLogos';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';

type CommunityLogoGaugeProps = {
  communities?: string[];
  className?: string;
  counterDialBox?: boolean;
  /** Retained for call-site compatibility — community logos no longer show a count. */
  target?: number;
  label?: string;
  animationKey?: string | number;
  duration?: number;
  delay?: number;
  circleSize?: string;
  valueFontSize?: string;
  labelFontSize?: string;
  onCountComplete?: () => void;
  readoutMode?: 'dial' | 'below';
  hideStatBelow?: boolean;
  renderStatBelow?: (stat: ReactNode) => ReactNode;
  href?: string;
};

function CommunityLogoButton({
  asset,
}: {
  asset: CommunityLogoAsset;
}) {
  const aspect = communityLogoAspect(asset);

  return (
    <a
      className="community-logo-gauge__button"
      href={asset.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={asset.label}
      style={{ ['--community-logo-aspect' as string]: aspect }}
    >
      <span className="community-logo-gauge__chrome" aria-hidden />
      <span className="community-logo-gauge__face">
        <span
          className={['community-logo-gauge__logo', asset.logoClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {asset.textOnly || !asset.src ? (
            <span className="community-logo-gauge__text-mark">{asset.label}</span>
          ) : (
            <CommunityLogoImageMark
              src={asset.src}
              className={asset.logoClassName}
            />
          )}
        </span>
        <span className="community-logo-gauge__gloss" aria-hidden />
        <span className="community-logo-gauge__shine" aria-hidden />
      </span>
    </a>
  );
}

function CommunityLogoEmptyShell({ aspect }: { aspect: string }) {
  return (
    <div
      className="community-logo-gauge__button community-logo-gauge__button--empty"
      role="img"
      aria-label="No community membership"
      style={{ ['--community-logo-aspect' as string]: aspect }}
    >
      <span className="community-logo-gauge__chrome" aria-hidden />
      <span className="community-logo-gauge__face community-logo-gauge__face--empty">
        <span className="community-logo-gauge__empty-mark" aria-hidden>
          <svg viewBox="0 0 48 48" className="community-logo-gauge__empty-mark-icon">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path
              d="M15 15 L33 33 M33 15 L15 33"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="community-logo-gauge__gloss" aria-hidden />
      </span>
    </div>
  );
}

export function CommunityLogoGauge({
  communities,
  className,
  counterDialBox = false,
  circleSize = '100%',
  href: _href = EXTERNAL_CTA_LINKS.exploreAllCommunities,
}: CommunityLogoGaugeProps) {
  const logos = resolveCommunityLogos(communities);
  const showEmptyShell = logos.length === 0;
  const gridClassName = [
    'community-logo-gauge__grid',
    logos.length === 1 ? 'community-logo-gauge__grid--single' : '',
    logos.length % 2 === 1 ? 'community-logo-gauge__grid--odd' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rootClassName = [
    'community-logo-gauge',
    showEmptyShell ? 'community-logo-gauge--empty' : '',
    logos.length === 1 ? 'community-logo-gauge--single' : '',
    logos.length > 1 ? 'community-logo-gauge--grid' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const dialSlotClassName = [
    'journey-counter-gauge__dial-slot',
    counterDialBox ? 'journey-counter-gauge__dial-slot--counter' : '',
    counterDialBox ? 'journey-counter-gauge__dial-slot--community-logo' : '',
    logos.length > 1 ? 'journey-counter-gauge__dial-slot--community-grid' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
        {showEmptyShell ? (
          <CommunityLogoEmptyShell aspect="300 / 126" />
        ) : logos.length === 1 ? (
          <CommunityLogoButton asset={logos[0]} />
        ) : (
          <div className={gridClassName}>
            {logos.map((asset) => (
              <CommunityLogoButton key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
