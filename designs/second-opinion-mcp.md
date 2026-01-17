# Second Opinion MCP Orchestrator

## Overview

Local MCP server that queries external coding agents (Codex, Gemini, Copilot) for second opinions, automatically excluding the active host agent.

## Requirements

| Requirement | Solution |
|-------------|----------|
| Local execution | MCP stdio server, no cloud orchestration |
| Auto lifecycle | Host spawns/kills via MCP config |
| Host exclusion | Explicit host ID in env var, not heuristic |
| Aggregated response | Consensus, disagreements, recommendations |
| Command interface | Single MCP tool: `second_opinion` |
| Autonomous action | Consensus → proceed; No consensus → decide; Only escalate if critical |

## Behavioral Contract

**When user asks for second opinion:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Decision Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Query external agents                                      │
│          │                                                  │
│          ▼                                                  │
│  ┌───────────────┐                                         │
│  │   Consensus?  │                                         │
│  └───────┬───────┘                                         │
│          │                                                  │
│    ┌─────┴─────┐                                           │
│    ▼           ▼                                           │
│   YES          NO                                          │
│    │           │                                           │
│    ▼           ▼                                           │
│  Proceed    ┌─────────────┐                                │
│  silently   │ Can decide? │                                │
│             └──────┬──────┘                                │
│                    │                                        │
│              ┌─────┴─────┐                                 │
│              ▼           ▼                                 │
│             YES          NO                                │
│              │           │                                 │
│              ▼           ▼                                 │
│           Decide      Ask user                             │
│           & proceed   (rare)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **Consensus** → Act on it. No summary needed. Just do.
2. **No consensus, decidable** → Pick best option, briefly state choice, proceed.
3. **No consensus, critical/irreversible** → Ask user. This should be rare.

**User does NOT care:**
- Which agent said what
- Individual agent attributions
- Verbose breakdowns
- Configuring host exclusion

**User DOES care:**
- What to do next
- Getting unblocked fast

## Automatic Host Exclusion

The MCP server automatically knows which host it's running in. No configuration needed.

```
┌─────────────────────────────────────────────────────────────┐
│  Running in Claude Code?  →  Don't ask Claude              │
│  Running in Gemini?       →  Don't ask Gemini              │
│  Running in Codex?        →  Don't ask OpenAI              │
│  Running in Copilot?      →  Don't ask GitHub Models       │
└─────────────────────────────────────────────────────────────┘
```

Extensible for future hosts.

**How it works:**
1. Host sets `SECOND_OPINION_HOST=<host-id>` when spawning MCP
2. MCP maps host-id → provider to exclude
3. Queries go to all OTHER providers
4. User never sees or configures this

**Example: User in Claude Code asks for second opinion**
```
Query sent to: OpenAI, Gemini, GitHub
NOT sent to: Anthropic (host)
User sees: "Use dependency injection here."
User does NOT see: "Claude was excluded because you're in Claude Code"
```

It just works. No verbosity about what was excluded.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Host Agent (e.g., Claude Code)               │
│                                                                 │
│   User: "get a second opinion on this approach"                 │
│                           │                                     │
│                           ▼                                     │
│   MCP Call: second_opinion({ query, context })                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ stdio
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 second-opinion MCP Server                       │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐                │
│  │  Config  │───▶│  Router  │───▶│ Aggregator │                │
│  │          │    │          │    │            │                │
│  │ • host   │    │ • filter │    │ • compare  │                │
│  │ • agents │    │ • fanout │    │ • synthesize│               │
│  └──────────┘    └────┬─────┘    └────────────┘                │
│                       │                                         │
│       ┌───────────────┼───────────────┐                        │
│       ▼               ▼               ▼                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                     │
│  │ OpenAI  │    │ Gemini  │    │ GitHub  │    (Claude excluded │
│  │ Adapter │    │ Adapter │    │ Adapter │     when host)      │
│  └────┬────┘    └────┬────┘    └────┬────┘                     │
└───────┼──────────────┼──────────────┼───────────────────────────┘
        ▼              ▼              ▼
   OpenAI API    Google AI API   GitHub Models API
```

## Host Identification

**Explicit, not heuristic.** Host declares itself via environment variable.

```bash
# Set by host when spawning MCP server
SECOND_OPINION_HOST=claude-code
```

Host-to-agent mapping in config:

```yaml
host_agent_map:
  claude-code: anthropic
  gemini: google
  codex: openai
  copilot: github
```

**Why not heuristic?**
- Environment sniffing is fragile
- Process name detection breaks with wrappers
- Explicit declaration is deterministic and testable

## Directory Structure

```
plugins/second-opinion/
├── .claude-plugin/
│   └── plugin.json
├── mcp/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # MCP server entry
│       ├── config.ts         # Config loader
│       ├── router.ts         # Agent routing + exclusion
│       ├── aggregator.ts     # Response synthesis
│       ├── types.ts          # Shared types
│       └── adapters/
│           ├── base.ts       # Adapter interface
│           ├── openai.ts
│           ├── gemini.ts
│           ├── anthropic.ts
│           └── github.ts
├── config/
│   └── default.yaml          # Default agent config
├── skills/
│   └── second-opinion/
│       └── SKILL.md
└── README.md
```

## Configuration Schema

```yaml
# config/default.yaml

# Explicit host identification (overridden by env var)
host: null  # SECOND_OPINION_HOST takes precedence

# Agent definitions
agents:
  openai:
    provider: openai
    model: gpt-4o
    api_key_env: OPENAI_API_KEY
    endpoint: https://api.openai.com/v1
    enabled: true
    timeout_ms: 30000

  gemini:
    provider: google
    model: gemini-2.0-flash
    api_key_env: GOOGLE_API_KEY
    endpoint: https://generativelanguage.googleapis.com/v1beta
    enabled: true
    timeout_ms: 30000

  anthropic:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key_env: ANTHROPIC_API_KEY
    endpoint: https://api.anthropic.com/v1
    enabled: true
    timeout_ms: 30000

  github:
    provider: github
    model: gpt-4o  # Via GitHub Models
    api_key_env: GITHUB_TOKEN
    endpoint: https://models.inference.ai.azure.com
    enabled: true
    timeout_ms: 30000

# Host-to-agent exclusion mapping (4 supported hosts)
host_agent_map:
  claude-code: anthropic
  gemini: google
  codex: openai
  copilot: github
  # Future hosts can be added here

# Aggregation settings
aggregation:
  min_responses: 2        # Minimum agents that must respond
  timeout_ms: 45000       # Overall timeout
  parallel: true          # Query agents in parallel

# System prompt for all agents
system_prompt: |
  You are providing a second opinion on a coding question.
  Be concise. Focus on:
  1. Direct answer to the question
  2. Key considerations or tradeoffs
  3. Potential issues with the proposed approach
  4. Alternative approaches if relevant

  Keep response under 500 words.
```

## MCP Tool Definition

```typescript
// src/tools.ts

export const secondOpinionTool = {
  name: "second_opinion",
  description: `Query external AI coding agents for a second opinion.
Automatically excludes the current host agent.
Returns aggregated analysis with consensus, disagreements, and recommendations.`,

  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The question or problem to get opinions on"
      },
      context: {
        type: "string",
        description: "Code, error messages, or additional context"
      },
      agents: {
        type: "array",
        items: { type: "string" },
        description: "Specific agents to query (default: all enabled except host)"
      },
      include_raw: {
        type: "boolean",
        description: "Include full raw responses (default: false)"
      }
    },
    required: ["query"]
  }
};
```

## Response Schema

```typescript
// src/types.ts

interface SecondOpinionRequest {
  query: string;
  context?: string;
  agents?: string[];      // Override default agent list
  include_raw?: boolean;  // Include full responses
}

interface AgentResponse {
  agent: string;
  provider: string;
  model: string;
  response: string;
  latency_ms: number;
  tokens_used?: number;
  error?: string;
}

interface SecondOpinionResponse {
  // Decision outcome
  outcome: "consensus" | "decided" | "needs_input";

  // What to do (the only thing that matters)
  action: string;

  // Brief rationale (1-2 sentences max)
  rationale?: string;

  // Only populated if outcome === "needs_input"
  options?: {
    option: string;
    tradeoff: string;
  }[];

  // Minimal metadata (hidden from user unless debugging)
  _meta?: {
    agents_count: number;
    consensus_strength: "strong" | "weak" | "none";
    time_ms: number;
  };
}
```

## Core Implementation

### Adapter Interface

```typescript
// src/adapters/base.ts

export interface AgentAdapter {
  readonly id: string;
  readonly provider: string;
  readonly model: string;

  query(params: {
    query: string;
    context?: string;
    systemPrompt: string;
  }): Promise<{
    response: string;
    tokens_used?: number;
  }>;

  healthCheck(): Promise<boolean>;
}

export abstract class BaseAdapter implements AgentAdapter {
  abstract readonly id: string;
  abstract readonly provider: string;
  abstract readonly model: string;

  protected apiKey: string;
  protected endpoint: string;
  protected timeout: number;

  constructor(config: AgentConfig) {
    this.apiKey = process.env[config.api_key_env] ?? "";
    this.endpoint = config.endpoint;
    this.timeout = config.timeout_ms;
  }

  abstract query(params: QueryParams): Promise<QueryResult>;

  async healthCheck(): Promise<boolean> {
    return !!this.apiKey;
  }
}
```

### Router

```typescript
// src/router.ts

export class AgentRouter {
  private adapters: Map<string, AgentAdapter>;
  private hostAgent: string | null;
  private hostAgentMap: Record<string, string>;

  constructor(config: Config) {
    this.adapters = this.initAdapters(config.agents);
    this.hostAgentMap = config.host_agent_map;
    this.hostAgent = this.resolveHostAgent(config.host);
  }

  private resolveHostAgent(configHost: string | null): string | null {
    // Env var takes precedence (explicit declaration)
    const envHost = process.env.SECOND_OPINION_HOST;
    const host = envHost ?? configHost;

    if (!host) return null;
    return this.hostAgentMap[host] ?? null;
  }

  getAvailableAgents(requestedAgents?: string[]): string[] {
    let agents = requestedAgents ?? [...this.adapters.keys()];

    // Exclude host agent
    if (this.hostAgent) {
      agents = agents.filter(a => a !== this.hostAgent);
    }

    // Filter to enabled/configured only
    return agents.filter(a => this.adapters.has(a));
  }

  getExcludedAgents(): { host: string | null; reason: string }[] {
    const excluded = [];
    if (this.hostAgent) {
      excluded.push({
        host: this.hostAgent,
        reason: `Host agent (${process.env.SECOND_OPINION_HOST})`
      });
    }
    return excluded;
  }

  async queryAgents(
    agents: string[],
    params: QueryParams,
    parallel: boolean
  ): Promise<AgentResponse[]> {
    if (parallel) {
      return Promise.all(
        agents.map(id => this.queryAgent(id, params))
      );
    }

    const results: AgentResponse[] = [];
    for (const id of agents) {
      results.push(await this.queryAgent(id, params));
    }
    return results;
  }

  private async queryAgent(
    id: string,
    params: QueryParams
  ): Promise<AgentResponse> {
    const adapter = this.adapters.get(id)!;
    const start = Date.now();

    try {
      const result = await adapter.query(params);
      return {
        agent: id,
        provider: adapter.provider,
        model: adapter.model,
        response: result.response,
        latency_ms: Date.now() - start,
        tokens_used: result.tokens_used
      };
    } catch (error) {
      return {
        agent: id,
        provider: adapter.provider,
        model: adapter.model,
        response: "",
        latency_ms: Date.now() - start,
        error: error.message
      };
    }
  }
}
```

### Aggregator

```typescript
// src/aggregator.ts

export class ResponseAggregator {

  aggregate(
    responses: AgentResponse[],
    query: string
  ): SecondOpinionResponse {
    const successful = responses.filter(r => !r.error);

    // No responses
    if (successful.length === 0) {
      return {
        outcome: "needs_input",
        action: "All agents failed. Check API keys or try again.",
        options: []
      };
    }

    // Single response - treat as consensus
    if (successful.length === 1) {
      return {
        outcome: "consensus",
        action: this.extractAction(successful[0].response),
        _meta: { agents_count: 1, consensus_strength: "weak", time_ms: 0 }
      };
    }

    // Multiple responses - analyze
    const analysis = this.analyzeResponses(successful);

    // Strong consensus - just do it
    if (analysis.consensusStrength === "strong") {
      return {
        outcome: "consensus",
        action: analysis.consensusAction,
        _meta: {
          agents_count: successful.length,
          consensus_strength: "strong",
          time_ms: Math.max(...successful.map(r => r.latency_ms))
        }
      };
    }

    // Weak consensus or disagreement - but decidable
    if (analysis.canDecide) {
      return {
        outcome: "decided",
        action: analysis.bestAction,
        rationale: analysis.decisionRationale,
        _meta: {
          agents_count: successful.length,
          consensus_strength: analysis.consensusStrength,
          time_ms: Math.max(...successful.map(r => r.latency_ms))
        }
      };
    }

    // Cannot decide - need user input (should be rare)
    return {
      outcome: "needs_input",
      action: "Conflicting approaches with significant tradeoffs.",
      options: analysis.options,
      _meta: {
        agents_count: successful.length,
        consensus_strength: "none",
        time_ms: Math.max(...successful.map(r => r.latency_ms))
      }
    };
  }

  private analyzeResponses(responses: AgentResponse[]): {
    consensusStrength: "strong" | "weak" | "none";
    consensusAction: string;
    canDecide: boolean;
    bestAction: string;
    decisionRationale: string;
    options: { option: string; tradeoff: string }[];
  } {
    // Extract core recommendations from each response
    const actions = responses.map(r => this.extractAction(r.response));

    // Check for semantic similarity (simplified - use embeddings in production)
    const similarity = this.calculateSimilarity(actions);

    if (similarity > 0.8) {
      return {
        consensusStrength: "strong",
        consensusAction: this.mergeActions(actions),
        canDecide: true,
        bestAction: "",
        decisionRationale: "",
        options: []
      };
    }

    if (similarity > 0.5) {
      return {
        consensusStrength: "weak",
        consensusAction: "",
        canDecide: true,
        bestAction: this.pickBestAction(actions, responses),
        decisionRationale: this.generateRationale(actions),
        options: []
      };
    }

    // Low similarity - check if decidable
    const tradeoffs = this.extractTradeoffs(responses);
    const isCritical = this.isIrreversibleDecision(actions);

    if (!isCritical) {
      return {
        consensusStrength: "none",
        consensusAction: "",
        canDecide: true,
        bestAction: this.pickBestAction(actions, responses),
        decisionRationale: "Approaches differ but going with most practical option.",
        options: []
      };
    }

    // Critical decision with no consensus - ask user
    return {
      consensusStrength: "none",
      consensusAction: "",
      canDecide: false,
      bestAction: "",
      decisionRationale: "",
      options: tradeoffs.slice(0, 3)  // Max 3 options
    };
  }

  private extractAction(response: string): string {
    // Extract the actionable recommendation (first sentence or bullet)
    const lines = response.split('\n').filter(l => l.trim());
    const actionLine = lines.find(l =>
      l.includes('should') ||
      l.includes('recommend') ||
      l.includes('use') ||
      l.includes('try')
    ) ?? lines[0];

    return actionLine?.trim().slice(0, 200) ?? response.slice(0, 200);
  }

  private isIrreversibleDecision(actions: string[]): boolean {
    const criticalKeywords = [
      'delete', 'remove', 'drop', 'migrate', 'schema',
      'production', 'deploy', 'release', 'security',
      'authentication', 'encryption', 'database'
    ];

    return actions.some(a =>
      criticalKeywords.some(k => a.toLowerCase().includes(k))
    );
  }

  private calculateSimilarity(actions: string[]): number {
    // Simplified word overlap - use embeddings in production
    const wordSets = actions.map(a =>
      new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3))
    );

    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const intersection = [...wordSets[i]].filter(w => wordSets[j].has(w));
        const union = new Set([...wordSets[i], ...wordSets[j]]);
        totalOverlap += intersection.length / union.size;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalOverlap / comparisons : 0;
  }

  private mergeActions(actions: string[]): string {
    // Return shortest action that captures the consensus
    return actions.sort((a, b) => a.length - b.length)[0];
  }

  private pickBestAction(actions: string[], responses: AgentResponse[]): string {
    // Prefer action from fastest responding agent (heuristic for confidence)
    const fastest = responses.sort((a, b) => a.latency_ms - b.latency_ms)[0];
    return this.extractAction(fastest.response);
  }

  private generateRationale(actions: string[]): string {
    return "Most straightforward approach given the tradeoffs.";
  }

  private extractTradeoffs(
    responses: AgentResponse[]
  ): { option: string; tradeoff: string }[] {
    return responses.map(r => ({
      option: this.extractAction(r.response).slice(0, 50),
      tradeoff: this.extractTradeoff(r.response)
    }));
  }

  private extractTradeoff(response: string): string {
    const tradeoffLine = response.split('\n').find(l =>
      l.toLowerCase().includes('but') ||
      l.toLowerCase().includes('however') ||
      l.toLowerCase().includes('tradeoff')
    );
    return tradeoffLine?.trim().slice(0, 100) ?? "See full response";
  }
}
```

### MCP Server Entry

```typescript
// src/index.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { AgentRouter } from "./router.js";
import { ResponseAggregator } from "./aggregator.js";
import { secondOpinionTool } from "./tools.js";

async function main() {
  const config = await loadConfig();
  const router = new AgentRouter(config);
  const aggregator = new ResponseAggregator();

  const server = new Server(
    { name: "second-opinion", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  // List tools
  server.setRequestHandler("tools/list", async () => ({
    tools: [secondOpinionTool]
  }));

  // Handle tool calls
  server.setRequestHandler("tools/call", async (request) => {
    if (request.params.name !== "second_opinion") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = request.params.arguments as SecondOpinionRequest;

    // Get available agents (excluding host)
    const agents = router.getAvailableAgents(args.agents);
    const excluded = router.getExcludedAgents();

    if (agents.length === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "No agents available",
            excluded: excluded,
            hint: "Check API keys and agent configuration"
          }, null, 2)
        }]
      };
    }

    // Query agents
    const responses = await router.queryAgents(
      agents,
      {
        query: args.query,
        context: args.context,
        systemPrompt: config.system_prompt
      },
      config.aggregation.parallel
    );

    // Aggregate results
    const analysis = aggregator.aggregate(responses, args.query);

    // Build response
    const result: SecondOpinionResponse = {
      query: args.query,
      context_provided: !!args.context,
      agents_consulted: responses.filter(r => !r.error).map(r => r.agent),
      agents_excluded: excluded.map(e => e.host).filter(Boolean) as string[],
      agents_failed: responses.filter(r => r.error).map(r => r.agent),
      host_excluded: excluded.find(e => e.reason.includes("Host"))?.host ?? null,
      analysis,
      metadata: {
        total_time_ms: Math.max(...responses.map(r => r.latency_ms)),
        timestamp: new Date().toISOString(),
        config_version: config.version ?? "1.0.0"
      }
    };

    if (args.include_raw) {
      result.raw_responses = responses;
    }

    return {
      content: [{
        type: "text",
        text: formatResponse(result)
      }]
    };
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function formatResponse(result: SecondOpinionResponse): string {
  // Consensus or decided: just return the action
  if (result.outcome === "consensus" || result.outcome === "decided") {
    let output = result.action;
    if (result.rationale) {
      output += `\n\n_${result.rationale}_`;
    }
    return output;
  }

  // Needs input: present options concisely
  const lines: string[] = [];
  lines.push("Need your input on this one:\n");

  for (const opt of result.options ?? []) {
    lines.push(`- **${opt.option}**: ${opt.tradeoff}`);
  }

  return lines.join("\n");
}

/*
 * OUTPUT EXAMPLES:
 *
 * Consensus:
 *   "Use dependency injection here. Add the service as a constructor param."
 *
 * Decided (no consensus but clear winner):
 *   "Going with Option A: extract to a separate module.
 *
 *    _Cleaner separation, easier to test._"
 *
 * Needs input (rare):
 *   "Need your input on this one:
 *
 *    - **Sync approach**: Simpler but blocks UI
 *    - **Async approach**: More complex but responsive"
 */

main().catch(console.error);
```

## Integration with Claude Code

### MCP Configuration

```json
// ~/.claude/mcp.json (global) or .mcp.json (project)
{
  "mcpServers": {
    "second-opinion": {
      "command": "node",
      "args": ["${HOME}/.claude/plugins/second-opinion/mcp/dist/index.js"],
      "env": {
        "SECOND_OPINION_HOST": "claude-code",
        "SECOND_OPINION_CONFIG": "${HOME}/.claude/plugins/second-opinion/config/default.yaml"
      }
    }
  }
}
```

### Plugin Skill (for discoverability)

```yaml
# skills/second-opinion/SKILL.md
---
name: second-opinion
description: Get second opinions from external AI agents (OpenAI, Gemini, GitHub). Use when user says "second opinion", "ask other AIs", "what would GPT say", "check with others", or wants to validate an approach.
---

# Second Opinion

Query external agents, get answer, act on it.

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
```

## Lifecycle Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Lifecycle Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Host starts (Claude Code)                               │
│     │                                                       │
│     ▼                                                       │
│  2. Reads .mcp.json                                         │
│     │                                                       │
│     ▼                                                       │
│  3. Spawns: node second-opinion/dist/index.js               │
│     • Sets SECOND_OPINION_HOST=claude-code                  │
│     • Connects via stdio                                    │
│     │                                                       │
│     ▼                                                       │
│  4. MCP server loads config                                 │
│     • Reads host from env (explicit)                        │
│     • Maps host → agent to exclude (anthropic)              │
│     • Initializes adapters                                  │
│     │                                                       │
│     ▼                                                       │
│  5. Server ready, awaiting tool calls                       │
│     │                                                       │
│     ▼                                                       │
│  6. User: "get second opinion on this"                      │
│     │                                                       │
│     ▼                                                       │
│  7. Claude calls second_opinion tool                        │
│     │                                                       │
│     ▼                                                       │
│  8. Router queries: openai, gemini, github                  │
│     (anthropic excluded)                                    │
│     │                                                       │
│     ▼                                                       │
│  9. Aggregator synthesizes responses                        │
│     │                                                       │
│     ▼                                                       │
│ 10. Returns formatted analysis to Claude                    │
│     │                                                       │
│     ▼                                                       │
│ 11. Host exits                                              │
│     │                                                       │
│     ▼                                                       │
│ 12. MCP server process terminated (SIGTERM)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API keys in config | Use env var references, not literals |
| Query data sent externally | User initiates, explicit consent |
| Response injection | Sanitize before display |
| Host spoofing | Env var set by host process, not user input |

## Testing

```bash
# Unit tests
npm test

# Integration test (mock APIs)
npm run test:integration

# Manual test with specific host
SECOND_OPINION_HOST=claude-code npm run dev

# Health check
curl -X POST localhost:3000/health
```

## Extension Points

1. **New agents**: Add adapter in `src/adapters/`, register in config
2. **Better aggregation**: Replace keyword matching with embeddings
3. **Caching**: Add response cache for repeated queries
4. **Streaming**: Support streaming responses from agents
5. **Cost tracking**: Log token usage per agent
