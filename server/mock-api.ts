import type { IncomingMessage, ServerResponse } from 'node:http';
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
