import { appConfig } from '@/lib/config';
import type { WrappedReport } from '@/types/wrappedReport';

export class ReportAdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ReportAdminError';
  }
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // ignore
  }
  return fallback;
}

function authHeaders(password: string, json = false): HeadersInit {
  return {
    Accept: 'application/json',
    'X-Reporting-Password': password,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function fetchAdminReports(password: string): Promise<WrappedReport[]> {
  const response = await fetch(appConfig.reportingReportsEndpoint, {
    method: 'GET',
    headers: authHeaders(password),
  });

  if (!response.ok) {
    throw new ReportAdminError(
      await readErrorMessage(response, 'Unable to load company reports'),
      response.status,
    );
  }

  const body = (await response.json()) as { reports?: WrappedReport[] };
  return body.reports ?? [];
}

export async function publishAdminReport(
  password: string,
  report: WrappedReport,
): Promise<WrappedReport> {
  const response = await fetch(appConfig.reportingReportsEndpoint, {
    method: 'POST',
    headers: authHeaders(password, true),
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new ReportAdminError(
      await readErrorMessage(response, 'Unable to publish report'),
      response.status,
    );
  }

  const body = (await response.json()) as { report: WrappedReport };
  return body.report;
}

export async function patchAdminReportField(
  password: string,
  companyId: string,
  path: string,
  value: unknown,
): Promise<WrappedReport> {
  const response = await fetch(
    `${appConfig.reportingReportsEndpoint}/${encodeURIComponent(companyId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(password, true),
      body: JSON.stringify({ path, value }),
    },
  );

  if (!response.ok) {
    throw new ReportAdminError(
      await readErrorMessage(response, 'Unable to update field'),
      response.status,
    );
  }

  const body = (await response.json()) as { report: WrappedReport };
  return body.report;
}

/** Public overlay lookup (no password). 404 means use static file. */
export async function fetchCompanyReportOverlay(
  recordNumber: string,
): Promise<WrappedReport | null> {
  const url = new URL(appConfig.companyReportEndpoint, window.location.origin);
  url.searchParams.set('record', recordNumber);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  try {
    const report = (await response.json()) as WrappedReport;
    if (report?.company?.id !== recordNumber) return null;
    return report;
  } catch {
    return null;
  }
}
