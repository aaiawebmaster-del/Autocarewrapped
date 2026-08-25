/**
 * Shared WrappedReport validation and field-path helpers for admin APIs.
 */

const REQUIRED_TOP_KEYS = ['reportYear', 'company', 'journey', 'events', 'products', 'factbook'];

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Accept Engagement Report upload shapes:
 * - single company object
 * - array of company objects
 * - `{ "reports": [ ... ] }`
 *
 * @param {unknown} payload
 * @returns {{ reports: unknown[]; error: string | null }}
 */
export function parseEngagementUpload(payload) {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return { reports: [], error: 'Upload array is empty' };
    }
    return { reports: payload, error: null };
  }

  if (!isObject(payload)) {
    return {
      reports: [],
      error:
        'Upload must be a company report JSON object, an array of reports, or { "reports": [...] }',
    };
  }

  if (Array.isArray(payload.reports)) {
    if (payload.reports.length === 0) {
      return { reports: [], error: 'reports array is empty' };
    }
    return { reports: payload.reports, error: null };
  }

  // Single-company Engagement Report template (e.g. EngagementReport_{id}_{year}.json)
  if (payload.company != null || payload.reportYear != null || payload.journey != null) {
    return { reports: [payload], error: null };
  }

  return {
    reports: [],
    error:
      'Upload must be a company report JSON object, an array of reports, or { "reports": [...] }',
  };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function validateWrappedReport(value) {
  if (!isObject(value)) return 'Report must be a JSON object';

  for (const key of REQUIRED_TOP_KEYS) {
    if (!(key in value)) return `Missing required field: ${key}`;
  }

  if (!isObject(value.company)) return 'company must be an object';
  const companyId = String(value.company.id ?? '').trim();
  if (!companyId) return 'company.id is required';
  if (!String(value.company.name ?? '').trim()) return 'company.name is required';

  const reportYear = Number(value.reportYear);
  if (!Number.isFinite(reportYear)) {
    return 'reportYear must be a number';
  }

  if (!isObject(value.journey)) return 'journey must be an object';
  if (!Array.isArray(value.journey.communities)) return 'journey.communities must be an array';

  if (!isObject(value.events)) return 'events must be an object';
  if (!isObject(value.products)) return 'products must be an object';
  if (!isObject(value.factbook)) return 'factbook must be an object';

  if (value.standards != null && !isObject(value.standards)) {
    return 'standards must be an object when provided';
  }

  if (
    value.company.recordNumber != null &&
    Number(value.company.recordNumber) !== Number(companyId) &&
    String(value.company.recordNumber) !== companyId
  ) {
    // Soft check — allow string/number mismatch only when numeric values differ
    if (
      Number.isFinite(Number(value.company.recordNumber)) &&
      Number.isFinite(Number(companyId)) &&
      Number(value.company.recordNumber) !== Number(companyId)
    ) {
      return 'company.recordNumber must match company.id';
    }
  }

  return null;
}

/**
 * @param {unknown} report
 * @returns {object}
 */
export function normalizeWrappedReport(report) {
  const next = structuredClone(report);
  const id = String(next.company.id).trim();
  next.company.id = id;
  next.company.name = String(next.company.name ?? '').trim();
  next.reportYear = Number(next.reportYear);

  if (next.company.recordNumber == null || next.company.recordNumber === '') {
    const asNumber = Number(id);
    if (Number.isFinite(asNumber)) next.company.recordNumber = asNumber;
  } else {
    next.company.recordNumber = Number(next.company.recordNumber);
  }

  if (!Array.isArray(next.journey.communities)) next.journey.communities = [];
  next.journey.communities = next.journey.communities.map((name) => String(name).trim()).filter(Boolean);

  if (next.standards) {
    if (!Array.isArray(next.standards.subscribedProducts)) {
      next.standards.subscribedProducts = [];
    }
    next.standards.subscribedProducts = next.standards.subscribedProducts
      .map((name) => String(name).trim())
      .filter(Boolean);
  }
  return next;
}

/**
 * @param {object} target
 * @param {string} path
 * @returns {unknown}
 */
export function getByPath(target, path) {
  const parts = path.split('.').filter(Boolean);
  let current = target;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/**
 * @param {object} target
 * @param {string} path
 * @param {unknown} value
 * @returns {object}
 */
export function setByPath(target, path, value) {
  const parts = path.split('.').filter(Boolean);
  if (parts.length === 0) return target;

  const root = structuredClone(target);
  let current = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return root;
}

/**
 * Recompute derived percentages after field edits.
 * @param {object} report
 * @returns {object}
 */
export function recomputeDerivedFields(report) {
  const next = structuredClone(report);
  const contacts = Number(next.journey?.activeContacts ?? 0);
  const inPersonAttended = Number(next.events?.inPersonAttended ?? 0);
  const inPersonTotal = Number(next.events?.inPersonTotal ?? 0);
  const trendLensUsers = Number(next.products?.trendLensUsers ?? 0);
  const factbookUsers = Number(next.factbook?.users ?? 0);

  if (next.journey?.membershipSince) {
    next.journey.membershipTenureYears = membershipTenureYearsFromDate(
      String(next.journey.membershipSince),
    );
  }

  if (inPersonTotal > 0) {
    next.events.attendancePct = Math.round((inPersonAttended / inPersonTotal) * 100);
  }

  if (contacts > 0) {
    next.products.trendLensContactPct = Math.round((trendLensUsers / contacts) * 100);
    next.factbook.contactPct = Math.round((factbookUsers / contacts) * 100);
  } else {
    next.products.trendLensContactPct = 0;
    next.factbook.contactPct = 0;
  }

  if (next.standards && Array.isArray(next.standards.subscribedProducts)) {
    next.standards.subscribedCount = next.standards.subscribedProducts.length;
  }

  return next;
}

/**
 * @param {string} since
 * @param {Date} [asOf]
 * @returns {number}
 */
function membershipTenureYearsFromDate(since, asOf = new Date()) {
  const trimmed = String(since ?? '').trim();
  let year;
  let month;
  let day;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (!us) return Number(0);
    month = Number(us[1]);
    day = Number(us[2]);
    year = Number(us[3]);
  }

  const start = new Date(year, month - 1, day);
  if (Number.isNaN(start.getTime())) return 0;

  let years = asOf.getFullYear() - start.getFullYear();
  if (
    asOf.getMonth() < start.getMonth() ||
    (asOf.getMonth() === start.getMonth() && asOf.getDate() < start.getDate())
  ) {
    years -= 1;
  }
  return Math.max(0, years);
}
