/** Stable JSON contract between Snowflake API and the Wrapped SPA. */
export type WrappedReport = {
  reportYear: number;
  company: {
    id: string;
    name: string;
    /** Impexium / CRM record number — matches /engagement/{recordNumber} pages. */
    recordNumber?: number;
  };
  journey: {
    membershipTenureYears: number;
    activeContacts: number;
    communityMembers: number;
    /** Community names the organization participates in (e.g. AWDA). */
    communities: string[];
    committeeMembers: number;
  };
  events: {
    inPersonAttended: number;
    inPersonTotal: number;
    attendancePct: number;
    /** Total webinars attended; UI may label this as hours. */
    webinarCount: number;
  };
  products: {
    trendLensUsers: number;
    trendLensContactPct: number;
    demandIndexGroups: number;
    demandIndexGroupsTotal: number;
    academyUsers: number;
    academyCoursesCompleted: number;
  };
  /**
   * Separate data source at launch — hardcoded per company until Factbook API exists.
   * Snowflake metrics live under `products`; Factbook does not.
   */
  factbook: {
    users: number;
    contactPct: number;
  };
  standards?: {
    subscribedCount: number;
    subscribedProducts: string[];
    /** Optional 0–100 for gauge UI; API may compute from subscribedCount / catalog total. */
    subscribedPct?: number;
  };
};

export type EventsMetrics = WrappedReport['events'];

export type WrappedReportScenario = 'default' | 'zero-events' | 'high-engagement';
