import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchWrappedReport, WrappedReportError } from '@/lib/api/wrappedReport';
import { buildJourneySections } from '@/lib/buildJourneySections';
import { buildSsoLoginRedirect } from '@/lib/config';
import type { JourneySection } from '@/lib/buildJourneySections';
import type { WrappedReport } from '@/types/wrappedReport';

type ReportStatus = 'loading' | 'ready' | 'error' | 'unauthorized' | 'not-found';

type WrappedReportContextValue = {
  status: ReportStatus;
  report: WrappedReport | null;
  journeySections: JourneySection[];
  errorMessage: string | null;
  retry: () => void;
};

const WrappedReportContext = createContext<WrappedReportContextValue | null>(null);

export function WrappedReportProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ReportStatus>('loading');
  const [report, setReport] = useState<WrappedReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const loadReport = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const nextReport = await fetchWrappedReport();
      setReport(nextReport);
      setStatus('ready');
    } catch (error) {
      if (error instanceof WrappedReportError && error.status === 401) {
        setStatus('unauthorized');
        setErrorMessage(error.message);
        return;
      }
      if (error instanceof WrappedReportError && error.status === 404) {
        setStatus('not-found');
        setErrorMessage(error.message);
        return;
      }
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load your report',
      );
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const journeySections = useMemo(
    () => (report ? buildJourneySections(report) : []),
    [report],
  );

  const value = useMemo(
    () => ({
      status,
      report,
      journeySections,
      errorMessage,
      retry,
    }),
    [status, report, journeySections, errorMessage, retry],
  );

  return (
    <WrappedReportContext.Provider value={value}>{children}</WrappedReportContext.Provider>
  );
}

export function useWrappedReport(): WrappedReportContextValue {
  const context = useContext(WrappedReportContext);
  if (!context) {
    throw new Error('useWrappedReport must be used within WrappedReportProvider');
  }
  return context;
}

export function redirectToSsoLogin(): void {
  window.location.assign(buildSsoLoginRedirect(window.location.href));
}
