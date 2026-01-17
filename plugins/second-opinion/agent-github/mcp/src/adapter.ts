/**
 * GitHub Models API Adapter
 * Uses OpenAI-compatible API
 */

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

interface GitHubMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GitHubResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

// GitHub Models supports various models - these are commonly available
const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o via GitHub' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective' },
  { id: 'o1', name: 'o1', description: 'Advanced reasoning model' },
  { id: 'o1-mini', name: 'o1 Mini', description: 'Faster reasoning model' },
  { id: 'Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: 'Meta Llama 3.3 70B' },
  { id: 'Mistral-Large-2411', name: 'Mistral Large', description: 'Mistral AI Large model' },
];

export class GitHubAdapter {
  private apiKey: string;
  private endpoint: string;
  private defaultModel: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.GITHUB_TOKEN ?? '';
    this.endpoint = process.env.GITHUB_MODELS_ENDPOINT ?? 'https://models.inference.ai.azure.com';
    this.defaultModel = 'gpt-4o';
    this.timeout = parseInt(process.env.GITHUB_MODELS_TIMEOUT ?? '60000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'github',
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

    const messages: GitHubMessage[] = [
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
      throw new Error(`GitHub Models API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as GitHubResponse;

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
