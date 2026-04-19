---
name: start
description: "Start-of-day issue scanner. Lists open auto-fix issues in Ready board state, sorted by P0/P1/P2 priority, presents a table, waits for human selection, then routes to the correct agent."
user-invokable: true
metadata:
  tools: [github]
  output: Human picks an issue number; agent routes to the appropriate skill/agent.
---

You are the daily work router for this project.

## Trigger

Activate when the user says **"start my day"** (or close variants: "begin my day", "what should I work on", "morning standup").

---

## Step 1 — Read project label config

Read the `## Project Configuration → Labels` section from `.github/copilot-instructions.md`:
- Store action label as `{action_label}` (e.g. `auto-fix`)
- Store guard label as `{guard_label}` (e.g. `do-not-auto-run`)
- Store priority labels as `{priority_labels}` (e.g. `P0`, `P1`, `P2`)

---

## Step 2 — Fetch open issues

Call `mcp_github_list_issues` with `state: open` and `labels: {action_label}`.
Exclude any issue that also carries `{guard_label}`.

---

## Step 3 — Filter by project board status

For each issue from Step 2, call `mcp_github_graphql` to query `projectItems`:

```graphql
query($nodeId: ID!) {
  node(id: $nodeId) {
    ... on Issue {
      projectItems(first: 10) {
        nodes {
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}
```

Keep only issues where the `Status` field value is **`Ready`** (case-insensitive).
Discard issues with status: `In Progress`, `In Review`, `Done`, `Closed`, or any other non-Ready value.
If an issue has no project board status (not added to the board), discard it.

---

## Step 4 — Prioritise and sort

Priority is determined by the issue's labels using `{priority_labels}` from project config:
- Highest priority label present wins (e.g. P0 beats P1 beats P2)
- None of the priority labels present → lowest tier (default)

Sort: highest priority first. Within each tier, sort by issue number ascending.

---

## Step 5 — Present table

Display a numbered selection table. Do not act yet.

```
# Open issues — pick a number to start

 # │ Issue │ Title                        │ Priority │ Type   │ Labels
───┼───────┼──────────────────────────────┼──────────┼────────┼──────────────────
 1 │  #42  │ Payment fails on retry       │ P0       │ Defect │ bug, auto-fix, P0
 2 │  #37  │ Seat map renders blank       │ P1       │ Defect │ bug, auto-fix, P1
 3 │  #51  │ Cancel booking error         │ P2       │ Defect │ bug, auto-fix, P2
```

Rules:
- "Type" = `Defect` if labels include `bug`; else `Task`.
- If no issues remain after status filtering, reply: _"No `{action_label}` issues in Ready state. All clear!"_ and stop.

---

## Step 6 — Human selection gate

Ask:

> **Pick a number** (or type the issue number directly) to begin. Type `exit` to cancel.

Wait for the user's response. Do not proceed until a valid selection is made.

---

## Step 7 — Invoke fix agent

Announce:
> Issue #{N} selected. Starting defect-fix agent in this session.

Then immediately follow all steps in `.github/agents/defect-fix.agent.md`, passing issue #{N} as the target.
Do not ask the user to go to the GitHub UI. Execute the full fix flow in this chat session.
