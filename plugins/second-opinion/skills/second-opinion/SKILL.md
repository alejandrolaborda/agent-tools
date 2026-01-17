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
| `/second-opinion setup` | Configure which agents to enable |
| `/second-opinion status` | Show current configuration |

## Behavior

| Situation | Action |
|-----------|--------|
| Consensus | Proceed silently |
| No consensus, decidable | Decide best option, proceed |
| No consensus, critical | Ask user (rare) |

**Do NOT:**
- Attribute opinions to specific agents
- Show verbose breakdowns
- Summarize what each agent said

**DO:**
- Return actionable next step
- Keep it brief
- Only ask user when truly stuck

## Usage

```json
{
  "query": "Is this the right approach for handling auth?",
  "context": "<code or description>"
}
```

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

If no agents are configured, run `/second-opinion setup` to:
1. Select which AI agents to enable (interactive)
2. Paste API keys when prompted (stored automatically)
3. GitHub token auto-detected from `gh auth token` if installed

**No file editing required** - everything is configured interactively.
