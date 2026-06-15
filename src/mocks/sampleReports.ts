import type { WrappedReport, WrappedReportScenario } from '@/types/wrappedReport';

const daycoReport: WrappedReport = {
  reportYear: 2026,
  company: {
    id: 'dayco-inc',
    name: 'Dayco Incorporated',
  },
  journey: {
    membershipTenureYears: 56,
    activeContacts: 87,
    communityMembers: 88,
    communities: ['AWDA Warehouse Distributors'],
    committeeMembers: 1,
  },
  events: {
    inPersonAttended: 2,
    inPersonTotal: 8,
    attendancePct: 25,
    webinarCount: 38,
  },
  products: {
    trendLensUsers: 7,
    trendLensContactPct: 8,
    demandIndexGroups: 8,
    demandIndexGroupsTotal: 200,
    academyUsers: 2,
    academyCoursesCompleted: 2,
  },
  factbook: {
    users: 4,
    contactPct: 5,
  },
  standards: {
    subscribedCount: 4,
    subscribedProducts: ['IPO', 'ISHOP', 'ACES', 'PIES'],
    subscribedPct: 40,
  },
};

const zeroEventsReport: WrappedReport = {
  ...daycoReport,
  company: {
    id: 'new-member-co',
    name: 'New Member Company',
  },
  events: {
    inPersonAttended: 0,
    inPersonTotal: 8,
    attendancePct: 0,
    webinarCount: 0,
  },
  journey: {
    ...daycoReport.journey,
    committeeMembers: 0,
    communityMembers: 12,
    communities: ['Aftermarket Suppliers Community'],
  },
};

const highEngagementReport: WrappedReport = {
  ...daycoReport,
  company: {
    id: 'elite-auto-parts',
    name: 'Elite Auto Parts',
  },
  events: {
    inPersonAttended: 6,
    inPersonTotal: 8,
    attendancePct: 75,
    webinarCount: 120,
  },
  journey: {
    membershipTenureYears: 42,
    activeContacts: 150,
    communityMembers: 140,
    communities: [
      'AWDA Warehouse Distributors',
      'Aftermarket Suppliers Community',
      'Heavy Duty Distribution Association',
    ],
    committeeMembers: 4,
  },
  products: {
    trendLensUsers: 45,
    trendLensContactPct: 30,
    demandIndexGroups: 120,
    demandIndexGroupsTotal: 200,
    academyUsers: 15,
    academyCoursesCompleted: 42,
  },
  factbook: {
    users: 28,
    contactPct: 19,
  },
  standards: {
    subscribedCount: 10,
    subscribedProducts: ['IPO', 'ISHOP', 'ACES', 'PIES', 'Super Spec'],
    subscribedPct: 95,
  },
};

export const SAMPLE_REPORTS: Record<WrappedReportScenario, WrappedReport> = {
  default: daycoReport,
  'zero-events': zeroEventsReport,
  'high-engagement': highEngagementReport,
};

export function getSampleReport(scenario: WrappedReportScenario = 'default'): WrappedReport {
  return SAMPLE_REPORTS[scenario] ?? daycoReport;
}

export { daycoReport, zeroEventsReport, highEngagementReport };
