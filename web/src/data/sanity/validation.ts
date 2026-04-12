import { type ZodType } from "zod";
import { reportError } from "../../lib/errors/errorLogger";

const buildError = (origin: string): string => `Sanity schema validation failed in ${origin}`;

export const validateSanityItem = <T>(
  schema: ZodType<T>,
  input: unknown,
  origin: string,
): T | null => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
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
  origin: string,
): T[] => {
  if (!Array.isArray(input)) {
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
