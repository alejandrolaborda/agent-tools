/**
 * Google Gemini API Adapter
 *
 * Authentication priority:
 * 1. GOOGLE_API_KEY environment variable
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

interface GeminiContent {
  parts: Array<{ text: string }>;
  role?: 'user' | 'model';
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    totalTokenCount: number;
  };
}

interface LocalConfig {
  apiKeys?: Record<string, string>;
}

// Recommended models for second opinions
const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and capable, good balance' },
  { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', description: 'Enhanced reasoning capabilities' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable, best for complex tasks' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and cost-effective' },
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
        if (config.apiKeys?.gemini) {
          return config.apiKeys.gemini;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return null;
}

export class GeminiAdapter {
  private apiKey: string;
  private endpoint: string;
  private defaultModel: string;
  private timeout: number;
  private authSource: 'env' | 'config' | 'none';

  constructor() {
    // Resolve API key from multiple sources
    if (process.env.GOOGLE_API_KEY) {
      this.apiKey = process.env.GOOGLE_API_KEY;
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

    this.endpoint = process.env.GEMINI_ENDPOINT ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = 'gemini-2.0-flash';
    this.timeout = parseInt(process.env.GEMINI_TIMEOUT ?? '60000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getAuthSource(): string {
    return this.authSource;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'google',
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

    let userContent = params.query;
    if (params.context) {
      userContent += `\n\nContext:\n${params.context}`;
    }

    const contents: GeminiContent[] = [
      { role: 'user', parts: [{ text: userContent }] },
    ];

    const response = await this.fetchWithTimeout(
      `${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemPrompt }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as GeminiResponse;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      response: text,
      tokensUsed: data.usageMetadata?.totalTokenCount,
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
