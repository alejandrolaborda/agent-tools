# Second Opinion

MCP orchestrator that spawns and queries external AI agent MCPs for second opinions with automatic host exclusion and consensus detection.

## Quick Start

1. **Install the orchestrator:**
   ```bash
   cd plugins/second-opinion/orchestrator/mcp && npm install && npm run build
   ```

2. **Add to your MCP config** (`.mcp.json`):
   ```json
   {
     "mcpServers": {
       "second-opinion": {
         "command": "node",
         "args": ["/path/to/second-opinion/mcp/dist/index.js"],
         "env": {
           "SECOND_OPINION_HOST": "claude-code"
         }
       }
     }
   }
   ```

3. **Run setup to select agents:**
   ```
   /second-opinion setup
   ```

## Setup Experience

When you first run `/second-opinion setup`, you'll be asked which agents to enable:

- **OpenAI** (GPT-4o) - Requires `OPENAI_API_KEY`
- **Anthropic** (Claude) - Requires `ANTHROPIC_API_KEY`
- **Google Gemini** - Requires `GOOGLE_API_KEY`
- **GitHub Models** - Requires `GITHUB_TOKEN`

Your selection is saved to `.claude/second-opinion.json` and persists across sessions.

### Check Status

Run `/second-opinion status` to see current configuration:
- Which agents are enabled
- Which agent is excluded (host)
- Config source (local file vs env vars)

## Architecture

```
second-opinion (orchestrator)
    ├── spawns → agent-openai MCP
    ├── spawns → agent-anthropic MCP
    ├── spawns → agent-gemini MCP
    └── spawns → agent-github MCP
```

## Configuration Priority

1. **Local config** (`.claude/second-opinion.json`) - Highest priority
2. **Environment variable** (`ENABLED_AGENTS`) - Fallback
3. **Default** - All agents enabled

### Local Config File

```json
{
  "enabledAgents": ["openai", "gemini", "github"],
  "updatedAt": "2024-01-16T12:00:00Z"
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECOND_OPINION_HOST` | No | - | Host for agent exclusion |
| `ENABLED_AGENTS` | No | all | Comma-separated agents (if no local config) |
| `SECOND_OPINION_PARALLEL` | No | `true` | Query agents in parallel |

## Host Exclusion

To avoid self-querying, set the host to exclude:

| Host | Set `SECOND_OPINION_HOST` to | Excludes |
|------|------------------------------|----------|
| Claude Code | `claude-code` | anthropic |
| Gemini | `gemini` | gemini |
| Codex | `codex` | openai |
| Copilot | `copilot` | github |

## Building Agent MCPs

Before using, build the agent MCPs you want to enable:

```bash
# Build agent MCPs (only for agents you want to use)
cd plugins/second-opinion/agent-openai/mcp && npm install && npm run build
cd plugins/second-opinion/agent-gemini/mcp && npm install && npm run build
cd plugins/second-opinion/agent-github/mcp && npm install && npm run build
cd plugins/second-opinion/agent-anthropic/mcp && npm install && npm run build  # optional

# Build orchestrator
cd plugins/second-opinion/orchestrator/mcp && npm install && npm run build
```

## Behavior

```
Consensus       → Proceed silently
No consensus    → Decide best option, proceed
Critical + split → Ask user (rare)
```
