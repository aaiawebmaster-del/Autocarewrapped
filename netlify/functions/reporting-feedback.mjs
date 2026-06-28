import { listFeedbackEntries } from './lib/feedback-store.mjs';
import { buildFeedbackSummary } from './lib/feedback-report.mjs';
import { listAnalyticsEvents } from './lib/analytics-store.mjs';
import { buildUsageReport, filterAnalyticsEventsByDateRange } from './lib/analytics-report.mjs';
import { isReportingPasswordValid } from './lib/reporting-auth.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Reporting-Password',
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (!isReportingPasswordValid(request)) {
    return jsonResponse(401, { error: 'Invalid reporting password' });
  }

  const url = new URL(request.url);
  const fromDate = url.searchParams.get('fromDate') ?? '';
  const toDate = url.searchParams.get('toDate') ?? '';

  const entries = await listFeedbackEntries();
  entries.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));

  const analyticsEvents = await listAnalyticsEvents();
  const filteredAnalytics = filterAnalyticsEventsByDateRange(analyticsEvents, fromDate, toDate);

  return jsonResponse(200, {
    entries,
    summary: buildFeedbackSummary(entries),
    usage: buildUsageReport(filteredAnalytics),
  });
}
