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

1. **Check GitHub CLI authentication:**
   ```bash
   gh auth token 2>/dev/null && echo "authenticated" || echo "not authenticated"
   ```

2. **Read the local config** from `.claude/second-opinion.json` if it exists

3. **Display status** in this format:

```
## Second Opinion Configuration

**Config file:** .claude/second-opinion.json

### Agent Status

| Agent | Status | Auth Source |
|-------|--------|-------------|
| GitHub | ✓ ready | gh CLI (OAuth) |
| OpenAI | ✓ ready | stored locally |
| Gemini | ✗ not configured | - |
| Anthropic | ✗ excluded | host agent |

### Host Exclusion

Host: claude-code
Excluded agent: anthropic (you can't ask yourself for a second opinion)

### To Configure

Run `/second-opinion setup` to add or update API keys interactively.
```

## Auth Detection Priority

For each agent, check in this order:

| Agent | Priority |
|-------|----------|
| GitHub | gh CLI token (OAuth) → stored in config |
| OpenAI | stored in config |
| Gemini | stored in config |

## Config File Format

The config file at `.claude/second-opinion.json`:

```json
{
  "apiKeys": {
    "openai": "sk-...",
    "gemini": "AI..."
  },
  "models": {
    "openai": "gpt-4o",
    "gemini": "gemini-2.0-flash"
  },
  "updatedAt": "2026-01-17T12:00:00Z"
}
```

## Status Icons

| Icon | Meaning |
|------|---------|
| ✓ | Agent is configured and ready |
| ✗ | Agent is not configured or excluded |
