import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStoredReport, listStoredReportIds, listStoredReports } from './report-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Candidate locations for bundled/static report JSON (local + Netlify included_files). */
const REPORT_DIR_CANDIDATES = [
  path.resolve(__dirname, '../../../public/data/reports'),
  path.resolve(__dirname, '../../../dist/data/reports'),
  path.resolve(process.cwd(), 'public/data/reports'),
  path.resolve(process.cwd(), 'dist/data/reports'),
  path.resolve(process.cwd(), 'data/reports'),
];

/**
 * @param {Request} request
 * @returns {string}
 */
function requestOrigin(request) {
  const envOrigin = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL;
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
 * @param {string} fileName
 * @returns {Promise<object | null>}
 */
async function readLocalJsonFile(fileName) {
  for (const dir of REPORT_DIR_CANDIDATES) {
    try {
      const raw = await readFile(path.join(dir, fileName), 'utf8');
      const parsed = parseJsonObject(raw);
      if (parsed) return parsed;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * @returns {Promise<string[]>}
 */
async function listLocalReportIds() {
  for (const dir of REPORT_DIR_CANDIDATES) {
    try {
      const files = await readdir(dir);
      const ids = files
        .filter((name) => name.endsWith('.json') && name !== 'index.json')
        .map((name) => name.replace(/\.json$/, ''))
        .filter(Boolean);
      if (ids.length > 0) return ids.sort();
    } catch {
      // try next candidate
    }
  }
  return [];
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function readLocalStaticReport(id) {
  return readLocalJsonFile(`${id}.json`);
}

/**
 * @returns {Promise<Array<{ id: string; name: string; recordNumber?: number; pagePath?: string }>>}
 */
async function readLocalStaticIndex() {
  const parsed = await readLocalJsonFile('index.json');
  return Array.isArray(parsed) ? parsed : [];
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
  const [staticIndex, storedIds, localIds] = await Promise.all([
    fetchStaticIndex(request),
    listStoredReportIds(),
    listLocalReportIds(),
  ]);

  const ids = [
    ...new Set([
      ...staticIndex.map((entry) => String(entry.id ?? '').trim()).filter(Boolean),
      ...localIds,
      ...storedIds,
    ]),
  ].sort((a, b) => {
    const nameA = staticIndex.find((entry) => String(entry.id) === a)?.name ?? a;
    const nameB = staticIndex.find((entry) => String(entry.id) === b)?.name ?? b;
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
