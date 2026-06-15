import { appConfig } from '@/lib/config';
import { staticReportUrl } from '@/lib/embedConfig';
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
  const response = await fetch(staticReportUrl(recordNumber), {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) {
    throw new WrappedReportError('Report not available for this company', 404);
  }

  if (!response.ok) {
    throw new WrappedReportError('Unable to load company report', response.status);
  }

  const report = (await response.json()) as WrappedReport;
  if (report.company?.id !== recordNumber) {
    throw new WrappedReportError('Report not available for this company', 404);
  }

  return report;
}

export async function fetchWrappedReport(): Promise<WrappedReport> {
  if (appConfig.embedRecordNumber) {
    return fetchStaticCompanyReport(appConfig.embedRecordNumber);
  }

  if (import.meta.env.DEV && appConfig.devRecordNumber) {
    return fetchStaticCompanyReport(appConfig.devRecordNumber);
  }

  if (appConfig.useMockAuth) {
    return getSampleReport(appConfig.mockScenario);
  }

  const url = new URL(appConfig.reportEndpoint, window.location.origin);
  if (import.meta.env.DEV && appConfig.mockScenario !== 'default') {
    url.searchParams.set('scenario', appConfig.mockScenario);
  }

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) {
    throw new WrappedReportError('Authentication required', 401);
  }

  if (response.status === 404) {
    throw new WrappedReportError('Report not available for your organization', 404);
  }

  if (!response.ok) {
    throw new WrappedReportError('Unable to load your report', response.status);
  }

  return response.json() as Promise<WrappedReport>;
}

export async function checkWrappedHealth(): Promise<boolean> {
  try {
    const response = await fetch(appConfig.healthEndpoint, { credentials: 'include' });
    return response.ok;
  } catch {
    return false;
  }
}
