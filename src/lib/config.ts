import { getEmbedConfig } from '@/lib/embedConfig';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL ?? 'https://my.autocare.org/login';
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
  analyticsEndpoint: `${apiBaseUrl}/api/wrapped/analytics`,
};

export function buildSsoLoginRedirect(returnUrl?: string): string {
  const url = new URL(ssoLoginUrl);
  if (returnUrl) {
    url.searchParams.set('returnUrl', returnUrl);
  }
  return url.toString();
}
