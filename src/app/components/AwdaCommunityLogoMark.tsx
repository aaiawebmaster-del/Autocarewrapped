import { useId } from 'react';
import awdaCommunityLogoWhite from '../../assets/awda-community-logo-white.png';

const LOGO_COLOR = '#035692';
export const AWDA_LOGO_WIDTH = 300;
export const AWDA_LOGO_HEIGHT = 126;
/** Inset so wordmark does not touch the HMI bezel. */
const LOGO_PAD_X = 18;
const LOGO_PAD_Y = 10;
const LOGO_ART_WIDTH = AWDA_LOGO_WIDTH - LOGO_PAD_X * 2;
const LOGO_ART_HEIGHT = AWDA_LOGO_HEIGHT - LOGO_PAD_Y * 2;

type AwdaCommunityLogoMarkProps = {
  className?: string;
};

/**
 * AWDA wordmark asset — blue (#035692) on white, luminance mask + glow filter.
 */
export function AwdaCommunityLogoMark({ className }: AwdaCommunityLogoMarkProps) {
  const maskId = useId().replace(/:/g, '');
  const glowId = useId().replace(/:/g, '');

  return (
    <svg
      className={className}
      viewBox={`0 0 ${AWDA_LOGO_WIDTH} ${AWDA_LOGO_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-hidden
    >
      <rect width={AWDA_LOGO_WIDTH} height={AWDA_LOGO_HEIGHT} fill="#ffffff" />
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={AWDA_LOGO_WIDTH}
          height={AWDA_LOGO_HEIGHT}
        >
          <image
            href={awdaCommunityLogoWhite}
            x={LOGO_PAD_X}
            y={LOGO_PAD_Y}
            width={LOGO_ART_WIDTH}
            height={LOGO_ART_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
        <filter
          id={glowId}
          x="-45%"
          y="-45%"
          width="190%"
          height="190%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
          <feFlood floodColor={LOGO_COLOR} floodOpacity="0.95" result="glowColor" />
          <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blurWide" />
          <feFlood floodColor={LOGO_COLOR} floodOpacity="0.55" result="glowColorWide" />
          <feComposite in="glowColorWide" in2="blurWide" operator="in" result="wideGlow" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="blurHalo" />
          <feFlood floodColor="#00bfff" floodOpacity="0.22" result="haloColor" />
          <feComposite in="haloColor" in2="blurHalo" operator="in" result="outerHalo" />
          <feMerge>
            <feMergeNode in="outerHalo" />
            <feMergeNode in="wideGlow" />
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        width={AWDA_LOGO_WIDTH}
        height={AWDA_LOGO_HEIGHT}
        fill={LOGO_COLOR}
        mask={`url(#${maskId})`}
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}
