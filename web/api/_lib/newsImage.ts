// Keep these runtime API constraints aligned with the dashboard UI constants in
// `src/types/dashboard.ts`. API functions should not import runtime values from
// frontend source modules because Vercel executes them as native ESM modules.
export const DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_NEWS_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
