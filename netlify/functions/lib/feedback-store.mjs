import { getStore } from '@netlify/blobs';

const STORE_NAME = 'wrapped-feedback';

function entryKey(id) {
  return `entry:${id}`;
}

/**
 * @param {Omit<import('./feedback-report.mjs').StoredFeedbackEntry, 'id' | 'submittedAt'>} submission
 */
export async function appendFeedbackEntry(submission) {
  const store = getStore(STORE_NAME);
  const id = crypto.randomUUID();
  const entry = {
    id,
    submittedAt: new Date().toISOString(),
    ...submission,
  };
  await store.setJSON(entryKey(id), entry);
  return entry;
}

export async function listFeedbackEntries() {
  const store = getStore(STORE_NAME);
  const blobs = await store.list({ prefix: 'entry:' });
  const entries = await Promise.all(
    blobs.blobs.map(async (blob) => store.get(blob.key, { type: 'json' })),
  );
  return entries.filter(Boolean);
}

/**
 * @param {Date} startInclusive
 * @param {Date} endExclusive
 */
export async function listFeedbackEntriesBetween(startInclusive, endExclusive) {
  const entries = await listFeedbackEntries();
  const startMs = startInclusive.getTime();
  const endMs = endExclusive.getTime();
  return entries.filter((entry) => {
    const submittedMs = Date.parse(entry.submittedAt);
    return submittedMs >= startMs && submittedMs < endMs;
  });
}

/**
 * @param {string} id
 * @param {Partial<import('./feedback-report.mjs').StoredFeedbackEntry>} patch
 */
export async function updateFeedbackEntry(id, patch) {
  const store = getStore(STORE_NAME);
  const key = entryKey(id);
  const existing = await store.get(key, { type: 'json' });
  if (!existing) return null;

  const updated = { ...existing, ...patch };
  await store.setJSON(key, updated);
  return updated;
}
