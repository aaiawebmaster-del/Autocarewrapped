import { formatCtaLabel } from '@/lib/analytics/ctaLabels';
import { formatDurationMs, sortCtaEntries } from '@/lib/usageReportingUtils';
import type { CompanyUsageMetrics } from '@/types/analytics';
import type { FeedbackReportSummary, StoredFeedbackEntry } from '@/types/feedback';

export type ReportingExportData = {
  fromDate: string;
  toDate: string;
  feedbackSummary: FeedbackReportSummary;
  feedbackEntries: StoredFeedbackEntry[];
  usageCompanies: CompanyUsageMetrics[];
  usageTotals: {
    totalVisitors: number;
    totalSessions: number;
    totalCompletions: number;
    totalShares: number;
  };
};

function formatReportingExportDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatRating(rating: 'positive' | 'negative'): string {
  return rating === 'positive' ? 'Positive' : 'Negative';
}

function formatDateRangeLabel(fromDate: string, toDate: string): string {
  if (fromDate && toDate) return `${fromDate} through ${toDate}`;
  if (fromDate) return `From ${fromDate}`;
  if (toDate) return `Through ${toDate}`;
  return 'All dates';
}

function buildExportFilename(fromDate: string, toDate: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  if (fromDate || toDate) {
    const range = [fromDate || 'start', toDate || 'today'].join('_to_');
    return `engagement-report_${range}_${stamp}.xlsx`;
  }
  return `engagement-report_${stamp}.xlsx`;
}

function buildSummaryRows(data: ReportingExportData): (string | number)[][] {
  return [
    ['Metric', 'Value'],
    ['Exported at (UTC)', new Date().toISOString()],
    ['Date range', formatDateRangeLabel(data.fromDate, data.toDate)],
    [],
    ['Usage totals', ''],
    ['Total visitors', data.usageTotals.totalVisitors],
    ['Sessions started', data.usageTotals.totalSessions],
    ['Completions', data.usageTotals.totalCompletions],
    ['Shares', data.usageTotals.totalShares],
    [],
    ['Feedback totals', ''],
    ['Total responses', data.feedbackSummary.total],
    ['Positive', data.feedbackSummary.positive],
    ['Negative', data.feedbackSummary.negative],
  ];
}

function buildFeedbackRows(entries: StoredFeedbackEntry[]): (string | number)[][] {
  const header = [
    'Date',
    'Company Name',
    'Rating',
    'Written Feedback',
    'Company ID',
    'Record Number',
    'Report Year',
  ];
  const rows = entries.map((entry) => [
    formatReportingExportDate(entry.submittedAt),
    entry.companyName,
    formatRating(entry.rating),
    entry.comment?.trim() ?? '',
    entry.companyId,
    entry.recordNumber ?? '',
    entry.reportYear ?? '',
  ]);
  return [header, ...rows];
}

function buildUsageRows(companies: CompanyUsageMetrics[]): (string | number)[][] {
  const header = [
    'Company Name',
    'Company ID',
    'Record Number',
    'Report Year',
    'Total Visitors',
    'Sessions Started',
    'Completions',
    'Shares',
    'Avg. Time on Report',
    'Funnel: Sessions Started',
    'Funnel: Reached Your Journey',
    'Funnel: Reached Under the Hood',
    'Funnel: Reached Kick the Tires',
    'Funnel: Reached Full Diagnostics',
    'Funnel: Completed',
  ];

  const rows = companies.map((company) => [
    company.companyName,
    company.companyId,
    company.recordNumber ?? '',
    company.reportYear ?? '',
    company.totalVisitors,
    company.totalSessions,
    company.totalCompletions,
    company.totalShares,
    formatDurationMs(company.avgTimeSpentMs),
    company.funnel.sessionsStarted,
    company.funnel.reachedJourney,
    company.funnel.reachedHood,
    company.funnel.reachedTires,
    company.funnel.reachedDiagnostics,
    company.funnel.completed,
  ]);

  return [header, ...rows];
}

function buildCtaRows(companies: CompanyUsageMetrics[]): (string | number)[][] {
  const header = ['Company Name', 'Company ID', 'Record Number', 'CTA', 'Clicks'];
  const rows: (string | number)[][] = [];

  for (const company of companies) {
    for (const [ctaKey, count] of sortCtaEntries(company.ctaClicks)) {
      rows.push([
        company.companyName,
        company.companyId,
        company.recordNumber ?? '',
        formatCtaLabel(ctaKey),
        count,
      ]);
    }
  }

  return rows.length > 0 ? [header, ...rows] : [header];
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadReportingSpreadsheet(data: ReportingExportData): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(buildSummaryRows(data)),
    'Summary',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(buildFeedbackRows(data.feedbackEntries)),
    'Feedback',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(buildUsageRows(data.usageCompanies)),
    'Usage by Company',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(buildCtaRows(data.usageCompanies)),
    'CTA Clicks',
  );

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    buildExportFilename(data.fromDate, data.toDate),
  );
}
