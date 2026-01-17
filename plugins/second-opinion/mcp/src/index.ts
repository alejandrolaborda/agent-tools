#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  loadConfig,
  getConfigFilePath,
  hasApiKey,
  isGitHubCLIAvailable,
  getGitHubTokenFromCLI,
  AGENT_KEY_ENV_VARS,
} from './config.js';
import { AgentOrchestrator } from './orchestrator.js';
import { ResponseAggregator } from './aggregator.js';
import { getAvailableAgentIds } from './agent-registry.js';
import { SecondOpinionRequest, SecondOpinionResponse } from './types.js';

// ============================================================================
// Prompt Definitions
// ============================================================================

const SETUP_PROMPT = {
  name: 'setup',
  description: 'Configure which AI agents to use for second opinions',
};

const STATUS_PROMPT = {
  name: 'status',
  description: 'Show current second-opinion configuration and enabled agents',
};

// ============================================================================
// Tool Definition
// ============================================================================

const SECOND_OPINION_TOOL = {
  name: 'second_opinion',
  description: `Query external AI coding agents for a second opinion.
Automatically excludes the current host agent.
Returns actionable guidance based on consensus analysis.

- Consensus: Proceeds with agreed approach
- No consensus (decidable): Picks best option and proceeds
- No consensus (critical): Asks for user input (rare)`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The question or problem to get opinions on',
      },
      context: {
        type: 'string',
        description: 'Code, error messages, or additional context',
      },
      agents: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific agents to query (default: all enabled except host)',
      },
    },
    required: ['query'],
  },
};

// ============================================================================
// Response Formatting
// ============================================================================

function formatResponse(result: SecondOpinionResponse): string {
  // Consensus or decided: just return the action
  if (result.outcome === 'consensus' || result.outcome === 'decided') {
    let output = result.action;
    if (result.rationale) {
      output += `\n\n_${result.rationale}_`;
    }
    return output;
  }

  // Needs input: present options concisely
  const lines: string[] = [];
  lines.push('Need your input on this one:\n');

  for (const opt of result.options ?? []) {
    lines.push(`- **${opt.option}**: ${opt.tradeoff}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Main Server
// ============================================================================

async function main(): Promise<void> {
  const config = loadConfig();

  // Initialize orchestrator with enabled agents
  const orchestrator = new AgentOrchestrator(
    config.enabledAgents,
    config.host,
    config.parallel
  );

  await orchestrator.initialize();

  const aggregator = new ResponseAggregator();

  const server = new Server(
    {
      name: 'second-opinion',
      version: '1.1.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [SECOND_OPINION_TOOL],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'second_opinion') {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = request.params.arguments as unknown as SecondOpinionRequest;

    if (!args.query || typeof args.query !== 'string') {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: query parameter is required',
          },
        ],
        isError: true,
      };
    }

    // Get available agents (excluding host)
    const availableAgents = orchestrator.getAvailableAgents(args.agents);
    const excludedAgent = orchestrator.getExcludedAgent();

    if (availableAgents.length === 0) {
      const configured = orchestrator.getConfiguredAgents();
      return {
        content: [
          {
            type: 'text' as const,
            text: `No agents available to query.\n\nConfigured: ${configured.join(', ') || 'none'}\nExcluded (host): ${excludedAgent ?? 'none'}\n\nCheck API keys in environment variables and ensure agent MCPs are built.`,
          },
        ],
        isError: true,
      };
    }

    // Query agents
    const responses = await orchestrator.queryAgents(availableAgents, {
      query: args.query,
      context: args.context,
      systemPrompt: config.systemPrompt,
    });

    // Aggregate results
    const result = aggregator.aggregate(responses);

    // Format response
    const formattedResponse = formatResponse(result);

    return {
      content: [
        {
          type: 'text' as const,
          text: formattedResponse,
        },
      ],
    };
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [SETUP_PROMPT, STATUS_PROMPT],
  }));

  // Handle prompt requests
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'status') {
      const allAgents = getAvailableAgentIds();
      const configuredAgents = orchestrator.getConfiguredAgents();
      const excludedAgent = orchestrator.getExcludedAgent();
      const ghAvailable = isGitHubCLIAvailable();
      const ghToken = ghAvailable ? getGitHubTokenFromCLI() : null;

      const agentRows = allAgents.map((agent) => {
        const enabled = configuredAgents.includes(agent);
        const excluded = agent === excludedAgent;

        let enabledStatus = enabled ? '✓' : '✗';
        if (excluded) enabledStatus = '✗ (host)';

        let keyStatus = '-';
        if (!excluded) {
          if (hasApiKey(agent)) {
            if (agent === 'github' && ghToken) {
              keyStatus = '✓ gh CLI';
            } else if (process.env[AGENT_KEY_ENV_VARS[agent]]) {
              keyStatus = '✓ env';
            } else {
              keyStatus = '✓ stored';
            }
          } else {
            keyStatus = '✗ missing';
          }
        }

        return `| ${agent} | ${enabledStatus} | ${keyStatus} |`;
      });

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `# Second Opinion Status

**Config source:** ${config.configSource}
**Config file:** ${getConfigFilePath()}
**Host:** ${config.host ?? 'not set'}
**GitHub CLI:** ${ghAvailable ? '✓ installed' : '✗ not found'}

## Agent Status

| Agent | Enabled | API Key |
|-------|---------|---------|
${agentRows.join('\n')}

## To Change Configuration

Run \`/second-opinion setup\` to reconfigure agents interactively.`,
            },
          },
        ],
      };
    }

    if (name === 'setup') {
      const allAgents = getAvailableAgentIds();
      const ghAvailable = isGitHubCLIAvailable();
      const ghToken = ghAvailable ? getGitHubTokenFromCLI() : null;

      const agentRows = allAgents.map((agent) => {
        const hasKey = hasApiKey(agent);
        let keyStatus = hasKey ? '✓' : '✗';
        if (agent === 'github' && ghToken) {
          keyStatus = '✓ (gh CLI)';
        }
        return `| ${agent} | ${keyStatus} |`;
      });

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `# Second Opinion Setup

Interactive configuration - no file editing required.

## Available Agents

| Agent | Key Available |
|-------|---------------|
${agentRows.join('\n')}

**GitHub CLI:** ${ghAvailable ? '✓ Token will be auto-detected' : '✗ Not installed (manual token needed)'}

## Current Configuration

- **Enabled agents:** ${config.enabledAgents.join(', ') || 'none'}
- **Config source:** ${config.configSource}

## Setup Flow

1. Use AskUserQuestion (multiSelect) to ask which agents to enable
2. For each selected agent without a key:
   - GitHub: Auto-detect from \`gh auth token\` if available
   - Others: Use AskUserQuestion to prompt user to paste their API key
3. Save to: ${getConfigFilePath()}
4. Keys are stored locally - user never edits files

### Key Format Hints
- OpenAI: starts with \`sk-\`
- Anthropic: starts with \`sk-ant-\`
- Google: alphanumeric string
- GitHub: \`ghp_\` or \`gho_\` (or auto-detected from gh CLI)

### Important
- Remind user to add \`.claude/\` to \`.gitignore\`
- Anthropic is auto-excluded when running in Claude Code`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.error('Shutting down...');
    await orchestrator.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup info to stderr (not stdout, which is for MCP)
  console.error('Second Opinion Orchestrator started');
  console.error(`Config source: ${config.configSource}`);
  console.error(`Host: ${config.host ?? 'not set'}`);
  console.error(`Excluded agent: ${orchestrator.getExcludedAgent() ?? 'none'}`);
  console.error(`Enabled agents: ${config.enabledAgents.join(', ')}`);
  console.error(`Available agents: ${orchestrator.getConfiguredAgents().join(', ')}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
