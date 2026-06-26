import accCommunityLogo from '../assets/acc-2c-tagline.svg?url';
import acpnCommunityLogo from '../assets/acpn-community-color.svg?url';
import awdaCommunityLogo from '../assets/awda-community-logo.svg?url';
import importVehicleCommunityLogo from '../assets/import-vehicle-community-logo.svg?url';
import womenInAutoCareCommunityLogo from '../assets/women-in-auto-care-community-logo.svg?url';
import yangCommunityLogo from '../assets/yang-community-logo.svg?url';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';

export const COMMUNITY_BUTTON_ASPECT_WIDTH = 300;
export const COMMUNITY_BUTTON_ASPECT_HEIGHT = 126;

export type CommunityLogoAsset = {
  id: string;
  label: string;
  href: string;
  width: number;
  height: number;
  src?: string;
  logoClassName?: string;
  textOnly?: boolean;
};

type CommunityMatcher = {
  pattern: RegExp;
  asset: Omit<CommunityLogoAsset, 'label'>;
};

const EXPLORE_COMMUNITIES_HREF = EXTERNAL_CTA_LINKS.exploreAllCommunities;

const COMMUNITY_MATCHERS: CommunityMatcher[] = [
  {
    pattern: /automotive communications council|^acc$/i,
    asset: {
      id: 'acc',
      href: EXPLORE_COMMUNITIES_HREF,
      width: 365.47,
      height: 165.58,
      src: accCommunityLogo,
      logoClassName: 'community-logo-gauge__logo--acc',
    },
  },
  {
    pattern: /automotive content professionals network|^acpn$/i,
    asset: {
      id: 'acpn',
      href: EXPLORE_COMMUNITIES_HREF,
      width: 274.37,
      height: 108.19,
      src: acpnCommunityLogo,
    },
  },
  {
    pattern: /awda/i,
    asset: {
      id: 'awda',
      href: EXPLORE_COMMUNITIES_HREF,
      width: COMMUNITY_BUTTON_ASPECT_WIDTH,
      height: COMMUNITY_BUTTON_ASPECT_HEIGHT,
      src: awdaCommunityLogo,
    },
  },
  {
    pattern: /import vehicle/i,
    asset: {
      id: 'import-vehicle',
      href: EXPLORE_COMMUNITIES_HREF,
      width: 274.4,
      height: 108.2,
      src: importVehicleCommunityLogo,
      logoClassName: 'community-logo-gauge__logo--import-vehicle',
    },
  },
  {
    pattern: /women in auto care/i,
    asset: {
      id: 'women-in-auto-care',
      href: EXPLORE_COMMUNITIES_HREF,
      width: 274.17,
      height: 108.11,
      src: womenInAutoCareCommunityLogo,
    },
  },
  {
    pattern: /yang/i,
    asset: {
      id: 'yang',
      href: EXPLORE_COMMUNITIES_HREF,
      width: 274.11,
      height: 108.09,
      src: yangCommunityLogo,
    },
  },
];

/** Manual community lists per Impexium record until CRM export is authoritative. */
export const COMMUNITY_LIST_OVERRIDES: Record<string, string[]> = {
  '1101050': [
    'Automotive Communications Council',
    'AWDA Community',
    'Women in Auto Care',
    'YANG Membership',
  ],
  '1376049': [
    'Automotive Content Professionals Network',
    'AWDA Community',
    'Import Vehicle Community',
  ],
  '1351167': ['AWDA Community'],
  '1257307': ['AWDA Community', 'Women in Auto Care', 'YANG Membership'],
  '1255413': ['AWDA Community'],
};

function slugifyCommunityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchCommunityAsset(name: string): CommunityLogoAsset | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  for (const matcher of COMMUNITY_MATCHERS) {
    if (matcher.pattern.test(trimmed)) {
      return { ...matcher.asset, label: trimmed };
    }
  }

  return {
    id: slugifyCommunityName(trimmed),
    label: trimmed,
    href: EXPLORE_COMMUNITIES_HREF,
    width: COMMUNITY_BUTTON_ASPECT_WIDTH,
    height: COMMUNITY_BUTTON_ASPECT_HEIGHT,
    textOnly: true,
  };
}

export function resolveCommunityLogos(communities: string[] | undefined): CommunityLogoAsset[] {
  if (!communities?.length) return [];

  const resolved: CommunityLogoAsset[] = [];
  const seen = new Set<string>();

  for (const name of communities) {
    const trimmed = name.trim();
    if (!trimmed || /^group$/i.test(trimmed)) continue;

    const asset = matchCommunityAsset(trimmed);
    if (!asset || seen.has(asset.id)) continue;
    seen.add(asset.id);
    resolved.push(asset);
  }

  return resolved;
}

export function communityLogoAspect(_asset?: CommunityLogoAsset): string {
  return `${COMMUNITY_BUTTON_ASPECT_WIDTH} / ${COMMUNITY_BUTTON_ASPECT_HEIGHT}`;
}

/** @deprecated Use resolveCommunityLogos instead. */
export function hasAwdaCommunity(communities: string[] | undefined): boolean {
  return communities?.some((name) => /awda/i.test(name)) ?? false;
}

/** @deprecated Use resolveCommunityLogos instead. */
export function hasImportVehicleCommunity(communities: string[] | undefined): boolean {
  return communities?.some((name) => /import vehicle/i.test(name)) ?? false;
}

/** @deprecated Use resolveCommunityLogos instead. */
export function showDualCommunityLogos(communities: string[] | undefined): boolean {
  const logos = resolveCommunityLogos(communities);
  return logos.length === 2;
}

/** @deprecated Use resolveCommunityLogos instead. */
export function hasSingleCommunity(communities: string[] | undefined): boolean {
  return resolveCommunityLogos(communities).length === 1;
}
