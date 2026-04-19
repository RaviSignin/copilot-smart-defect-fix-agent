# Agent-Skills Registry

Router/bridge between agents (`.github/agents/`) and skills (`.github/skills/`).
Single source of truth for: which agent uses which skill, at which step, with what input/output contract.

---

## Routing table

| Agent | Step | Skill | Skill file | Input | Output |
|-------|------|-------|-----------|-------|--------|
| _(human-invoked)_ | "start my day" | `start` | `.github/skills/start/SKILL.md` | Trigger phrase | Prioritised issue table → human picks → route to agent |
| `defect-fix` | 3 — Synthesise context | `gather` | `.github/skills/gather/SKILL.md` | JSON array of `{title,body}` ordered Epic→Defect | Context paragraph ≤150 words |
| `defect-fix` | 4 — Identify file | `extract` | `.github/skills/extract/SKILL.md` | Defect title + body + context + file tree + `{project_hints}` | Single repo-relative file path |
| `defect-fix` | 6 — Generate fix (.java) | `fix-be` | `.github/skills/fix-be/SKILL.md` | Defect title + body + context + full file content + `{stack_backend}` + `{conventions_backend}` | Complete fixed backend source file |
| `defect-fix` | 6 — Generate fix (.tsx/.ts/.css) | `fix-fe` | `.github/skills/fix-fe/SKILL.md` | Defect title + body + context + full file content + `{stack_frontend}` + `{conventions_frontend}` | Complete fixed frontend source file |

---

## Trigger flow

```
[Human] "start my day"
  → .github/skills/start/SKILL.md
      → mcp_github_list_issues (auto-fix label)
      → mcp_github_graphql projectItems per issue → keep Status = Ready
      → sort P0→P1→P2 → present table → human picks issue
      → invoke .github/agents/defect-fix.agent.md inline (same session)
```

---

## How agents invoke skills

Agents invoke skills by referencing the skill name in their instructions body:

```markdown
## Step 3 — Synthesise context
Invoke skill: `gather`
Input: JSON array of {title, body} ordered Epic→Defect.
Output: single context paragraph ≤150 words. Store as {context}.
```
