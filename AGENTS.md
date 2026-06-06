# Mentira FC Agent Guide

## Project Shape

- `web/`: public React + Vite + TypeScript SPA, dashboard/admin UI, and serverless API routes.
- `studio/`: Sanity Studio, schemas, and Sanity Functions.
- Sanity is the current content backend and schema source. The long-term direction is an in-site CMS that writes to Sanity.
- Keep `/dashboard` editorial and `/admin` operational unless the task explicitly changes that boundary.

## Working Rules

- Inspect relevant files before editing and keep changes small, reviewable, and scoped.
- Prefer existing routes, helpers, contracts, and components over parallel systems.
- Do not touch secrets, real `.env` files, `.codex/config.toml`, MCP config, or external services unless explicitly requested.
- Do not run destructive actions on Vercel, Sanity, Supabase, GitHub, or production systems.
- Use `pnpm.cmd` in PowerShell for local commands.
- Do not create commits unless explicitly asked.
- Absolutely every time repository files are changed, including code, docs, config, tests, or skills, the final answer must include a suggested conventional commit message. Use clear scopes such as `feat: improve admin panel UX and responsive layout`, `fix: correct dashboard data fallback`, or `docs: update agent workflow guidance`.

## Skills

Repo-local skills live in `.agents/skills/`. Use `mentira-project-guardrails` as the baseline, then use the specific skill that matches the task:

- `mentira-project-guardrails`
- `mentira-frontend-react`
- `mentira-design-system-components`
- `mentira-ux-product-review`
- `mentira-performance-web-vitals`
- `mentira-feature-architecture`
- `mentira-content-flow`
- `mentira-sanity-cms`
- `mentira-supabase-safe-db`
- `mentira-vercel-deploy`
- `mentira-ci-github-actions`
- `mentira-qa-before-finish`

Keep skills concise and project-specific.

## Validation

- Inspect `.github/workflows/` before presenting code changes as complete.
- Run builds, checks, linting, and tests only when relevant to the files changed.
- Do not force full builds for documentation-only changes.
- Do not force frontend checks for Sanity-only docs, or Sanity checks for frontend-only CSS.
- Run the closest local equivalents for relevant GitHub Actions jobs when applicable.
- Explain skipped validations in the final answer.

## Documentation

- Update `README.md` when setup, commands, architecture, deployment, usage, or project structure changes.
- Update `DATA_MODEL.md` when Sanity schemas, Supabase tables, relationships, entities, or important data flow changes.
- Do not update project-level docs for trivial internal refactors.

## Repository Hygiene

- Keep logs, temporary files, local debug output, generated reports, caches, local env files, editor/system junk, coverage, and build artifacts out of Git unless intentionally committed.
- Add narrow `.gitignore` rules when new local artifacts appear.
- If a development-only artifact is already tracked, remove it from version control without deleting needed local files when possible.
