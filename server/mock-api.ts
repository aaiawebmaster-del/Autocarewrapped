import type { IncomingMessage, ServerResponse } from 'node:http';
import { appendFeedbackEntry, listFeedbackEntries, updateFeedbackEntry } from './feedback-store.mjs';
import { buildFeedbackSummary } from '../netlify/functions/lib/feedback-report.mjs';
import { isReportingPasswordValid } from '../netlify/functions/lib/reporting-auth.mjs';
import { getSampleReport } from '../src/mocks/sampleReports.ts';
import type { WrappedReportScenario } from '../src/types/wrappedReport.ts';

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseScenario(url: string): WrappedReportScenario {
  const parsed = new URL(url, 'http://localhost');
  const scenario = parsed.searchParams.get('scenario');
  if (scenario === 'zero-events' || scenario === 'high-engagement' || scenario === 'default') {
    return scenario;
  }
  return 'default';
}

function isAuthenticated(req: IncomingMessage): boolean {
  const cookie = req.headers.cookie ?? '';
  return cookie.includes('wrapped_session=1') || cookie.includes('mock_auth=1');
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function isFeedbackRating(value: unknown): value is 'positive' | 'negative' {
  return value === 'positive' || value === 'negative';
}

/**
 * Reference mock handler for GET /api/wrapped/report and /api/wrapped/health.
 * Wire this into the Auto Care API service with real Impexium + Snowflake logic.
 */
export function handleMockWrappedApi(req: IncomingMessage, res: ServerResponse): boolean {
  const url = req.url ?? '/';
  const pathname = url.split('?')[0];

  if (req.method === 'GET' && pathname === '/api/wrapped/health') {
    sendJson(res, 200, { status: 'ok' });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/wrapped/feedback') {
    void handleFeedbackSubmit(req, res);
    return true;
  }

  if (req.method === 'PATCH' && pathname === '/api/wrapped/feedback') {
    void handleFeedbackComment(req, res);
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/wrapped/reporting/feedback') {
    if (!isReportingPasswordValid(req)) {
      sendJson(res, 401, { error: 'Invalid reporting password' });
      return true;
    }

    void handleReportingFeedback(res);
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/wrapped/report') {
    if (!isAuthenticated(req)) {
      sendJson(res, 401, { error: 'Authentication required' });
      return true;
    }

    const scenario = parseScenario(url);
    const report = getSampleReport(scenario);
    sendJson(res, 200, report);
    return true;
  }

  return false;
}

async function handleFeedbackSubmit(req: IncomingMessage, res: ServerResponse) {
  try {
    const payload = (await readJsonBody(req)) as Record<string, unknown>;
    const companyId = String(payload.companyId ?? '').trim();
    const companyName = String(payload.companyName ?? '').trim();
    const rating = payload.rating;

    if (!companyId || !companyName || !isFeedbackRating(rating)) {
      sendJson(res, 400, { error: 'companyId, companyName, and rating are required' });
      return;
    }

    const recordNumber =
      payload.recordNumber === undefined || payload.recordNumber === null
        ? undefined
        : Number(payload.recordNumber);
    const reportYear =
      payload.reportYear === undefined || payload.reportYear === null
        ? undefined
        : Number(payload.reportYear);

    const entry = await appendFeedbackEntry({
      companyId,
      companyName,
      rating,
      recordNumber: recordNumber !== undefined && !Number.isNaN(recordNumber) ? recordNumber : undefined,
      reportYear: reportYear !== undefined && !Number.isNaN(reportYear) ? reportYear : undefined,
    });

    sendJson(res, 201, { ok: true, id: entry.id });
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
  }
}

const MAX_COMMENT_LENGTH = 2000;

async function handleFeedbackComment(req: IncomingMessage, res: ServerResponse) {
  try {
    const payload = (await readJsonBody(req)) as Record<string, unknown>;
    const id = String(payload.id ?? '').trim();
    const comment = String(payload.comment ?? '').trim();

    if (!id) {
      sendJson(res, 400, { error: 'id is required' });
      return;
    }

    if (!comment) {
      sendJson(res, 400, { error: 'comment is required' });
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      sendJson(res, 400, { error: `comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
      return;
    }

    const entry = await updateFeedbackEntry(id, {
      comment,
      commentSubmittedAt: new Date().toISOString(),
    });

    if (!entry) {
      sendJson(res, 404, { error: 'Feedback submission not found' });
      return;
    }

    sendJson(res, 200, { ok: true, id: entry.id });
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
  }
}

async function handleReportingFeedback(res: ServerResponse) {
  try {
    const entries = await listFeedbackEntries();
    entries.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
    sendJson(res, 200, {
      entries,
      summary: buildFeedbackSummary(entries),
    });
  } catch {
    sendJson(res, 500, { error: 'Unable to load feedback report' });
  }
}
