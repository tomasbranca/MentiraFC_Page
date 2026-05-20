const TRUSTED_SCRIPT_PATHS = new Set([
  "/_vercel/insights/script.js",
  "/_vercel/speed-insights/script.js",
]);

type TrustedTypesPolicyFactory = {
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

export const isTrustedScriptUrl = (
  value: string,
  origin = window.location.origin
): boolean => {
  try {
    const url = new URL(value, origin);

    return url.origin === origin && TRUSTED_SCRIPT_PATHS.has(url.pathname);
  } catch {
    return false;
  }
};

export const installTrustedTypesPolicy = (): void => {
  const trustedTypes = getTrustedTypes();

  if (!trustedTypes) return;

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

installTrustedTypesPolicy();
