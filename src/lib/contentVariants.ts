import type { EventsMetrics, WrappedReport } from '@/types/wrappedReport';
import {
  getStandardsDatabaseAccessIcons,
  getStandardsProtocolLogos,
  getStandardsSubscribedPct,
  type StandardsDatabaseIcon,
  type StandardsProtocolLogo,
} from '@/lib/standardsDatabaseIcons';

import {
  EXTERNAL_CTA_LINKS,
} from '@/lib/externalCtaLinks';

export type TirePhase = 'trendlens' | 'demandindex' | 'factbook' | 'academy';

/** Total DemandIndex product groups in the catalog — constant across all companies. */
export const DEMAND_INDEX_AVAILABLE_PRODUCT_GROUPS = 200;

export type AttendanceVariant = 'none' | 'some' | 'high';
export type WebinarVariant = 'none' | 'some' | 'many';

export type ContentCta = {
  label: string;
  href: string;
};

export type AttendanceCopy = {
  eyebrow: string;
  metricLabel: string;
  eventsTotalLabel: string;
  detailLabel: (attended: number, total: number) => string;
  asideMessage: string;
  body: string;
  cta: ContentCta;
};

export type WebinarCopy = {
  subtitle: string;
  body: string;
  cta: ContentCta;
};

const EVENTS_CTA: ContentCta = {
  label: 'Explore Upcoming Events',
  href: EXTERNAL_CTA_LINKS.exploreUpcomingEvents,
};

const WEBINAR_CTA: ContentCta = {
  label: 'browse webinar library',
  href: EXTERNAL_CTA_LINKS.browseWebinarLibrary,
};

export function getAttendanceAsideMessage(attendancePct: number): string {
  if (attendancePct > 50) {
    return "You're showing up in a critical arena to fuel your education and business development! Explore upcoming events for you and your team";
  }
  return "We'd love to see you! Our Events are the easiest way to get fresh education, make new connections, and reinforce business relationships.";
}

export function getAttendanceVariant(attendancePct: number): AttendanceVariant {
  if (attendancePct === 0) return 'none';
  if (attendancePct > 50) return 'high';
  return 'some';
}

export function getWebinarVariant(hours: number): WebinarVariant {
  if (hours === 0) return 'none';
  if (hours > 5) return 'many';
  return 'some';
}

export function getAttendanceCopy(
  events: EventsMetrics,
  variant = getAttendanceVariant(events.attendancePct),
): AttendanceCopy {
  const { inPersonAttended, inPersonTotal } = events;
  const asideMessage = getAttendanceAsideMessage(events.attendancePct);

  const copy: Record<AttendanceVariant, AttendanceCopy> = {
    none: {
      eyebrow: 'in-person event attendance',
      metricLabel: 'in-person event attendance',
      eventsTotalLabel: `${inPersonTotal} in-person auto care events`,
      detailLabel: (_attended, total) => `0 of ${total} in-person auto care events`,
      asideMessage,
      body: "You haven't attended an in-person event yet — there's still time to connect, learn, and grow with the Auto Care community.",
      cta: EVENTS_CTA,
    },
    some: {
      eyebrow: 'in-person event attendance',
      metricLabel: 'in-person event attendance',
      eventsTotalLabel: `${inPersonTotal} in-person auto care events`,
      detailLabel: (attended, total) =>
        `${attended} of ${total} in-person auto care events`,
      asideMessage,
      body: 'Our Events are the easiest way to get fresh education, make new connections, and reinforce business relationships.',
      cta: EVENTS_CTA,
    },
    high: {
      eyebrow: 'in-person event attendance',
      metricLabel: 'in-person event attendance',
      eventsTotalLabel: `${inPersonTotal} in-person auto care events`,
      detailLabel: (attended, total) =>
        `${attended} of ${total} in-person auto care events`,
      asideMessage,
      body: "Outstanding engagement! You're making the most of in-person Auto Care events — keep building those industry connections.",
      cta: EVENTS_CTA,
    },
  };

  return copy[variant];
}

export function getAapex2026DetailMessage(aapexExhibitor = false): string {
  if (aapexExhibitor) {
    return "You're front and center at our industry's homecoming. See what's new at the upcoming show";
  }
  return 'Being at AAPEX is the #1 way to not only stay connected and forge new business.';
}

export function getWebinarMessageBody(hours: number): string {
  if (hours <= 5) {
    return 'See what you missed and view our webinars on-demand on the Digital Hub';
  }
  return 'Are there other employees who could benefit from our robust library of on-demand content?';
}

export function getWebinarCopy(
  hours: number,
  variant = getWebinarVariant(hours),
): WebinarCopy {
  const copy: Record<WebinarVariant, WebinarCopy> = {
    none: {
      subtitle: 'Webinar Attendance',
      body: 'Explore on-demand webinars to keep your team learning between events.',
      cta: WEBINAR_CTA,
    },
    some: {
      subtitle: 'Webinar Attendance',
      body: 'See what you missed and view our webinars on-demand.',
      cta: WEBINAR_CTA,
    },
    many: {
      subtitle: 'Webinar Attendance',
      body: 'Your team is deeply invested in learning — share the webinar library with colleagues who could benefit too.',
      cta: WEBINAR_CTA,
    },
  };

  return {
    ...copy[variant],
    body: getWebinarMessageBody(hours),
  };
}

export function getHoodStandardsMessages(report: WrappedReport): {
  checking: string;
  subscribed: string;
  subscribedDatabase: string;
  missing: string;
  vip: string;
  subscribedPct: number;
  databaseAccessIcons: StandardsDatabaseIcon[];
  protocolLogos: StandardsProtocolLogo[];
} {
  const subscribedProducts = report.standards?.subscribedProducts ?? [];
  const subscribedPct = getStandardsSubscribedPct(subscribedProducts);
  const hasNoStandardsSubscriptions = subscribedProducts.length === 0;
  const subscribed = subscribedProducts.length > 0 ? subscribedProducts : ['IPO', 'ISHOP', 'ACES', 'PIES'];
  const subscribedCount =
    report.standards?.subscribedCount ?? subscribed.length;
  const subscribedLabel =
    subscribed.length > 0 ? subscribed.join(', ') : 'no standards subscriptions yet';
  const databaseAccessIcons = getStandardsDatabaseAccessIcons(subscribedProducts);

  return {
    checking: 'checking standards levels',
    subscribed: `you are subscribed to ${subscribedPct}% of our data standards`,
    subscribedDatabase: hasNoStandardsSubscriptions
      ? 'Is your data healthy? Utilize our Catalog Assessment tool to find opportunities where standards can help you increase sales and reduce returns'
      : 'Make sure your databases are up-to-date with the latest releases',
    missing: `you are subscribed to ${subscribedCount} standards: ${subscribedLabel}`,
    vip: hasNoStandardsSubscriptions
      ? 'Is your data healthy? Utilize our Catalog Assessment tool to find opportunities where standards can help you increase sales and reduce returns'
      : 'Make sure your databases are up-to-date with the latest releases',
    subscribedPct,
    databaseAccessIcons,
    protocolLogos: getStandardsProtocolLogos(subscribedProducts),
  };
}

type TireReadoutSecondary =
  | { type: 'percent'; value: number; suffix: string }
  | { type: 'overTotal'; total: number; suffix: string }
  | { type: 'count'; value: number; suffix: string };

export type TireReadoutConfig = {
  measuring: string;
  primaryValue: number;
  primaryLabel: string;
  secondary: TireReadoutSecondary;
  upsellMessage?: string;
};

export function shouldSkipTrendlensPhase(_report: WrappedReport): boolean {
  return false;
}

export function getInitialTirePhase(report: WrappedReport): TirePhase {
  return shouldSkipTrendlensPhase(report) ? 'demandindex' : 'trendlens';
}

export function resolveTirePhaseForReport(
  report: WrappedReport,
  phase: TirePhase,
): TirePhase {
  if (shouldSkipTrendlensPhase(report) && phase === 'trendlens') {
    return 'demandindex';
  }
  return phase;
}

const ALL_TIRE_PHASES: TirePhase[] = ['trendlens', 'demandindex', 'factbook', 'academy'];

export function getTirePhasesForReport(report: WrappedReport): TirePhase[] {
  if (shouldSkipTrendlensPhase(report)) {
    return ALL_TIRE_PHASES.filter((phase) => phase !== 'trendlens');
  }
  return ALL_TIRE_PHASES;
}

export function getNextTirePhaseForReport(
  phase: TirePhase,
  report: WrappedReport,
): TirePhase | null {
  const order = getTirePhasesForReport(report);
  const i = order.indexOf(phase);
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1];
}

export function getPrevTirePhaseForReport(
  phase: TirePhase,
  report: WrappedReport,
): TirePhase | null {
  const order = getTirePhasesForReport(report);
  const i = order.indexOf(phase);
  if (i <= 0) return null;
  return order[i - 1];
}

export function isTirePhaseEmpty(report: WrappedReport, phase: TirePhase): boolean {
  return buildTireReadoutConfig(report)[phase].primaryValue === 0;
}

export function getAcademyCtaMessage(academyUsers: number): string {
  if (academyUsers === 0) {
    return "See what you've missed by exploring our current course catalog";
  }
  return "See what's new in our course catalog";
}

export function buildTireReadoutConfig(
  report: WrappedReport,
): Record<TirePhase, TireReadoutConfig> {
  const { products } = report;

  return {
    trendlens: {
      measuring: 'measuring trendlens usage..',
      primaryValue: products.trendLensUsers,
      primaryLabel: 'TrendLens® Users',
      secondary: {
        type: 'percent',
        value: products.trendLensContactPct,
        suffix: 'of your active contacts',
      },
      upsellMessage:
        products.trendLensUsers === 0
          ? 'Get market insights with TrendLens — invite your team to explore trends.'
          : undefined,
    },
    demandindex: {
      measuring: 'measuring demandindex usage..',
      primaryValue: products.demandIndexGroups,
      primaryLabel: 'product groups',
      secondary: {
        type: 'overTotal',
        total: DEMAND_INDEX_AVAILABLE_PRODUCT_GROUPS,
        suffix: 'available product groups',
      },
      upsellMessage:
        products.demandIndexGroups === 0
          ? 'Discover demand patterns across product groups with DemandIndex.'
          : undefined,
    },
    factbook: {
      measuring: 'measuring factbook usage..',
      primaryValue: report.factbook.users,
      primaryLabel: 'Factbook Users',
      secondary: {
        type: 'percent',
        value: report.factbook.contactPct,
        suffix: 'of active contacts',
      },
      upsellMessage:
        report.factbook.users === 0
          ? 'Equip your team with industry benchmarks from the Auto Care Factbook.'
          : undefined,
    },
    academy: {
      measuring: 'measuring academy progress..',
      primaryValue: products.academyUsers,
      primaryLabel: 'Auto Care Academy Students',
      secondary: {
        type: 'count',
        value: products.academyCoursesCompleted,
        suffix: 'completed courses',
      },
      upsellMessage:
        products.academyUsers === 0
          ? 'Start building skills with Auto Care Academy courses.'
          : undefined,
    },
  };
}

export function attendedCountFromPct(pct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((pct / 100) * total);
}

export function pctFromAttended(attended: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((attended / total) * 100);
}
