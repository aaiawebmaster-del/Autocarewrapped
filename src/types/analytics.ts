export type AnalyticsEventName =
  | 'report_view'
  | 'session_started'
  | 'intro_skipped'
  | 'checkpoint_reached'
  | 'diagnostics_completed'
  | 'share_clicked'
  | 'cta_clicked'
  | 'session_engagement';

export type AnalyticsCheckpoint = 'journey' | 'hood' | 'tires' | 'diagnostics';

export type AnalyticsEventPayload = {
  event: AnalyticsEventName;
  sessionId: string;
  visitorId: string;
  companyId: string;
  companyName: string;
  recordNumber?: number;
  reportYear?: number;
  timestamp: string;
  properties?: Record<string, string | number>;
};

export type StoredAnalyticsEvent = AnalyticsEventPayload & {
  id: string;
};

export type CompanyUsageFunnel = {
  sessionsStarted: number;
  reachedJourney: number;
  reachedHood: number;
  reachedTires: number;
  reachedDiagnostics: number;
  completed: number;
};

export type CompanyUsageMetrics = {
  companyId: string;
  companyName: string;
  recordNumber: number | null;
  reportYear: number | null;
  totalVisitors: number;
  totalSessions: number;
  totalCompletions: number;
  totalShares: number;
  ctaClicks: Record<string, number>;
  funnel: CompanyUsageFunnel;
  avgTimeSpentMs: number | null;
};

export type UsageReportResponse = {
  companies: CompanyUsageMetrics[];
};
