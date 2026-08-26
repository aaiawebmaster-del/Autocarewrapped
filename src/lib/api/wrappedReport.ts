import { appConfig } from '@/lib/config';
import { staticReportUrl } from '@/lib/embedConfig';
import { fetchCompanyReportOverlay } from '@/lib/api/reportAdmin';
import { withResolvedMembershipTenure } from '@/lib/membershipTenure';
import { getSampleReport } from '@/mocks/sampleReports';
import type { WrappedReport } from '@/types/wrappedReport';

export class WrappedReportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'WrappedReportError';
  }
}

async function fetchStaticCompanyReport(recordNumber: string): Promise<WrappedReport> {
  // Admin-published overlays (Netlify Blobs / local runtime store) win over build files.
  const overlay = await fetchCompanyReportOverlay(recordNumber);
  if (overlay) {
    return withResolvedMembershipTenure(overlay);
  }

  const response = await fetch(staticReportUrl(recordNumber), {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) {
    throw new WrappedReportError('Report not available for this company', 404);
  }

  if (!response.ok) {
    throw new WrappedReportError('Unable to load company report', response.status);
  }

  // A missing report file is served as index.html (HTTP 200) by the Netlify SPA
  // catch-all, so guard against parsing HTML as JSON and treat it as "no report".
  const raw = await response.text();
  let report: WrappedReport;
  try {
    if (raw.trimStart().startsWith('<')) {
      throw new Error('non-json-response');
    }
    report = JSON.parse(raw) as WrappedReport;
  } catch {
    throw new WrappedReportError('Report not available for this company', 404);
  }

  if (report.company?.id !== recordNumber) {
    throw new WrappedReportError('Report not available for this company', 404);
  }

  return withResolvedMembershipTenure(report);
}

/** Try each candidate record number and return the first one that has a report. */
async function fetchFirstAvailableReport(recordNumbers: string[]): Promise<WrappedReport> {
  let lastError: unknown = null;

  for (const recordNumber of recordNumbers) {
    try {
      return await fetchStaticCompanyReport(recordNumber);
    } catch (error) {
      lastError = error;
      // A 404 just means this organization has no report yet — try the next one.
      if (error instanceof WrappedReportError && error.status === 404) continue;
      // Surface unexpected/transient errors (network, 5xx) immediately.
      throw error;
    }
  }

  if (lastError instanceof WrappedReportError) throw lastError;
  throw new WrappedReportError('Report not available for your organization', 404);
}

export async function fetchWrappedReport(): Promise<WrappedReport> {
  if (appConfig.embedRecordNumbers.length > 0) {
    return fetchFirstAvailableReport(appConfig.embedRecordNumbers);
  }

  if (appConfig.embedRecordNumber) {
    return fetchStaticCompanyReport(appConfig.embedRecordNumber);
  }

  if (import.meta.env.DEV && appConfig.devRecordNumber) {
    return fetchStaticCompanyReport(appConfig.devRecordNumber);
  }

  if (appConfig.useMockAuth) {
    return withResolvedMembershipTenure(getSampleReport(appConfig.mockScenario));
  }

  const url = new URL(appConfig.reportEndpoint, window.location.origin);
  if (import.meta.env.DEV && appConfig.mockScenario !== 'default') {
    url.searchParams.set('scenario', appConfig.mockScenario);
  }

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  // No company record in the URL: only a signed-in session can resolve a report.
  // Treat auth failures (and missing API / HTML SPA fallback) as login-required so
  // Drive visitors see "Log in to view report" instead of "Report not available".
  if (response.status === 401 || response.status === 403) {
    throw new WrappedReportError('Authentication required', 401);
  }

  if (response.status === 404) {
    throw new WrappedReportError('Authentication required', 401);
  }

  if (!response.ok) {
    throw new WrappedReportError('Unable to load your report', response.status);
  }

  const raw = await response.text();
  try {
    if (raw.trimStart().startsWith('<')) {
      throw new WrappedReportError('Authentication required', 401);
    }
    return withResolvedMembershipTenure(JSON.parse(raw) as WrappedReport);
  } catch (error) {
    if (error instanceof WrappedReportError) throw error;
    throw new WrappedReportError('Authentication required', 401);
  }
}

export async function checkWrappedHealth(): Promise<boolean> {
  try {
    const response = await fetch(appConfig.healthEndpoint, { credentials: 'include' });
    return response.ok;
  } catch {
    return false;
  }
}
