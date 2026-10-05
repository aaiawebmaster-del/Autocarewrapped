import type { WrappedReport } from '@/types/wrappedReport';

type TenureJourneyFields = Pick<
  WrappedReport['journey'],
  'membershipSince' | 'membershipTenureYears' | 'membershipTenureMonths'
>;

export type MembershipTenureDisplay = {
  value: number;
  unit: 'years' | 'months';
  /** Counter label, singular when value is 1 (e.g. "1 month", "3 months"). */
  label: string;
};

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

/** Completed whole months from membership start date through `asOf`. */
export function membershipTenureTotalMonthsFromDate(
  since: string,
  asOf: Date = new Date(),
): number {
  const start = parseMembershipSinceDate(since);
  if (!start) return 0;

  let months =
    (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
  if (asOf.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

/** Completed whole years from membership start date through `asOf`. */
export function membershipTenureYearsFromDate(
  since: string,
  asOf: Date = new Date(),
): number {
  return Math.floor(membershipTenureTotalMonthsFromDate(since, asOf) / 12);
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

/**
 * Months as a member when tenure is under one year; `undefined` once tenure reaches a year.
 * Prefers `membershipSince`, then the stored `membershipTenureMonths`.
 */
export function resolveMembershipTenureMonths(
  journey: TenureJourneyFields,
  asOf: Date = new Date(),
): number | undefined {
  if (resolveMembershipTenureYears(journey, asOf) >= 1) return undefined;

  if (journey.membershipSince) {
    return membershipTenureTotalMonthsFromDate(journey.membershipSince, asOf);
  }
  if (journey.membershipTenureMonths == null) return undefined;

  const months = Math.floor(Number(journey.membershipTenureMonths));
  return Number.isFinite(months) ? Math.min(Math.max(months, 0), 11) : undefined;
}

/** Value + unit for the tenure counter: months under one year, years otherwise. */
export function resolveMembershipTenureDisplay(
  journey: TenureJourneyFields,
  asOf: Date = new Date(),
): MembershipTenureDisplay {
  const months = resolveMembershipTenureMonths(journey, asOf);
  if (months != null) {
    return { value: months, unit: 'months', label: months === 1 ? 'month' : 'months' };
  }
  const years = resolveMembershipTenureYears(journey, asOf);
  return { value: years, unit: 'years', label: years === 1 ? 'year' : 'years' };
}

/**
 * Sync `membershipTenureYears` / `membershipTenureMonths` with `membershipSince` (or the
 * stored counts) so downstream consumers see consistent values.
 */
export function withResolvedMembershipTenure(
  report: WrappedReport,
  asOf: Date = new Date(),
): WrappedReport {
  const years = resolveMembershipTenureYears(report.journey, asOf);
  const months = resolveMembershipTenureMonths(report.journey, asOf);
  if (
    years === report.journey.membershipTenureYears &&
    months === report.journey.membershipTenureMonths
  ) {
    return report;
  }

  const { membershipTenureMonths: _previousMonths, ...journey } = report.journey;
  return {
    ...report,
    journey: {
      ...journey,
      membershipTenureYears: years,
      ...(months != null ? { membershipTenureMonths: months } : {}),
    },
  };
}
