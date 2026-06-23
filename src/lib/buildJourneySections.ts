import type { WrappedReport } from '@/types/wrappedReport';
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
      label: 'active contacts',
      gaugeVariant: 'fuel',
      footerMessage: getActiveContactsFooterMessage(journey.activeContacts),
      footerButton: {
        label: 'sign up team members',
        href: EXTERNAL_CTA_LINKS.signUpTeamMembers,
      },
    },
    {
      type: 'counter',
      subtitle: 'Community Membership',
      target: journey.communityMembers,
      label: 'community members',
      gaugeVariant: 'community-logo',
      footerMessage: getCommunityFooterMessage(journey.communityMembers),
      footerButton: {
        label: 'explore all communities',
        href: EXTERNAL_CTA_LINKS.exploreAllCommunities,
      },
    },
    {
      type: 'counter',
      subtitle: 'Committee Membership',
      target: journey.committeeMembers,
      label: 'committee members',
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
    return "Thank you for your longstanding support! You're continuing a legacy of industry participation";
  }
  if (years >= 5) {
    return "Thank you for your continued support — you're building a strong track record in our industry.";
  }
  return 'Welcome to the Auto Care community — your journey is just getting started.';
}

function getActiveContactsFooterMessage(contacts: number): string {
  if (contacts > 50) {
    return "Your organization is killing it! Don't forget you've got unlimited seats available in your membership";
  }
  if (contacts >= 25) {
    return "Excellent work! Don't forget you've got unlimited seats available in your membership";
  }
  if (contacts >= 5) {
    return "Great job! Don't forget you've got unlimited seats available in your membership";
  }
  return 'Many more of your employees are able to take advantage of their membership benefits - they just need to create a free account.';
}

function getCommunityFooterMessage(members: number): string {
  if (members > 25) {
    return "WOW! You're one of our most active participants in Auto Care communities, driving our industry forward.";
  }
  if (members >= 4) {
    return 'Thank you volunteering your time to be active in our communities!';
  }
  if (members >= 1) {
    return "You're on your way! More communities mean more connections and opportunities: Explore more communities to get involved with segment-specific challenges while driving industry leadership";
  }
  return "You're missing out! Join a community or committee to find your tribe and start influencing the future of our industry";
}

function getCommitteeFooterMessage(members: number): string {
  if (members > 0) {
    return 'Thank you for helping shape the future of our industry through committee participation.';
  }
  return 'Do you want to influence the future of our industry, solve challenges and capitalize on opportunities?';
}

function getNavSectionMessage(report: WrappedReport): string {
  return getAttendanceAsideMessage(report.events.attendancePct);
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
      label: 'active contacts',
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
      label: 'committee members',
      animationKey: 'diag-committee',
      delay: 600,
      gaugeVariant: 'battery' as const,
    },
  ];
}
