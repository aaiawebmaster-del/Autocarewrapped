import type { FeedbackReportSummary, StoredFeedbackEntry } from '@/types/feedback';

export function buildFeedbackSummary(entries: StoredFeedbackEntry[]): FeedbackReportSummary {
  const positive = entries.filter((entry) => entry.rating === 'positive').length;
  const negative = entries.filter((entry) => entry.rating === 'negative').length;
  return { total: entries.length, positive, negative };
}

function dayStartMs(dateValue: string): number {
  return new Date(`${dateValue}T00:00:00`).getTime();
}

function dayEndMs(dateValue: string): number {
  return new Date(`${dateValue}T23:59:59.999`).getTime();
}

export function filterFeedbackEntriesByDateRange(
  entries: StoredFeedbackEntry[],
  fromDate: string,
  toDate: string,
): StoredFeedbackEntry[] {
  if (!fromDate && !toDate) return entries;

  return entries.filter((entry) => {
    const submittedMs = Date.parse(entry.submittedAt);
    if (Number.isNaN(submittedMs)) return false;
    if (fromDate && submittedMs < dayStartMs(fromDate)) return false;
    if (toDate && submittedMs > dayEndMs(toDate)) return false;
    return true;
  });
}

export function entriesWithWrittenFeedback(entries: StoredFeedbackEntry[]): StoredFeedbackEntry[] {
  return entries.filter((entry) => Boolean(entry.comment?.trim()));
}
