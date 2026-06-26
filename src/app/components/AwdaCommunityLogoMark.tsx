import awdaCommunityLogo from '../../assets/awda-community-logo.svg?url';
import { CommunityLogoImageMark } from './CommunityLogoImageMark';

export const AWDA_LOGO_WIDTH = 300;
export const AWDA_LOGO_HEIGHT = 126;

type AwdaCommunityLogoMarkProps = {
  className?: string;
};

/** AWDA community wordmark — official CMYK SVG asset. */
export function AwdaCommunityLogoMark({ className }: AwdaCommunityLogoMarkProps) {
  return <CommunityLogoImageMark className={className} src={awdaCommunityLogo} />;
}
