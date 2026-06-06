---
name: mentira-feature-architecture
description: Mentira FC feature architecture workflow. Use when implementing a complete feature or changing architecture, folders, modules, data flow, contracts, shared helpers, API boundaries, or frontend/CMS/DB/backend responsibilities.
---

# Mentira Feature Architecture

## Before Editing

- Define the problem the feature solves.
- Identify needed data, source of truth, and consumers.
- Decide what belongs in frontend, CMS, database, API/backend, and deployment/config.
- Reuse existing patterns before creating new ones.
- Explain risks when the feature touches several layers.

## Organization

- Keep related files grouped in logical subfolders.
- Avoid large flat folders with too many unrelated files.
- Propose feature-based or domain-based subfolders when a folder is becoming hard to scan.
- Do not add nesting just for architecture aesthetics.
- Colocate component, styles, tests, hooks, utils, and types when that improves discoverability.
- When moving files, update imports carefully and search for stale paths.

## Boundaries

- Do not mix `presentation`, `data`, `domain`, `web/api`, `studio`, and Supabase responsibilities.
- Avoid broad refactors unless the feature needs them.
- Do not add a serverless function if an existing route can be safely extended.
- Keep `/dashboard` editorial and `/admin` operational unless the user asks otherwise.

## Tests And Docs

- Look for the existing test framework and follow current style.
- Add unit, component, or integration tests for new functionality when reasonable.
- Update `README.md` for setup, command, architecture, deployment, or usage changes.
- Update `DATA_MODEL.md` for schema, table, relationship, entity, or important data-flow changes.
