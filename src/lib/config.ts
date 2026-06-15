import { getEmbedConfig } from '@/lib/embedConfig';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL ?? 'https://my.autocare.org/login';
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const mockScenario =
  (import.meta.env.VITE_MOCK_REPORT_SCENARIO as 'default' | 'zero-events' | 'high-engagement') ??
  'default';

const embed = typeof window !== 'undefined' ? getEmbedConfig() : { isEmbedded: false, recordNumber: null };

export const appConfig = {
  apiBaseUrl,
  ssoLoginUrl,
  useMockAuth,
  mockScenario,
  embedMode: embed.isEmbedded,
  embedRecordNumber: embed.recordNumber,
  reportEndpoint: `${apiBaseUrl}/api/wrapped/report`,
  healthEndpoint: `${apiBaseUrl}/api/wrapped/health`,
} as const;

export function buildSsoLoginRedirect(returnUrl?: string): string {
  const url = new URL(ssoLoginUrl);
  if (returnUrl) {
    url.searchParams.set('returnUrl', returnUrl);
  }
  return url.toString();
}
