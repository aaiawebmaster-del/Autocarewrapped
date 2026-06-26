import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  FeedbackReportingError,
  fetchFeedbackReport,
} from '@/lib/api/feedbackReporting';
import type { FeedbackReportResponse } from '@/types/feedback';
import '@/styles/reporting.css';

const REPORTING_PASSWORD_STORAGE_KEY = 'wrapped-reporting-password';

function formatFeedbackDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatRating(rating: 'positive' | 'negative'): string {
  return rating === 'positive' ? 'Positive' : 'Negative';
}

export default function ReportingPage() {
  const [passwordInput, setPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REPORTING_PASSWORD_STORAGE_KEY);
  });
  const [report, setReport] = useState<FeedbackReportResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(storedPassword));
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      const nextReport = await fetchFeedbackReport(password);
      setReport(nextReport);
      sessionStorage.setItem(REPORTING_PASSWORD_STORAGE_KEY, password);
      setStoredPassword(password);
    } catch (err) {
      const message =
        err instanceof FeedbackReportingError
          ? err.status === 401
            ? 'Incorrect password.'
            : err.message
          : 'Unable to load feedback report.';
      setError(message);
      setReport(null);
      if (err instanceof FeedbackReportingError && err.status === 401) {
        sessionStorage.removeItem(REPORTING_PASSWORD_STORAGE_KEY);
        setStoredPassword(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!storedPassword) return;
    void loadReport(storedPassword);
  }, [storedPassword, loadReport]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = passwordInput.trim();
    if (!password) {
      setError('Enter the reporting password.');
      return;
    }
    void loadReport(password);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(REPORTING_PASSWORD_STORAGE_KEY);
    setStoredPassword(null);
    setReport(null);
    setPasswordInput('');
    setError(null);
  };

  const isAuthenticated = Boolean(storedPassword);

  return (
    <main className="reporting-page">
      <div className="reporting-page__inner">
        <header className="reporting-page__header">
          <div>
            <h1 className="reporting-page__title">Engagement Report Feedback</h1>
            <p className="reporting-page__subtitle">
              Internal submissions from the Full Diagnostics feedback buttons.
            </p>
          </div>
          {isAuthenticated ? (
            <div className="reporting-page__actions">
              <button
                type="button"
                className="reporting-page__button"
                disabled={loading}
                onClick={() => void loadReport(storedPassword!)}
              >
                Refresh
              </button>
              <button
                type="button"
                className="reporting-page__button"
                disabled={loading}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </header>

        {!isAuthenticated ? (
          <section className="reporting-page__gate" aria-label="Reporting password">
            <h2 className="reporting-page__gate-title">Internal access</h2>
            <p className="reporting-page__gate-copy">
              Enter the reporting password to view submitted feedback.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="reporting-page__field">
                <label className="reporting-page__label" htmlFor="reporting-password">
                  Password
                </label>
                <input
                  id="reporting-password"
                  className="reporting-page__input"
                  type="password"
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                />
              </div>
              {error ? <p className="reporting-page__error">{error}</p> : null}
              <button type="submit" className="reporting-page__button" disabled={loading}>
                {loading ? 'Checking…' : 'View report'}
              </button>
            </form>
          </section>
        ) : (
          <>
            {loading ? <p className="reporting-page__status">Loading feedback…</p> : null}
            {error ? <p className="reporting-page__error">{error}</p> : null}
            {report ? (
              <>
                <div className="reporting-page__summary">
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{report.summary.total}</span>
                    <span className="reporting-page__summary-label">Total responses</span>
                  </div>
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{report.summary.positive}</span>
                    <span className="reporting-page__summary-label">Positive</span>
                  </div>
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{report.summary.negative}</span>
                    <span className="reporting-page__summary-label">Negative</span>
                  </div>
                </div>

                <div className="reporting-page__table-wrap">
                  {report.entries.length > 0 ? (
                    <table className="reporting-page__table">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Company Name</th>
                          <th scope="col">Rating</th>
                          <th scope="col">Company ID</th>
                          <th scope="col">Record Number</th>
                          <th scope="col">Report Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{formatFeedbackDate(entry.submittedAt)}</td>
                            <td>{entry.companyName}</td>
                            <td
                              className={
                                entry.rating === 'positive'
                                  ? 'reporting-page__rating--positive'
                                  : 'reporting-page__rating--negative'
                              }
                            >
                              {formatRating(entry.rating)}
                            </td>
                            <td>{entry.companyId}</td>
                            <td>{entry.recordNumber ?? ''}</td>
                            <td>{entry.reportYear ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="reporting-page__empty">No feedback submissions yet.</p>
                  )}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
