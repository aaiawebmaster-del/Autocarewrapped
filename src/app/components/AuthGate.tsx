import { DrivingView } from '@/app/components/DrivingView';
import { AnalyticsTracker } from '@/app/components/AnalyticsTracker';
import { appConfig, buildSsoLoginRedirect } from '@/lib/config';
import {
  redirectToSsoLogin,
  useWrappedReport,
  WrappedReportProvider,
} from '@/context/WrappedReportContext';

function LoginPrompt({
  title = 'Log in to view your report',
  body = "Sign in with your Auto Care membership to view your company's Year In Review.",
}: {
  title?: string;
  body?: string;
}) {
  const loginHref = buildSsoLoginRedirect();

  return (
    <div className="auth-gate auth-gate--unauthorized">
      <div className="auth-gate__panel">
        <p className="auth-gate__eyebrow">Your Year In Review</p>
        <h1 className="auth-gate__title">{title}</h1>
        <p className="auth-gate__body">{body}</p>
        <button type="button" className="auth-gate__btn" onClick={redirectToSsoLogin}>
          Log in to view report
        </button>
        <a className="auth-gate__link" href={loginHref}>
          Continue to Autocare login
        </a>
      </div>
    </div>
  );
}

function AuthGateInner() {
  const { status, report, errorMessage, retry } = useWrappedReport();
  const hasCompanyRecord =
    appConfig.embedRecordNumbers.length > 0 || Boolean(appConfig.embedRecordNumber);

  if (status === 'loading') {
    return (
      <div className="auth-gate auth-gate--loading">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Your Year In Review</p>
          <h1 className="auth-gate__title">Loading your report</h1>
          <p className="auth-gate__body">Gathering Your Year In Review…</p>
        </div>
      </div>
    );
  }

  // No org id / no session → prompt login (including Drive embeds).
  if (status === 'unauthorized') {
    return <LoginPrompt />;
  }

  // Bare /drive (or session API) with no company record: treat as login-required,
  // not "you don't have a report".
  if (status === 'not-found' && !hasCompanyRecord) {
    return <LoginPrompt />;
  }

  if (status === 'not-found') {
    return (
      <div className="auth-gate auth-gate--not-found">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Your Year In Review</p>
          <h1 className="auth-gate__title">Report not available</h1>
          <p className="auth-gate__body">
            {errorMessage ??
              'We could not find Your Year In Review for your organization yet.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-gate auth-gate--error">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Your Year In Review</p>
          <h1 className="auth-gate__title">Something went wrong</h1>
          <p className="auth-gate__body">{errorMessage ?? 'Unable to load your report.'}</p>
          <button type="button" className="auth-gate__btn" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return <DrivingView report={report} embedded={appConfig.embedMode} />;
}

export function AuthGate() {
  return (
    <WrappedReportProvider>
      <AnalyticsTracker />
      <AuthGateInner />
    </WrappedReportProvider>
  );
}
