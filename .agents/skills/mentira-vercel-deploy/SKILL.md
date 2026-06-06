---
name: mentira-vercel-deploy
description: Mentira FC Vercel deployment workflow. Use when a task affects Vercel deploys, build/install logs, root directory, install/build/output settings, serverless runtime errors, environment variables, analytics, speed insights, or local-vs-production differences.
---

# Mentira Vercel Deploy

## Diagnosis

- Identify the failing phase: install, build, routing, serverless runtime, static assets, observability, or post-deploy.
- Check root directory, install command, build command, and output directory before changing app code.
- Inspect `web/vercel.json`, root scripts, `web/package.json`, and CI workflow expectations.
- Compare local and production: env, Node/pnpm versions, build-time values, deployed bundle, and endpoints.
- Treat pasted `500`, `FUNCTION_INVOCATION_FAILED`, or Vercel logs as runtime/deploy diagnosis first.

## Safety

- Do not change environment variables without explicit confirmation.
- Do not read, print, or commit secrets.
- Do not run manual deploys unless explicitly requested.
- Do not add new serverless functions if an existing route can cover the case.
- Prefer existing surfaces: `/api/admin/[resource]`, `/api/dashboard/<resource>`, `/api/comments`, and `/api/reactions`.

## Validation

- Run local build/check only when deploy-related files or app code changed.
- If the issue depends on Vercel dashboard/env/live logs, state what was and was not verified.
- Update `README.md` when deployment setup or commands change.
