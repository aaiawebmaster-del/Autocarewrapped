import { listFeedbackEntriesBetween } from './lib/feedback-store.mjs';
import {
  buildFeedbackSummary,
  feedbackEntriesToCsv,
  previousEasternDayWindow,
  sendFeedbackReportEmail,
} from './lib/feedback-report.mjs';

const REPORT_TO = process.env.FEEDBACK_REPORT_TO ?? 'kyle.hardy@autocare.org';

function getCurrentEasternHour(referenceDate = new Date()) {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  })
    .formatToParts(referenceDate)
    .find((part) => part.type === 'hour')?.value;
  const hour = Number(hourPart);
  return hour === 24 ? 0 : hour;
}

export default async function handler() {
  if (getCurrentEasternHour() !== 0) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'not_midnight_et' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { start, end, label } = previousEasternDayWindow();
  const entries = await listFeedbackEntriesBetween(start, end);
  const summary = buildFeedbackSummary(entries);
  const csv = feedbackEntriesToCsv(entries);
  const csvFilename = `wrapped-feedback-${label.replace(/\s+/g, '-').toLowerCase()}.csv`;

  const text = [
    `Auto Care Wrapped daily feedback report`,
    `Date: ${label} (America/New_York)`,
    ``,
    `Total responses: ${summary.total}`,
    `Positive: ${summary.positive}`,
    `Negative: ${summary.negative}`,
    ``,
    entries.length > 0
      ? 'See attached CSV for the full spreadsheet of submissions.'
      : 'No feedback submissions were recorded for this period.',
  ].join('\n');

  const result = await sendFeedbackReportEmail({
    to: REPORT_TO,
    subject: `Auto Care Wrapped Feedback — ${label}`,
    text,
    csvFilename,
    csvContent: csv,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      emailed: result.sent,
      periodLabel: label,
      total: summary.total,
      positive: summary.positive,
      negative: summary.negative,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export const config = {
  schedule: '0 * * * *',
};
