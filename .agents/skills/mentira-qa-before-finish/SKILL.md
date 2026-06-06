---
name: mentira-qa-before-finish
description: Mentira FC final QA workflow. Use before finishing any task that changed code, schemas, config, docs with executable instructions, API routes, UI, Sanity contracts, Supabase SQL, deploy settings, CI, or repo-local skills.
---

# Mentira QA Before Finish

## Inspect

- Review `git status --short` and changed files.
- Inspect `.github/workflows/` when relevant, and identify jobs/checks that would run on push or pull request.
- Use GitHub Actions as the source of truth for local equivalents when possible.

## Relevant Validation

- Run only checks relevant to changed files.
- Documentation-only changes usually need skill/docs validation and `git diff --check`, not full app builds.
- Frontend code changes: run targeted tests and/or `pnpm.cmd --dir web check` when warranted.
- Studio/schema/function changes: run targeted tests and/or `pnpm.cmd --dir studio check` when warranted.
- CI changes: validate YAML if possible and explain workflow triggers.
- Performance changes: inspect bundle/render/fetch evidence when relevant.
- UI changes: review desktop, tablet, mobile, and loading/error/empty/success states.

## Tests

- For new functionality, look for the existing test framework and follow current style.
- Add unit, component, or integration tests when reasonable.
- Do not introduce a new test framework without justification.
- If tests are not added, explain why.

## Final Answer

- List relevant workflows/checks.
- List local equivalents run.
- List skipped checks and why.
- Summarize changed files, tests added or omitted, remaining risks, and a conventional commit message if files changed.
