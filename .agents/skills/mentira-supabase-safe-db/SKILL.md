---
name: mentira-supabase-safe-db
description: Mentira FC Supabase safety workflow. Use when a task affects Supabase SQL, tables, migrations, RLS, policies, grants, RPCs, auth/session data, generated types, private schemas, storage, or database-backed app data.
---

# Mentira Supabase Safe DB

## Strict Rules

- Do not execute Supabase SQL migrations directly.
- Do not apply destructive database changes directly.
- Provide SQL in the final response for the user to run manually in the Supabase SQL Editor.
- Never expose, request, or place `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Never disable RLS without a strong reason, narrow scope, and rollback guidance.

## SQL Output Requirements

When DB changes are needed, include:

- The SQL.
- What it changes.
- Whether it is safe or destructive.
- Rollback guidance when relevant.
- Required follow-up app code or generated type updates.

## Boundaries

- Frontend code may only use public `VITE_*` values and publishable keys.
- Service role usage belongs only in server-side API code, never browser bundles.
- Keep `private.*` operational data away from direct client access.
- UI guards are not security boundaries; sensitive actions need API and/or RLS enforcement.

## Diagnostics

- For permission failures, inspect grants, exposed schemas, RLS, policies, auth state, active user state, and role/permission data.
- Validate UUIDs, slugs, sort, limit, and filters before SQL/RPC usage.
- Handle nulls, missing relationships, inactive users, and empty states.

## Docs And Tests

- Update `DATA_MODEL.md` for table, policy, relationship, or data-flow changes.
- Follow existing tests and add coverage for new database-backed behavior when reasonable.
