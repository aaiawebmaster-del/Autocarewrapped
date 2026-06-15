/** Resolve company record number from embed URL or my.autocare.org page path. */
export type EmbedConfig = {
  isEmbedded: boolean;
  recordNumber: string | null;
};

function readSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function getRecordNumberFromPath(pathname = window.location.pathname): string | null {
  const engagementMatch = pathname.match(/\/engagement\/(\d+)\/?$/i);
  if (engagementMatch) return engagementMatch[1];

  return null;
}

export function getEmbedConfig(): EmbedConfig {
  const params = readSearchParams();
  const fromQuery =
    params.get('record')?.trim() ||
    params.get('company')?.trim() ||
    params.get('companyId')?.trim() ||
    null;
  const fromPath = typeof window !== 'undefined' ? getRecordNumberFromPath() : null;
  const recordNumber = fromQuery || fromPath;
  const embedFlag = params.get('embed');
  const isEmbedded = embedFlag === '1' || embedFlag === 'true' || recordNumber !== null;

  return { isEmbedded, recordNumber };
}

export function staticReportUrl(recordNumber: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/data/reports/${encodeURIComponent(recordNumber)}.json`;
}
