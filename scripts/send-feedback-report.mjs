#!/usr/bin/env node
import { listFeedbackEntriesBetween } from '../server/feedback-store.mjs';
import {
  buildFeedbackSummary,
  feedbackEntriesToCsv,
  previousEasternDayWindow,
  sendFeedbackReportEmail,
} from '../netlify/functions/lib/feedback-report.mjs';

const reportTo = process.env.FEEDBACK_REPORT_TO ?? 'kyle.hardy@autocare.org';
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
  to: reportTo,
  subject: `Auto Care Wrapped Feedback — ${label}`,
  text,
  csvFilename,
  csvContent: csv,
});

console.log(
  JSON.stringify(
    {
      ok: true,
      emailed: result.sent,
      periodLabel: label,
      total: summary.total,
      positive: summary.positive,
      negative: summary.negative,
      csvPreview: csv.split('\n').slice(0, 5).join('\n'),
    },
    null,
    2,
  ),
);
