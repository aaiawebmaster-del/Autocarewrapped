import { getStore } from '@netlify/blobs';

const STORE_NAME = 'wrapped-reports';

function reportKey(id) {
  return `report:${String(id).trim()}`;
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getStoredReport(id) {
  const store = getStore(STORE_NAME);
  const report = await store.get(reportKey(id), { type: 'json' });
  return report ?? null;
}

/**
 * @param {object} report
 * @returns {Promise<object>}
 */
export async function setStoredReport(report) {
  const id = String(report?.company?.id ?? '').trim();
  if (!id) throw new Error('company.id is required');
  const store = getStore(STORE_NAME);
  await store.setJSON(reportKey(id), report);
  return report;
}

/**
 * @returns {Promise<string[]>}
 */
export async function listStoredReportIds() {
  const store = getStore(STORE_NAME);
  const listed = await store.list({ prefix: 'report:' });
  return listed.blobs
    .map((blob) => blob.key.replace(/^report:/, ''))
    .filter(Boolean)
    .sort();
}

/**
 * @returns {Promise<object[]>}
 */
export async function listStoredReports() {
  const ids = await listStoredReportIds();
  const reports = await Promise.all(ids.map((id) => getStoredReport(id)));
  return reports.filter(Boolean);
}
