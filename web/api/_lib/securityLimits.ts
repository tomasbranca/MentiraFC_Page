import type { RateLimitRule } from "./rateLimit.js";

export const COMMENT_CREATE_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 5 },
  { windowMs: 60 * 60_000, max: 30 },
] as const satisfies readonly RateLimitRule[];

export const COMMENT_EDIT_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 10 },
  { windowMs: 60 * 60_000, max: 60 },
] as const satisfies readonly RateLimitRule[];

export const COMMENT_DELETE_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 10 },
] as const satisfies readonly RateLimitRule[];

export const COMMENT_REPORT_RATE_LIMIT_RULES = [
  { windowMs: 60 * 60_000, max: 10 },
] as const satisfies readonly RateLimitRule[];

export const COMMENT_MODERATION_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 30 },
] as const satisfies readonly RateLimitRule[];

export const REACTION_MUTATION_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 30 },
] as const satisfies readonly RateLimitRule[];

export const ADMIN_MUTATION_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 20 },
] as const satisfies readonly RateLimitRule[];

export const AUTHENTICATED_WRITE_IP_RATE_LIMIT_RULES = [
  { windowMs: 60_000, max: 120 },
] as const satisfies readonly RateLimitRule[];
