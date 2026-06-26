const AWDA_PATTERN = /awda/i;
const IMPORT_VEHICLE_PATTERN = /import vehicle/i;

export function hasAwdaCommunity(communities: string[] | undefined): boolean {
  return communities?.some((name) => AWDA_PATTERN.test(name)) ?? false;
}

export function hasImportVehicleCommunity(communities: string[] | undefined): boolean {
  return communities?.some((name) => IMPORT_VEHICLE_PATTERN.test(name)) ?? false;
}

export function showDualCommunityLogos(communities: string[] | undefined): boolean {
  return hasAwdaCommunity(communities) && hasImportVehicleCommunity(communities);
}

export function hasSingleCommunity(communities: string[] | undefined): boolean {
  return communities?.length === 1;
}
