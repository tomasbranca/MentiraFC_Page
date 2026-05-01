import type { CaptureContext } from "@sentry/react";

type SentryModule = typeof import("@sentry/react");

let sentryModulePromise: Promise<SentryModule | null> | null = null;
let sentryInitPromise: Promise<void> | null = null;

const getSentryDsn = (): string => import.meta.env.VITE_SENTRY_DSN?.trim() ?? "";

const sanitizeSentryUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return url.split(/[?#]/)[0] ?? url;
  }
};

const loadSentry = (): Promise<SentryModule | null> => {
  if (!getSentryDsn()) {
    return Promise.resolve(null);
  }

  sentryModulePromise ??= import("@sentry/react").catch((error: unknown) => {
    console.error("[Sentry]", error);
    return null;
  });

  return sentryModulePromise;
};

export const isSentryConfigured = (): boolean => Boolean(getSentryDsn());

export const initSentry = (): Promise<void> => {
  if (sentryInitPromise) {
    return sentryInitPromise;
  }

  sentryInitPromise = (async () => {
    const dsn = getSentryDsn();

    if (!dsn) {
      return;
    }

    const Sentry = await loadSentry();

    if (!Sentry || Sentry.isInitialized()) {
      return;
    }

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      beforeSend(event) {
        delete event.user;

        if (event.request?.url) {
          event.request.url = sanitizeSentryUrl(event.request.url);
        }

        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.Authorization;
          delete event.request.headers.cookie;
          delete event.request.headers.Cookie;
        }

        return event;
      },
    });
  })();

  return sentryInitPromise;
};

export const captureSentryException = async (
  error: Error,
  context: CaptureContext
): Promise<boolean> => {
  const Sentry = await loadSentry();

  if (!Sentry) {
    return false;
  }

  if (!Sentry.isInitialized()) {
    await initSentry();
  }

  if (!Sentry.isInitialized()) {
    return false;
  }

  Sentry.captureException(error, context);
  return true;
};
