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

function sortReports(reports: WrappedReport[]): WrappedReport[] {
  return [...reports].sort((a, b) => a.company.name.localeCompare(b.company.name));
}

function mergeReportsById(groups: WrappedReport[][]): WrappedReport[] {
  const byId = new Map<string, WrappedReport>();
  for (const group of groups) {
    for (const report of group) {
      if (!isWrappedReport(report)) continue;
      byId.set(String(report.company.id), report);
    }
  }
  return sortReports([...byId.values()]);
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

  return reports.filter((report): report is WrappedReport => Boolean(report));
}

/**
 * Merge API overlays (Blobs uploads) with static `/data/reports`.
 * Static files are the catalog; overlays win when present.
 */
export async function fetchAdminReports(password: string): Promise<WrappedReport[]> {
  let apiError: ReportAdminError | null = null;
  let apiReports: WrappedReport[] = [];
  let apiAvailable = false;

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
    apiReports = (body.reports ?? []).filter(isWrappedReport);
    apiAvailable = true;
  } catch (error) {
    if (error instanceof ReportAdminError) {
      if (error.status === 401) throw error;
      apiError = error;
    } else if (error instanceof Error) {
      apiError = new ReportAdminError(error.message, 500);
    }
  }

  const staticReports = await fetchStaticReportCatalog();

  // Prefer API overlay map when the endpoint is healthy; otherwise skip per-id
  // overlay fetches so the console is not flooded with expected 404s.
  const merged = apiAvailable
    ? mergeReportsById([staticReports, apiReports])
    : sortReports(staticReports);

  if (merged.length === 0 && apiError) throw apiError;
  return merged;
}

/**
 * Parse Engagement Report upload JSON:
 * - single company object
 * - array of company objects
 * - `{ "reports": [ ... ] }`
 */
export function parseEngagementUploadPayload(payload: unknown): WrappedReport[] {
  if (Array.isArray(payload)) {
    if (payload.length === 0) throw new Error('Upload array is empty');
    return payload as WrappedReport[];
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(
      'Upload must be a company report JSON object, an array of reports, or { "reports": [...] }',
    );
  }

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.reports)) {
    if (record.reports.length === 0) throw new Error('reports array is empty');
    return record.reports as WrappedReport[];
  }

  if (record.company != null || record.reportYear != null || record.journey != null) {
    return [payload as WrappedReport];
  }

  throw new Error(
    'Upload must be a company report JSON object, an array of reports, or { "reports": [...] }',
  );
}

export async function publishAdminReports(
  password: string,
  payload: unknown,
): Promise<WrappedReport[]> {
  const response = await fetch(appConfig.reportingReportsEndpoint, {
    method: 'POST',
    headers: authHeaders(password, true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ReportAdminError(
      await readErrorMessage(response, 'Unable to publish report'),
      response.status,
    );
  }

  const body = (await response.json()) as { reports?: WrappedReport[]; report?: WrappedReport };
  if (Array.isArray(body.reports) && body.reports.length > 0) return body.reports;
  if (body.report) return [body.report];
  return parseEngagementUploadPayload(payload);
}

export async function publishAdminReport(
  password: string,
  report: WrappedReport,
): Promise<WrappedReport> {
  const published = await publishAdminReports(password, report);
  return published[0];
}

export async function patchAdminReportField(
  password: string,
  companyId: string,
  path: string,
  value: unknown,
  baseReport?: WrappedReport,
): Promise<WrappedReport> {
  const response = await fetch(
    `${appConfig.reportingReportsEndpoint}/${encodeURIComponent(companyId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(password, true),
      body: JSON.stringify({ path, value, baseReport }),
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
