import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStoredReport, listStoredReportIds, listStoredReports } from './report-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_REPORTS_DIR = path.resolve(__dirname, '../../../public/data/reports');

/**
 * @param {Request} request
 * @returns {string}
 */
function requestOrigin(request) {
  const envOrigin = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return '';
  }
}

/**
 * @param {string} raw
 * @returns {object | null}
 */
function parseJsonObject(raw) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('<')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function readLocalStaticReport(id) {
  try {
    const raw = await readFile(path.join(REPO_REPORTS_DIR, `${id}.json`), 'utf8');
    return parseJsonObject(raw);
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<Array<{ id: string; name: string; recordNumber?: number; pagePath?: string }>>}
 */
async function readLocalStaticIndex() {
  try {
    const raw = await readFile(path.join(REPO_REPORTS_DIR, 'index.json'), 'utf8');
    const parsed = parseJsonObject(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {Request} request
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function fetchStaticReport(request, id) {
  const local = await readLocalStaticReport(id);
  if (local) return local;

  const origin = requestOrigin(request);
  if (!origin) return null;

  try {
    const response = await fetch(`${origin}/data/reports/${encodeURIComponent(id)}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const raw = await response.text();
    return parseJsonObject(raw);
  } catch {
    return null;
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Array<{ id: string; name: string; recordNumber?: number; pagePath?: string }>>}
 */
export async function fetchStaticIndex(request) {
  const local = await readLocalStaticIndex();
  if (local.length > 0) return local;

  const origin = requestOrigin(request);
  if (!origin) return [];

  try {
    const response = await fetch(`${origin}/data/reports/index.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const raw = await response.text();
    const parsed = parseJsonObject(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Overlay (admin publish) wins over the static build file.
 * @param {Request} request
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getEffectiveReport(request, id) {
  const recordId = String(id ?? '').trim();
  if (!recordId) return null;

  const stored = await getStoredReport(recordId);
  if (stored) return stored;

  const staticReport = await fetchStaticReport(request, recordId);
  if (staticReport) return staticReport;

  return null;
}

/**
 * @param {Request} request
 * @returns {Promise<object[]>}
 */
export async function listEffectiveReports(request) {
  const [staticIndex, storedIds] = await Promise.all([
    fetchStaticIndex(request),
    listStoredReportIds(),
  ]);

  const ids = [
    ...new Set([
      ...staticIndex.map((entry) => String(entry.id ?? '').trim()).filter(Boolean),
      ...storedIds,
    ]),
  ].sort((a, b) => {
    const nameA =
      staticIndex.find((entry) => String(entry.id) === a)?.name ??
      a;
    const nameB =
      staticIndex.find((entry) => String(entry.id) === b)?.name ??
      b;
    return String(nameA).localeCompare(String(nameB));
  });

  const reports = await Promise.all(ids.map((id) => getEffectiveReport(request, id)));
  return reports.filter(Boolean);
}

/**
 * @returns {Promise<object[]>}
 */
export async function listOverlayReports() {
  return listStoredReports();
}
