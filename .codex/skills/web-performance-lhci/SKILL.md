---
name: web-performance-lhci
description: Performance and Lighthouse CI workflow for Mentira FC. Use when optimizing first paint, LCP, CLS, image delivery, Sanity request waterfalls, bundle size, Vite chunks, sourcemaps, Lighthouse assertions, or CI performance checks in `web`.
---

# Web Performance LHCI

Use this skill for performance work in the Mentira FC public app. Propose a short plan before editing and prioritize real first-paint bottlenecks before cosmetic tuning.

## Priority Order

1. Reduce render delay and critical requests.
2. Split home-critical data from non-critical tables, top scorers, history and tournament data.
3. Fix image delivery, dimensions, `srcSet`, `sizes` and Sanity image URL handling.
4. Check route-level splitting, lazy imports and React render waterfalls before adding new libraries.
5. Reduce unused initial JavaScript and keep Vite chunking conservative.
6. Use React profiling or browser evidence when a render bottleneck is suspected.
7. Adjust Lighthouse CI assertions only when the gate is broader than the product need.

## Files To Inspect

- `web/src/data/getInitialData.ts`
- `web/src/data/getRouteInitialData.ts`
- `web/src/data/sanity/queries/home.queries.ts`
- `web/src/data/imageService.ts`
- `web/vite.config.js`
- `web/lighthouserc.json`
- `.github/workflows/ci.yml`
- lazy route imports in `web/src/App.tsx`
- React Query hooks and `InitialDataContext` consumers
- `web/public/robots.txt`
- `web/public/patterns/`
- `web/public/sponsors/`

## Lighthouse CI

Run LHCI from the repo root because `web/lighthouserc.json` already starts preview from `web`:

```powershell
npm.cmd exec --yes @lhci/cli@0.15.1 -- autorun --config=./web/lighthouserc.json
```

Do not change UI or functionality unless the user explicitly asks for that scope. Prefer semantic, data-loading, image, bundle or config fixes first.

## Validation

For web changes:

```powershell
cd web
npm.cmd run build
npm.cmd run check
```

If browser automation is unavailable, state that clearly and use build output, HTTP status and Lighthouse evidence instead of implying a visual walkthrough happened.

Leave the repo commit-ready when edits are made. Suggest a conventional commit message only if the repo has changes.
