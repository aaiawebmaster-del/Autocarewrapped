/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SSO_LOGIN_URL?: string;
  /** Post-login return target for `returnUrl` (default: https://my.autocare.org/drive). */
  readonly VITE_SSO_RETURN_URL?: string;
  /** @deprecated Prefer VITE_SSO_RETURN_URL. */
  readonly VITE_SSO_REDIRECT_URI?: string;
  readonly VITE_USE_MOCK_AUTH?: string;
  readonly VITE_DEV_RECORD_NUMBER?: string;
  readonly VITE_MOCK_REPORT_SCENARIO?: 'default' | 'zero-events' | 'high-engagement';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
