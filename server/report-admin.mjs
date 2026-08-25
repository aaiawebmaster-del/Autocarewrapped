import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getStoredReport, listStoredReportIds, setStoredReport } from './report-store.mjs';
import {
  normalizeWrappedReport,
  parseEngagementUpload,
  recomputeDerivedFields,
  setByPath,
  validateWrappedReport,
} from '../netlify/functions/lib/report-validate.mjs';

const STATIC_REPORTS_DIR = path.resolve(process.cwd(), 'public/data/reports');

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
 */
async function fetchStaticReport(id) {
  try {
    const raw = await readFile(path.join(STATIC_REPORTS_DIR, `${id}.json`), 'utf8');
    return parseJsonObject(raw);
  } catch {
    return null;
  }
}

async function fetchStaticIndex() {
  try {
    const raw = await readFile(path.join(STATIC_REPORTS_DIR, 'index.json'), 'utf8');
    const parsed = parseJsonObject(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} id
 */
export async function getEffectiveReport(id) {
  const recordId = String(id ?? '').trim();
  if (!recordId) return null;
  const stored = await getStoredReport(recordId);
  if (stored) return stored;
  return fetchStaticReport(recordId);
}

export async function listEffectiveReports() {
  const [staticIndex, storedIds] = await Promise.all([fetchStaticIndex(), listStoredReportIds()]);
  const ids = [
    ...new Set([
      ...staticIndex.map((entry) => String(entry.id ?? '').trim()).filter(Boolean),
      ...storedIds,
    ]),
  ].sort((a, b) => {
    const nameA = staticIndex.find((entry) => String(entry.id) === a)?.name ?? a;
    const nameB = staticIndex.find((entry) => String(entry.id) === b)?.name ?? b;
    return String(nameA).localeCompare(String(nameB));
  });

  const reports = await Promise.all(ids.map((id) => getEffectiveReport(id)));
  return reports.filter(Boolean);
}

/**
 * @param {unknown} payload
 * @returns {Promise<object[]>}
 */
export async function publishReports(payload) {
  const parsed = parseEngagementUpload(payload);
  if (parsed.error) {
    const error = new Error(parsed.error);
    error.status = 400;
    throw error;
  }

  const published = [];
  for (let index = 0; index < parsed.reports.length; index += 1) {
    const candidate = parsed.reports[index];
    const validationError = validateWrappedReport(candidate);
    if (validationError) {
      const error = new Error(`Report ${index + 1}: ${validationError}`);
      error.status = 400;
      throw error;
    }
    const report = recomputeDerivedFields(normalizeWrappedReport(candidate));
    await setStoredReport(report);
    published.push(report);
  }
  return published;
}

/**
 * @param {unknown} payload
 */
export async function publishReport(payload) {
  const published = await publishReports(payload);
  return published[0];
}

/**
 * @param {string} id
 * @param {string} fieldPath
 * @param {unknown} value
 * @param {object} [baseReport]
 */
export async function patchReportField(id, fieldPath, value, baseReport) {
  const path = String(fieldPath ?? '').trim();
  if (!path) {
    const error = new Error('path is required');
    error.status = 400;
    throw error;
  }
  if (path === 'company.id') {
    const error = new Error('company.id cannot be changed via field edit');
    error.status = 400;
    throw error;
  }

  const existing = (await getStoredReport(id)) ?? baseReport ?? null;
  if (!existing) {
    const error = new Error(
      'Report not found. Refresh the ADMIN list and try again, or upload a full JSON report first.',
    );
    error.status = 404;
    throw error;
  }

  const patched = recomputeDerivedFields(setByPath(existing, path, value));
  const validationError = validateWrappedReport(patched);
  if (validationError) {
    const error = new Error(validationError);
    error.status = 400;
    throw error;
  }

  const report = normalizeWrappedReport(patched);
  if (String(report.company.id) !== String(id)) {
    const error = new Error('company.id cannot be changed via field edit');
    error.status = 400;
    throw error;
  }

  await setStoredReport(report);
  return report;
}

export { getStoredReport };
