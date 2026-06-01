import {
  hashSecurityIdentifier,
  logSecurityEvent,
} from "./securityLog.js";

export const RATE_LIMIT_MESSAGE =
  "Demasiadas acciones en poco tiempo. Intenta nuevamente mas tarde.";

export type RateLimitRule = {
  windowMs: number;
  max: number;
};

type RateLimitInput = {
  action: string;
  identifier: string | null | undefined;
  rules: readonly RateLimitRule[];
  now?: number;
  meta?: Record<string, unknown>;
};

const rateLimitBuckets = new Map<string, number[]>();
const MAX_BUCKETS = 5000;

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Rate limit exceeded.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const isRateLimitError = (error: unknown): error is RateLimitError =>
  error instanceof RateLimitError || (
    error instanceof Error && error.name === "RateLimitError"
  );

export const getClientIp = (request: Request): string | null => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const vercelIp = request.headers.get("x-vercel-forwarded-for");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    vercelIp?.split(",")[0]?.trim() ||
    null
  );
};

export const assertRateLimit = ({
  action,
  identifier,
  rules,
  now = Date.now(),
  meta = {},
}: RateLimitInput): void => {
  if (!identifier || rules.length === 0) {
    return;
  }

  const maxWindowMs = Math.max(...rules.map((rule) => rule.windowMs));
  const key = `${action}:${identifier}`;
  const existing = rateLimitBuckets.get(key) ?? [];
  const windowed = existing.filter((timestamp) => now - timestamp < maxWindowMs);

  for (const rule of rules) {
    const windowStart = now - rule.windowMs;
    const hits = windowed.filter((timestamp) => timestamp > windowStart);

    if (hits.length >= rule.max) {
      const oldestHit = hits[0] ?? now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestHit + rule.windowMs - now) / 1000)
      );

      logSecurityEvent("rate_limit_triggered", {
        action,
        identifierHash: hashSecurityIdentifier(identifier),
        retryAfterSeconds,
        ...meta,
      });

      throw new RateLimitError(retryAfterSeconds);
    }
  }

  if (!rateLimitBuckets.has(key) && rateLimitBuckets.size >= MAX_BUCKETS) {
    const firstKey = rateLimitBuckets.keys().next().value as string | undefined;

    if (firstKey) {
      rateLimitBuckets.delete(firstKey);
    }
  }

  rateLimitBuckets.set(key, [...windowed, now]);
};

export const __resetRateLimitsForTests = (): void => {
  rateLimitBuckets.clear();
};
