---
name: mentira-sanity-cms
description: Mentira FC Sanity CMS workflow. Use when a task affects Sanity Studio, `studio/schemas`, GROQ, documents, previews, validation, slugs, references, images, drafts, adapters, services, or schema-to-web data contracts.
---

# Mentira Sanity CMS

## Source Of Truth

- Inspect `studio/schemas/*.schema.js` before changing GROQ or UI consumers.
- Register new document types in `studio/schemas/index.js`.
- Treat Sanity as the current content backend; do not assume Sanity Studio is the final editorial UI.
- Treat `DATA_MODEL.md` as documentation, not as the source of truth.

## Free Plan Awareness

- Keep schemas lean and avoid over-modeling.
- Avoid duplicating large content when references or derived values are better.
- Minimize unnecessary storage, asset weight, and bandwidth.
- Be careful with images and large Portable Text payloads.
- Keep listing GROQ projections small; reserve full payloads for detail views.

## Contract Path

Keep this path aligned when fields or document types change:

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

## Rules

- Prefer backward-compatible changes.
- Use clear field names and editorial validation.
- Handle nulls, optional fields, missing images, missing slugs, incomplete references, and drafts.
- Pass dynamic values through GROQ params; do not interpolate user input into query strings.
- Update `DATA_MODEL.md` when schemas or web data contracts change.

## Validation

- Run only relevant `studio` and `web` checks for changed files.
- Explain skipped checks and any Sanity free-plan tradeoffs.
