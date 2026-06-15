import { DrivingView } from '@/app/components/DrivingView';
import { appConfig, buildSsoLoginRedirect } from '@/lib/config';
import {
  redirectToSsoLogin,
  useWrappedReport,
  WrappedReportProvider,
} from '@/context/WrappedReportContext';

function AuthGateInner() {
  const { status, report, errorMessage, retry } = useWrappedReport();

  if (status === 'loading') {
    return (
      <div className="auth-gate auth-gate--loading">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Auto Care Wrapped</p>
          <h1 className="auth-gate__title">Loading your report</h1>
          <p className="auth-gate__body">Gathering your year in review…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized' && !appConfig.embedMode) {
    return (
      <div className="auth-gate auth-gate--unauthorized">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Auto Care Wrapped</p>
          <h1 className="auth-gate__title">Sign in required</h1>
          <p className="auth-gate__body">
            Sign in with your Auto Care membership to view your company&apos;s Wrapped report.
          </p>
          <button type="button" className="auth-gate__btn" onClick={redirectToSsoLogin}>
            Continue to sign in
          </button>
          <a className="auth-gate__link" href={buildSsoLoginRedirect()}>
            Go to my.autocare.org
          </a>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="auth-gate auth-gate--not-found">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Auto Care Wrapped</p>
          <h1 className="auth-gate__title">Report not available</h1>
          <p className="auth-gate__body">
            {errorMessage ??
              'We could not find a Wrapped report for your organization yet.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-gate auth-gate--error">
        <div className="auth-gate__panel">
          <p className="auth-gate__eyebrow">Auto Care Wrapped</p>
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
      <AuthGateInner />
    </WrappedReportProvider>
  );
}
