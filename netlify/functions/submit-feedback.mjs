import { appendFeedbackEntry, updateFeedbackEntry } from './lib/feedback-store.mjs';
import { sendFeedbackSubmissionEmail } from './lib/feedback-report.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const MAX_COMMENT_LENGTH = 2000;

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

async function handleRatingSubmit(payload) {
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

  try {
    await sendFeedbackSubmissionEmail(entry);
  } catch (error) {
    console.error('[submit-feedback] Failed to send notification email:', error);
  }

  return jsonResponse(201, { ok: true, id: entry.id });
}

async function handleCommentUpdate(payload) {
  const id = String(payload?.id ?? '').trim();
  const comment = String(payload?.comment ?? '').trim();

  if (!id) {
    return jsonResponse(400, { error: 'id is required' });
  }

  if (!comment) {
    return jsonResponse(400, { error: 'comment is required' });
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return jsonResponse(400, { error: `comment must be ${MAX_COMMENT_LENGTH} characters or fewer` });
  }

  const entry = await updateFeedbackEntry(id, {
    comment,
    commentSubmittedAt: new Date().toISOString(),
  });

  if (!entry) {
    return jsonResponse(404, { error: 'Feedback submission not found' });
  }

  try {
    await sendFeedbackSubmissionEmail(entry, { includeComment: true });
  } catch (error) {
    console.error('[submit-feedback] Failed to send comment notification email:', error);
  }

  return jsonResponse(200, { ok: true, id: entry.id });
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (request.method === 'POST') {
    return handleRatingSubmit(payload);
  }

  if (request.method === 'PATCH') {
    return handleCommentUpdate(payload);
  }

  return jsonResponse(405, { error: 'Method not allowed' });
}
