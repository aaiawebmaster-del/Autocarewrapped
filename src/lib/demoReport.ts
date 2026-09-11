import type { WrappedReport } from '@/types/wrappedReport';

/** Public demo Wrapped report — fictional company for shareable Netlify links. */
export const DEMO_RECORD_NUMBER = '9999999';
export const DEMO_COMPANY_NAME = 'Demo Company';

const DEMO_RECORD_IDS = new Set([DEMO_RECORD_NUMBER]);

export function isDemoReportId(companyId: string | null | undefined): boolean {
  if (!companyId) return false;
  return DEMO_RECORD_IDS.has(String(companyId));
}

/** Fictional metrics for the public /demo experience (no real member data). */
export const DEMO_WRAPPED_REPORT: WrappedReport = {
  reportYear: 2026,
  company: {
    id: DEMO_RECORD_NUMBER,
    name: DEMO_COMPANY_NAME,
    recordNumber: Number(DEMO_RECORD_NUMBER),
  },
  journey: {
    membershipSince: '2012-03-15',
    membershipTenureYears: 14,
    activeContacts: 42,
    communityMembers: 28,
    communities: [
      'AWDA Community',
      'Women in Auto Care',
    ],
    committeeMembers: 1,
  },
  events: {
    inPersonAttended: 4,
    inPersonTotal: 8,
    attendancePct: 50,
    webinarCount: 18,
    aapexExhibitor: true,
    aapexAttended: true,
  },
  products: {
    trendLensUsers: 6,
    trendLensContactPct: 14,
    demandIndexGroups: 24,
    demandIndexGroupsTotal: 200,
    academyUsers: 5,
    academyCoursesCompleted: 9,
  },
  factbook: {
    users: 4,
    contactPct: 10,
  },
  standards: {
    subscribedCount: 2,
    subscribedProducts: ['ACES', 'PIES'],
    subscribedPct: 67,
  },
};

export function getDemoWrappedReport(): WrappedReport {
  return DEMO_WRAPPED_REPORT;
}
