/**
 * OpenAI API Adapter
 *
 * Authentication priority:
 * 1. OPENAI_API_KEY environment variable
 * 2. Stored in .claude/second-opinion.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface QueryParams {
  query: string;
  context?: string;
  systemPrompt: string;
  model?: string;
}

export interface QueryResult {
  response: string;
  tokensUsed?: number;
  model: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

interface LocalConfig {
  apiKeys?: Record<string, string>;
}

// Recommended models for second opinions
const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex reasoning' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation, still powerful' },
  { id: 'o1', name: 'o1', description: 'Advanced reasoning model' },
  { id: 'o1-mini', name: 'o1 Mini', description: 'Faster reasoning model' },
];

/**
 * Try to read API key from local config file
 */
function getKeyFromLocalConfig(): string | null {
  const configPaths = [
    join(process.cwd(), '.claude', 'second-opinion.json'),
    join(process.env.HOME ?? '', '.claude', 'second-opinion.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as LocalConfig;
        if (config.apiKeys?.openai) {
          return config.apiKeys.openai;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return null;
}

export class OpenAIAdapter {
  private apiKey: string;
  private endpoint: string;
  private defaultModel: string;
  private timeout: number;
  private authSource: 'env' | 'config' | 'none';

  constructor() {
    // Resolve API key from multiple sources
    if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.authSource = 'env';
    } else {
      const configKey = getKeyFromLocalConfig();
      if (configKey) {
        this.apiKey = configKey;
        this.authSource = 'config';
      } else {
        this.apiKey = '';
        this.authSource = 'none';
      }
    }

    this.endpoint = process.env.OPENAI_ENDPOINT ?? 'https://api.openai.com/v1';
    this.defaultModel = 'gpt-4o';
    this.timeout = parseInt(process.env.OPENAI_TIMEOUT ?? '60000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getAuthSource(): string {
    return this.authSource;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'openai',
      model: this.defaultModel,
    };
  }

  getAvailableModels(): ModelInfo[] {
    return AVAILABLE_MODELS;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async query(params: QueryParams): Promise<QueryResult> {
    const model = params.model ?? this.defaultModel;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: params.systemPrompt },
    ];

    let userContent = params.query;
    if (params.context) {
      userContent += `\n\nContext:\n${params.context}`;
    }
    messages.push({ role: 'user', content: userContent });

    const response = await this.fetchWithTimeout(
      `${this.endpoint}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAIResponse;

    return {
      response: data.choices[0]?.message?.content ?? '',
      tokensUsed: data.usage?.total_tokens,
      model,
    };
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
