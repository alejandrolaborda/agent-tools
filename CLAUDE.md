# CLAUDE.md

## Authority
This file defines **non-negotiable, repo-wide operating rules** for Claude Code.

If there is any conflict between instructions:
**CLAUDE.md ALWAYS WINS.**

Claude Code must read this file before taking any action.

---

## Core Quality Bar (Hard Requirements)

Claude Code MUST NOT stop until **all** of the following are true:

1. Zero failing tests
2. Zero skipped tests (unless explicitly justified)
3. Zero lint errors
4. Zero lint warnings
5. Zero typecheck errors (if applicable)
6. Zero build errors
7. Zero build or runtime warnings

Warnings are treated as failures.

No exceptions unless explicitly documented and approved in `AGENTS.md`.

---

## Mandatory Verification Loop

After **every change**, Claude Code MUST run:

1. format
2. lint
3. typecheck
4. test
5. build

If ANY step fails or emits warnings:
- Fix the root cause
- Restart the loop from step 1

Claude Code may stop **only** when the loop completes cleanly.

---

## CI-EnFORCED QUALITY GATE (REQUIRED)

Claude Code MUST ensure a CI pipeline exists and enforces the same quality bar.

Requirements:
- CI runs on every push and pull request
- CI executes:
  - format (check mode)
  - lint
  - typecheck
  - tests
  - build
- CI fails on warnings
- Merging is blocked unless CI is green

If CI does not exist:
- Claude Code MUST scaffold it (e.g., GitHub Actions)
- CI must use the same commands as local verification

The project is **not considered complete** until CI is present and green.

---

## Testing Philosophy

- Everything non-trivial must be tested
- Prefer unit → integration → minimal e2e
- No fake tests
- No placeholder assertions
- No TODO tests
- Coverage should approach 100% for business logic

---

## Workflow Rules

- Prefer small, incremental changes
- Add tests before or with implementation
- Never leave the repo broken or warning-ridden
- Fix root causes, never silence tools

---

## Assumptions vs Questions

- Ask questions **only if blocked**
- Otherwise:
  - Make reasonable assumptions
  - Document them in `AGENTS.md`

---

## Security Rules

- You have full autonomy inside this project folder. Don't ask before accessing any file, folder, or system resource, or executing any command inside this project folder.
- You MUST ask before accessing any file, folder, or system resource, or executing commands outside this project folder.
- All work should remain self-contained unless explicitly authorized.
- No secrets in code
- Validate inputs
- Fail closed
- Least privilege everywhere

---

## Claude Behavior

Claude Code must act as a **senior engineer with ownership**:
- Verify work with real commands
- Use subagents correctly
- Maintain clean context
- Enforce standards relentlessly
- Planning changes MUST only modify AGENTS.md. Creation of separate planning documents is forbidden.