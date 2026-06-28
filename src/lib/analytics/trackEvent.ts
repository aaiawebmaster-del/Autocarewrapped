import { appConfig } from '@/lib/config';
import type { AnalyticsEventName, AnalyticsEventPayload } from '@/types/analytics';
import type { WrappedReport } from '@/types/wrappedReport';
import {
  getAnalyticsSessionId,
  getAnalyticsVisitorId,
  markSessionStartedAtNow,
} from '@/lib/analytics/session';

export type AnalyticsCompanyContext = {
  companyId: string;
  companyName: string;
  recordNumber?: number;
  reportYear?: number;
};

export function reportToAnalyticsContext(report: WrappedReport): AnalyticsCompanyContext {
  return {
    companyId: report.company.id,
    companyName: report.company.name,
    recordNumber: report.company.recordNumber,
    reportYear: report.reportYear,
  };
}

function buildPayload(
  event: AnalyticsEventName,
  company: AnalyticsCompanyContext,
  properties?: Record<string, string | number>,
): AnalyticsEventPayload {
  return {
    event,
    sessionId: getAnalyticsSessionId(),
    visitorId: getAnalyticsVisitorId(),
    companyId: company.companyId,
    companyName: company.companyName,
    recordNumber: company.recordNumber,
    reportYear: company.reportYear,
    timestamp: new Date().toISOString(),
    properties,
  };
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  company: AnalyticsCompanyContext,
  properties?: Record<string, string | number>,
): void {
  if (typeof window === 'undefined') return;

  if (event === 'session_started') {
    markSessionStartedAtNow();
  }

  const payload = buildPayload(event, company, properties);

  void fetch(appConfig.analyticsEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    keepalive: event === 'session_engagement',
  }).catch(() => {
    // Analytics must never interrupt the experience.
  });
}

export function trackAnalyticsEventOnce(
  event: AnalyticsEventName,
  company: AnalyticsCompanyContext,
  properties?: Record<string, string | number>,
  flagKey?: string,
): void {
  const storageKey = flagKey ?? event;
  if (typeof window !== 'undefined') {
    const flag = `wrapped-analytics-event:${storageKey}`;
    if (sessionStorage.getItem(flag) === '1') return;
    sessionStorage.setItem(flag, '1');
  }
  trackAnalyticsEvent(event, company, properties);
}
