import type { WrappedReport, WrappedReportScenario } from '@/types/wrappedReport';

/** Dayco Incorporated — sourced from public/data/reports/1101050.json (Excel import). */
const daycoReport: WrappedReport = {
  reportYear: 2026,
  company: {
    id: '1101050',
    name: 'Dayco Incorporated',
    recordNumber: 1101050,
  },
  journey: {
    membershipTenureYears: 56,
    activeContacts: 90,
    communityMembers: 176,
    communities: ['AWDA Community'],
    committeeMembers: 2,
  },
  events: {
    inPersonAttended: 5,
    inPersonTotal: 8,
    attendancePct: 63,
    webinarCount: 18,
    aapexExhibitor: true,
  },
  products: {
    trendLensUsers: 4,
    trendLensContactPct: 6,
    demandIndexGroups: 7,
    demandIndexGroupsTotal: 200,
    academyUsers: 2,
    academyCoursesCompleted: 4,
  },
  factbook: {
    users: 3,
    contactPct: 3,
  },
  standards: {
    subscribedCount: 3,
    subscribedProducts: [
      'PAdb - Product Attribute database',
      'VCdb - (North America) Light Duty & Powersports',
      'VCdb - (North America) Medium & Heavy Duty',
    ],
    subscribedPct: 100,
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
