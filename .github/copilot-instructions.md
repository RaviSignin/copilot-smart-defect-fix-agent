# Copilot — Sample App Repo Instructions

## FIRST CHECK — do this before anything else

When assigned to any issue:
1. Call `mcp_github_get_issue` to read the issue labels.
2. If the `auto-fix` label is **not present** → post comment: _"Skipping: this issue does not have the `auto-fix` label. Assign the label to proceed."_ then **stop immediately. Do not read the issue. Do not write any code. Do not open any PR.**
3. If the `do-not-auto-run` label is present → post comment: _"Skipping: do-not-auto-run label detected."_ then **stop immediately.**

Only continue past this check if `auto-fix` is present and `do-not-auto-run` is absent.

---

## Project

Sample App (Simple Hello World Application)
Stack: Java 21 / Spring Boot 3.2.x / React 18 / TypeScript / Vite
Tests: JUnit 5 + JaCoCo (backend)

## Issue hierarchy

Epic → Story → Task → Defect via `trackedInIssues` sub-issue links.
Always walk the full chain before acting — each level carries feature intent and business rules.

## Project board

Defects originate from a GitHub Projects board linked to this repo.
Board identity is discovered at runtime by querying the issue's `projectItems` via `mcp_github_graphql` — no org or project number is hardcoded.

## Trigger flow

```
"start my day" in Copilot chat
  → .github/skills/start/SKILL.md  (triage + selection from open issues labeled {action_label})
      → keep only Ready issues, sort by {priority_labels}: P0 → P1 → P2
      → select issue #{N} (must include {action_label}; exclude {guard_label})
      → .github/agents/defect-fix.agent.md  (orchestrator)
      Step 0:  read ## Project Configuration below → load {stack_*}, {conventions_*}, {project_hints}, {labels}
      Step 1:  read issue + mcp_github_graphql projectItems
               → {board}, {project_id}, {project_item_id}, {status_field_id}, {in_review_option_id}
      Step 2:  walk Epic → Story → Task → Defect hierarchy
      Step 3:  skill gather → {context}
      Step 4:  skill extract → {file_path}
      Step 5:  read file
      Step 6:  skill fix-be OR fix-fe → {fixed_content}
      Step 7:  branch fix/issue-{N} → commit
      Step 8:  open PR
      Step 9:  post <!-- copilot-defect-fix-complete --> on issue
      Step 10: read CODEOWNERS → request reviewer
      Step 11: mcp_github_graphql updateProjectV2ItemFieldValue → Status = "In review"
```

One agent runs at a time. Concurrent assignments queue — never run in parallel.

## Agent compliance — mandatory

When assigned to any issue in this repo, you MUST:
1. Load and follow `.github/agents/defect-fix.agent.md` step by step, in order.
2. Read `## Project Configuration` below to populate all `{placeholders}` before Step 1.
3. Never skip a step. Never substitute your own reasoning for a step defined in the agent.
4. Skills (`gather`, `extract`, `fix-be`, `fix-fe`) are invoked from the agent — follow them exactly when referenced.
5. Steps 9, 10, and 11 are MANDATORY. The session is not complete until all three are done.

## Safety — non-negotiable

- Only act on issues that have the `auto-fix` label — stop immediately if it is absent
- Never commit to `{base_branch}` (configured in `### Labels`)
- Never auto-merge or auto-approve
- Never skip `do-not-auto-run` label check
- Never close or resolve issues
- Always request human review before merge
- Branch: `fix/issue-{N}`

## Human approval gate

After PR is open:
1. Post PR link on issue
2. Request reviewer
3. Stop — do not merge

## MCP tools

| Step | Operation | Tool |
|------|-----------|------|
| First check | Read issue labels — verify `auto-fix` is present, else stop | `mcp_github_get_issue` |
| Step 0 | Read project configuration (this file) | _(read this file)_ |
| Step 1 | Read issue body + labels + `trackedInIssues` | `mcp_github_get_issue` |
| Step 1 | Discover project board — store `{project_id}`, `{project_item_id}`, `{status_field_id}`, `{in_review_option_id}` | `mcp_github_graphql` |
| Step 2 | Walk parent issues (Epic → Defect chain) | `mcp_github_get_issue` (repeated per parent) |
| Step 2 | Post hierarchy review comment | `mcp_github_add_issue_comment` |
| Step 3 | Synthesise context (gather skill) | _(skill — no MCP call)_ |
| Step 4 | Search repository file tree | `search/codebase` |
| Step 5 | Read file content | `mcp_github_get_file_contents` |
| Step 6 | Generate fix (fix-be or fix-fe skill) | _(skill — no MCP call)_ |
| Step 7 | Create fix branch | `mcp_github_create_branch` |
| Step 7 | Commit fixed file | `mcp_github_push_files` |
| Step 8 | Open pull request | `mcp_github_create_pull_request` |
| Step 9 | Post completion comment on issue | `mcp_github_add_issue_comment` |
| Step 10 | Read CODEOWNERS | `mcp_github_get_file_contents` |
| Step 10 | Request human reviewer | `mcp_github_request_reviewers` |
| Step 11 | Move issue to "In review" on project board | `mcp_github_graphql` (`updateProjectV2ItemFieldValue`) |

---

## Project Configuration

> The agent reads this section at Step 0 to populate all `{placeholders}` used by skills.

### Labels

```
action_label:    auto-fix
guard_label:     do-not-auto-run
priority_labels: P0, P1, P2
base_branch:     main
```

### Backend stack

```
stack_backend:
  Java 21, Spring Boot 3.2.x, Spring Security + JWT (jjwt), Spring Data JPA, PostgreSQL 15, Flyway

conventions_backend:
  package_root:    com.example
  packages:        config | controller | service | service/impl | repository
                   dto/request | dto/response | entity | security | exception
  migration_path:  backend/src/main/resources/db/migration/V{N}__{description}.sql
  patterns:        Lombok, constructor injection, SLF4J logging, Jakarta validation, DTOs at API boundary
```

### Frontend stack

```
stack_frontend:
  React 18, TypeScript (strict mode), Vite 4, React Router 6, Axios with interceptors

conventions_frontend:
  component_folder: frontend/src/components/
  page_folder:      frontend/src/pages/
  service_folder:   frontend/src/services/
  styling:          co-located .css files per component/page; design tokens in frontend/src/styles/sky-theme.css
  auth:             access token held in memory; refresh token in sessionStorage
```

### File hints

Used by `extract` skill to break ties when multiple files are plausible:

```
auth login / token logic:     backend/src/main/java/com/example/security/
auth service logic:           backend/src/main/java/com/example/service/AuthenticationService.java
registration:                 backend/src/main/java/com/example/service/RegistrationService.java
booking / reservation:        backend/src/main/java/com/example/service/ReservationService.java
payment:                      backend/src/main/java/com/example/service/PaymentService.java
flight search / inquiry:      backend/src/main/java/com/example/service/FlightInquiryService.java
cancellation:                 backend/src/main/java/com/example/service/CancellationService.java
admin flight management:      backend/src/main/java/com/example/service/AdminFlightService.java
login page (UI):              frontend/src/pages/auth/LoginPage.tsx
registration page (UI):       frontend/src/pages/auth/RegistrationPage.tsx
flight search page (UI):      frontend/src/pages/flights/FlightSearchPage.tsx
booking page (UI):            frontend/src/pages/booking/BookingPage.tsx
reservation detail (UI):      frontend/src/pages/reservations/ReservationDetailPage.tsx
header / nav (UI):            frontend/src/components/Header.tsx
visual / styling defect:      frontend/src/styles/sky-theme.css or co-located .css file
```

## Coding rules

- Preserve all method signatures, class names, package declarations, and field names exactly
- Fix only what the issue describes — no refactoring, renaming, reformatting, or cleanup
- Complete files only — no truncation, no `// rest unchanged`, no ellipsis
- No markdown fences in raw source output
- No secrets, no hardcoded credentials, no `.env` files committed
