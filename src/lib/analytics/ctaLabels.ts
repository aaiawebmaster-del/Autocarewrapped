import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';

/** Human-readable labels for reporting — keyed by EXTERNAL_CTA_LINKS property name. */
export const CTA_DISPLAY_LABELS: Record<keyof typeof EXTERNAL_CTA_LINKS, string> = {
  signUpTeamMembers: 'Sign up team members',
  exploreAllCommunities: 'Explore all communities',
  exploreAllCommittees: 'Explore all committees',
  browseWebinarLibrary: 'Browse webinar library',
  aapex2026: 'AAPEX 2026',
  exploreAutoCareVip: 'Explore Auto Care VIP',
  seeLatestReleases: 'See latest releases',
  catalogAssessmentTool: 'Catalog assessment tool',
  visitTrendLens: 'Visit TrendLens',
  demandIndexLearnMore: 'Demand Index learn more',
  factbook2027: 'Factbook 2027',
  exploreAcademyCourses: 'Explore Academy courses',
  exploreUpcomingEvents: 'Explore upcoming events',
  seeAllSubscriptions: 'See all subscriptions',
};

const HREF_TO_CTA_KEY = new Map<string, keyof typeof EXTERNAL_CTA_LINKS>(
  Object.entries(EXTERNAL_CTA_LINKS).map(([key, href]) => [href, key as keyof typeof EXTERNAL_CTA_LINKS]),
);

export function resolveCtaKeyFromHref(href: string): keyof typeof EXTERNAL_CTA_LINKS | 'unknown' {
  const normalized = href.split('#')[0]?.split('?')[0] ?? href;
  for (const [ctaHref, key] of HREF_TO_CTA_KEY.entries()) {
    const ctaBase = ctaHref.split('#')[0]?.split('?')[0] ?? ctaHref;
    if (normalized === ctaBase || href.startsWith(ctaHref)) {
      return key;
    }
  }
  return 'unknown';
}

export function formatCtaLabel(ctaKey: string): string {
  if (ctaKey in CTA_DISPLAY_LABELS) {
    return CTA_DISPLAY_LABELS[ctaKey as keyof typeof CTA_DISPLAY_LABELS];
  }
  return ctaKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
