---
name: mentira-frontend-react
description: Mentira FC React frontend workflow. Use when a task affects `web` components, pages, hooks, styles, routing, React Query state, dashboard/admin UI, SEO metadata, responsive behavior, or frontend data states.
---

# Mentira Frontend React

## Structure

- Respect the current layers: `domain`, `data`, `presentation`, `lib`, and `types`.
- Keep data fetching, adapters, and server-state concerns out of presentational components when practical.
- Prefer React Query and existing query keys/helpers for server-state.
- Avoid new libraries unless the benefit clearly beats local patterns.

## Components

- Extract components when JSX is getting large, logic repeats, a visual block is reusable, a section has a clear responsibility, or readability improves.
- Do not create tiny components that make navigation harder.
- Use clear component names and keep props explicit.
- Keep component, styles, tests, hooks, utils, and local types colocated when that improves discoverability.
- Use `mentira-design-system-components` for shared components and variants.

## UI States

- Handle loading, error, empty, and success states for external data and mutations.
- Do not turn real fetch/permission/data failures into silent blank states.
- Keep accessible labels, focus behavior, and action feedback.
- Validate desktop, tablet, and mobile implications for UI changes.

## Coordination

- Use `mentira-ux-product-review` for flows, forms, navigation, CTAs, and information hierarchy.
- Use `mentira-performance-web-vitals` for images, bundle, fetch, cache, lazy loading, and render cost.
- Use `mentira-content-flow` when content freshness or cache strategy is part of the issue.

## Validation

- Run only checks relevant to changed frontend files.
- Prefer targeted tests for changed behavior, then `pnpm.cmd --dir web check` when the blast radius warrants it.
- Explain skipped frontend validation in the final answer.
