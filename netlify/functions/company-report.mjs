import { getStoredReport } from './lib/report-store.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Cache-Control': 'no-store',
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
 * Public overlay lookup used by the Wrapped experience.
 * Returns a published admin override when present; otherwise 404 so the client
 * can fall back to the static build file.
 */
export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const url = new URL(request.url);
    const record =
      url.searchParams.get('record') ??
      url.searchParams.get('id') ??
      url.pathname.split('/').filter(Boolean).at(-1) ??
      '';
    const id = decodeURIComponent(String(record)).trim();
    if (!id || id === 'company-report') {
      return jsonResponse(400, { error: 'record query parameter is required' });
    }

    const report = await getStoredReport(id);
    if (!report) {
      return jsonResponse(404, { error: 'No published override for this company' });
    }

    return jsonResponse(200, report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load company report overlay';
    console.error('[company-report]', message, error);
    return jsonResponse(500, { error: message });
  }
}
