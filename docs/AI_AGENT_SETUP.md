# AI Agent Setup

This document keeps the agent setup for Mentira FC in one place. It is safe to commit because it contains no secrets.

## Recommended MCPs

Use a small set of MCPs:

- Filesystem or equivalent local repo access: required for real code work, architecture review and cross-file analysis.
- Sanity: content, schemas, GROQ and dataset inspection.
- GitHub: PRs, issues, review comments and CI.
- Vercel: deployments, logs, environment variables and Vercel docs. This is the assumed deployment platform.
- Sentry: production issues and event context, only when a Sentry token is available.
- Browser automation: local UI checks against `localhost`.

## MCP Configuration Example

Client-specific MCP config formats vary. Use this as a starting point, then place the real config in your local MCP client config file, not in the repo.

```json
{
  "mcpServers": {
    "sanity": {
      "type": "http",
      "url": "https://mcp.sanity.io/developer"
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    }
  }
}
```

For Sanity, authenticate through the MCP client OAuth flow when possible. If a token-based flow is required, keep the token in the client secret store or local environment, never in this repo.

Prefer read-only Sanity MCP usage unless the task explicitly asks for content writes. The current Studio is an admin interface over Sanity, but the planned direction is an in-site custom CMS that writes to Sanity, so agents should not treat Sanity Studio as the permanent editorial UX.

For GitHub, Sentry and browser automation, prefer the installed Codex plugins/connectors when available. If another MCP client is used, configure those services in the client-specific secret store.

## Repo-Local Skills

The repo includes local skills under `.codex/skills/`:

- `sanity-model-rollout`: use for Sanity-backed fields, documents and detail routes.
- `web-performance-lhci`: use for Lighthouse, bundle, image and first-paint work.
- `public-copy-seo`: use for public copy, metadata and share previews.
- `repo-audit-architecture`: use for architecture audits, dependency boundaries, duplicated logic, dead code and review-style risk analysis.
- `design-system-guidance`: use for UI work that must preserve the Mentira FC sports identity.

If your agent does not auto-discover repo-local skills, point it at `.codex/skills/<skill-name>/SKILL.md`.

## Agent Roles

Use these roles when splitting work:

- Sanity/Data Agent: owns schema-to-web data propagation.
- Web UI Agent: owns React components, hooks and states.
- QA/Performance Agent: owns tests, build, checks, Lighthouse and browser verification.
- Architecture Audit Agent: owns dependency boundaries, dead code, duplicated logic, query weight and missing tests.
- Design System Agent: owns visual consistency, component reuse, typography, spacing and responsive behavior.
- SEO/Copy Agent: owns visible copy, metadata and OG/Twitter behavior.
- Review Agent: owns final bug-focused review across regressions, missing tests, accessibility, waterfalls, bundle impact and verification gaps.

## Work Style

Agents should propose a short plan before editing files. For small documentation or mechanical changes, the plan can be brief; for data, dependency, deployment, UI or architecture changes, the plan should be explicit before implementation.

Leave the repo commit-ready rather than committing automatically when there are repo changes. Final responses should include a suggested conventional commit message only when the agent changed files or `git status --short` shows repo changes. Do not suggest a commit message for analysis-only, review-only, or no-op turns. Examples:

```text
docs: add agent setup guidance
feat: add public llms context
fix: document no-ui lighthouse workflow
```

Agents may install dependencies when justified, but must explain why. Never use `--force` blindly.

Agents must not perform full-repo rewrites, broad architecture migrations, framework migrations or automatic "refactor everything" tasks without a staged plan approved by the user.

Update `DATA_MODEL.md` when a justified schema or model change affects the real data contract. Do not update it for unrelated UI-only changes.

For performance and Lighthouse work, do not change UI or functionality unless the user explicitly asks for that scope.

## Verification Baseline

Use PowerShell-safe commands:

```powershell
cd web
npm.cmd run build
npm.cmd run check
```

```powershell
cd studio
npm.cmd run build
npm.cmd run check
```

For Lighthouse CI, run from the repo root:

```powershell
npm.cmd exec --yes @lhci/cli@0.15.1 -- autorun --config=./web/lighthouserc.json
```

## Security Rules

- Do not commit `.env`, OAuth output, personal tokens or generated MCP credential files.
- Do not give agents write access to Sanity production content unless the task explicitly requires it.
- Prefer read-only MCP access for analysis and review.
- Confirm destructive content operations before running them.
