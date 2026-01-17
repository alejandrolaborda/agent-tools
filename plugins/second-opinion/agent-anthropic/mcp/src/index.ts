#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AnthropicAdapter, QueryParams } from './adapter.js';

const AGENT_QUERY_TOOL = {
  name: 'agent_query',
  description: 'Query the Anthropic Claude agent with a question and optional context',
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
    },
    required: ['query', 'systemPrompt'],
  },
};

async function main(): Promise<void> {
  const adapter = new AnthropicAdapter();

  if (!adapter.isConfigured()) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    process.exit(1);
  }

  const info = adapter.getInfo();

  const server = new Server(
    {
      name: 'agent-anthropic',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [AGENT_QUERY_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'agent_query') {
      throw new Error(`Unknown tool: ${request.params.name}`);
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
              model: info.model,
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
              model: info.model,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Agent Anthropic MCP Server started (model: ${info.model})`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
