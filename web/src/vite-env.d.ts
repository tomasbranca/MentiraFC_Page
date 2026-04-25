/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID: string;
  readonly VITE_SANITY_DATASET: string;
  readonly VITE_SANITY_API_VERSION: string;
  readonly VITE_ENABLE_WEB_VITALS_LOG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}