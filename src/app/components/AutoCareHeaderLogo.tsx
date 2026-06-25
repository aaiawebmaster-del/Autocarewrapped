import autocareLogoNotag from '../../assets/autocare-logo-notag.svg?url';

type AutoCareHeaderLogoProps = {
  className?: string;
};

const LOGO_VIEW_WIDTH = 254.23;
const LOGO_VIEW_HEIGHT = 51;
const LOGO_ART_HEIGHT = 73.95;

/** Header artwork from autocare-logo-notag.svg (AUTO CARE + Association wordmark). */
export function AutoCareHeaderLogo({ className }: AutoCareHeaderLogoProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-hidden
    >
      <image
        href={autocareLogoNotag}
        width={LOGO_VIEW_WIDTH}
        height={LOGO_ART_HEIGHT}
        preserveAspectRatio="xMidYMin meet"
      />
    </svg>
  );
}
