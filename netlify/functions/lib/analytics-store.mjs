import { getStore } from '@netlify/blobs';

const STORE_NAME = 'wrapped-analytics';

function eventKey(id) {
  return `event:${id}`;
}

/**
 * @param {Omit<import('./analytics-report.mjs').StoredAnalyticsEvent, 'id'>} event
 */
export async function appendAnalyticsEvent(event) {
  const store = getStore(STORE_NAME);
  const id = crypto.randomUUID();
  const entry = { id, ...event };
  await store.setJSON(eventKey(id), entry);
  return entry;
}

export async function listAnalyticsEvents() {
  const store = getStore(STORE_NAME);
  const blobs = await store.list({ prefix: 'event:' });
  const events = await Promise.all(
    blobs.blobs.map(async (blob) => store.get(blob.key, { type: 'json' })),
  );
  return events.filter(Boolean);
}

/**
 * @param {Date} startInclusive
 * @param {Date} endExclusive
 */
export async function listAnalyticsEventsBetween(startInclusive, endExclusive) {
  const events = await listAnalyticsEvents();
  const startMs = startInclusive.getTime();
  const endMs = endExclusive.getTime();
  return events.filter((event) => {
    const ts = Date.parse(event.timestamp);
    return ts >= startMs && ts < endMs;
  });
}
