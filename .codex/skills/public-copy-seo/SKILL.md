---
name: public-copy-seo
description: Public copy and SEO workflow for Mentira FC. Use when editing visible Spanish copy, empty states, errors, footer text, institutional messaging, mojibake, document titles, meta descriptions, Open Graph, Twitter tags, or SPA share-preview explanations.
---

# Public Copy SEO

Use this skill for public-facing language and metadata in Mentira FC. Propose a short plan before editing. Keep the tone institutional, sponsor-safe and aligned with an amateur club identity.

## Copy Rules

- Prefer professional club language over jokes or overly casual phrasing.
- Sweep nearby empty states, errors, buttons and footer text when editing a public page.
- Fix mojibake and broken accents when found in visible strings.
- Avoid changing product behavior while doing a copy-only pass.
- Leave the repo commit-ready when edits are made. Suggest a conventional commit message only if the repo has changes.

## SEO Rules

- Use shared helpers in `web/src/presentation/seo/` instead of ad hoc head mutations.
- Keep route-back metadata reset behavior intact.
- Be explicit about SPA limits: browser-side metadata helps users and browser navigation, but social crawlers may still need prerender, SSR, edge metadata, or static OG image generation for true per-route previews.

## Files To Inspect

- `web/src/presentation/seo/head.ts`
- `web/src/presentation/seo/metadata.ts`
- `web/src/presentation/seo/RouteHead.tsx`
- `web/src/presentation/pages/**`
- `web/src/presentation/components/**`
- `web/index.html`
- `web/public/og_image.png`
- `README.md` when public project wording is part of the task.

## Validation

For copy-only changes, run targeted lint or the full web check based on risk. For metadata, route or component changes, run:

```powershell
cd web
npm.cmd run build
npm.cmd run check
```
