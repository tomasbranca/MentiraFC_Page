import { type ZodType } from "zod/v3";
import { reportError } from "../../lib/errors/errorLogger";

const buildError = (origin: string): string =>
  `Sanity schema validation failed in ${origin}`;

const isSanityDebugEnabled = (): boolean => {
  try {
    return Boolean(import.meta.env?.VITE_DEBUG_SANITY);
  } catch {
    return false;
  }
};

const debugValidationFailure = (
  origin: string,
  payload: unknown,
  issues: unknown,
  extra: Record<string, unknown> = {}
): void => {
  if (!isSanityDebugEnabled()) return;

  console.groupCollapsed(`[SanityValidation] ${origin}`);
  console.log("extra", extra);
  console.log("issues", issues);
  console.log("payload", payload);
  console.groupEnd();
};

export const validateSanityItem = <T>(
  schema: ZodType<T>,
  input: unknown,
  origin: string
): T | null => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    debugValidationFailure(origin, input, parsed.error.issues);
    reportError(new Error(buildError(origin)), {
      origin,
      issues: parsed.error.issues,
      input,
    });
    return null;
  }

  return parsed.data;
};

export const validateSanityArray = <T>(
  schema: ZodType<T>,
  input: unknown,
  origin: string
): T[] => {
  if (!Array.isArray(input)) {
    debugValidationFailure(origin, input, [], { reason: "Expected array" });
    reportError(new Error(buildError(origin)), {
      origin,
      reason: "Expected array",
      input,
    });
    return [];
  }

  return input.reduce<T[]>((acc, item, index) => {
    const parsed = schema.safeParse(item);

    if (!parsed.success) {
      debugValidationFailure(origin, item, parsed.error.issues, { index });
      reportError(new Error(buildError(origin)), {
        origin,
        index,
        issues: parsed.error.issues,
        input: item,
      });
      return acc;
    }

    acc.push(parsed.data);
    return acc;
  }, []);
};
