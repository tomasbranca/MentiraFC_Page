import * as Sentry from "@sentry/react";

type ErrorContext = Record<string, unknown>;

const SENSITIVE_CONTEXT_KEY =
  /(authorization|auth|password|passwd|secret|token|cookie|session|email|mail|phone|dni|document|address|query|search)/i;
const MAX_CONTEXT_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 1000;

const redact = (): string => "[Filtered]";

const truncateString = (value: string): string =>
  value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[Truncated]`
    : value;

const getErrorType = (error: unknown): string => {
  if (error instanceof Error) return error.name;
  if (error === null) return "null";
  if (Array.isArray(error)) return "array";
  return typeof error;
};

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_CONTEXT_DEPTH) return "[Truncated]";

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "undefined") {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce<ErrorContext>((acc, [key, item]) => {
      acc[key] = SENSITIVE_CONTEXT_KEY.test(key)
        ? redact()
        : sanitizeValue(item, depth + 1);
      return acc;
    }, {});
  }

  return String(value);
};

const sanitizeContext = (context: ErrorContext): ErrorContext =>
  sanitizeValue(context) as ErrorContext;

const getBrowserContext = (): ErrorContext => {
  if (typeof window === "undefined") {
    return {
      runtime: "server",
      environment: import.meta.env.MODE,
    };
  }

  return {
    runtime: "browser",
    environment: import.meta.env.MODE,
    pathname: window.location.pathname,
  };
};

const getSentryTags = (context: ErrorContext): Record<string, string> => {
  const tags: Record<string, string> = {};

  for (const key of ["scope", "action", "source"]) {
    const value = context[key];
    if (typeof value === "string" && !SENSITIVE_CONTEXT_KEY.test(key)) {
      tags[key] = value.slice(0, 200);
    }
  }

  return tags;
};

export const reportError = (
  error: unknown,
  context: ErrorContext = {}
): void => {
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown error");
  const sanitizedContext = sanitizeContext(context);

  const payload = {
    message: normalizedError.message,
    stack: normalizedError.stack,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV || !Sentry.isInitialized()) {
    console.error("[AppError]", payload);
  }

  if (!Sentry.isInitialized()) return;

  Sentry.captureException(normalizedError, {
    tags: getSentryTags(context),
    contexts: {
      app: getBrowserContext(),
      report: sanitizedContext,
    },
    extra: {
      originalErrorType: getErrorType(error),
    },
  });
};
