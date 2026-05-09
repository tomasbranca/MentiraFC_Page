---
name: sanity-model-rollout
description: End-to-end Sanity-backed model and field rollout for Mentira FC. Use when adding or changing Studio schemas, GROQ queries, Zod schemas, adapters, services, TS models, bootstrap payloads, detail routes, Team placement, SEO metadata, or tests across `studio` and `web`.
---

# Sanity Model Rollout

Use this skill for Sanity-backed behavior in Mentira FC. Start from the content source of truth and keep every downstream web contract aligned.

Propose a short plan before editing. The current Studio is not the final product direction; the future custom CMS should write to Sanity, so preserve Sanity as backend/source-of-truth while avoiding assumptions that Sanity Studio is the permanent admin UX.

## Workflow

1. Identify the authoritative schema in `studio/schemas/*.schema.js`.
2. Register any new document type in `studio/schemas/index.js`.
3. Update GROQ in `web/src/data/sanity/queries/*.queries.ts`.
4. Update validation in `web/src/data/sanity/schemas.ts`.
5. Update the adapter in `web/src/data/sanity/adapters/*.adapter.ts`.
6. Update the service wrapper in `web/src/data/sanity/services/*.service.ts` when needed.
7. Update shared TS models in `web/src/types/models.ts`.
8. For route or bootstrap data, update:
   - `web/src/data/getInitialData.ts`
   - `web/src/data/getRouteInitialData.ts`
   - `web/src/data/initialDataPayload.ts`
   - `web/src/data/queryKeys.ts`
   - `web/src/main.tsx`
9. Update route pages, hooks, UI consumers and SEO metadata.
10. Add or update focused tests near the changed adapter, query or domain logic.

## Local Rules

- Treat `DATA_MODEL.md` as documentation, not as a replacement for live schemas and adapters.
- Update `DATA_MODEL.md` when a justified schema or model change affects the real data contract.
- Keep duplicated business rules synchronized. Tournament table classification exists in both domain and presentation paths.
- For player-like detail models, mirror the player pipeline unless the user explicitly narrows scope.
- Preserve `InitialDataContext`, `reportError`, manual `refetch`, and bootstrap error behavior unless the task asks for a redesign.
- Prefer accessible visual fallbacks over raw missing-image failures.
- Leave the repo commit-ready when edits are made. Suggest a conventional commit message only if the repo has changes.

## Validation

Use `npm.cmd` in PowerShell:

```powershell
cd web
npm.cmd run build
npm.cmd run check
```

```powershell
cd studio
npm.cmd run build
npm.cmd run check
```

Run both packages when a schema change affects public data.
