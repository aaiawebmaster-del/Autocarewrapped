/**
 * Standalone reference API for staging / integration testing.
 * Production: replace auth + data with Impexium SSO + Snowflake Snowpark query.
 *
 * Usage: node server/reference-api.mjs
 * Set cookie: mock_auth=1 then GET http://localhost:8787/api/wrapped/report
 */
import { createServer } from 'node:http';

const daycoReport = {
  reportYear: 2026,
  company: { id: 'dayco-inc', name: 'Dayco Incorporated' },
  journey: {
    membershipTenureYears: 56,
    activeContacts: 87,
    communityMembers: 88,
    committeeMembers: 1,
  },
  events: {
    inPersonAttended: 2,
    inPersonTotal: 8,
    attendancePct: 25,
    webinarHours: 38,
  },
  products: {
    trendLensUsers: 7,
    trendLensContactPct: 8,
    demandIndexGroups: 8,
    demandIndexGroupsTotal: 200,
    factbookUsers: 4,
    factbookContactPct: 5,
    academyUsers: 2,
    academyCoursesCompleted: 2,
  },
  standards: { subscribedPct: 40, missingProducts: ['IPO', 'ISHOP', 'Super Spec'] },
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function isAuthenticated(req) {
  return (req.headers.cookie ?? '').includes('mock_auth=1');
}

const port = Number(process.env.WRAPPED_API_PORT ?? 8787);

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.WRAPPED_CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = (req.url ?? '/').split('?')[0];

  if (req.method === 'GET' && pathname === '/api/wrapped/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/wrapped/report') {
    if (!isAuthenticated(req)) {
      sendJson(res, 401, { error: 'Authentication required' });
      return;
    }
    sendJson(res, 200, daycoReport);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}).listen(port, () => {
  console.log(`Reference Wrapped API: http://localhost:${port}`);
});
