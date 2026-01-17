/**
 * GitHub Models API Adapter
 * Uses OpenAI-compatible API
 */

export interface QueryParams {
  query: string;
  context?: string;
  systemPrompt: string;
}

export interface QueryResult {
  response: string;
  tokensUsed?: number;
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

export class GitHubAdapter {
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.GITHUB_TOKEN ?? '';
    this.endpoint = process.env.GITHUB_MODELS_ENDPOINT ?? 'https://models.inference.ai.azure.com';
    this.model = process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o';
    this.timeout = parseInt(process.env.GITHUB_MODELS_TIMEOUT ?? '30000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'github',
      model: this.model,
    };
  }

  async query(params: QueryParams): Promise<QueryResult> {
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
          model: this.model,
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
