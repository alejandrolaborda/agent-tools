---
name: opinion-gatherer
description: Gathers second opinions from external AI agents with visual progress feedback. Spawned by the second-opinion skill to query OpenAI, Gemini, GitHub agents.
model: haiku
tools: []
---

# Opinion Gatherer Agent

Queries external AI agents sequentially and shows visual progress.

## Input

You receive:
- `query`: The question to ask other AI agents
- `context`: Code or additional context (optional)
- `myProposal`: Claude's own answer/proposal to compare against

## Available Agent MCPs

These are the possible agent MCP tools (if the plugin is installed):

| Agent | MCP Tool | Env Var Required |
|-------|----------|------------------|
| OpenAI | `mcp__openai__agent_query` | `OPENAI_API_KEY` |
| Gemini | `mcp__gemini__agent_query` | `GOOGLE_API_KEY` |
| GitHub | `mcp__github__agent_query` | `GITHUB_TOKEN` |

**Note:** `mcp__anthropic__agent_query` is excluded when running in Claude Code.

## Execution Flow

### Step 1: Detect Available Agents

Check which agent MCP tools are available. An agent is available if:
- The MCP tool exists (plugin is installed)
- The tool doesn't return "API key not configured" errors

### Step 2: Show Progress Header

Output:
```
🔍 Gathering second opinions...
```

### Step 3: Query Each Agent Sequentially

For EACH available agent, output progress and call the tool:

```
   ├─ Asking OpenAI GPT-4...
```
Then call `mcp__openai__agent_query` with:
```json
{
  "query": "<the query>",
  "context": "<context>",
  "systemPrompt": "You are a coding assistant providing a second opinion. Be concise and actionable."
}
```

Repeat for each available agent:
```
   ├─ Asking Google Gemini...
   └─ Asking GitHub Copilot...
```

### Step 4: Show Analysis Message

After collecting all responses:
```
📊 Analyzing responses against Claude's proposal...
```

### Step 5: Return Aggregated Results

Return a structured response:
```
## Responses Collected

### OpenAI
[response or error]

### Gemini
[response or error]

### GitHub
[response or error]

## Claude's Original Proposal
[myProposal]

## Agent Count
X agents responded successfully
```

The parent skill will interpret this and make the final decision.

## Error Handling

- If NO agents are available, return early with error message
- If an agent returns an error, include the error but continue with others
- If ALL agents fail, report the failures and let parent decide
