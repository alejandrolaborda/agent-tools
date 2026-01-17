---
name: second-opinion
description: Get second opinions from external AI agents (OpenAI, Gemini, GitHub). Use when user says "second opinion", "ask other AIs", "what would GPT say", "check with others", or wants to validate an approach.
---

# Second Opinion

Query external agents, get answer, act on it.

## Commands

| Command | Description |
|---------|-------------|
| `/second-opinion` | Get a second opinion on current context |
| `/second-opinion setup` | Configure agents interactively |
| `/second-opinion status` | Show current configuration |

## CRITICAL: Execution Flow

### Step 1: Check for Installed Agent Plugins

**FIRST**, check if any agent MCP tools are available. Look for these tools:

| Tool | Agent Plugin |
|------|--------------|
| `mcp__openai__agent_query` | agent-openai |
| `mcp__gemini__agent_query` | agent-gemini |
| `mcp__github__agent_query` | agent-github |

**Note:** `mcp__anthropic__agent_query` is excluded when running in Claude Code.

If **NONE** of these tools exist, display this message and **STOP immediately**:

```
No second-opinion agents available.

Run `/second-opinion setup` to configure authentication:
- GitHub: Uses OAuth via `gh auth login`
- OpenAI: Enter API key interactively
- Gemini: Enter API key interactively
```

**Do NOT proceed further if no agents are available.**

### Step 2: Gather Opinions (use opinion-gatherer agent)

If agents ARE installed, spawn the `opinion-gatherer` agent with:
- The user's query/question
- Your own proposal/answer to the question
- Any relevant context

The agent will:
1. Output "Gathering second opinions..."
2. Query each available agent sequentially, showing progress:
   - "   Asking OpenAI..."
   - "   Asking Gemini..."
   - "   Asking GitHub..."
3. Return aggregated results (including actual model names from responses)

### Step 3: Analyze and Decide

After receiving responses from the opinion-gatherer agent, display:

```
Analyzing responses against my proposal...
```

Then apply this decision logic:

| Situation | Action |
|-----------|--------|
| Consensus with your proposal | Proceed with your proposal |
| Consensus against your proposal | Adopt the consensus approach |
| No consensus, decidable | Pick best option, explain briefly |
| No consensus, critical | Ask user (rare) |

## Output Guidelines

**Do NOT:**
- Attribute opinions to specific agents by name
- Show verbose breakdowns of each response
- Summarize what each agent said individually

**DO:**
- Return actionable next step
- Keep it brief
- Only ask user when truly stuck

## Output Examples

**Consensus:**
```
Use dependency injection. Add the service as a constructor param.
```

**Decided:**
```
Going with extracted module approach.

_Cleaner separation, easier to test._
```

**Needs input (rare):**
```
Need your input on this one:

- **Sync**: Simpler but blocks UI
- **Async**: More complex but responsive
```

## First-Time Setup

Run `/second-opinion setup` to configure agents interactively.

| Agent | Auth Method |
|-------|-------------|
| GitHub | OAuth via `gh auth login` (no API key needed!) |
| OpenAI | API key (entered interactively, stored locally) |
| Gemini | API key (entered interactively, stored locally) |
