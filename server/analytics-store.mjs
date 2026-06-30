import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const STORE_PATH = path.resolve(process.cwd(), 'data/analytics/events.json');

/**
 * @typedef {import('../../src/types/analytics.ts').StoredAnalyticsEvent} StoredAnalyticsEvent
 */

/** Serialize read-modify-write to avoid interleaved writes corrupting events.json. */
let storeMutation = Promise.resolve();

function runSerialized(task) {
  const next = storeMutation.then(task, task);
  storeMutation = next.catch(() => {});
  return next;
}

function parseEventsJson(raw) {
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function salvageCorruptEventsFile(raw) {
  const trimmed = raw.trimEnd();
  const withoutTrailingBracket = trimmed.replace(/\]\s*\]\s*$/, ']');
  if (withoutTrailingBracket !== trimmed) {
    return parseEventsJson(withoutTrailingBracket);
  }
  return null;
}

async function readEvents() {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return parseEventsJson(raw);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    if (error instanceof SyntaxError) {
      const raw = await readFile(STORE_PATH, 'utf8');
      const salvaged = await salvageCorruptEventsFile(raw);
      if (salvaged) {
        await writeEvents(salvaged);
        return salvaged;
      }
    }

    throw error;
  }
}

async function writeEvents(events) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  const content = `${JSON.stringify(events, null, 2)}\n`;
  const tempPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, content, 'utf8');
  await rename(tempPath, STORE_PATH);
}

/**
 * @param {Omit<StoredAnalyticsEvent, 'id'>} event
 */
export async function appendAnalyticsEvent(event) {
  return runSerialized(async () => {
    const events = await readEvents();
    const entry = {
      id: randomUUID(),
      ...event,
    };
    events.push(entry);
    await writeEvents(events);
    return entry;
  });
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
