import importVehicleCommunityLogo from '../../assets/import-vehicle-community-logo.svg?url';
import { CommunityLogoImageMark } from './CommunityLogoImageMark';

type ImportVehicleCommunityLogoMarkProps = {
  className?: string;
};

/** Import Vehicle Community wordmark — official CMYK SVG asset. */
export function ImportVehicleCommunityLogoMark({
  className,
}: ImportVehicleCommunityLogoMarkProps) {
  return (
    <CommunityLogoImageMark className={className} src={importVehicleCommunityLogo} />
  );
}
