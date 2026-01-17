#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { GitHubAdapter, QueryParams } from './adapter.js';

const LIST_MODELS_TOOL = {
  name: 'list_models',
  description: 'List available GitHub Models for second opinions',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

const AGENT_QUERY_TOOL = {
  name: 'agent_query',
  description: 'Query the GitHub Models agent with a question and optional context',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The question or problem to get an opinion on',
      },
      context: {
        type: 'string',
        description: 'Code, error messages, or additional context',
      },
      systemPrompt: {
        type: 'string',
        description: 'System prompt to guide the response',
      },
      model: {
        type: 'string',
        description: 'Model to use (optional, defaults to gpt-4o). Use list_models to see available options.',
      },
    },
    required: ['query', 'systemPrompt'],
  },
};

async function main(): Promise<void> {
  const adapter = new GitHubAdapter();

  if (!adapter.isConfigured()) {
    console.error('Error: GitHub authentication not found.');
    console.error('');
    console.error('To authenticate, run: gh auth login');
    console.error('');
    console.error('This uses OAuth - no API keys needed!');
    process.exit(1);
  }

  console.error(`GitHub auth source: ${adapter.getAuthSource()}`);

  const info = adapter.getInfo();

  const server = new Server(
    {
      name: 'agent-github',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [LIST_MODELS_TOOL, AGENT_QUERY_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    if (name === 'list_models') {
      const models = adapter.getAvailableModels();
      const defaultModel = adapter.getDefaultModel();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              provider: 'github',
              models,
              default: defaultModel,
            }),
          },
        ],
      };
    }

    if (name !== 'agent_query') {
      throw new Error(`Unknown tool: ${name}`);
    }

    const args = request.params.arguments as unknown as QueryParams;

    if (!args.query || typeof args.query !== 'string') {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ error: 'query parameter is required' }),
          },
        ],
        isError: true,
      };
    }

    if (!args.systemPrompt || typeof args.systemPrompt !== 'string') {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ error: 'systemPrompt parameter is required' }),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await adapter.query(args);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              response: result.response,
              tokensUsed: result.tokensUsed,
              provider: info.provider,
              model: result.model,
            }),
          },
        ],
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error,
              provider: info.provider,
              model: args.model ?? adapter.getDefaultModel(),
            }),
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Agent GitHub MCP Server started (model: ${info.model})`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
