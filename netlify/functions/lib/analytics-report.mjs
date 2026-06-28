const VALID_EVENTS = new Set([
  'report_view',
  'session_started',
  'intro_skipped',
  'checkpoint_reached',
  'diagnostics_completed',
  'share_clicked',
  'cta_clicked',
  'session_engagement',
]);

const VALID_CHECKPOINTS = new Set(['journey', 'hood', 'tires', 'diagnostics']);

/**
 * @param {unknown} payload
 */
export function parseAnalyticsEventPayload(payload) {
  const event = String(payload?.event ?? '').trim();
  const sessionId = String(payload?.sessionId ?? '').trim();
  const visitorId = String(payload?.visitorId ?? '').trim();
  const companyId = String(payload?.companyId ?? '').trim();
  const companyName = String(payload?.companyName ?? '').trim();
  const timestamp = String(payload?.timestamp ?? new Date().toISOString()).trim();

  if (!VALID_EVENTS.has(event)) {
    return { error: 'Invalid analytics event' };
  }
  if (!sessionId || !visitorId || !companyId || !companyName) {
    return { error: 'sessionId, visitorId, companyId, and companyName are required' };
  }

  const recordNumber =
    payload?.recordNumber === undefined || payload?.recordNumber === null
      ? undefined
      : Number(payload.recordNumber);
  const reportYear =
    payload?.reportYear === undefined || payload?.reportYear === null
      ? undefined
      : Number(payload.reportYear);

  if (recordNumber !== undefined && Number.isNaN(recordNumber)) {
    return { error: 'recordNumber must be a number' };
  }
  if (reportYear !== undefined && Number.isNaN(reportYear)) {
    return { error: 'reportYear must be a number' };
  }

  /** @type {Record<string, string | number>} */
  const properties = {};
  if (payload?.properties && typeof payload.properties === 'object') {
    for (const [key, value] of Object.entries(payload.properties)) {
      if (typeof value === 'string' || typeof value === 'number') {
        properties[key] = value;
      }
    }
  }

  if (event === 'checkpoint_reached') {
    const checkpoint = String(properties.checkpoint ?? '').trim();
    if (!VALID_CHECKPOINTS.has(checkpoint)) {
      return { error: 'Invalid checkpoint' };
    }
    properties.checkpoint = checkpoint;
  }

  if (event === 'cta_clicked') {
    const ctaKey = String(properties.ctaKey ?? 'unknown').trim();
    properties.ctaKey = ctaKey || 'unknown';
    if (properties.ctaLabel) properties.ctaLabel = String(properties.ctaLabel);
    if (properties.href) properties.href = String(properties.href);
  }

  if (event === 'session_engagement') {
    const durationMs = Number(properties.durationMs);
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return { error: 'durationMs must be a non-negative number' };
    }
    properties.durationMs = Math.round(durationMs);
  }

  return {
    event: {
      event,
      sessionId,
      visitorId,
      companyId,
      companyName,
      recordNumber,
      reportYear,
      timestamp,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    },
  };
}

/**
 * @typedef {{
 *   id: string;
 *   event: string;
 *   sessionId: string;
 *   visitorId: string;
 *   companyId: string;
 *   companyName: string;
 *   recordNumber?: number;
 *   reportYear?: number;
 *   timestamp: string;
 *   properties?: Record<string, string | number>;
 * }} StoredAnalyticsEvent
 */

/**
 * @param {StoredAnalyticsEvent[]} events
 */
export function buildUsageReport(events) {
  /** @type {Map<string, {
   *   companyId: string;
   *   companyName: string;
   *   recordNumber: number | null;
   *   reportYear: number | null;
   *   visitorIds: Set<string>;
   *   startedSessionIds: Set<string>;
   *   completedSessionIds: Set<string>;
   *   shareCount: number;
   *   ctaClicks: Record<string, number>;
   *   funnelSessions: Record<string, Set<string>>;
   *   durations: number[];
   * }>} */
  const companies = new Map();

  /**
   * @param {StoredAnalyticsEvent} event
   */
  function getCompany(event) {
    const key = `${event.companyId}|${event.recordNumber ?? ''}|${event.companyName}`;
    if (!companies.has(key)) {
      companies.set(key, {
        companyId: event.companyId,
        companyName: event.companyName,
        recordNumber: event.recordNumber ?? null,
        reportYear: event.reportYear ?? null,
        visitorIds: new Set(),
        startedSessionIds: new Set(),
        completedSessionIds: new Set(),
        shareCount: 0,
        ctaClicks: {},
        funnelSessions: {
          journey: new Set(),
          hood: new Set(),
          tires: new Set(),
          diagnostics: new Set(),
        },
        durations: [],
      });
    }
    return companies.get(key);
  }

  for (const event of events) {
    const company = getCompany(event);
    const sessionId = event.sessionId;

    switch (event.event) {
      case 'report_view':
        company.visitorIds.add(event.visitorId);
        break;
      case 'session_started':
        company.startedSessionIds.add(sessionId);
        company.visitorIds.add(event.visitorId);
        break;
      case 'intro_skipped':
        company.funnelSessions.journey.add(sessionId);
        break;
      case 'checkpoint_reached': {
        const checkpoint = String(event.properties?.checkpoint ?? '');
        if (company.funnelSessions[checkpoint]) {
          company.funnelSessions[checkpoint].add(sessionId);
        }
        break;
      }
      case 'diagnostics_completed':
        company.completedSessionIds.add(sessionId);
        company.funnelSessions.diagnostics.add(sessionId);
        break;
      case 'share_clicked':
        company.shareCount += 1;
        break;
      case 'cta_clicked': {
        const ctaKey = String(event.properties?.ctaKey ?? 'unknown');
        company.ctaClicks[ctaKey] = (company.ctaClicks[ctaKey] ?? 0) + 1;
        break;
      }
      case 'session_engagement': {
        const durationMs = Number(event.properties?.durationMs);
        if (Number.isFinite(durationMs) && durationMs > 0) {
          company.durations.push(durationMs);
        }
        break;
      }
      default:
        break;
    }
  }

  const companyRows = [...companies.values()]
    .map((company) => {
      const durations = company.durations;
      const avgTimeSpentMs =
        durations.length > 0
          ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : null;

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        recordNumber: company.recordNumber,
        reportYear: company.reportYear,
        totalVisitors: company.visitorIds.size,
        totalSessions: company.startedSessionIds.size,
        totalCompletions: company.completedSessionIds.size,
        totalShares: company.shareCount,
        ctaClicks: company.ctaClicks,
        funnel: {
          sessionsStarted: company.startedSessionIds.size,
          reachedJourney: company.funnelSessions.journey.size,
          reachedHood: company.funnelSessions.hood.size,
          reachedTires: company.funnelSessions.tires.size,
          reachedDiagnostics: company.funnelSessions.diagnostics.size,
          completed: company.completedSessionIds.size,
        },
        avgTimeSpentMs,
      };
    })
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  return { companies: companyRows };
}

/**
 * @param {StoredAnalyticsEvent[]} events
 * @param {string} fromDate YYYY-MM-DD or ''
 * @param {string} toDate YYYY-MM-DD or ''
 */
export function filterAnalyticsEventsByDateRange(events, fromDate, toDate) {
  if (!fromDate && !toDate) return events;

  const startMs = fromDate ? Date.parse(`${fromDate}T00:00:00.000Z`) : Number.NEGATIVE_INFINITY;
  const endMs = toDate ? Date.parse(`${toDate}T23:59:59.999Z`) : Number.POSITIVE_INFINITY;

  return events.filter((event) => {
    const ts = Date.parse(event.timestamp);
    return ts >= startMs && ts <= endMs;
  });
}
