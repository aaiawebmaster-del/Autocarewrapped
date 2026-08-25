import { getStore } from '@netlify/blobs';

const STORE_NAME = 'wrapped-reports';

function reportKey(id) {
  return `report:${String(id).trim()}`;
}

/**
 * Create the store inside the call (never at module scope) so Netlify can
 * inject Blobs credentials for Functions 2.0.
 * @returns {ReturnType<typeof getStore>}
 */
function getReportStore() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function getStoredReport(id) {
  try {
    const store = getReportStore();
    const report = await store.get(reportKey(id), { type: 'json' });
    return report ?? null;
  } catch (error) {
    console.error('[wrapped-reports] getStoredReport failed', error);
    return null;
  }
}

/**
 * @param {object} report
 * @returns {Promise<object>}
 */
export async function setStoredReport(report) {
  const id = String(report?.company?.id ?? '').trim();
  if (!id) throw new Error('company.id is required');

  try {
    const store = getReportStore();
    await store.setJSON(reportKey(id), report);
    return report;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[wrapped-reports] setStoredReport failed', error);
    throw new Error(
      `Unable to save report to Netlify Blobs (${detail}). Check that Blobs is enabled for this site.`,
    );
  }
}

/**
 * @returns {Promise<string[]>}
 */
export async function listStoredReportIds() {
  try {
    const store = getReportStore();
    const listed = await store.list({ prefix: 'report:' });
    return listed.blobs
      .map((blob) => blob.key.replace(/^report:/, ''))
      .filter(Boolean)
      .sort();
  } catch (error) {
    console.error('[wrapped-reports] listStoredReportIds failed', error);
    return [];
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
