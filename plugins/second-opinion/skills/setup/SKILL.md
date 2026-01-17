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

### Step 1: Detect Available Agent Plugins

Check which agent MCP tools are available by looking for these tools:
- `mcp__openai__list_models` → OpenAI plugin installed
- `mcp__gemini__list_models` → Gemini plugin installed
- `mcp__github__list_models` → GitHub plugin installed

Show what's detected:
```
## Detected Agent Plugins

| Agent | Plugin | Status |
|-------|--------|--------|
| OpenAI | agent-openai | ✓ installed / ✗ not found |
| Gemini | agent-gemini | ✓ installed / ✗ not found |
| GitHub | agent-github | ✓ installed / ✗ not found |
```

If NO plugins are detected, tell user to install at least one:
```
⚠️ No agent plugins detected.

Install at least one:
/plugin install agent-openai@agent-tools
/plugin install agent-gemini@agent-tools
/plugin install agent-github@agent-tools
```

### Step 2: Query Available Models

For each detected agent plugin, call its `list_models` tool:
- `mcp__openai__list_models`
- `mcp__gemini__list_models`
- `mcp__github__list_models`

Each returns JSON with:
```json
{
  "provider": "openai",
  "models": [
    {"id": "gpt-4o", "name": "GPT-4o", "description": "Most capable"},
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast and cheap"}
  ],
  "default": "gpt-4o"
}
```

### Step 3: Let User Select Models

For each available agent, use AskUserQuestion to let user pick a model:

```json
{
  "questions": [{
    "question": "Which OpenAI model do you want to use?",
    "header": "OpenAI",
    "multiSelect": false,
    "options": [
      {"label": "GPT-4o (Recommended)", "description": "Most capable, best for complex reasoning"},
      {"label": "GPT-4o Mini", "description": "Fast and cost-effective"},
      {"label": "o1", "description": "Advanced reasoning model"}
    ]
  }]
}
```

**Note:** Build the options dynamically from the `list_models` response. Mark the default as "(Recommended)".

### Step 4: Save Configuration

Create `.claude/second-opinion.json` with the selected models:

```json
{
  "models": {
    "openai": "gpt-4o",
    "gemini": "gemini-2.0-flash",
    "github": "gpt-4o"
  },
  "updatedAt": "2026-01-16T12:00:00Z"
}
```

### Step 5: Show Confirmation

```
## Configuration Saved

**File:** .claude/second-opinion.json

### Selected Models

| Agent | Model |
|-------|-------|
| OpenAI | gpt-4o |
| Gemini | gemini-2.0-flash |
| GitHub | gpt-4o |

### Note

- Models can be changed anytime by running `/second-opinion setup`
- API keys are read from environment variables (set in your shell profile)
- GitHub token auto-detected from `gh auth token` if available
```

## Important Notes

- NEVER ask user to edit files manually
- NEVER hardcode model lists - always query from `list_models` tool
- Use AskUserQuestion for ALL user input
- Build model options dynamically from what each agent reports
- Mark the default model as "(Recommended)" in the options
- Store only model selections (not API keys) in the config file
- API keys come from environment variables, not stored in config
