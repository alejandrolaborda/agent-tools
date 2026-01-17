---
name: setup
description: |
  Configure which AI agents to use for second opinions. Use when user says
  "setup second opinion", "configure agents", "enable/disable agents",
  "which agents", or wants to change second-opinion settings.
---

# Second Opinion Setup

Interactive configuration for second-opinion agents. The user should NEVER need to edit any files manually.

## Instructions

Follow these steps exactly:

### Step 1: Show Current Status

First, check if `.claude/second-opinion.json` exists and show current configuration:

```
## Current Configuration

Config file: .claude/second-opinion.json
Status: [exists | not configured]
Enabled agents: [list or "none"]
```

### Step 2: Ask User to Select Agents

Use AskUserQuestion with multiSelect=true:

```json
{
  "questions": [{
    "question": "Which AI agents do you want to enable for second opinions?",
    "header": "Agents",
    "multiSelect": true,
    "options": [
      {
        "label": "OpenAI (GPT-4o)",
        "description": "Requires OpenAI API key"
      },
      {
        "label": "Google Gemini",
        "description": "Requires Google AI API key"
      },
      {
        "label": "GitHub Models",
        "description": "Uses GitHub token (auto-detected from gh CLI if installed)"
      },
      {
        "label": "Anthropic (Claude)",
        "description": "Requires Anthropic API key. Note: Excluded when running in Claude Code"
      }
    ]
  }]
}
```

### Step 3: Check for Existing Keys & Auto-Detect GitHub Token

After user selects agents, for each selected agent:

1. **For GitHub**: Run `gh auth token` to check if a token is available
   - If available, note that it will be auto-detected (no input needed)
   - If not available, mark as needing manual input

2. **For others**: Check if key already exists in `.claude/second-opinion.json`
   - If exists, note it's already configured
   - If missing, mark as needing input

### Step 4: Prompt for Missing API Keys

For each selected agent that needs an API key, use AskUserQuestion to prompt:

```json
{
  "questions": [{
    "question": "Please paste your OpenAI API key (starts with sk-):",
    "header": "OpenAI Key",
    "multiSelect": false,
    "options": [
      {
        "label": "Enter key now",
        "description": "Paste your API key when prompted"
      },
      {
        "label": "Skip for now",
        "description": "Configure later"
      }
    ]
  }]
}
```

If user selects "Enter key now", they will type in "Other" - that's the API key.
If user selects "Skip for now", don't save a key for that agent.

**Key format hints to tell the user:**
- OpenAI: starts with `sk-`
- Anthropic: starts with `sk-ant-`
- Google: alphanumeric string
- GitHub: starts with `ghp_` or `gho_` (unless using gh CLI)

### Step 5: Save Configuration

Map user choices to agent IDs:
- "OpenAI (GPT-4o)" → `openai`
- "Google Gemini" → `gemini`
- "GitHub Models" → `github`
- "Anthropic (Claude)" → `anthropic`

Create the `.claude` directory if needed, then write to `.claude/second-opinion.json`:

```json
{
  "enabledAgents": ["openai", "gemini", "github"],
  "apiKeys": {
    "openai": "sk-...",
    "gemini": "AI..."
  },
  "updatedAt": "2026-01-16T12:00:00Z"
}
```

**Important**: GitHub keys are NOT stored if auto-detected from `gh auth token`.

### Step 6: Show Confirmation

```
## Configuration Saved

**File:** .claude/second-opinion.json

### Enabled Agents

- openai: ✓ configured
- gemini: ✓ configured
- github: ✓ auto-detected from gh CLI

### Note

- Make sure .claude/ is in your .gitignore to protect API keys
- GitHub token is auto-detected from `gh auth token` - no key stored
- To change agents, run `/second-opinion setup` again
```

## Important Notes

- NEVER ask user to edit files manually
- Use AskUserQuestion for ALL user input
- Auto-detect GitHub token from `gh auth token` when possible
- Store keys in `.claude/second-opinion.json` (user doesn't touch this)
- Remind user to add `.claude/` to `.gitignore`
- Anthropic agent is auto-excluded when `SECOND_OPINION_HOST=claude-code`
