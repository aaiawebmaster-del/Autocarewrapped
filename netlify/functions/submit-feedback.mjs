import { appendFeedbackEntry } from './lib/feedback-store.mjs';

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

function isValidRating(value) {
  return value === 'positive' || value === 'negative';
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

  const companyId = String(payload?.companyId ?? '').trim();
  const companyName = String(payload?.companyName ?? '').trim();
  const rating = payload?.rating;

  if (!companyId || !companyName || !isValidRating(rating)) {
    return jsonResponse(400, { error: 'companyId, companyName, and rating are required' });
  }

  const recordNumber =
    payload?.recordNumber === undefined || payload?.recordNumber === null
      ? undefined
      : Number(payload.recordNumber);
  const reportYear =
    payload?.reportYear === undefined || payload?.reportYear === null
      ? undefined
      : Number(payload.reportYear);

  if (recordNumber !== undefined && Number.isNaN(recordNumber)) {
    return jsonResponse(400, { error: 'recordNumber must be a number' });
  }

  if (reportYear !== undefined && Number.isNaN(reportYear)) {
    return jsonResponse(400, { error: 'reportYear must be a number' });
  }

  const entry = await appendFeedbackEntry({
    companyId,
    companyName,
    rating,
    recordNumber,
    reportYear,
  });

  return jsonResponse(201, { ok: true, id: entry.id });
}
