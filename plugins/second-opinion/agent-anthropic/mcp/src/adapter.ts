/**
 * Anthropic API Adapter
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

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicAdapter {
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? '';
    this.endpoint = process.env.ANTHROPIC_ENDPOINT ?? 'https://api.anthropic.com/v1';
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
    this.timeout = parseInt(process.env.ANTHROPIC_TIMEOUT ?? '30000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'anthropic',
      model: this.model,
    };
  }

  async query(params: QueryParams): Promise<QueryResult> {
    let userContent = params.query;
    if (params.context) {
      userContent += `\n\nContext:\n${params.context}`;
    }

    const messages: AnthropicMessage[] = [
      { role: 'user', content: userContent },
    ];

    const response = await this.fetchWithTimeout(
      `${this.endpoint}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          system: params.systemPrompt,
          messages,
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    const text = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    return {
      response: text,
      tokensUsed: data.usage
        ? data.usage.input_tokens + data.usage.output_tokens
        : undefined,
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
