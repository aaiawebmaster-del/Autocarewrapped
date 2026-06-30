import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FeedbackReportingError,
  fetchFeedbackReport,
} from '@/lib/api/feedbackReporting';
import { formatCtaLabel } from '@/lib/analytics/ctaLabels';
import {
  buildFeedbackSummary,
  entriesWithWrittenFeedback,
  filterFeedbackEntriesByDateRange,
} from '@/lib/feedbackReportingUtils';
import {
  formatDurationMs,
  sortCtaEntries,
  sumUsageTotals,
} from '@/lib/usageReportingUtils';
import { downloadReportingSpreadsheet } from '@/lib/reportingExport';
import type { CompanyUsageMetrics } from '@/types/analytics';
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

function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function CompanyUsageRow({ company }: { company: CompanyUsageMetrics }) {
  const ctaEntries = sortCtaEntries(company.ctaClicks);
  const funnel = company.funnel;
  const started = funnel.sessionsStarted;

  return (
    <details className="reporting-page__usage-company">
      <summary className="reporting-page__usage-company-summary">
        <span className="reporting-page__usage-company-name">{company.companyName}</span>
        <span className="reporting-page__usage-company-stats">
          <span>{company.totalVisitors} visitors</span>
          <span>{company.totalSessions} sessions</span>
          <span>{company.totalCompletions} completions</span>
        </span>
      </summary>
      <div className="reporting-page__usage-company-body">
        <dl className="reporting-page__usage-metrics">
          <div>
            <dt>Total visitors</dt>
            <dd>{company.totalVisitors}</dd>
          </div>
          <div>
            <dt>Sessions started</dt>
            <dd>{company.totalSessions}</dd>
          </div>
          <div>
            <dt>Completions</dt>
            <dd>{company.totalCompletions}</dd>
          </div>
          <div>
            <dt>Shares</dt>
            <dd>{company.totalShares}</dd>
          </div>
          <div>
            <dt>Avg. time on report</dt>
            <dd>{formatDurationMs(company.avgTimeSpentMs)}</dd>
          </div>
          <div>
            <dt>Record #</dt>
            <dd>{company.recordNumber ?? '—'}</dd>
          </div>
        </dl>

        <div className="reporting-page__usage-subsection">
          <h3 className="reporting-page__usage-subtitle">Funnel (partial completions)</h3>
          <ul className="reporting-page__funnel-list">
            <li>
              <span>Sessions started</span>
              <strong>{funnel.sessionsStarted}</strong>
              <span>{formatPercent(funnel.sessionsStarted, started)}</span>
            </li>
            <li>
              <span>Reached Your Journey</span>
              <strong>{funnel.reachedJourney}</strong>
              <span>{formatPercent(funnel.reachedJourney, started)}</span>
            </li>
            <li>
              <span>Reached Under the Hood</span>
              <strong>{funnel.reachedHood}</strong>
              <span>{formatPercent(funnel.reachedHood, started)}</span>
            </li>
            <li>
              <span>Reached Kick the Tires</span>
              <strong>{funnel.reachedTires}</strong>
              <span>{formatPercent(funnel.reachedTires, started)}</span>
            </li>
            <li>
              <span>Reached Full Diagnostics</span>
              <strong>{funnel.reachedDiagnostics}</strong>
              <span>{formatPercent(funnel.reachedDiagnostics, started)}</span>
            </li>
            <li>
              <span>Completed</span>
              <strong>{funnel.completed}</strong>
              <span>{formatPercent(funnel.completed, started)}</span>
            </li>
          </ul>
        </div>

        <div className="reporting-page__usage-subsection">
          <h3 className="reporting-page__usage-subtitle">CTA clicks</h3>
          {ctaEntries.length > 0 ? (
            <ul className="reporting-page__cta-list">
              {ctaEntries.map(([ctaKey, count]) => (
                <li key={ctaKey}>
                  <span>{formatCtaLabel(ctaKey)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reporting-page__empty reporting-page__empty--inline">No CTA clicks yet.</p>
          )}
        </div>
      </div>
    </details>
  );
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(
    async (password: string, range?: { fromDate: string; toDate: string }) => {
      setLoading(true);
      setError(null);

      try {
        const nextReport = await fetchFeedbackReport(password, {
          fromDate: range?.fromDate || undefined,
          toDate: range?.toDate || undefined,
        });
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
    },
    [],
  );

  useEffect(() => {
    if (!storedPassword) return;
    void loadReport(storedPassword, { fromDate, toDate });
  }, [storedPassword, fromDate, toDate, loadReport]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = passwordInput.trim();
    if (!password) {
      setError('Enter the reporting password.');
      return;
    }
    void loadReport(password, { fromDate, toDate });
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(REPORTING_PASSWORD_STORAGE_KEY);
    setStoredPassword(null);
    setReport(null);
    setPasswordInput('');
    setError(null);
    setFromDate('');
    setToDate('');
  };

  const filteredEntries = useMemo(() => {
    if (!report) return [];
    return filterFeedbackEntriesByDateRange(report.entries, fromDate, toDate);
  }, [report, fromDate, toDate]);

  const filteredSummary = useMemo(() => buildFeedbackSummary(filteredEntries), [filteredEntries]);

  const writtenFeedbackEntries = useMemo(
    () => entriesWithWrittenFeedback(filteredEntries),
    [filteredEntries],
  );

  const usageCompanies = report?.usage?.companies ?? [];
  const usageTotals = useMemo(() => sumUsageTotals(usageCompanies), [usageCompanies]);

  const handleExport = async () => {
    if (!report || exporting) return;

    setExporting(true);
    setError(null);
    try {
      await downloadReportingSpreadsheet({
        fromDate,
        toDate,
        feedbackSummary: filteredSummary,
        feedbackEntries: filteredEntries,
        usageCompanies,
        usageTotals,
      });
    } catch {
      setError('Unable to export spreadsheet. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const isAuthenticated = Boolean(storedPassword);
  const hasDateFilter = Boolean(fromDate || toDate);

  return (
    <main className="reporting-page">
      <div className="reporting-page__inner">
        <header className="reporting-page__header">
          <div>
            <h1 className="reporting-page__title">Engagement Report Feedback</h1>
            <p className="reporting-page__subtitle">
              Internal feedback submissions and usage metrics by company.
            </p>
          </div>
          {isAuthenticated ? (
            <div className="reporting-page__header-tools">
              <div className="reporting-page__date-range" aria-label="Filter by submission date">
                <div className="reporting-page__date-field">
                  <label className="reporting-page__date-label" htmlFor="reporting-from-date">
                    From
                  </label>
                  <input
                    id="reporting-from-date"
                    className="reporting-page__date-input"
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </div>
                <div className="reporting-page__date-field">
                  <label className="reporting-page__date-label" htmlFor="reporting-to-date">
                    To
                  </label>
                  <input
                    id="reporting-to-date"
                    className="reporting-page__date-input"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </div>
                {hasDateFilter ? (
                  <button
                    type="button"
                    className="reporting-page__button reporting-page__button--ghost"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="reporting-page__actions">
                <button
                  type="button"
                  className="reporting-page__button"
                  disabled={loading || exporting || !report}
                  onClick={() => void handleExport()}
                >
                  {exporting ? 'Exporting…' : 'Export spreadsheet'}
                </button>
                <button
                  type="button"
                  className="reporting-page__button"
                  disabled={loading}
                  onClick={() => void loadReport(storedPassword!, { fromDate, toDate })}
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
            </div>
          ) : null}
        </header>

        {!isAuthenticated ? (
          <section className="reporting-page__gate" aria-label="Reporting password">
            <h2 className="reporting-page__gate-title">Internal access</h2>
            <p className="reporting-page__gate-copy">
              Enter the reporting password to view submitted feedback and usage metrics.
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
            {loading ? <p className="reporting-page__status">Loading report…</p> : null}
            {error ? <p className="reporting-page__error">{error}</p> : null}
            {report ? (
              <>
                {hasDateFilter ? (
                  <p className="reporting-page__filter-note">
                    Showing data from {fromDate ? fromDate : 'the beginning'} through{' '}
                    {toDate ? toDate : 'today'}.
                  </p>
                ) : null}

                <section className="reporting-page__section" aria-label="Usage by company">
                  <h2 className="reporting-page__section-title">Usage by company</h2>
                  <div className="reporting-page__summary reporting-page__summary--usage">
                    <div className="reporting-page__summary-card">
                      <span className="reporting-page__summary-value">{usageTotals.totalVisitors}</span>
                      <span className="reporting-page__summary-label">Total visitors</span>
                    </div>
                    <div className="reporting-page__summary-card">
                      <span className="reporting-page__summary-value">{usageTotals.totalSessions}</span>
                      <span className="reporting-page__summary-label">Sessions started</span>
                    </div>
                    <div className="reporting-page__summary-card">
                      <span className="reporting-page__summary-value">{usageTotals.totalCompletions}</span>
                      <span className="reporting-page__summary-label">Completions</span>
                    </div>
                    <div className="reporting-page__summary-card">
                      <span className="reporting-page__summary-value">{usageTotals.totalShares}</span>
                      <span className="reporting-page__summary-label">Shares</span>
                    </div>
                  </div>
                  {usageCompanies.length > 0 ? (
                    <div className="reporting-page__usage-list">
                      {usageCompanies.map((company) => (
                        <CompanyUsageRow
                          key={`${company.companyId}-${company.recordNumber ?? 'na'}`}
                          company={company}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="reporting-page__empty">
                      {hasDateFilter
                        ? 'No usage data in this date range.'
                        : 'No usage data yet — metrics appear after users visit embedded reports.'}
                    </p>
                  )}
                </section>

                <div className="reporting-page__summary">
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{filteredSummary.total}</span>
                    <span className="reporting-page__summary-label">Total responses</span>
                  </div>
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{filteredSummary.positive}</span>
                    <span className="reporting-page__summary-label">Positive</span>
                  </div>
                  <div className="reporting-page__summary-card">
                    <span className="reporting-page__summary-value">{filteredSummary.negative}</span>
                    <span className="reporting-page__summary-label">Negative</span>
                  </div>
                </div>

                <section className="reporting-page__section" aria-label="Written feedback">
                  <h2 className="reporting-page__section-title">Written feedback</h2>
                  {writtenFeedbackEntries.length > 0 ? (
                    <ul className="reporting-page__comments">
                      {writtenFeedbackEntries.map((entry) => (
                        <li key={entry.id} className="reporting-page__comment">
                          <div className="reporting-page__comment-meta">
                            <span className="reporting-page__comment-company">{entry.companyName}</span>
                            <span
                              className={
                                entry.rating === 'positive'
                                  ? 'reporting-page__rating--positive'
                                  : 'reporting-page__rating--negative'
                              }
                            >
                              {formatRating(entry.rating)}
                            </span>
                            <time className="reporting-page__comment-date" dateTime={entry.submittedAt}>
                              {formatFeedbackDate(entry.submittedAt)}
                            </time>
                          </div>
                          <p className="reporting-page__comment-body">{entry.comment}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="reporting-page__empty">
                      {hasDateFilter
                        ? 'No written feedback in this date range.'
                        : 'No written feedback yet.'}
                    </p>
                  )}
                </section>

                <section className="reporting-page__section" aria-label="All submissions">
                  <h2 className="reporting-page__section-title">All submissions</h2>
                  <div className="reporting-page__table-wrap">
                    {filteredEntries.length > 0 ? (
                      <table className="reporting-page__table">
                        <thead>
                          <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Company Name</th>
                            <th scope="col">Rating</th>
                            <th scope="col">Written feedback</th>
                            <th scope="col">Company ID</th>
                            <th scope="col">Record Number</th>
                            <th scope="col">Report Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((entry) => (
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
                              <td className="reporting-page__comment-cell">
                                {entry.comment?.trim() ? entry.comment : '—'}
                              </td>
                              <td>{entry.companyId}</td>
                              <td>{entry.recordNumber ?? ''}</td>
                              <td>{entry.reportYear ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="reporting-page__empty">
                        {hasDateFilter
                          ? 'No feedback submissions in this date range.'
                          : 'No feedback submissions yet.'}
                      </p>
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
