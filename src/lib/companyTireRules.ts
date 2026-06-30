import type { WrappedReport } from '@/types/wrappedReport';

export type CompanyMarketSegment = 'retailer';

/** Impexium record numbers tagged as retailer in source data / automations. */
const RETAILER_RECORD_NUMBERS = new Set<number>([1386304]);

export function isRetailerCompany(report: WrappedReport): boolean {
  if (report.company.marketSegment === 'retailer') return true;
  const recordNumber = report.company.recordNumber ?? Number(report.company.id);
  return Number.isFinite(recordNumber) && RETAILER_RECORD_NUMBERS.has(recordNumber);
}

/** Retailers skip DemandIndex in Kick the Tires and Full Diagnostics. */
export function shouldSkipDemandIndexPhase(report: WrappedReport): boolean {
  return isRetailerCompany(report);
}
