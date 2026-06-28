const VISITOR_ID_KEY = 'wrapped-analytics-visitor-id';
const SESSION_ID_KEY = 'wrapped-analytics-session-id';
const SESSION_STARTED_AT_KEY = 'wrapped-analytics-session-started-at';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = createId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = createId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function getSessionStartedAtMs(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = sessionStorage.getItem(SESSION_STARTED_AT_KEY);
  if (raw) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const now = Date.now();
  sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
  return now;
}

export function markSessionStartedAtNow(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
}

export function getSessionDurationMs(): number {
  return Math.max(0, Date.now() - getSessionStartedAtMs());
}

const CHECKPOINT_FLAG_PREFIX = 'wrapped-analytics-checkpoint:';

export function hasTrackedCheckpoint(checkpoint: string): boolean {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem(`${CHECKPOINT_FLAG_PREFIX}${checkpoint}`) === '1';
}

export function markCheckpointTracked(checkpoint: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${CHECKPOINT_FLAG_PREFIX}${checkpoint}`, '1');
}

const EVENT_FLAG_PREFIX = 'wrapped-analytics-event:';

export function hasTrackedEventOnce(event: string): boolean {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem(`${EVENT_FLAG_PREFIX}${event}`) === '1';
}

export function markEventTrackedOnce(event: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${EVENT_FLAG_PREFIX}${event}`, '1');
}
