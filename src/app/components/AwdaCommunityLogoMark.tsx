import awdaCommunityLogo from '../../assets/awda-community-logo.svg?url';

export const AWDA_LOGO_WIDTH = 300;
export const AWDA_LOGO_HEIGHT = 126;

type AwdaCommunityLogoMarkProps = {
  className?: string;
};

/** AWDA community wordmark — official CMYK SVG asset. */
export function AwdaCommunityLogoMark({ className }: AwdaCommunityLogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${AWDA_LOGO_WIDTH} ${AWDA_LOGO_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-hidden
    >
      <image
        href={awdaCommunityLogo}
        width={AWDA_LOGO_WIDTH}
        height={AWDA_LOGO_HEIGHT}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
