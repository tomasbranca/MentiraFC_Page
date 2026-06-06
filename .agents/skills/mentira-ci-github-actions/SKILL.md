---
name: mentira-ci-github-actions
description: Mentira FC GitHub Actions workflow. Use when a task affects `.github/workflows`, automatic checks, lint, build, tests, preview validation, deploy validation, scheduled jobs, manual workflows, pnpm CI setup, or GitHub automation.
---

# Mentira CI GitHub Actions

## Inspect First

- Inspect `.github/workflows/` before finalizing changes.
- Identify which jobs run on `push`, `pull_request`, `workflow_dispatch`, or `schedule`.
- Use workflows as the source of truth for relevant local equivalents.

## Workflow Design

- Keep workflows simple and maintainable.
- Use pnpm because this repo uses pnpm.
- Separate `web` and `studio` checks when their dependencies or failure modes differ.
- Use cache when it saves time without making behavior opaque.
- Keep job and step names clear.
- Do not store secrets in YAML or print them in logs.
- Do not add expensive or noisy automation without a clear need.
- Do not add deploy/publish automation without explicit confirmation.

## Validation

- Validate YAML when possible.
- Check commands against root, `web`, and `studio` `package.json`.
- If real GitHub Actions cannot run locally, say so and run closest local equivalents when relevant.
- Update `README.md` if CI behavior, commands, or contributor workflow changes.
