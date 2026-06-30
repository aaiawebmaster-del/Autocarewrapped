import type { WrappedReport } from '@/types/wrappedReport';
import { resolveCommunityLogos } from '@/lib/communityLogos';
import { EXTERNAL_CTA_LINKS } from '@/lib/externalCtaLinks';
import { getAttendanceAsideMessage, getWebinarMessageBody } from '@/lib/contentVariants';

export type JourneySection =
  | {
      type: 'counter';
      subtitle: string;
      target: number;
      label: string;
      labelLines?: string[];
      gaugeVariant?: 'speedometer' | 'fuel' | 'battery' | 'community-logo';
      communities?: string[];
      footerMessage?: string;
      footerButton?: { label: string; href: string };
    }
  | {
      type: 'nav';
      navMessage: string;
      navButton?: { label: string; href: string };
      webinarsMessage: string;
      webinarsButton: { label: string; href: string };
    };

export function buildJourneySections(report: WrappedReport): JourneySection[] {
  const { journey } = report;

  return [
    {
      type: 'counter',
      subtitle: 'Membership Tenure',
      target: journey.membershipTenureYears,
      label: 'years',
      footerMessage: getTenureFooterMessage(journey.membershipTenureYears),
    },
    {
      type: 'counter',
      subtitle: 'Active Contacts',
      target: journey.activeContacts,
      label: 'contacts',
      gaugeVariant: 'fuel',
      footerMessage: getActiveContactsFooterMessage(journey.activeContacts),
      footerButton: {
        label: 'sign up team members',
        href: EXTERNAL_CTA_LINKS.signUpTeamMembers,
      },
    },
    {
      type: 'counter',
      subtitle: 'Community Participation',
      target: journey.communityMembers,
      label: 'community members',
      gaugeVariant: 'community-logo',
      communities: journey.communities,
      footerMessage: getCommunityFooterMessage(journey.communities),
      footerButton: {
        label: 'explore all communities',
        href: EXTERNAL_CTA_LINKS.exploreAllCommunities,
      },
    },
    {
      type: 'counter',
      subtitle: 'Committee Leadership',
      target: journey.committeeMembers,
      label: 'leaders',
      gaugeVariant: 'battery',
      footerMessage: getCommitteeFooterMessage(journey.committeeMembers),
      footerButton: {
        label: 'explore all committees',
        href: EXTERNAL_CTA_LINKS.exploreAllCommittees,
      },
    },
    {
      type: 'nav',
      navMessage: getNavSectionMessage(report),
      navButton: {
        label: 'see upcoming events',
        href: EXTERNAL_CTA_LINKS.exploreUpcomingEvents,
      },
      webinarsMessage: getWebinarSectionMessage(report.events.webinarCount),
      webinarsButton: {
        label: 'browse webinar library',
        href: EXTERNAL_CTA_LINKS.browseWebinarLibrary,
      },
    },
  ];
}

function getTenureFooterMessage(years: number): string {
  if (years >= 25) {
    return "Thank you for your longstanding support! You're continuing a legacy of industry participation.";
  }
  if (years >= 5) {
    return "Thank you for your continued support — you're building a strong track record in our industry.";
  }
  return 'Welcome to the Auto Care community — your journey is just getting started.';
}

function getActiveContactsFooterMessage(contacts: number): string {
  if (contacts > 50) {
    return "Your organization is killing it! Don't forget you've got unlimited seats available in your membership.";
  }
  if (contacts >= 25) {
    return "Excellent work! Don't forget you've got unlimited seats available in your membership.";
  }
  if (contacts >= 5) {
    return "Great job! Don't forget you've got unlimited seats available in your membership.";
  }
  return 'Many more of your employees are able to take advantage of their membership benefits - they just need to create a free account.';
}

function getCommunityFooterMessage(communities: string[] | undefined): string {
  const communityCount = resolveCommunityLogos(communities).length;

  if (communityCount >= 2) {
    return "WOW! You're one of our most active participants in Auto Care communities, driving our industry forward.";
  }

  return 'Explore more of our communities and get involved to address segment-specific challenges while driving industry leadership!';
}

function getCommitteeFooterMessage(members: number): string {
  if (members > 0) {
    return 'Thank you for helping shape the future of our industry through committee participation.';
  }
  return 'Do you want to influence the future of our industry, solve challenges and capitalize on opportunities?';
}

function getNavSectionMessage(report: WrappedReport): string {
  return getAttendanceAsideMessage(
    report.events.attendancePct,
    report.events.inPersonAttended,
  );
}

function getWebinarSectionMessage(hours: number): string {
  return getWebinarMessageBody(hours);
}

export function buildDiagnosticsCounterStats(report: WrappedReport) {
  const { journey } = report;
  return [
    {
      target: journey.membershipTenureYears,
      label: 'years',
      animationKey: 'diag-years',
      delay: 0,
      gaugeVariant: 'speedometer' as const,
    },
    {
      target: journey.activeContacts,
      label: 'contacts',
      animationKey: 'diag-contacts',
      delay: 200,
      gaugeVariant: 'fuel' as const,
    },
    {
      target: journey.communityMembers,
      label: 'community members',
      animationKey: 'diag-community',
      delay: 400,
      gaugeVariant: 'community-logo' as const,
    },
    {
      target: journey.committeeMembers,
      label: 'leaders',
      animationKey: 'diag-committee',
      delay: 600,
      gaugeVariant: 'battery' as const,
    },
  ];
}
