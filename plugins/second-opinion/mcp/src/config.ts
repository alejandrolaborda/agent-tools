import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { getAvailableAgentIds } from './agent-registry.js';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_SYSTEM_PROMPT = `You are providing a second opinion on a coding question.
Be concise. Focus on:
1. Direct answer to the question
2. Key considerations or tradeoffs
3. Potential issues with the proposed approach
4. Alternative approaches if relevant

Keep response under 300 words. Be direct and actionable.`;

// ============================================================================
// API Key Environment Variable Mapping
// ============================================================================

export const AGENT_KEY_ENV_VARS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GOOGLE_API_KEY',
  github: 'GITHUB_TOKEN',
};

// ============================================================================
// Local Config File
// ============================================================================

interface LocalConfig {
  enabledAgents?: string[];
  apiKeys?: Record<string, string>;
  updatedAt?: string;
}

/**
 * Try to read local config from .claude/second-opinion.json
 */
function readLocalConfig(): LocalConfig | null {
  // Try current working directory first
  const configPaths = [
    join(process.cwd(), '.claude', 'second-opinion.json'),
    join(process.env.HOME ?? '', '.claude', 'second-opinion.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as LocalConfig;
        console.error(`Loaded config from: ${configPath}`);
        return config;
      } catch (err) {
        console.error(`Failed to parse config at ${configPath}:`, err);
      }
    }
  }

  return null;
}

// ============================================================================
// Orchestrator Config
// ============================================================================

export interface OrchestratorConfig {
  host: string | null;
  enabledAgents: string[];
  parallel: boolean;
  systemPrompt: string;
  configSource: 'local' | 'env' | 'default';
}

/**
 * Load orchestrator configuration
 * Priority: Local config file > Environment variables > Defaults
 */
export function loadConfig(): OrchestratorConfig {
  const allAgents = getAvailableAgentIds();
  let enabledAgents: string[];
  let configSource: 'local' | 'env' | 'default' = 'default';

  // Try local config first
  const localConfig = readLocalConfig();
  if (localConfig?.enabledAgents && localConfig.enabledAgents.length > 0) {
    enabledAgents = localConfig.enabledAgents.filter((a) => allAgents.includes(a));
    configSource = 'local';
  } else {
    // Fall back to env var
    const enabledAgentsEnv = process.env.ENABLED_AGENTS;
    if (enabledAgentsEnv) {
      enabledAgents = enabledAgentsEnv
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter((a) => allAgents.includes(a));
      configSource = 'env';
    } else {
      // Default to all available agents
      enabledAgents = allAgents;
      configSource = 'default';
    }
  }

  // Get host from env
  const host = process.env.SECOND_OPINION_HOST ?? null;

  // Get parallel setting from env (default: true)
  const parallel = process.env.SECOND_OPINION_PARALLEL !== 'false';

  // Get custom system prompt from env
  const systemPrompt = process.env.SECOND_OPINION_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;

  return {
    host,
    enabledAgents,
    parallel,
    systemPrompt,
    configSource,
  };
}

/**
 * Get config file path for the current project
 */
export function getConfigFilePath(): string {
  return join(process.cwd(), '.claude', 'second-opinion.json');
}

// ============================================================================
// GitHub CLI Integration
// ============================================================================

/**
 * Try to get GitHub token from gh CLI
 */
export function getGitHubTokenFromCLI(): string | null {
  try {
    const token = execSync('gh auth token 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Check if gh CLI is available
 */
export function isGitHubCLIAvailable(): boolean {
  try {
    execSync('which gh 2>/dev/null', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// API Key Management
// ============================================================================

/**
 * Get API keys for agents, merging stored keys with environment variables
 * Priority: Environment variable > Stored config > GitHub CLI (for github agent)
 */
export function getApiKeysForAgents(agents: string[]): Record<string, string> {
  const localConfig = readLocalConfig();
  const storedKeys = localConfig?.apiKeys ?? {};
  const keys: Record<string, string> = {};

  for (const agent of agents) {
    const envVar = AGENT_KEY_ENV_VARS[agent];
    if (!envVar) continue;

    // Priority 1: Environment variable
    const envValue = process.env[envVar];
    if (envValue) {
      keys[envVar] = envValue;
      continue;
    }

    // Priority 2: Stored in local config
    const storedValue = storedKeys[agent];
    if (storedValue) {
      keys[envVar] = storedValue;
      continue;
    }

    // Priority 3: GitHub CLI for github agent
    if (agent === 'github') {
      const cliToken = getGitHubTokenFromCLI();
      if (cliToken) {
        keys[envVar] = cliToken;
      }
    }
  }

  return keys;
}

/**
 * Check which agents have API keys available
 */
export function getAgentsWithKeys(): string[] {
  const allAgents = getAvailableAgentIds();
  const keysAvailable = getApiKeysForAgents(allAgents);

  return allAgents.filter((agent) => {
    const envVar = AGENT_KEY_ENV_VARS[agent];
    return envVar && keysAvailable[envVar];
  });
}

/**
 * Check if an agent has an API key available
 */
export function hasApiKey(agent: string): boolean {
  const envVar = AGENT_KEY_ENV_VARS[agent];
  if (!envVar) return false;

  const keys = getApiKeysForAgents([agent]);
  return !!keys[envVar];
}

// ============================================================================
// Config Saving
// ============================================================================

/**
 * Save configuration to local file
 */
export function saveConfig(config: {
  enabledAgents?: string[];
  apiKeys?: Record<string, string>;
}): void {
  const configPath = getConfigFilePath();
  const dir = dirname(configPath);

  // Ensure .claude directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Merge with existing config
  const existing = readLocalConfig() ?? {};
  const merged: LocalConfig = {
    ...existing,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  // If apiKeys provided, merge them
  if (config.apiKeys) {
    merged.apiKeys = {
      ...(existing.apiKeys ?? {}),
      ...config.apiKeys,
    };
  }

  writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n');
}
