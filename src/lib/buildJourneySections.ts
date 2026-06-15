import type { WrappedReport } from '@/types/wrappedReport';

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
      footerButton: { label: 'sign up team members', href: 'https://my.autocare.org' },
    },
    {
      type: 'counter',
      subtitle: 'Community Membership',
      target: journey.communityMembers,
      label: 'community members',
      gaugeVariant: 'community-logo',
      footerMessage: getCommunityFooterMessage(journey.communityMembers),
      footerButton: { label: 'explore all communities', href: 'https://autocare.org/' },
    },
    {
      type: 'counter',
      subtitle: 'Committee Membership',
      target: journey.committeeMembers,
      label: 'committee members',
      gaugeVariant: 'battery',
      footerMessage: getCommitteeFooterMessage(journey.committeeMembers),
      footerButton: {
        label: 'explore our committees',
        href: 'https://autocare.org/committees',
      },
    },
    {
      type: 'nav',
      navMessage: getNavSectionMessage(report),
      navButton: { label: 'see upcoming events', href: 'https://autocare.org/events' },
      webinarsMessage: getWebinarSectionMessage(report.events.webinarCount),
      webinarsButton: { label: 'browse webinar library', href: 'https://autocare.org/education' },
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
  if (contacts >= 50) {
    return "Your organization is killing it! Don't forget you've got unlimited seats available in your membership";
  }
  return 'Invite more team members to unlock the full value of your membership benefits.';
}

function getCommunityFooterMessage(members: number): string {
  if (members >= 50) {
    return "WOW! You're one of our most active participants in Auto Care communities, driving our industry forward.";
  }
  if (members > 0) {
    return 'Your team is engaging in Auto Care communities — keep the conversation going.';
  }
  return 'Explore Auto Care communities and connect with peers across the industry.';
}

function getCommitteeFooterMessage(members: number): string {
  if (members > 0) {
    return 'Thank you for helping shape the future of our industry through committee participation.';
  }
  return 'Do you want to influence the future of our industry, solve challenges and capitalize on opportunities?';
}

function getNavSectionMessage(report: WrappedReport): string {
  if (report.events.inPersonAttended === 0) {
    return "We'd love to see you at an in-person event — the easiest way to get fresh education and make new connections.";
  }
  return "We'd love to see more of you! Our Events are the easiest way to get fresh education, make new connections, and reinforce business relationships.";
}

function getWebinarSectionMessage(hours: number): string {
  if (hours === 0) {
    return 'Explore our robust library of on-demand content to keep your team learning year-round.';
  }
  return 'Are there other employees who could benefit from our robust library of on-demand content?';
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
