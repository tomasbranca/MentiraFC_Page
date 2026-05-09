# Mentira FC Agent Guide

## Project Shape

Mentira FC is a simple monorepo with two apps:

- `web/`: public React + Vite + TypeScript SPA.
- `studio/`: current Sanity Studio and source-of-truth content schemas.

Prefer source-of-truth changes over presentation-only patches. For Sanity-backed behavior, start in `studio/schemas`, then propagate through the web data contract before touching UI.

The long-term product direction is to replace Sanity Studio with an in-site custom CMS that writes data to Sanity. Treat Sanity as the current content backend and schema source, but do not assume Sanity Studio is the final editorial interface.

## Default Workflow

1. Inspect the relevant files before editing.
2. Propose a short plan before changing files, especially when the task touches architecture, Sanity data, UI, dependencies, deploy or CI.
3. Keep edits scoped to the requested behavior.
4. Preserve existing public behavior unless the task asks for a UI or API change.
5. Add or update focused tests when behavior changes.
6. Use `npm.cmd` in PowerShell. Plain `npm` can fail because of script execution policy.

## Autonomy And Delivery

Leave the repo commit-ready by default when there are repo changes. Do not create commits unless the user explicitly asks.

Final responses should include a suggested normalized commit message only when the agent changed files or `git status --short` shows repo changes. Do not suggest a commit message for analysis-only, review-only, or no-op turns. Use conventional commit style such as:

```text
feat: add agent workflow docs
fix: tighten lighthouse agent guidance
docs: document mcp setup
```

When a task is broad or risky, explain the plan first and then implement after the user agrees.

Avoid autonomous full-repo rewrites. Do not run broad "refactor entire repo", "upgrade architecture", "migrate framework" or "rewrite module" tasks without a staged, user-approved plan. Prefer small, reviewable steps that preserve the repo's existing patterns.

## Dependencies

Agents may install dependencies when justified by the task, but must explain why the dependency is needed. Never use `--force` blindly. If a safe install path leaves residual advisories or conflicts, explain the tradeoff instead of forcing an unsafe remediation.

## Validation

For `web` changes:

```powershell
cd web
npm.cmd run build
npm.cmd run check
```

For `studio` changes:

```powershell
cd studio
npm.cmd run build
npm.cmd run check
```

For full Sanity-backed changes, run both packages. If a local browser check is required and port `5173` is busy, retry with `5174` or another strict port.

## Sanity Data Path

For a new Sanity-backed field or document type, keep this path aligned:

```text
studio/schemas/*.schema.js
studio/schemas/index.js
web/src/data/sanity/queries/*.queries.ts
web/src/data/sanity/schemas.ts
web/src/data/sanity/adapters/*.adapter.ts
web/src/data/sanity/services/*.service.ts
web/src/types/models.ts
web/src/data/getInitialData.ts
web/src/data/getRouteInitialData.ts
web/src/data/initialDataPayload.ts
web/src/data/queryKeys.ts
web/src/main.tsx
routes/pages/tests
```

Do not treat `DATA_MODEL.md` as the source of truth without checking live schemas and adapters. Update `DATA_MODEL.md` when a justified model/schema change affects the real data contract.

## Recommended Agent Roles

- **Sanity/Data Agent**: schemas, GROQ queries, Zod schemas, adapters, services, models, bootstrap and cache hydration.
- **Web UI Agent**: page components, hooks, layout, loading, empty, error and accessibility states.
- **QA/Performance Agent**: tests, builds, Lighthouse CI, image delivery, bundle size and first-paint bottlenecks.
- **Architecture Audit Agent**: dead code, dependency boundaries, duplicated logic, circular imports, query weight and missing tests.
- **Design System Agent**: visual consistency, sports-broadcast UI, card/widget reuse, typography, spacing and responsive behavior.
- **SEO/Copy Agent**: public copy, metadata, OG/Twitter tags, encoding cleanup and institutional tone.
- **Review Agent**: final PR-style review focused on bugs, regressions, missing tests, boundary leaks, waterfalls, bundle impact, accessibility gaps and verification gaps.

## MCP Usage

Use MCPs only when they add live context that the repo cannot provide:

- Local filesystem or equivalent repo access is required for serious code work. If an agent cannot inspect the actual tree, files and diffs, treat its analysis as limited.
- Sanity MCP for dataset, schema-aware content inspection, GROQ and content operations. Prefer read-only usage unless the user explicitly asks for content writes.
- GitHub MCP or connector for PRs, review threads, issues and CI context.
- Vercel MCP for deployments, logs, environment configuration and Vercel docs. Vercel is the assumed deployment platform for this project.
- Sentry MCP or connector for production issue triage.
- Browser automation for local UI verification.

Never commit auth tokens, OAuth output, local MCP credentials or production secrets.

## Performance And UI Scope

For performance, Lighthouse or LHCI work, do not change UI or functionality unless the user explicitly asks for it. Prefer semantic, data-loading, image, bundle or CI configuration fixes first.

## Repo-Local Skills

Repo-local skills live in `.codex/skills/`:

- `sanity-model-rollout`
- `web-performance-lhci`
- `public-copy-seo`
- `repo-audit-architecture`
- `design-system-guidance`

Use them as procedural context for repeatable work in this repo. They are intentionally small and should stay focused.
