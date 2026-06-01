type AnalyticsEnv = {
  readonly PROD?: boolean;
  readonly VITE_ENABLE_ANALYTICS?: string;
};

export const shouldEnableVercelAnalytics = (
  env: AnalyticsEnv = import.meta.env
): boolean => {
  const explicitFlag = env.VITE_ENABLE_ANALYTICS?.trim().toLowerCase();

  if (explicitFlag === "true") return true;
  if (explicitFlag === "false") return false;

  return env.PROD === true;
};
