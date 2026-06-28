import { getEmbedConfig } from '@/lib/embedConfig';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL ?? 'https://my.autocare.org/login';
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const devRecordNumber = import.meta.env.VITE_DEV_RECORD_NUMBER?.trim() || null;
const mockScenario =
  (import.meta.env.VITE_MOCK_REPORT_SCENARIO as 'default' | 'zero-events' | 'high-engagement') ??
  'default';

const embed = typeof window !== 'undefined' ? getEmbedConfig() : { isEmbedded: false, recordNumber: null };

export const appConfig = {
  apiBaseUrl,
  ssoLoginUrl,
  useMockAuth,
  devRecordNumber,
  mockScenario,
  embedMode: embed.isEmbedded,
  embedRecordNumber: embed.recordNumber,
  reportEndpoint: `${apiBaseUrl}/api/wrapped/report`,
  healthEndpoint: `${apiBaseUrl}/api/wrapped/health`,
  feedbackEndpoint: `${apiBaseUrl}/api/wrapped/feedback`,
  reportingFeedbackEndpoint: `${apiBaseUrl}/api/wrapped/reporting/feedback`,
  analyticsEndpoint: `${apiBaseUrl}/api/wrapped/analytics`,
} as const;

export function buildSsoLoginRedirect(returnUrl?: string): string {
  const url = new URL(ssoLoginUrl);
  if (returnUrl) {
    url.searchParams.set('returnUrl', returnUrl);
  }
  return url.toString();
}
