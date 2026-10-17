export type FixtureCategory =
  | 'conventional'
  | 'unconventional'
  | 'dashboard'
  | 'mobile';

export interface ExpectedElementsAssertion {
  [elementType: string]: number | { min?: number; max?: number; exact?: number };
}

export interface NestingAssertion {
  parent: string;
  contains: string;
  minCount?: number;
}

export interface FlagAssertion {
  selector: string;
  expectedCss: string; // regex or substring, e.g. 'sticky|fixed'
  description?: string;
}

export interface WidthAssertion {
  selector: string;
  expectedClasses: string[]; // at least one must match
  description?: string;
}

export interface ContractDefinition {
  name: string;
  category: FixtureCategory;
  description: string;
  assertions: {
    expectedElements?: ExpectedElementsAssertion;
    nesting?: NestingAssertion[];
    flags?: FlagAssertion[];
    widths?: WidthAssertion[];
    sectionOrder?: string[];
  };
}

export interface BenchmarkFixture {
  id: string;
  name: string;
  category: FixtureCategory;
  description: string;
  shapes: any[];
  contract: ContractDefinition;
}

export type PromptModality = 'spec' | 'baseline' | 'ast';

export interface PromptPayload {
  modality: PromptModality;
  fixtureId: string;
  systemPrompt: string;
  userPrompt: string;
  estimatedPromptTokens: number;
}

export interface AssertionDetail {
  category: 'elements' | 'nesting' | 'flags' | 'widths' | 'order';
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface ScorerResult {
  fixtureId: string;
  modality: PromptModality;
  totalAssertions: number;
  passedAssertions: number;
  scorePercentage: number;
  categoryScores: {
    elements: { passed: number; total: number };
    nesting: { passed: number; total: number };
    flags: { passed: number; total: number };
    widths: { passed: number; total: number };
    order: { passed: number; total: number };
  };
  details: AssertionDetail[];
  tokenCost: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface BenchmarkModalitySummary {
  modality: PromptModality;
  avgScore: number;
  avgPromptTokens: number;
  avgCompletionTokens: number;
  avgTotalTokens: number;
  perfectFixtures: number;
  categoryAverages: Record<FixtureCategory, number>;
}

export interface BenchmarkRunReport {
  timestamp: string;
  version: string;
  fixtureCount: number;
  modalities: Record<PromptModality, BenchmarkModalitySummary>;
  winDelta: number; // spec score minus baseline score
  decisionPassed: boolean; // winDelta >= 15 && spec tokens <= baseline tokens * 1.2
  fixtures: Record<string, Record<PromptModality, ScorerResult>>;
}
