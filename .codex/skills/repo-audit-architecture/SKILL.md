---
name: repo-audit-architecture
description: Repo audit and architecture review workflow for Mentira FC. Use when reviewing technical debt, dead code, circular imports, duplicated logic, dependency boundaries, React hook risks, GROQ/query weight, bundle impact, TypeScript/test coverage, or domain/data/presentation leaks.
---

# Repo Audit Architecture

Use this skill for review-style work in Mentira FC. Propose a short audit plan before scanning broadly, then ground findings in concrete files and line references when possible.

## Scope

Review risks that affect maintainability:

- Dead or unused code, imports and dependencies.
- Circular dependencies and tangled ownership.
- Duplicated business logic, especially across domain and presentation.
- Leaks between `domain`, `data`, `presentation`, `lib` and `types`.
- React hooks that hide fetch waterfalls, stale state, infinite loading or duplicated cache contracts.
- GROQ queries that fetch too much, duplicate fragments or bypass adapters.
- Bundle growth, oversized static imports and avoidable initial JS.
- Missing tests around adapters, domain rules, data hooks and error states.

## Procedure

1. Start with the requested area and repo-tracked files. Avoid broad recursive scans through `node_modules` or build output.
2. Inspect architecture from both sides of the boundary:
   - Source of truth: `studio/schemas`, `web/src/data/sanity`, `web/src/types/models.ts`.
   - Consumers: `web/src/domain`, `web/src/presentation/pages`, hooks and components.
3. Prefer focused searches:
   - `Select-String` or `rg` for imports, query names, direct `imageUrl`, `urlFor`, `useEffect`, `useQuery`, `fetch`, `TODO`, `ts-ignore`, `ts-nocheck`.
4. Report findings in code-review style:
   - Severity first.
   - File and line references.
   - Why it matters.
   - Minimal suggested fix.
5. Do not rewrite architecture wholesale. Recommend staged fixes with verification.

## Guardrails

- Do not propose full-repo rewrites, full architecture migrations or broad renames without a user-approved plan.
- Do not add abstractions unless they remove real duplication or protect an existing boundary.
- Do not treat lack of a pattern as permission to invent a new one. Prefer local conventions.
- Leave the repo commit-ready and suggest a conventional commit message if edits are made.

## Validation

For code changes, run the affected package checks with `npm.cmd`. For review-only work, state that no validation was run because no code changed.
