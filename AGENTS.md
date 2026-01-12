# AGENTS.md

## Project Execution Playbook

This document defines **how Claude Code should build this project**, how work is delegated across subagents, and how progress is verified.

Source of truth for requirements: **PROJECT_SPECS.md**  
Repo-wide governing rules: **CLAUDE.md**

---

## 1. Execution Mandate

Claude Code MUST:

- Read `CLAUDE.md` before any action
- Read `PROJECT_SPECS.md` as the source of truth
- Generate all required **subagents**
- Generate all required **skills**
- Scaffold all required **tooling and CI**
- Use any required MCP (Model Checking Protocol) to verify the project
- Use any required LSP (Language Server Protocol) to provide code completion and other features
- Ensure best practices are followed
- Ensure latest versions possible of dependencies are used, adapt to full compatibility
- Create a .gitignore file with any files and folders that should be ignored by git in the root of the project
- Iterate until the project is **fully working, warning-free, and fully tested**

Partial completion is not acceptable.

---

## 2. Project Overview

This project is built from `PROJECT_SPECS.md`. Claude Code is expected to transform those specs into a **production-grade system** with:

- Clean architecture
- Deterministic builds
- Exhaustive test coverage
- Zero errors and zero warnings

The primary goal is **correctness and reliability**, not speed alone.

---

## 3. Non-Goals / Explicitly Out of Scope

Unless explicitly stated in `PROJECT_SPECS.md`, the following are out of scope:

- Premature optimization
- UI polish beyond functional correctness
- Legal, licensing, or compliance work
- Manual workflows where automation is feasible

---

## 4. Architecture Principles

The system must follow these principles:

- Clear module boundaries
- Dependency inversion at boundaries
- Testability first
- Deterministic, reproducible builds

Initial conceptual model:

```
[ Interface ] → [ Application ] → [ Infrastructure ]
      ↑               |                 |
   [ Tests ]       [ Domain ]      [ External IO ]
```

---

## 5. Required Commands

Claude Code MUST ensure the following commands exist and run cleanly:

- `format`
- `lint`
- `typecheck` (if applicable)
- `test`
- `build`

If any are missing:
- Scaffold minimal tooling (Makefile, package scripts, justfile, etc.)
- Commands must be real, deterministic, and runnable locally and in CI

All commands must run with **zero warnings**.

---

## 6. Milestones & Definition of Done

Claude Code MUST generate milestones based on `PROJECT_SPECS.md`.

Each milestone must include:
- Deliverables
- Acceptance criteria
- Required tests
- Verification commands

A milestone is **DONE** only when:
- All acceptance criteria pass
- Full verification loop is green
- CI is green
- No warnings exist

---

## 7. Backlog Expectations

Claude Code MUST generate and maintain an ordered backlog.

Each backlog item must:
- Be small and executable
- Describe the change
- Specify the tests that prove it works
- Be independently verifiable

---

## 8. Subagents (REQUIRED)

Claude Code MUST generate the following subagents in `.claude/agents/`:

### planner
- Converts specs into milestones and backlog
- Defines acceptance criteria

### architect
- Defines system boundaries and contracts
- Prevents architectural drift

### implementer
- Writes production code
- Runs the verification loop

### tester
- Enforces coverage and correctness
- Writes missing or weak tests
- Eliminates flaky tests

### reviewer
- Performs final quality, security, and regression pass

---

## 9. Skills (REQUIRED)

Claude Code MUST generate the following skills in `.claude/skills/`:

- `repo-commands` – canonical build/test commands
- `style-standards` – formatting, naming, conventions
- `spec-guardrails` – enforces PROJECT_SPECS.md constraints
- `quality-gate` – enforces CLAUDE.md rules automatically

---

## 10. CI Enforcement

Claude Code MUST:

- Scaffold CI (e.g., GitHub Actions) if not present
- Ensure CI mirrors the local verification loop
- Fail CI on any error or warning
- Block merges unless CI is green

CI is part of the definition of done.

---

## 11. Assumptions & Open Questions

Claude Code should:
- Document assumptions explicitly
- Ask questions only if truly blocking

This section should trend toward empty.

---

## 12. Mandatory Execution Order

Claude Code MUST follow this order:

1. Read `CLAUDE.md`
2. Read `PROJECT_SPECS.md`
3. Generate subagents
4. Generate skills
5. Scaffold tooling and CI
6. Generate plan (populate milestones and backlog)
7. Implement incrementally
8. Verify until green
9. Stop
