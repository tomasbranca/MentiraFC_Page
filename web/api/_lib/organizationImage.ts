// Keep these runtime API constraints aligned with the dashboard UI constants in
// `src/types/dashboard.ts`. API functions execute as native ESM on Vercel.
export const DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
