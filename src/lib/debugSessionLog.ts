const DEBUG_STORAGE_KEY = 'debug-dacadc';

type DebugLogPayload = {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
};

export function debugSessionLog(payload: DebugLogPayload): void {
  if (typeof window === 'undefined') return;

  const entry = {
    sessionId: 'dacadc',
    timestamp: Date.now(),
    ...payload,
  };

  try {
    const prev = window.localStorage.getItem(DEBUG_STORAGE_KEY);
    const logs = prev ? (JSON.parse(prev) as unknown[]) : [];
    logs.push(entry);
    window.localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(logs.slice(-80)));
  } catch {
    // ignore storage failures
  }

  fetch('http://127.0.0.1:7309/ingest/e37df176-7b34-48f2-acb9-bbc0f91681a3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'dacadc',
    },
    body: JSON.stringify(entry),
  }).catch(() => {});

  if (import.meta.env.DEV) {
    console.info('[debug-dacadc]', entry.message, entry.data ?? {});
  }
}

export function readDebugSessionLogs(): string {
  if (typeof window === 'undefined') return '[]';
  return window.localStorage.getItem(DEBUG_STORAGE_KEY) ?? '[]';
}

export function clearDebugSessionLogs(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEBUG_STORAGE_KEY);
}
