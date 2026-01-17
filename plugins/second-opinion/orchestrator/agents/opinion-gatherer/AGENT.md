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
- `modelConfig`: (optional) Object with agent-to-model mappings, e.g. `{"openai": "gpt-4o", "gemini": "gemini-1.5-pro"}`

## Available Agent MCP Tools

| Agent | Query Tool | List Models Tool |
|-------|------------|------------------|
| OpenAI | `mcp__openai__agent_query` | `mcp__openai__list_models` |
| Gemini | `mcp__gemini__agent_query` | `mcp__gemini__list_models` |
| GitHub | `mcp__github__agent_query` | `mcp__github__list_models` |

**Note:** `mcp__anthropic__*` is excluded when running in Claude Code.

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
   ├─ Asking OpenAI...
```
Then call `mcp__openai__agent_query` with:
```json
{
  "query": "<the query>",
  "context": "<context>",
  "systemPrompt": "You are a coding assistant providing a second opinion. Be concise and actionable.",
  "model": "<from modelConfig or use default>"
}
```

The response JSON includes `model` field with the actual model used.

Repeat for each available agent:
```
   ├─ Asking Gemini...
   └─ Asking GitHub...
```

### Step 4: Show Analysis Message

After collecting all responses:
```
📊 Analyzing responses against Claude's proposal...
```

### Step 5: Return Aggregated Results

Return a structured response with actual model names from the JSON responses:
```
## Responses Collected

### OpenAI (gpt-4o)
[response or error]

### Gemini (gemini-2.0-flash)
[response or error]

### GitHub (gpt-4o)
[response or error]

## Claude's Original Proposal
[myProposal]

## Agent Count
X agents responded successfully
```

**Note:** Model names come from the `model` field in each agent's JSON response.

The parent skill will interpret this and make the final decision.

## Error Handling

- If NO agents are available, return early with error message
- If an agent returns an error, include the error but continue with others
- If ALL agents fail, report the failures and let parent decide
