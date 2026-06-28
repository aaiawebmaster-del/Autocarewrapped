import { appendAnalyticsEvent } from './lib/analytics-store.mjs';
import { parseAnalyticsEventPayload } from './lib/analytics-report.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
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

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const parsed = parseAnalyticsEventPayload(payload);
  if ('error' in parsed) {
    return jsonResponse(400, { error: parsed.error });
  }

  const entry = await appendAnalyticsEvent(parsed.event);
  return jsonResponse(201, { ok: true, id: entry.id });
}
