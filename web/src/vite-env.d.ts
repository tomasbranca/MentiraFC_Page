/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID: string;
  readonly VITE_SANITY_DATASET: string;
  readonly VITE_SANITY_API_VERSION: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_WEB_VITALS_LOG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
