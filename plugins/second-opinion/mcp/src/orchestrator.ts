/**
 * Agent Orchestrator
 * Spawns and manages agent MCPs as child processes
 */

import { spawn, ChildProcess } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { AGENT_REGISTRY, getAgentInfo, getAgentIdFromHost } from './agent-registry.js';
import { getApiKeysForAgents } from './config.js';
import { AgentResponse, QueryParams } from './types.js';

interface AgentClient {
  id: string;
  client: Client;
  transport: StdioClientTransport;
  process: ChildProcess;
  provider: string;
}

export class AgentOrchestrator {
  private agents: Map<string, AgentClient> = new Map();
  private excludedAgent: string | null = null;
  private parallel: boolean;

  constructor(
    private enabledAgents: string[],
    host: string | null,
    parallel: boolean = true
  ) {
    this.parallel = parallel;
    if (host) {
      this.excludedAgent = getAgentIdFromHost(host);
    }
  }

  /**
   * Initialize all enabled agent MCPs
   */
  async initialize(): Promise<void> {
    const spawnPromises = this.enabledAgents
      .filter((id) => AGENT_REGISTRY[id])
      .map((id) => this.spawnAgent(id));

    await Promise.all(spawnPromises);
  }

  /**
   * Spawn a single agent MCP as a child process
   */
  private async spawnAgent(id: string): Promise<void> {
    const info = getAgentInfo(id);
    if (!info) {
      console.error(`Unknown agent: ${id}`);
      return;
    }

    try {
      // Get API keys from stored config + env + GitHub CLI
      const agentKeys = getApiKeysForAgents([id]);

      // Merge with current environment (stored keys override missing env vars)
      const env = {
        ...(process.env as Record<string, string>),
        ...agentKeys,
      };

      const transport = new StdioClientTransport({
        command: 'node',
        args: [info.path],
        env,
      });

      const client = new Client(
        {
          name: `orchestrator-${id}`,
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);

      // Get the underlying process from transport
      // The transport spawns a child process internally
      const childProcess = (transport as unknown as { _process?: ChildProcess })._process;

      this.agents.set(id, {
        id,
        client,
        transport,
        process: childProcess!,
        provider: info.provider,
      });

      console.error(`Spawned agent: ${id}`);
    } catch (err) {
      console.error(`Failed to spawn agent ${id}:`, err);
    }
  }

  /**
   * Get list of available agents (excluding host)
   */
  getAvailableAgents(requestedAgents?: string[]): string[] {
    let agents = requestedAgents ?? [...this.agents.keys()];

    // Exclude host agent
    if (this.excludedAgent) {
      agents = agents.filter((a) => a !== this.excludedAgent);
    }

    // Filter to only spawned agents
    return agents.filter((a) => this.agents.has(a));
  }

  /**
   * Get the excluded agent ID
   */
  getExcludedAgent(): string | null {
    return this.excludedAgent;
  }

  /**
   * Get list of configured agents
   */
  getConfiguredAgents(): string[] {
    return [...this.agents.keys()];
  }

  /**
   * Query multiple agents
   */
  async queryAgents(
    agents: string[],
    params: QueryParams
  ): Promise<AgentResponse[]> {
    if (this.parallel) {
      return this.queryParallel(agents, params);
    }
    return this.querySequential(agents, params);
  }

  private async queryParallel(
    agents: string[],
    params: QueryParams
  ): Promise<AgentResponse[]> {
    const promises = agents.map((id) => this.queryAgent(id, params));
    return Promise.all(promises);
  }

  private async querySequential(
    agents: string[],
    params: QueryParams
  ): Promise<AgentResponse[]> {
    const results: AgentResponse[] = [];
    for (const id of agents) {
      results.push(await this.queryAgent(id, params));
    }
    return results;
  }

  /**
   * Query a single agent
   */
  private async queryAgent(
    id: string,
    params: QueryParams
  ): Promise<AgentResponse> {
    const agent = this.agents.get(id);
    if (!agent) {
      return {
        agent: id,
        provider: 'unknown',
        model: 'unknown',
        response: '',
        latencyMs: 0,
        error: `Agent not found: ${id}`,
      };
    }

    const start = Date.now();

    try {
      const result = await agent.client.callTool({
        name: 'agent_query',
        arguments: {
          query: params.query,
          context: params.context,
          systemPrompt: params.systemPrompt,
        },
      });

      const latencyMs = Date.now() - start;

      // Parse the JSON response from the agent
      const content = result.content as Array<{ type: string; text?: string }>;
      const textContent = content.find((c) => c.type === 'text');

      if (!textContent?.text) {
        return {
          agent: id,
          provider: agent.provider,
          model: 'unknown',
          response: '',
          latencyMs,
          error: 'Empty response from agent',
        };
      }

      const parsed = JSON.parse(textContent.text) as {
        response?: string;
        tokensUsed?: number;
        provider?: string;
        model?: string;
        error?: string;
      };

      if (parsed.error) {
        return {
          agent: id,
          provider: parsed.provider ?? agent.provider,
          model: parsed.model ?? 'unknown',
          response: '',
          latencyMs,
          error: parsed.error,
        };
      }

      return {
        agent: id,
        provider: parsed.provider ?? agent.provider,
        model: parsed.model ?? 'unknown',
        response: parsed.response ?? '',
        latencyMs,
        tokensUsed: parsed.tokensUsed,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        agent: id,
        provider: agent.provider,
        model: 'unknown',
        response: '',
        latencyMs: Date.now() - start,
        error,
      };
    }
  }

  /**
   * Gracefully shutdown all agent processes
   */
  async shutdown(): Promise<void> {
    for (const [id, agent] of this.agents) {
      try {
        await agent.client.close();
        console.error(`Stopped agent: ${id}`);
      } catch (err) {
        console.error(`Error stopping agent ${id}:`, err);
      }
    }
    this.agents.clear();
  }
}
