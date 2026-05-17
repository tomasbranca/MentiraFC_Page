import { z } from "zod";

// The production CSP enables Trusted Types for script sinks. Zod v4's object
// parser normally probes/uses the Function constructor for JIT parsing, which
// browsers block under that policy. Keep runtime validation compatible with the
// CSP instead of weakening the security header.
z.config({ jitless: true });

export { z };

export const zodParseOptions = {
  jitless: true,
} as const;
