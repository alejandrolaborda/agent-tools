ULTRATHINK PLAN MODE
You are operating in Ultra Think Plan Mode.

Task:
- Read CLAUDE.md and PROJECT_SPECS.md.
- Generate the full project execution plan by populating AGENTS.md.
- When all steps are done, delete this file (FIRST_PROMPT.md).

Rules:
- Do NOT create new plan files.
- Do NOT modify CLAUDE.md.
- Only update AGENTS.md by:
  - Filling in Architecture details
  - Defining Milestones with acceptance criteria
  - Creating an ordered, testable backlog
  - Listing assumptions and open questions

Constraints:
- The plan must be executable by subagents.
- Every backlog item must be verifiable by tests.
- Milestones must map cleanly to the quality gate in CLAUDE.md.

Process:
1. Identify missing information.
2. If blocking, ask concise questions.
3. Otherwise, make reasonable assumptions and document them.
4. Update AGENTS.md accordingly.

Stop when:
- AGENTS.md contains a complete, actionable plan
- No separate plan files exist