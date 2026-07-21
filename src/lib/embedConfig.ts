/** Resolve company record number from embed URL or my.autocare.org page path. */
export type EmbedConfig = {
  isEmbedded: boolean;
  /** First candidate record number, kept for backwards compatibility. */
  recordNumber: string | null;
  /**
   * All candidate record numbers, in priority order. The Query Content component can
   * return multiple related organizations; only some have a Wrapped report, so the app
   * tries each in turn.
   */
  recordNumbers: string[];
};

function readSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/** Extract the first 5-9 digit record number from an arbitrary string. */
function extractRecord(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d{5,9}/);
  return match ? match[0] : null;
}

export function getRecordNumberFromPath(pathname = window.location.pathname): string | null {
  const engagementMatch = pathname.match(/\/engagement\/(\d+)\/?$/i);
  if (engagementMatch) return engagementMatch[1];

  return null;
}

export function getEmbedConfig(): EmbedConfig {
  const params = readSearchParams();

  const ordered: string[] = [];
  const push = (value: string | null | undefined) => {
    const record = extractRecord(value);
    if (record && !ordered.includes(record)) ordered.push(record);
  };

  // Comma-separated list from embed.js (may contain several related organizations).
  for (const part of (params.get('records') ?? '').split(',')) {
    push(part);
  }
  push(params.get('record'));
  push(params.get('company'));
  push(params.get('companyId'));
  if (typeof window !== 'undefined') push(getRecordNumberFromPath());

  const recordNumber = ordered[0] ?? null;
  const embedFlag = params.get('embed');
  const isEmbedded = embedFlag === '1' || embedFlag === 'true' || recordNumber !== null;

  return { isEmbedded, recordNumber, recordNumbers: ordered };
}

export function staticReportUrl(recordNumber: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/data/reports/${encodeURIComponent(recordNumber)}.json`;
}

const ENGAGEMENT_PAGE_ORIGIN = 'https://my.autocare.org';

/** Unified my.autocare.org page where colleagues view a company's Wrapped report. */
export const ENGAGEMENT_PAGE_PATH = '/engagement';

/** Public my.autocare.org page where colleagues view a company's Wrapped report. */
export function companyReportPageUrl(recordNumber?: string | number | null): string {
  const record =
    recordNumber != null && String(recordNumber).trim() !== ''
      ? String(recordNumber).trim()
      : getEmbedConfig().recordNumber;

  if (record) {
    return `${ENGAGEMENT_PAGE_ORIGIN}${ENGAGEMENT_PAGE_PATH}?record=${encodeURIComponent(record)}`;
  }

  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

export function buildShareMailtoUrl(reportPageUrl: string): string {
  const subject = 'Our Year with the Auto Care Association';
  const body = `View Your Year In Review for our company:\n\n${reportPageUrl}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
