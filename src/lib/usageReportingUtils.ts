import type { CompanyUsageMetrics } from '@/types/analytics';

export function formatDurationMs(ms: number | null): string {
  if (ms == null || ms <= 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function sumUsageTotals(companies: CompanyUsageMetrics[]) {
  return companies.reduce(
    (totals, company) => ({
      totalVisitors: totals.totalVisitors + company.totalVisitors,
      totalSessions: totals.totalSessions + company.totalSessions,
      totalCompletions: totals.totalCompletions + company.totalCompletions,
      totalShares: totals.totalShares + company.totalShares,
    }),
    {
      totalVisitors: 0,
      totalSessions: 0,
      totalCompletions: 0,
      totalShares: 0,
    },
  );
}

export function sortCtaEntries(ctaClicks: Record<string, number>): [string, number][] {
  return Object.entries(ctaClicks).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
