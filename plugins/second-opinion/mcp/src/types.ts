// ============================================================================
// Request/Response Types
// ============================================================================

export interface SecondOpinionRequest {
  query: string;
  context?: string;
  agents?: string[];
}

export interface QueryParams {
  query: string;
  context?: string;
  systemPrompt: string;
}

export interface AgentResponse {
  agent: string;
  provider: string;
  model: string;
  response: string;
  latencyMs: number;
  tokensUsed?: number;
  error?: string;
}

export type Outcome = 'consensus' | 'decided' | 'needs_input';
export type ConsensusStrength = 'strong' | 'weak' | 'none';

export interface SecondOpinionResponse {
  outcome: Outcome;
  action: string;
  rationale?: string;
  options?: Array<{
    option: string;
    tradeoff: string;
  }>;
  _meta?: {
    agentsCount: number;
    consensusStrength: ConsensusStrength;
    timeMs: number;
  };
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisResult {
  consensusStrength: ConsensusStrength;
  consensusAction: string;
  canDecide: boolean;
  bestAction: string;
  decisionRationale: string;
  options: Array<{
    option: string;
    tradeoff: string;
  }>;
}
