import type { WrappedReport } from '@/types/wrappedReport';

type TenureJourneyFields = Pick<
  WrappedReport['journey'],
  'membershipSince' | 'membershipTenureYears'
>;

/** Parse membership start dates as local calendar dates (avoids UTC day-shift). */
export function parseMembershipSinceDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  return null;
}

/** Completed whole years from membership start date through `asOf`. */
export function membershipTenureYearsFromDate(
  since: string,
  asOf: Date = new Date(),
): number {
  const start = parseMembershipSinceDate(since);
  if (!start) return 0;

  let years = asOf.getFullYear() - start.getFullYear();
  const month = asOf.getMonth();
  const day = asOf.getDate();
  if (month < start.getMonth() || (month === start.getMonth() && day < start.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

/**
 * Prefer `membershipSince` when present; otherwise fall back to the stored year count.
 */
export function resolveMembershipTenureYears(
  journey: TenureJourneyFields,
  asOf: Date = new Date(),
): number {
  if (journey.membershipSince) {
    return membershipTenureYearsFromDate(journey.membershipSince, asOf);
  }
  return Math.max(0, Number(journey.membershipTenureYears ?? 0));
}

/** Ensure `membershipTenureYears` matches `membershipSince` when a start date is provided. */
export function withResolvedMembershipTenure(
  report: WrappedReport,
  asOf: Date = new Date(),
): WrappedReport {
  const years = resolveMembershipTenureYears(report.journey, asOf);
  if (years === report.journey.membershipTenureYears) return report;
  return {
    ...report,
    journey: {
      ...report.journey,
      membershipTenureYears: years,
    },
  };
}
