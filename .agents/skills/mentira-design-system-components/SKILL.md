---
name: mentira-design-system-components
description: Mentira FC reusable component workflow. Use when creating or changing shared cards, buttons, inputs, layouts, badges, loaders, modals, headers, repeated visual blocks, variants, or presentation primitives in `web`.
---

# Mentira Design System Components

## Before Creating

- Search existing components before adding a new one.
- Do not duplicate an existing component with minor styling differences.
- Keep local-only UI local unless reuse or readability justifies extraction.
- Prefer composition over large prop surfaces.

## Component Shape

- Maximize logical componentization: extract clear sections, reusable visual blocks, repeated logic, or bulky JSX.
- Avoid over-abstraction and tiny wrapper components that make code harder to follow.
- Keep components small, readable, and named for their role.
- Separate data logic from presentation when the component is shared or reused.
- Keep variants explicit and limited to real product needs.
- Briefly document important shared props when behavior is not obvious.

## Visual Consistency

- Preserve the current Mentira FC identity and existing component patterns.
- Keep spacing, typography, states, and responsive behavior consistent.
- Coordinate with `mentira-ux-product-review` for flow/comfort changes and `mentira-performance-web-vitals` for image/render/bundle impact.

## Validation

- Verify key variants, states, and responsive behavior affected by the component.
- Add focused tests when component logic, branching, or interaction changes.
