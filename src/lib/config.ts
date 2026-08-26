import { DRIVE_PAGE_URL, getEmbedConfig } from '@/lib/embedConfig';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
/** Public Autocare account login (Impexium / www.autocare.org). */
const ssoLoginUrl =
  import.meta.env.VITE_SSO_LOGIN_URL ?? 'https://www.autocare.org/account/login';
/**
 * Where Autocare should send the user after a successful login.
 * Must match a registered redirect for the login page (path or absolute URL).
 */
const ssoRedirectUri =
  import.meta.env.VITE_SSO_REDIRECT_URI?.trim() || DRIVE_PAGE_URL;
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const devRecordNumber = import.meta.env.VITE_DEV_RECORD_NUMBER?.trim() || null;
const mockScenario =
  (import.meta.env.VITE_MOCK_REPORT_SCENARIO as 'default' | 'zero-events' | 'high-engagement') ??
  'default';

function readEmbed() {
  return typeof window !== 'undefined'
    ? getEmbedConfig()
    : {
        isEmbedded: false,
        recordNumber: null,
        recordNumbers: [] as string[],
        isImpersonating: false,
        section: null as ReturnType<typeof getEmbedConfig>['section'],
        sectionOnly: false,
      };
}

/**
 * App config. URL-dependent embed fields are getters so they always reflect the
 * current query string (important for Vite HMR and same-tab URL changes).
 */
export const appConfig = {
  apiBaseUrl,
  ssoLoginUrl,
  ssoRedirectUri,
  useMockAuth,
  devRecordNumber,
  mockScenario,
  get embedMode() {
    return readEmbed().isEmbedded;
  },
  get embedRecordNumber() {
    return readEmbed().recordNumber;
  },
  get embedRecordNumbers() {
    return readEmbed().recordNumbers;
  },
  /** Skip usage analytics when re:Members admin is impersonating a member. */
  get isImpersonating() {
    return readEmbed().isImpersonating;
  },
  /** Footer checkpoint for Netlify section-only embeds (`?section=`). */
  get embedSection() {
    return readEmbed().section;
  },
  /** When true, jump into `embedSection` and block leaving that checkpoint. */
  get sectionOnly() {
    return readEmbed().sectionOnly;
  },
  reportEndpoint: `${apiBaseUrl}/api/wrapped/report`,
  healthEndpoint: `${apiBaseUrl}/api/wrapped/health`,
  feedbackEndpoint: `${apiBaseUrl}/api/wrapped/feedback`,
  reportingFeedbackEndpoint: `${apiBaseUrl}/api/wrapped/reporting/feedback`,
  reportingReportsEndpoint: `${apiBaseUrl}/api/wrapped/reporting/reports`,
  companyReportEndpoint: `${apiBaseUrl}/api/wrapped/company-report`,
  analyticsEndpoint: `${apiBaseUrl}/api/wrapped/analytics`,
};

/**
 * Build the Autocare login URL with `redirect_uri` so members return to Drive
 * after signing in (same pattern as www.autocare.org/account/login?redirect_uri=…).
 */
export function buildSsoLoginRedirect(redirectUri = ssoRedirectUri): string {
  const url = new URL(ssoLoginUrl);
  url.searchParams.set('redirect_uri', redirectUri);
  return url.toString();
}
