/**
 * Google Gemini API Adapter
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

export class GeminiAdapter {
  private apiKey: string;
  private endpoint: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY ?? '';
    this.endpoint = process.env.GEMINI_ENDPOINT ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    this.timeout = parseInt(process.env.GEMINI_TIMEOUT ?? '30000', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getInfo(): { provider: string; model: string } {
    return {
      provider: 'google',
      model: this.model,
    };
  }

  async query(params: QueryParams): Promise<QueryResult> {
    let userContent = params.query;
    if (params.context) {
      userContent += `\n\nContext:\n${params.context}`;
    }

    const contents: GeminiContent[] = [
      { role: 'user', parts: [{ text: userContent }] },
    ];

    const response = await this.fetchWithTimeout(
      `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`,
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
