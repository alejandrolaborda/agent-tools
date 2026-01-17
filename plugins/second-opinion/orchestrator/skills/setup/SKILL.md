---
name: setup
description: |
  Configure second-opinion agents interactively. Use when user says
  "setup second opinion", "configure agents", "enable/disable agents",
  "which agents", or wants to change second-opinion settings.
---

# Second Opinion Setup

Interactive configuration for second-opinion agents. **No file editing required.**

## Authentication Methods

| Agent | Auth Method | How to Set Up |
|-------|-------------|---------------|
| GitHub | OAuth via gh CLI | Run `gh auth login` in terminal |
| OpenAI | API Key | Enter interactively below |
| Gemini | API Key | Enter interactively below |

## Instructions

### Step 1: Check GitHub Authentication

First, check if `gh auth token` returns a token:

```bash
gh auth token 2>/dev/null && echo "authenticated" || echo "not authenticated"
```

**If authenticated:** GitHub agent is ready to use (OAuth - no API key needed).

**If not authenticated:** Tell the user:
```
GitHub uses OAuth authentication.

To set up, run this in your terminal:
  gh auth login

Then restart Claude Code.
```

### Step 2: Check for Existing API Keys

Read `.claude/second-opinion.json` if it exists to see what's already configured.

Display current status:
```
## Current Configuration

| Agent | Status |
|-------|--------|
| GitHub | ✓ authenticated via gh CLI |
| OpenAI | ✗ not configured |
| Gemini | ✗ not configured |
```

### Step 3: Prompt for Missing API Keys

For each agent WITHOUT a configured key, use AskUserQuestion:

```json
{
  "questions": [{
    "question": "Would you like to configure OpenAI?",
    "header": "OpenAI",
    "multiSelect": false,
    "options": [
      {"label": "Yes, enter API key", "description": "I have an OpenAI API key ready"},
      {"label": "Skip for now", "description": "I'll configure this later"}
    ]
  }]
}
```

**If user selects "Yes, enter API key":**

Use AskUserQuestion with a text input option:
```json
{
  "questions": [{
    "question": "Enter your OpenAI API key (starts with sk-):",
    "header": "API Key",
    "multiSelect": false,
    "options": [
      {"label": "I'll paste it", "description": "The API key will be stored locally in .claude/second-opinion.json"}
    ]
  }]
}
```

When the user provides the key via "Other" input, save it to the config file.

### Step 4: Save Configuration

Write the API keys to `.claude/second-opinion.json`:

```json
{
  "apiKeys": {
    "openai": "sk-...",
    "gemini": "AI..."
  },
  "updatedAt": "2026-01-17T12:00:00Z"
}
```

Use the Write tool to create/update this file.

### Step 5: Show Confirmation

```
## Configuration Complete

| Agent | Status | Auth Source |
|-------|--------|-------------|
| GitHub | ✓ ready | gh CLI (OAuth) |
| OpenAI | ✓ ready | stored locally |
| Gemini | ✗ skipped | - |

**Config file:** .claude/second-opinion.json

### Next Steps

- Use `/second-opinion` to get second opinions
- Run `/second-opinion setup` again to reconfigure
- GitHub auth: run `gh auth login` in terminal

### Security Note

API keys are stored locally in your project's `.claude/` directory.
Add `.claude/second-opinion.json` to `.gitignore` to avoid committing keys.
```

## Important Rules

1. **NEVER ask users to edit files manually**
2. **NEVER ask users to set environment variables**
3. **Use AskUserQuestion for ALL user input**
4. **GitHub uses OAuth via `gh auth login` - no API key needed**
5. **Store API keys in `.claude/second-opinion.json` using Write tool**
6. **Add reminder about .gitignore for security**
