---
name: mentira-content-flow
description: Mentira FC dynamic content workflow. Use when a task affects news, next match, fixture, squad, standings, cards, home data, dashboard-published content, CMS/database freshness, cache, revalidation, fetch strategy, or content shown in `web`.
---

# Mentira Content Flow

## Classify The Data

- Separate editorial content, sports content, administrative data, and critical user/permission data.
- Match cache/fetch strategy to update frequency, cost, and importance.
- Do not use the same strategy for news, next match, fixture, squad, standings, and cards.
- Do not solve every freshness issue with polling.

## Trace The Flow

1. Identify the data source: Sanity, Supabase, API route, bootstrap payload, React Query cache, or local state.
2. Check schema/table shape, required fields, defaults, drafts, RLS/policies, and relationships.
3. Check query params, filters, limits, sort, null handling, and payload size.
4. Check adapters and consumer components.
5. Check cache, revalidation, React Query keys, invalidation, TTL, runtime/browser cache, and build-time values before blaming UI.
6. Check loading, error, empty, and success states.
7. Verify production can reflect the change: env, published/draft state, endpoint, deploy bundle, and cache layer.

## Strategy Hints

- News: published state, slug, optional image, metadata, and lean listing queries.
- Next match: freshness and clear fallback when no match is scheduled.
- Fixture/history: ordering, tournament/team filters, and summary payloads.
- Squad: missing photo, slug, stats, or inactive players.
- Home/cards: bootstrap data, home-specific queries, and derived domain data.

## Docs

- Update `DATA_MODEL.md` when the data contract changes.
- Update `README.md` only when behavior, setup, or project-level architecture changes.
