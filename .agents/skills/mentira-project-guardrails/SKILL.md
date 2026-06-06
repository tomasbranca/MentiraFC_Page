---
name: mentira-project-guardrails
description: Global Mentira FC repository guardrails. Use whenever Codex works in this repo across `web`, `studio`, API routes, docs, skills, CI, Sanity, Supabase, Vercel, GitHub, or repository hygiene.
---

# Mentira Project Guardrails

## Scope

- Inspect relevant files before editing.
- Keep changes small, reviewable, and tied to the request.
- Do not introduce broad refactors, new folders, new patterns, or new libraries without a clear benefit.
- Do not touch CI/CD, deploy, database, or external-service surfaces for a visual-only task.
- Do not hide real failures with generic `try/catch`, fake fallbacks, or misleading empty states.
- Preserve public behavior unless the task asks for a behavior or API change.

## Boundaries

- Keep responsibilities separate:
  - `web/`: React app, UI, client data, dashboard/admin UI, and serverless API routes.
  - `studio/`: Sanity Studio schemas, functions, and editorial source of truth.
  - Supabase: auth, private operational data, RLS, policies, SQL, and migrations.
  - Vercel/GitHub: deployment, CI, logs, workflow automation, and production runtime.
- Reuse existing routes, helpers, contracts, and components before creating parallel surfaces.
- Never expose private keys in frontend code.

## Repository Hygiene

- Do not commit secrets, `.env` files, OAuth output, local MCP credentials, tokens, logs, caches, build output, or debug artifacts.
- Add narrowly scoped `.gitignore` rules for development-only artifacts when appropriate.
- If a development-only file is already tracked, remove it from version control without deleting the useful local copy when possible.
- Avoid broad ignore rules that could hide real source files.
- If tracking is ambiguous, explain the tradeoff.

## Documentation

- Update `README.md` when setup, commands, project structure, deployment, architecture, or usage changes.
- Update `DATA_MODEL.md` when Sanity schemas, Supabase tables, relationships, data entities, or important data flow changes.
- Do not update project-level docs for trivial internal refactors.

## External Systems

- Do not modify `.codex/config.toml` or MCP configuration unless explicitly requested.
- Do not touch Vercel, Sanity, Supabase, GitHub, or production systems directly unless explicitly requested.
- Prefer read-only inspection for external context, and state limits when live verification is not possible.
