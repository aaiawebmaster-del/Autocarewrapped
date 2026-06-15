/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SSO_LOGIN_URL?: string;
  readonly VITE_USE_MOCK_AUTH?: string;
  readonly VITE_DEV_RECORD_NUMBER?: string;
  readonly VITE_MOCK_REPORT_SCENARIO?: 'default' | 'zero-events' | 'high-engagement';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
