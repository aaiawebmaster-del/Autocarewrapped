import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const STORE_PATH = path.resolve(process.cwd(), 'data/analytics/events.json');

/**
 * @typedef {import('../../src/types/analytics.ts').StoredAnalyticsEvent} StoredAnalyticsEvent
 */

async function readEvents() {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeEvents(events) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(events, null, 2)}\n`, 'utf8');
}

/**
 * @param {Omit<StoredAnalyticsEvent, 'id'>} event
 */
export async function appendAnalyticsEvent(event) {
  const events = await readEvents();
  const entry = {
    id: randomUUID(),
    ...event,
  };
  events.push(entry);
  await writeEvents(events);
  return entry;
}

export async function listAnalyticsEvents() {
  return readEvents();
}

/**
 * @param {Date} startInclusive
 * @param {Date} endExclusive
 */
export async function listAnalyticsEventsBetween(startInclusive, endExclusive) {
  const events = await readEvents();
  const startMs = startInclusive.getTime();
  const endMs = endExclusive.getTime();
  return events.filter((event) => {
    const ts = Date.parse(event.timestamp);
    return ts >= startMs && ts < endMs;
  });
}
