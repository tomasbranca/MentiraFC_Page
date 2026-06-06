---
name: mentira-performance-web-vitals
description: Mentira FC web performance workflow. Use when a task affects initial load, Core Web Vitals, bundle size, images, rendering, fetch strategy, cache, lazy loading, route weight, fonts, Lighthouse, or perceived performance in `web`.
---

# Mentira Performance Web Vitals

## Guardrails

- Preserve the current UI and UX during performance-only work.
- Do not change layout, spacing, colors, hierarchy, animations, or behavior unless explicitly requested.
- If a UI tradeoff is required for performance, explain it before applying it.
- Avoid micro-optimizations without user-visible or measurable impact.

## Focus Areas

- Bundle size and expensive imports.
- Image size, dimensions, `srcSet`, `sizes`, loading mode, and Sanity image helpers.
- Data shape, duplicate fetches, waterfalls, cache, and revalidation strategy.
- Lazy loading for routes, panels, modals, and heavy dependencies.
- Avoidable renders from derived state, unstable props, and unnecessary effects.
- Font loading and layout shift.
- LCP, INP, and CLS impact.

## Coordination

- Use `mentira-content-flow` for freshness and cache strategy.
- Use `mentira-vercel-deploy` for production-only performance symptoms.
- Use `mentira-frontend-react` for component/hook implementation.

## Validation

- Use build output, Lighthouse, bundle evidence, browser profiling, or focused tests when relevant.
- If no measurement is available, label the result as reasoned rather than measured.
