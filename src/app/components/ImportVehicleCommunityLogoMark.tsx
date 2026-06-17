export const IMPORT_VEHICLE_LOGO_WIDTH = 300;
export const IMPORT_VEHICLE_LOGO_HEIGHT = 126;

type ImportVehicleCommunityLogoMarkProps = {
  className?: string;
};

/** Import Vehicle Community wordmark — white on brand blue. */
export function ImportVehicleCommunityLogoMark({ className }: ImportVehicleCommunityLogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${IMPORT_VEHICLE_LOGO_WIDTH} ${IMPORT_VEHICLE_LOGO_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width={IMPORT_VEHICLE_LOGO_WIDTH} height={IMPORT_VEHICLE_LOGO_HEIGHT} fill="#0085CA" />
      <text
        x="24"
        y="78"
        fill="#ffffff"
        fontFamily="'Arial Narrow', 'Barlow Condensed', Arial, sans-serif"
        fontSize="72"
        fontWeight="700"
        letterSpacing="-1"
      >
        import
      </text>
      <text
        x="24"
        y="112"
        fill="#ffffff"
        fontFamily="'Arial Narrow', 'Barlow Condensed', Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        VEHICLE
      </text>
      <text
        x="152"
        y="112"
        fill="#ffffff"
        fontFamily="'Arial Narrow', 'Barlow Condensed', Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        COMMUNITY
      </text>
    </svg>
  );
}
