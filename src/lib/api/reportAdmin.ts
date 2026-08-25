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

type ReportIndexEntry = {
  id: string;
  name?: string;
  recordNumber?: number;
  pagePath?: string;
};

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

function isWrappedReport(value: unknown): value is WrappedReport {
  if (!value || typeof value !== 'object') return false;
  const report = value as WrappedReport;
  return Boolean(report.company?.id && report.company?.name);
}

async function fetchJson(url: string): Promise<unknown | null> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const raw = await response.text();
  if (!raw.trim() || raw.trimStart().startsWith('<')) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Load built-in company reports from static `/data/reports` files. */
export async function fetchStaticReportCatalog(): Promise<WrappedReport[]> {
  const index = (await fetchJson('/data/reports/index.json')) as ReportIndexEntry[] | null;
  if (!Array.isArray(index) || index.length === 0) return [];

  const reports = await Promise.all(
    index.map(async (entry) => {
      const id = String(entry.id ?? '').trim();
      if (!id) return null;
      const report = await fetchJson(`/data/reports/${encodeURIComponent(id)}.json`);
      return isWrappedReport(report) ? report : null;
    }),
  );

  return reports
    .filter((report): report is WrappedReport => Boolean(report))
    .sort((a, b) => a.company.name.localeCompare(b.company.name));
}

async function mergeOverlayReports(baseReports: WrappedReport[]): Promise<WrappedReport[]> {
  const merged = await Promise.all(
    baseReports.map(async (report) => {
      const overlay = await fetchCompanyReportOverlay(report.company.id);
      return overlay ?? report;
    }),
  );
  return merged.sort((a, b) => a.company.name.localeCompare(b.company.name));
}

/**
 * Prefer the authenticated API catalog when it returns companies.
 * Always fall back to static `/data/reports` so ADMIN shows built-in data
 * even when Blobs/API resolution is empty.
 */
export async function fetchAdminReports(password: string): Promise<WrappedReport[]> {
  let apiError: ReportAdminError | null = null;

  try {
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
    const apiReports = (body.reports ?? []).filter(isWrappedReport);
    if (apiReports.length > 0) {
      return apiReports.sort((a, b) => a.company.name.localeCompare(b.company.name));
    }
  } catch (error) {
    if (error instanceof ReportAdminError) {
      if (error.status === 401) throw error;
      apiError = error;
    }
  }

  const staticReports = await fetchStaticReportCatalog();
  if (staticReports.length === 0) {
    if (apiError) throw apiError;
    return [];
  }

  return mergeOverlayReports(staticReports);
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

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) return null;

    const report = (await response.json()) as WrappedReport;
    if (report?.company?.id !== recordNumber) return null;
    return report;
  } catch {
    return null;
  }
}
