/**
 * Agent Registry
 * Maps agent IDs to their MCP executable paths
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths relative to the second-opinion plugin
const PLUGIN_ROOT = resolve(__dirname, '..', '..', '..');

export interface AgentInfo {
  id: string;
  path: string;
  provider: string;
  hostId: string; // ID used in hostAgentMap
}

export const AGENT_REGISTRY: Record<string, AgentInfo> = {
  openai: {
    id: 'openai',
    path: resolve(PLUGIN_ROOT, 'agent-openai', 'mcp', 'dist', 'index.js'),
    provider: 'openai',
    hostId: 'openai',
  },
  anthropic: {
    id: 'anthropic',
    path: resolve(PLUGIN_ROOT, 'agent-anthropic', 'mcp', 'dist', 'index.js'),
    provider: 'anthropic',
    hostId: 'anthropic',
  },
  gemini: {
    id: 'gemini',
    path: resolve(PLUGIN_ROOT, 'agent-gemini', 'mcp', 'dist', 'index.js'),
    provider: 'google',
    hostId: 'gemini',
  },
  github: {
    id: 'github',
    path: resolve(PLUGIN_ROOT, 'agent-github', 'mcp', 'dist', 'index.js'),
    provider: 'github',
    hostId: 'github',
  },
};

/**
 * Get list of available agent IDs
 */
export function getAvailableAgentIds(): string[] {
  return Object.keys(AGENT_REGISTRY);
}

/**
 * Get agent info by ID
 */
export function getAgentInfo(id: string): AgentInfo | undefined {
  return AGENT_REGISTRY[id];
}

/**
 * Get agent ID from host name
 */
export function getAgentIdFromHost(host: string): string | null {
  const hostAgentMap: Record<string, string> = {
    'claude-code': 'anthropic',
    'gemini': 'gemini',
    'codex': 'openai',
    'copilot': 'github',
  };
  return hostAgentMap[host] ?? null;
}
