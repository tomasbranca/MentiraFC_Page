---
name: design-system-guidance
description: Mentira FC UI and design-system guidance. Use when creating, changing, or reviewing React UI, cards, widgets, scoreboards, page sections, loading states, empty states, sports visuals, Tailwind classes, typography, spacing, colors, or responsive behavior in `web`.
---

# Design System Guidance

Use this skill for UI work in Mentira FC. Propose a short plan before editing UI. Preserve the club identity instead of drifting into a generic SaaS or marketing template.

## Visual Identity

- Treat the site as an official amateur club experience.
- Favor a sports-broadcast feel: strong contrast, dark surfaces, image overlays, bold labels, score/widget clarity and confident hierarchy.
- Keep the palette anchored in violet, neutral black/white and restrained accents. Avoid making the whole UI a flat single-hue purple surface.
- Use `Archivo` for headings and `Roboto` for body text, matching `web/src/index.css`.
- Keep headings uppercase and strong where the existing design does.
- Prefer compact, information-dense sports components over decorative landing-page sections.

## Component Rules

- Reuse existing components and patterns before adding new ones:
  - `Button`
  - `ProgressiveMedia`
  - `NewsCard`
  - `PlayerCard`
  - `StaffCard`
  - `GameWidget`
  - skeleton components
- Use Sanity and local images through existing image helpers and progressive media patterns.
- Keep stable dimensions for cards, widgets and media with fixed aspect ratios, explicit dimensions or responsive constraints.
- Do not add decorative containers, excessive rounding, generic gradients, or unrelated illustrations unless the user asks for a visual redesign.
- Use accessible empty, loading and error states. Do not leave silent blanks for failed data unless the existing UX intentionally does so.

## Layout And Responsiveness

- Preserve desktop polish while keeping mobile usable.
- Avoid text overflow in buttons, cards and stat widgets.
- Use line clamps and responsive sizes where existing components already do.
- Do not change UI or functionality for performance/LHCI tasks unless the user explicitly asks.

## Review Checklist

- Does the UI match the existing violet/neutral sports identity?
- Does it reuse existing components or utilities?
- Are images optimized with explicit dimensions, `loading`, `decoding`, `srcSet` or `sizes` where useful?
- Are loading, empty and error states clear?
- Does mobile avoid overlap, clipped text and layout jumps?
- Is business logic outside presentation components?

## Validation

Run `npm.cmd run check` in `web` for UI changes. If visual behavior matters, use browser verification when available and call out any skipped visual check.
