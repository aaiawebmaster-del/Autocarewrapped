import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const STORE_PATH = path.resolve(process.cwd(), 'data/feedback/submissions.json');

/**
 * @typedef {'positive' | 'negative'} FeedbackRating
 * @typedef {{
 *   id: string;
 *   submittedAt: string;
 *   companyId: string;
 *   companyName: string;
 *   recordNumber?: number;
 *   reportYear?: number;
 *   rating: FeedbackRating;
 *   comment?: string;
 *   commentSubmittedAt?: string;
 * }} StoredFeedbackEntry
 */

async function readEntries() {
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

async function writeEntries(entries) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

/**
 * @param {Omit<StoredFeedbackEntry, 'id' | 'submittedAt'>} submission
 */
export async function appendFeedbackEntry(submission) {
  const entries = await readEntries();
  const entry = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    ...submission,
  };
  entries.push(entry);
  await writeEntries(entries);
  return entry;
}

export async function listFeedbackEntries() {
  return readEntries();
}

/**
 * @param {Date} startInclusive
 * @param {Date} endExclusive
 */
export async function listFeedbackEntriesBetween(startInclusive, endExclusive) {
  const entries = await readEntries();
  const startMs = startInclusive.getTime();
  const endMs = endExclusive.getTime();
  return entries.filter((entry) => {
    const submittedMs = Date.parse(entry.submittedAt);
    return submittedMs >= startMs && submittedMs < endMs;
  });
}

/**
 * @param {string} id
 * @param {Partial<StoredFeedbackEntry>} patch
 */
export async function updateFeedbackEntry(id, patch) {
  const entries = await readEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = { ...entries[index], ...patch };
  await writeEntries(entries);
  return entries[index];
}
