import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const STORE_DIR = path.resolve(process.cwd(), 'data/runtime/reports');

function reportPath(id) {
  return path.join(STORE_DIR, `${String(id).trim()}.json`);
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getStoredReport(id) {
  try {
    const raw = await readFile(reportPath(id), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * @param {object} report
 * @returns {Promise<object>}
 */
export async function setStoredReport(report) {
  const id = String(report?.company?.id ?? '').trim();
  if (!id) throw new Error('company.id is required');
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(reportPath(id), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

/**
 * @returns {Promise<string[]>}
 */
export async function listStoredReportIds() {
  try {
    const files = await readdir(STORE_DIR);
    return files
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''))
      .sort();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * @returns {Promise<object[]>}
 */
export async function listStoredReports() {
  const ids = await listStoredReportIds();
  const reports = await Promise.all(ids.map((id) => getStoredReport(id)));
  return reports.filter(Boolean);
}
