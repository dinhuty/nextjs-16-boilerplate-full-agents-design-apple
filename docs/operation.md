# Operation — AI Work Rules

Operation rules to follow when working with AI (e.g. Cursor, Claude Code).

---

## Operation Rules

Do **not** bypass these without explicit user permission:

| Rule | Meaning |
|------|--------|
| **no-bypass-commit-hook** | Do not use `git commit --no-verify` unless the user explicitly approves. Pre-commit hooks (when configured) run lint/checks; fix issues instead of skipping. |
| **no-bypass-eslint** | Fix ESLint errors; do not disable or ignore rules without a justified reason. When adding or changing code, run `yarn lint` on the files you changed (see [coding-style](core-principles-and-coding-standards/coding-style.md)). |
| **no-bypass-type-check** | Run `yarn build` (Next.js compile + TypeScript) before considering the change done; fix type errors rather than using `any` or `@ts-ignore` to bypass. |
| **no-auto-release** | Do not run deploy/release commands automatically (e.g. `vercel deploy --prod`, `yarn deploy`, anything that publishes). These require explicit user approval. |

---

## Related

- [AGENTS.md](../AGENTS.md) — Entry point for AI agents
- [AI agent guidelines](ai-agent-guidelines.md)
- [Coding style](core-principles-and-coding-standards/coding-style.md)
