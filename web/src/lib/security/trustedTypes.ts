const TRUSTED_SCRIPT_PATHS = new Set([
  "/_vercel/insights/script.js",
  "/_vercel/speed-insights/script.js",
]);
const TRUSTED_VERCEL_SCRIPT_ORIGIN = "https://va.vercel-scripts.com";
const TRUSTED_VERCEL_SCRIPT_PATHS = new Set([
  "/v1/script.js",
  "/v1/script.debug.js",
  "/v1/speed-insights/script.js",
  "/v1/speed-insights/script.debug.js",
]);
const TRUSTED_VERCEL_LIVE_ORIGIN = "https://vercel.live";
const TRUSTED_VERCEL_LIVE_SCRIPT_PATHS = new Set([
  "/_next-live/feedback/feedback.js",
]);

type TrustedTypesPolicyFactory = {
  getPolicyNames?: () => string[];
  createPolicy: (
    name: string,
    rules: {
      createHTML?: (value: string) => string;
      createScriptURL: (value: string) => string;
    }
  ) => unknown;
};

const getTrustedTypes = (): TrustedTypesPolicyFactory | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { trustedTypes?: TrustedTypesPolicyFactory })
    .trustedTypes;
};

const hasTrustedTypesPolicy = (
  trustedTypes: TrustedTypesPolicyFactory,
  name: string
): boolean => {
  try {
    return trustedTypes.getPolicyNames?.().includes(name) ?? false;
  } catch {
    return false;
  }
};

export const isTrustedScriptUrl = (
  value: string,
  origin = window.location.origin
): boolean => {
  try {
    const url = new URL(value, origin);

    if (url.origin === origin) {
      return TRUSTED_SCRIPT_PATHS.has(url.pathname);
    }

    if (
      url.origin === TRUSTED_VERCEL_SCRIPT_ORIGIN &&
      TRUSTED_VERCEL_SCRIPT_PATHS.has(url.pathname)
    ) {
      return true;
    }

    return (
      url.origin === TRUSTED_VERCEL_LIVE_ORIGIN &&
      TRUSTED_VERCEL_LIVE_SCRIPT_PATHS.has(url.pathname)
    );
  } catch {
    return false;
  }
};

export const installTrustedTypesPolicy = (): void => {
  const trustedTypes = getTrustedTypes();

  if (!trustedTypes) return;
  if (hasTrustedTypesPolicy(trustedTypes, "default")) return;

  try {
    trustedTypes.createPolicy("default", {
      createHTML(value) {
        return value;
      },
      createScriptURL(value) {
        if (isTrustedScriptUrl(value)) {
          return value;
        }

        throw new TypeError(`Untrusted script URL: ${value}`);
      },
    });
  } catch {
    // Browsers throw if the default policy already exists. In that case, keep
    // the existing policy so app startup remains idempotent.
  }
};
