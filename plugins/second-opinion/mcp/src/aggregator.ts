import {
  AgentResponse,
  SecondOpinionResponse,
  AnalysisResult,
  ConsensusStrength,
} from './types.js';

// Keywords that indicate critical/irreversible decisions
const CRITICAL_KEYWORDS = new Set([
  'delete', 'remove', 'drop', 'truncate', 'destroy',
  'migrate', 'schema', 'database', 'production', 'deploy',
  'release', 'publish', 'security', 'authentication', 'auth',
  'encryption', 'credential', 'secret', 'key', 'token',
  'payment', 'billing', 'pii', 'gdpr', 'irreversible',
]);

// Technical terms that indicate agreement
const AGREEMENT_INDICATORS = new Set([
  'recommend', 'suggest', 'should', 'better', 'prefer',
  'approach', 'solution', 'pattern', 'best', 'optimal',
]);

// Stopwords to filter out when comparing responses
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'this', 'that', 'these', 'those', 'i', 'you', 'we', 'they', 'it',
  'its', 'your', 'our', 'their', 'my', 'his', 'her', 'which', 'who',
  'whom', 'what', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
]);

export class ResponseAggregator {
  aggregate(responses: AgentResponse[]): SecondOpinionResponse {
    const successful = responses.filter((r) => !r.error && r.response);

    // No responses - need input
    if (successful.length === 0) {
      return {
        outcome: 'needs_input',
        action: 'All agents failed to respond. Check API keys or retry.',
        options: [],
      };
    }

    // Single response - treat as weak consensus, proceed
    if (successful.length === 1) {
      return {
        outcome: 'consensus',
        action: this.extractAction(successful[0].response),
        _meta: {
          agentsCount: 1,
          consensusStrength: 'weak',
          timeMs: successful[0].latencyMs,
        },
      };
    }

    // Multiple responses - analyze
    const analysis = this.analyzeResponses(successful);
    const maxLatency = Math.max(...successful.map((r) => r.latencyMs));

    // Strong consensus - just do it
    if (analysis.consensusStrength === 'strong') {
      return {
        outcome: 'consensus',
        action: analysis.consensusAction,
        _meta: {
          agentsCount: successful.length,
          consensusStrength: 'strong',
          timeMs: maxLatency,
        },
      };
    }

    // Can decide - pick best and proceed
    if (analysis.canDecide) {
      return {
        outcome: 'decided',
        action: analysis.bestAction,
        rationale: analysis.decisionRationale,
        _meta: {
          agentsCount: successful.length,
          consensusStrength: analysis.consensusStrength,
          timeMs: maxLatency,
        },
      };
    }

    // Cannot decide - need user input (rare)
    return {
      outcome: 'needs_input',
      action: 'Conflicting approaches on a critical decision.',
      options: analysis.options.slice(0, 3),
      _meta: {
        agentsCount: successful.length,
        consensusStrength: 'none',
        timeMs: maxLatency,
      },
    };
  }

  private analyzeResponses(responses: AgentResponse[]): AnalysisResult {
    // Extract core actions from each response
    const actions = responses.map((r) => this.extractAction(r.response));
    const fullResponses = responses.map((r) => r.response);

    // Calculate semantic similarity
    const similarity = this.calculateSimilarity(fullResponses);

    // Strong consensus (>80% similarity)
    if (similarity > 0.8) {
      return {
        consensusStrength: 'strong',
        consensusAction: this.mergeActions(actions, fullResponses),
        canDecide: true,
        bestAction: '',
        decisionRationale: '',
        options: [],
      };
    }

    // Weak consensus (50-80% similarity)
    if (similarity > 0.5) {
      const bestAction = this.pickBestAction(responses);
      return {
        consensusStrength: 'weak',
        consensusAction: '',
        canDecide: true,
        bestAction,
        decisionRationale: 'Approaches are similar. Going with the most direct solution.',
        options: [],
      };
    }

    // Low similarity - check if decidable
    const isCritical = this.isIrreversibleDecision(fullResponses);

    if (!isCritical) {
      const bestAction = this.pickBestAction(responses);
      return {
        consensusStrength: 'none',
        consensusAction: '',
        canDecide: true,
        bestAction,
        decisionRationale: 'Opinions differ but none involve critical/irreversible changes.',
        options: [],
      };
    }

    // Critical decision with no consensus - ask user
    const options = this.extractOptions(responses);
    return {
      consensusStrength: 'none',
      consensusAction: '',
      canDecide: false,
      bestAction: '',
      decisionRationale: '',
      options,
    };
  }

  private extractAction(response: string): string {
    // Clean up the response
    const lines = response
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Look for action-oriented lines
    const actionPatterns = [
      /^(?:you should|i recommend|i suggest|try|use|consider|implement)/i,
      /^(?:the (?:best|recommended|preferred) (?:approach|solution|way))/i,
      /^(?:\d+\.|[-•*])\s*/,  // Numbered or bulleted lists
    ];

    for (const line of lines) {
      for (const pattern of actionPatterns) {
        if (pattern.test(line)) {
          return this.cleanAction(line);
        }
      }
    }

    // Fall back to first meaningful line
    const firstMeaningful = lines.find((l) => l.length > 30) ?? lines[0] ?? '';
    return this.cleanAction(firstMeaningful);
  }

  private cleanAction(text: string): string {
    // Remove markdown formatting, list prefixes, etc.
    return text
      .replace(/^(?:\d+\.|[-•*])\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim()
      .slice(0, 300);
  }

  private calculateSimilarity(responses: string[]): number {
    if (responses.length < 2) return 1;

    // Extract significant words from each response
    const wordSets = responses.map((r) => this.extractSignificantWords(r));

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < wordSets.length; i++) {
      for (let j = i + 1; j < wordSets.length; j++) {
        const similarity = this.jaccardSimilarity(wordSets[i], wordSets[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private extractSignificantWords(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));

    return new Set(words);
  }

  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter((w) => set2.has(w)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  private mergeActions(actions: string[], fullResponses: string[]): string {
    // Find the most concise action that captures the consensus
    const sorted = actions
      .filter((a) => a.length > 20)
      .sort((a, b) => a.length - b.length);

    if (sorted.length > 0) {
      return sorted[0];
    }

    // Fall back to extracting from the most comprehensive response
    const longestResponse = fullResponses.sort((a, b) => b.length - a.length)[0];
    return this.extractAction(longestResponse);
  }

  private pickBestAction(responses: AgentResponse[]): string {
    // Heuristics for picking the best action:
    // 1. Prefer shorter latency (more confident/faster model)
    // 2. Prefer more concise responses (usually more actionable)

    const sorted = [...responses]
      .filter((r) => r.response.length > 50)
      .sort((a, b) => {
        // Weight: 70% latency, 30% response length (shorter = better)
        const latencyScore = a.latencyMs - b.latencyMs;
        const lengthScore = (a.response.length - b.response.length) * 0.3;
        return latencyScore + lengthScore;
      });

    if (sorted.length === 0) {
      return this.extractAction(responses[0].response);
    }

    return this.extractAction(sorted[0].response);
  }

  private isIrreversibleDecision(responses: string[]): boolean {
    const combined = responses.join(' ').toLowerCase();
    const words = combined.split(/\W+/);

    for (const word of words) {
      if (CRITICAL_KEYWORDS.has(word)) {
        return true;
      }
    }
    return false;
  }

  private extractOptions(
    responses: AgentResponse[]
  ): Array<{ option: string; tradeoff: string }> {
    return responses.map((r) => {
      const action = this.extractAction(r.response);
      const tradeoff = this.extractTradeoff(r.response);
      return {
        option: action.slice(0, 80),
        tradeoff,
      };
    });
  }

  private extractTradeoff(response: string): string {
    const lines = response.split('\n');

    // Look for tradeoff indicators
    const tradeoffPatterns = [
      /(?:but|however|although|though|downside|drawback|tradeoff|trade-off|caveat)/i,
      /(?:on the other hand|keep in mind|be aware|note that)/i,
    ];

    for (const line of lines) {
      for (const pattern of tradeoffPatterns) {
        if (pattern.test(line)) {
          return line.trim().slice(0, 100);
        }
      }
    }

    return 'See full response for details';
  }
}
