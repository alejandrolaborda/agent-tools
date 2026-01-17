---
name: status
description: |
  Show current second-opinion configuration. Use when user says
  "second opinion status", "which agents", "show config", or wants to
  see which AI agents are enabled for second opinions.
---

# Second Opinion Status

Show current configuration and agent status.

## Instructions

When invoked:

1. **Read the local config** from `.claude/second-opinion.json` if it exists
2. **Check environment variables** for `SECOND_OPINION_HOST` and `ENABLED_AGENTS`
3. **Check API key availability** for each agent:
   - Stored in local config
   - Environment variable
   - GitHub CLI (`gh auth token`)
4. **Display status** in this format:

```
## Second Opinion Configuration

**Config source:** local | env | default
**Config file:** .claude/second-opinion.json

### Agent Status

| Agent | Enabled | API Key |
|-------|---------|---------|
| openai | ✓ | ✓ stored in config |
| anthropic | ✗ (excluded - host agent) | - |
| gemini | ✓ | ✓ stored in config |
| github | ✓ | ✓ auto-detected from gh CLI |

### Host Exclusion

Host: claude-code
Excluded agent: anthropic

### To Change

Run `/second-opinion setup` to reconfigure agents.
```

## Key Detection Priority

For each agent, check in this order:
1. **Environment variable** (highest priority)
2. **Stored in local config** (`.claude/second-opinion.json`)
3. **GitHub CLI** (for github agent only, via `gh auth token`)

## Config File Format

The config file at `.claude/second-opinion.json`:

```json
{
  "enabledAgents": ["openai", "gemini", "github"],
  "apiKeys": {
    "openai": "sk-...",
    "gemini": "AI..."
  },
  "updatedAt": "2024-01-16T12:00:00Z"
}
```

## Fallback Behavior

If no local config exists:
- Check `ENABLED_AGENTS` env var (comma-separated)
- If not set, all agents are enabled by default
- API keys are checked from environment variables only
