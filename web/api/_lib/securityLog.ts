import { createHash } from "node:crypto";

type SecurityLogLevel = "info" | "warn" | "error";

type SecurityLogMeta = Record<string, unknown>;

const MAX_LOG_STRING_LENGTH = 160;

const sensitiveKeyPattern =
  /authorization|bearer|cookie|password|secret|service|token|key/i;

const sanitizeLogValue = (key: string, value: unknown): unknown => {
  if (sensitiveKeyPattern.test(key)) {
    return "[redacted]";
  }

  if (typeof value === "string") {
    return value.length > MAX_LOG_STRING_LENGTH
      ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}...`
      : value;
  }

  if (
    value == null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return "[redacted]";
};

export const hashSecurityIdentifier = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

export const sanitizeSecurityLogMeta = (
  meta: SecurityLogMeta = {}
): SecurityLogMeta =>
  Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      sanitizeLogValue(key, value),
    ])
  );

export const logSecurityEvent = (
  event: string,
  meta: SecurityLogMeta = {},
  level: SecurityLogLevel = "warn"
): void => {
  const payload = {
    event,
    ...sanitizeSecurityLogMeta(meta),
  };

  const logger =
    level === "error" ? console.error : level === "info" ? console.info : console.warn;

  logger("[security]", payload);
};
