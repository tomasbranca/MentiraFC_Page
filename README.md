# Mentira FC

Mentira FC is a monorepo for a football club web platform with a React/Vite public app and a Sanity-backed content studio.

## Apps

- `web/`: React 19 + Vite + TypeScript SPA, dashboard/admin UI, serverless API routes, React Query, Tailwind CSS, Supabase client usage, Vercel Analytics, and Speed Insights.
- `studio/`: Sanity Studio, content schemas, Sanity Functions, and editorial tooling.

Sanity is the current content backend and schema source. The product direction is to move toward an in-site CMS that writes to Sanity, so do not treat Sanity Studio as the permanent editorial interface.

## Requirements

- Node.js 22 recommended, matching CI.
- pnpm 10.34.x, managed by the root `packageManager`.
- Sanity project/dataset access for real content.
- Supabase credentials only where required by local API/backend flows.

On Windows PowerShell, prefer `pnpm.cmd` for local commands.

## Install

```powershell
pnpm.cmd install
```

## Development

Run both apps:

```powershell
pnpm.cmd dev
```

Run one app:

```powershell
pnpm.cmd dev:web
pnpm.cmd dev:studio
```

## Repository Structure

```text
.
+-- web/       # Public app, dashboard/admin UI, API routes
+-- studio/    # Sanity Studio, schemas, functions
+-- docs/      # Project docs, security notes, model docs
+-- scripts/   # Local automation
`-- .agents/   # Codex project skills
```

`web/src` follows layered ownership:

```text
web/src/
+-- domain/        # Pure business rules
+-- data/          # Sanity/Supabase access, adapters, services
+-- presentation/  # Pages, layouts, components, hooks, UI
+-- lib/           # Cross-cutting utilities
`-- types/         # Shared TypeScript models
```

Keep related files grouped by feature or domain when it improves discoverability. Avoid large flat folders, but do not add nesting without a clear reason.

## Scripts

Root scripts:

```powershell
pnpm.cmd dev
pnpm.cmd dev:web
pnpm.cmd dev:studio
pnpm.cmd check:web
pnpm.cmd check:studio
pnpm.cmd check
```

Web scripts:

```powershell
pnpm.cmd --dir web lint
pnpm.cmd --dir web typecheck
pnpm.cmd --dir web test
pnpm.cmd --dir web build
pnpm.cmd --dir web check
```

Studio scripts:

```powershell
pnpm.cmd --dir studio lint
pnpm.cmd --dir studio functions:unit
pnpm.cmd --dir studio build
pnpm.cmd --dir studio check
```

Studio deploy commands exist, but do not run deploys unless explicitly intended:

```powershell
pnpm.cmd --dir studio deploy
pnpm.cmd --dir studio deploy-graphql
```

## CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`.

Jobs:

- `web-quality`: lint, typecheck, tests, build for `web`.
- `studio-quality`: lint and build for `studio`.
- `web-performance`: web build plus Lighthouse CI after `web-quality`.

For local validation, run the closest relevant equivalent instead of blindly running every check. Documentation-only changes usually do not need web or studio builds.

## Content And Data

- Sanity schemas live in `studio/schemas`.
- Web Sanity queries, validation, adapters, and services live under `web/src/data/sanity`.
- Domain models live in `web/src/types/models.ts`.
- Supabase-backed operational/security notes live in `docs/SECURITY.md`.
- Supabase reconciliation SQL lives in `docs/supabase-rls-hardening.sql`; run it manually before enabling `SUPABASE_RATE_LIMIT_STORE=supabase`.
- Data model documentation lives in `DATA_MODEL.md`.

Update `DATA_MODEL.md` when Sanity schemas, Supabase tables, relationships, data entities, or important data flows change.

## Agent Instructions

- Global agent rules live in `AGENTS.md`.
- Codex project skills live in `.agents/skills/`.
- MCP setup notes live in `docs/AI_AGENT_SETUP.md`.

Agents should not modify `.codex/config.toml`, MCP config, real `.env` files, or external services unless explicitly requested.

## Repository Hygiene

Keep local-only artifacts out of Git: logs, caches, debug output, generated reports, local env files, editor/system junk, coverage, and build output. Add narrow `.gitignore` rules when new local artifacts appear.

## License

Internal/demo project for portfolio and educational use.
