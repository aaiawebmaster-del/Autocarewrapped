import { getEffectiveReport, listEffectiveReports } from './lib/report-resolve.mjs';
import { setStoredReport } from './lib/report-store.mjs';
import {
  normalizeWrappedReport,
  recomputeDerivedFields,
  setByPath,
  validateWrappedReport,
} from './lib/report-validate.mjs';
import { isReportingPasswordValid } from './lib/reporting-auth.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, PATCH, OPTIONS',
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

/**
 * @param {string} pathname
 * @param {URLSearchParams} searchParams
 * @returns {string | null}
 */
function extractReportId(pathname, searchParams) {
  const fromQuery = searchParams.get('id');
  if (fromQuery) return decodeURIComponent(fromQuery);

  const match = pathname.match(/\/api\/wrapped\/reporting\/reports\/([^/]+)\/?$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

/**
 * @param {Request} request
 * @returns {Promise<unknown>}
 */
async function readJsonBody(request) {
  const raw = await request.text();
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!isReportingPasswordValid(request)) {
    return jsonResponse(401, { error: 'Invalid reporting password' });
  }

  const url = new URL(request.url);
  const reportId = extractReportId(url.pathname, url.searchParams);

  try {
    if (request.method === 'GET' && !reportId) {
      const reports = await listEffectiveReports(request);
      return jsonResponse(200, {
        reports,
        count: reports.length,
      });
    }

    if (request.method === 'GET' && reportId) {
      const report = await getEffectiveReport(request, reportId);
      if (!report) return jsonResponse(404, { error: 'Report not found' });
      return jsonResponse(200, { report, source: 'effective' });
    }

    if (request.method === 'POST' && !reportId) {
      const payload = await readJsonBody(request);
      const validationError = validateWrappedReport(payload);
      if (validationError) return jsonResponse(400, { error: validationError });

      const report = recomputeDerivedFields(normalizeWrappedReport(payload));
      await setStoredReport(report);
      return jsonResponse(200, {
        report,
        created: true,
        message: `Published report for ${report.company.name} (${report.company.id})`,
      });
    }

    if ((request.method === 'PUT' || request.method === 'POST') && reportId) {
      const payload = await readJsonBody(request);
      const validationError = validateWrappedReport(payload);
      if (validationError) return jsonResponse(400, { error: validationError });

      const report = recomputeDerivedFields(normalizeWrappedReport(payload));
      if (String(report.company.id) !== String(reportId)) {
        return jsonResponse(400, {
          error: `company.id (${report.company.id}) must match URL id (${reportId})`,
        });
      }

      await setStoredReport(report);
      return jsonResponse(200, {
        report,
        message: `Published report for ${report.company.name} (${report.company.id})`,
      });
    }

    if (request.method === 'PATCH' && reportId) {
      const payload = (await readJsonBody(request)) ?? {};
      const path = String(payload.path ?? '').trim();
      if (!path) return jsonResponse(400, { error: 'path is required' });
      if (path === 'company.id') {
        return jsonResponse(400, { error: 'company.id cannot be changed via field edit' });
      }

      const existing = await getEffectiveReport(request, reportId);
      if (!existing) return jsonResponse(404, { error: 'Report not found' });

      const patched = recomputeDerivedFields(setByPath(existing, path, payload.value));
      const validationError = validateWrappedReport(patched);
      if (validationError) return jsonResponse(400, { error: validationError });

      const report = normalizeWrappedReport(patched);
      if (String(report.company.id) !== String(reportId)) {
        return jsonResponse(400, { error: 'company.id cannot be changed via field edit' });
      }

      await setStoredReport(report);
      return jsonResponse(200, {
        report,
        path,
        message: `Updated ${path} for ${report.company.name}`,
      });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process report request';
    return jsonResponse(500, { error: message });
  }
}
