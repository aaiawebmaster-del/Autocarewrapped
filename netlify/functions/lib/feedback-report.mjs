/**
 * @typedef {'positive' | 'negative'} FeedbackRating
 * @typedef {{
 *   id: string;
 *   submittedAt: string;
 *   companyId: string;
 *   companyName: string;
 *   recordNumber?: number;
 *   reportYear?: number;
 *   rating: FeedbackRating;
 *   comment?: string;
 *   commentSubmittedAt?: string;
 * }} StoredFeedbackEntry
 */

/**
 * @param {StoredFeedbackEntry[]} entries
 */
export function feedbackEntriesToCsv(entries) {
  const header = [
    'Date',
    'Company Name',
    'Rating',
    'Written Feedback',
    'Company ID',
    'Record Number',
    'Report Year',
  ];
  const rows = entries.map((entry) => {
    const date = formatReportDate(entry.submittedAt);
    const rating = entry.rating === 'positive' ? 'Positive' : 'Negative';
    return [
      date,
      entry.companyName,
      rating,
      entry.comment ?? '',
      entry.companyId,
      entry.recordNumber ?? '',
      entry.reportYear ?? '',
    ];
  });

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

/**
 * @param {StoredFeedbackEntry[]} entries
 */
export function buildFeedbackSummary(entries) {
  const positive = entries.filter((entry) => entry.rating === 'positive').length;
  const negative = entries.filter((entry) => entry.rating === 'negative').length;
  return { total: entries.length, positive, negative };
}

function formatReportDate(iso) {
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

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Midnight-to-midnight window for the previous calendar day in America/New_York.
 */
export function previousEasternDayWindow(referenceDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(referenceDate);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  const end = easternWallTimeToUtc(year, month, day, 0, 0);
  const previous = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const previousParts = formatter.formatToParts(previous);
  const start = easternWallTimeToUtc(
    Number(previousParts.find((part) => part.type === 'year')?.value),
    Number(previousParts.find((part) => part.type === 'month')?.value),
    Number(previousParts.find((part) => part.type === 'day')?.value),
    0,
    0,
  );

  const labelFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    start,
    end,
    label: labelFormatter.format(start),
  };
}

function easternWallTimeToUtc(year, month, day, hour, minute) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour + 5, minute));
  const offsetMinutes = getEasternOffsetMinutes(guess);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) + offsetMinutes * 60 * 1000);
}

function getEasternOffsetMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-5';
  const match = offset.match(/GMT([+-])(\d+)(?::?(\d+))?/);
  if (!match) return 300;
  const sign = match[1] === '-' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

/**
 * @param {StoredFeedbackEntry} entry
 */
export function formatFeedbackEntryForEmail(entry) {
  const rating =
    entry.rating === 'positive' ? 'Positive (thumbs up)' : 'Negative (thumbs down)';
  const lines = [
    'New Auto Care Wrapped feedback submission',
    '',
    `Date: ${formatReportDate(entry.submittedAt)} (America/New_York)`,
    `Company: ${entry.companyName}`,
    `Rating: ${rating}`,
    `Company ID: ${entry.companyId}`,
  ];

  if (entry.recordNumber != null) {
    lines.push(`Record Number: ${entry.recordNumber}`);
  }

  if (entry.reportYear != null) {
    lines.push(`Report Year: ${entry.reportYear}`);
  }

  if (entry.comment) {
    lines.push('');
    lines.push('Written feedback:');
    lines.push(entry.comment);
    if (entry.commentSubmittedAt) {
      lines.push(`Comment submitted: ${formatReportDate(entry.commentSubmittedAt)} (America/New_York)`);
    }
  }

  lines.push(`Submission ID: ${entry.id}`);
  return lines.join('\n');
}

/**
 * @param {StoredFeedbackEntry} entry
 * @param {{ includeComment?: boolean }} [options]
 */
export async function sendFeedbackSubmissionEmail(entry, options = {}) {
  const ratingLabel = entry.rating === 'positive' ? 'Positive' : 'Negative';
  const subjectSuffix = options.includeComment && entry.comment ? ' — with comment' : '';
  return sendResendEmail({
    to: process.env.FEEDBACK_REPORT_TO ?? 'kyle.hardy@autocare.org',
    subject: `Auto Care Wrapped Feedback — ${ratingLabel} — ${entry.companyName}${subjectSuffix}`,
    text: formatFeedbackEntryForEmail(entry),
  });
}

/**
 * @param {{
 *   to: string;
 *   subject: string;
 *   text: string;
 *   csvFilename?: string;
 *   csvContent?: string;
 * }} params
 */
async function sendResendEmail(params) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_REPORT_FROM ?? 'Auto Care Wrapped <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('[feedback-email] RESEND_API_KEY is not set; skipping email send.');
    return { sent: false, reason: 'missing_api_key' };
  }

  /** @type {{ filename: string; content: string }[]} */
  const attachments = [];
  if (params.csvFilename && params.csvContent) {
    attachments.push({
      filename: params.csvFilename,
      content: Buffer.from(params.csvContent, 'utf8').toString('base64'),
    });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      ...(attachments.length > 0 ? { attachments } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return { sent: true };
}

/**
 * @param {{
 *   to: string;
 *   subject: string;
 *   text: string;
 *   csvFilename: string;
 *   csvContent: string;
 * }} params
 */
export async function sendFeedbackReportEmail(params) {
  return sendResendEmail(params);
}
