/**
 * Prompt A/B Testing Framework
 * Phase 5.2.9: Add prompt A/B testing framework
 *
 * Enables testing different prompt variations to optimize
 * response quality and user satisfaction.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type PromptVariantId = string;

export interface PromptVariant {
  id: PromptVariantId;
  name: string;
  description: string;
  promptTemplate: string;
  weight: number; // 0-1, used for weighted random selection
  metadata: {
    createdAt: string;
    author?: string;
    tags?: string[];
  };
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  promptType: string;
  variants: PromptVariant[];
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
  trafficSplit: Record<PromptVariantId, number>; // % traffic per variant
  winningVariant?: PromptVariantId;
}

export interface ABTestAssignment {
  testId: string;
  variantId: PromptVariantId;
  assignedAt: string;
  userId?: string;
}

export interface ABTestResult {
  testId: string;
  variantId: PromptVariantId;
  timestamp: string;
  metrics: {
    responseQuality: number; // 0-100
    userFeedback?: 'positive' | 'negative' | 'neutral';
    wasUsed?: boolean; // Did user copy the suggestion
    responseTime?: number; // ms
    tokenCount?: number;
  };
}

export interface ABTestAnalytics {
  testId: string;
  variantId: PromptVariantId;
  sampleSize: number;
  avgQualityScore: number;
  positiveRate: number;
  useRate: number;
  avgResponseTime: number;
  confidenceLevel: number; // 0-1
}

// ==========================================
// Storage Keys
// ==========================================

const STORAGE_KEYS = {
  TESTS: 'flirtkey_ab_tests',
  ASSIGNMENTS: 'flirtkey_ab_assignments',
  RESULTS: 'flirtkey_ab_results',
} as const;

// ==========================================
// Default Prompt Variants
// ==========================================

export const DEFAULT_FLIRT_VARIANTS: PromptVariant[] = [
  {
    id: 'flirt_v1_structured',
    name: 'Structured Approach',
    description: 'Highly structured prompt with clear sections',
    weight: 0.5,
    promptTemplate: `You are FlirtKey, an expert dating assistant.

## CONTEXT
{context}

## HER MESSAGE
"{message}"

## TASK
Generate 3 response options in JSON format:
{
  "suggestions": [
    {"type": "safe", "text": "...", "reason": "..."},
    {"type": "balanced", "text": "...", "reason": "..."},
    {"type": "bold", "text": "...", "reason": "..."}
  ],
  "proTip": "...",
  "interestLevel": 1-10,
  "mood": "..."
}

## RULES
{rules}`,
    metadata: {
      createdAt: '2025-01-01',
      author: 'FlirtKey Team',
      tags: ['original', 'structured'],
    },
  },
  {
    id: 'flirt_v2_conversational',
    name: 'Conversational Approach',
    description: 'More natural, conversational prompt style',
    weight: 0.3,
    promptTemplate: `Hey FlirtKey! I need your help responding to {name}.

Here's what I know about her: {context}

She just sent me this: "{message}"

Can you give me 3 options ranging from safe to bold? Format as JSON with suggestions array (type, text, reason), plus proTip, interestLevel (1-10), and mood.

Remember: {rules}`,
    metadata: {
      createdAt: '2025-01-15',
      author: 'FlirtKey Team',
      tags: ['conversational', 'friendly'],
    },
  },
  {
    id: 'flirt_v3_minimal',
    name: 'Minimal Approach',
    description: 'Token-efficient minimal prompt',
    weight: 0.2,
    promptTemplate: `FlirtKey: Dating assistant
Girl: {name} | {context}
Her msg: "{message}"
Task: 3 replies (safe/balanced/bold) as JSON
Output: {"suggestions":[{"type":"...","text":"...","reason":"..."}],"proTip":"...","interestLevel":N,"mood":"..."}`,
    metadata: {
      createdAt: '2025-01-20',
      author: 'FlirtKey Team',
      tags: ['minimal', 'efficient'],
    },
  },
];

// ==========================================
// A/B Test Manager Class
// ==========================================

class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private assignments: Map<string, ABTestAssignment> = new Map();
  private results: ABTestResult[] = [];
  private initialized: boolean = false;

  /**
   * Initialize the manager and load persisted data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [testsData, assignmentsData, resultsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TESTS),
        AsyncStorage.getItem(STORAGE_KEYS.ASSIGNMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.RESULTS),
      ]);

      if (testsData) {
        const tests = JSON.parse(testsData) as ABTestConfig[];
        tests.forEach((t) => this.tests.set(t.id, t));
      }

      if (assignmentsData) {
        const assignments = JSON.parse(assignmentsData) as ABTestAssignment[];
        assignments.forEach((a) => this.assignments.set(`${a.testId}:${a.userId || 'default'}`, a));
      }

      if (resultsData) {
        this.results = JSON.parse(resultsData) as ABTestResult[];
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ABTestManager:', error);
      this.initialized = true; // Continue without persisted data
    }
  }

  /**
   * Persist current state to storage
   */
  private async persist(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(Array.from(this.tests.values()))),
        AsyncStorage.setItem(
          STORAGE_KEYS.ASSIGNMENTS,
          JSON.stringify(Array.from(this.assignments.values()))
        ),
        AsyncStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(this.results.slice(-1000))), // Keep last 1000
      ]);
    } catch (error) {
      console.error('Failed to persist ABTestManager state:', error);
    }
  }

  /**
   * Create a new A/B test
   */
  async createTest(config: Omit<ABTestConfig, 'startedAt' | 'isActive'>): Promise<ABTestConfig> {
    await this.initialize();

    const test: ABTestConfig = {
      ...config,
      startedAt: new Date().toISOString(),
      isActive: true,
    };

    this.tests.set(test.id, test);
    await this.persist();

    return test;
  }

  /**
   * Get an active test by prompt type
   */
  async getActiveTest(promptType: string): Promise<ABTestConfig | null> {
    await this.initialize();

    for (const test of this.tests.values()) {
      if (test.isActive && test.promptType === promptType) {
        return test;
      }
    }
    return null;
  }

  /**
   * Assign a user to a test variant
   */
  async assignVariant(testId: string, userId?: string): Promise<PromptVariant | null> {
    await this.initialize();

    const test = this.tests.get(testId);
    if (!test || !test.isActive) return null;

    const assignmentKey = `${testId}:${userId || 'default'}`;

    // Check for existing assignment (sticky assignment)
    const existing = this.assignments.get(assignmentKey);
    if (existing) {
      const variant = test.variants.find((v) => v.id === existing.variantId);
      if (variant) return variant;
    }

    // New assignment based on traffic split
    const variant = this.selectVariant(test);
    if (!variant) return null;

    const assignment: ABTestAssignment = {
      testId,
      variantId: variant.id,
      assignedAt: new Date().toISOString(),
      userId,
    };

    this.assignments.set(assignmentKey, assignment);
    await this.persist();

    return variant;
  }

  /**
   * Select variant based on traffic split
   */
  private selectVariant(test: ABTestConfig): PromptVariant | null {
    const random = Math.random();
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += test.trafficSplit[variant.id] || 0;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return test.variants[0] || null;
  }

  /**
   * Record a test result
   */
  async recordResult(result: ABTestResult): Promise<void> {
    await this.initialize();

    this.results.push(result);
    await this.persist();
  }

  /**
   * Get analytics for a test
   */
  async getAnalytics(testId: string): Promise<ABTestAnalytics[]> {
    await this.initialize();

    const test = this.tests.get(testId);
    if (!test) return [];

    const testResults = this.results.filter((r) => r.testId === testId);

    return test.variants.map((variant) => {
      const variantResults = testResults.filter((r) => r.variantId === variant.id);
      const sampleSize = variantResults.length;

      if (sampleSize === 0) {
        return {
          testId,
          variantId: variant.id,
          sampleSize: 0,
          avgQualityScore: 0,
          positiveRate: 0,
          useRate: 0,
          avgResponseTime: 0,
          confidenceLevel: 0,
        };
      }

      const avgQualityScore =
        variantResults.reduce((sum, r) => sum + r.metrics.responseQuality, 0) / sampleSize;
      const positiveCount = variantResults.filter(
        (r) => r.metrics.userFeedback === 'positive'
      ).length;
      const usedCount = variantResults.filter((r) => r.metrics.wasUsed).length;
      const avgResponseTime =
        variantResults.reduce((sum, r) => sum + (r.metrics.responseTime || 0), 0) / sampleSize;

      // Calculate confidence level based on sample size (simplified)
      const confidenceLevel = Math.min(1, sampleSize / 100);

      return {
        testId,
        variantId: variant.id,
        sampleSize,
        avgQualityScore,
        positiveRate: positiveCount / sampleSize,
        useRate: usedCount / sampleSize,
        avgResponseTime,
        confidenceLevel,
      };
    });
  }

  /**
   * Determine winner based on analytics
   */
  async determineWinner(testId: string): Promise<{
    winner: PromptVariant | null;
    confidence: number;
    reason: string;
  }> {
    const analytics = await this.getAnalytics(testId);
    const test = this.tests.get(testId);

    if (!test || analytics.length === 0) {
      return { winner: null, confidence: 0, reason: 'No data available' };
    }

    // Need minimum sample size for statistical significance
    const MIN_SAMPLE_SIZE = 30;
    const validAnalytics = analytics.filter((a) => a.sampleSize >= MIN_SAMPLE_SIZE);

    if (validAnalytics.length < 2) {
      return { winner: null, confidence: 0, reason: 'Insufficient sample size' };
    }

    // Score variants (weighted combination of metrics)
    const scored = validAnalytics.map((a) => ({
      ...a,
      score: a.avgQualityScore * 0.4 + a.positiveRate * 100 * 0.3 + a.useRate * 100 * 0.3,
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0]!;
    const second = scored[1];

    // Check if winner is statistically significant
    // Simplified: >10% improvement with >0.8 confidence
    const improvement = second ? (best.score - second.score) / second.score : 0;
    const isSignificant = improvement > 0.1 && best.confidenceLevel > 0.8;

    const winner = test.variants.find((v) => v.id === best.variantId) || null;

    return {
      winner: isSignificant ? winner : null,
      confidence: best.confidenceLevel,
      reason: isSignificant
        ? `Variant "${winner?.name}" outperforms by ${(improvement * 100).toFixed(1)}%`
        : 'No statistically significant winner yet',
    };
  }

  /**
   * End a test and optionally set winner
   */
  async endTest(testId: string, winningVariantId?: PromptVariantId): Promise<void> {
    await this.initialize();

    const test = this.tests.get(testId);
    if (test) {
      test.isActive = false;
      test.endedAt = new Date().toISOString();
      if (winningVariantId) {
        test.winningVariant = winningVariantId;
      }
      await this.persist();
    }
  }

  /**
   * Get all tests
   */
  async getAllTests(): Promise<ABTestConfig[]> {
    await this.initialize();
    return Array.from(this.tests.values());
  }

  /**
   * Clear all test data
   */
  async clearAll(): Promise<void> {
    this.tests.clear();
    this.assignments.clear();
    this.results = [];
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TESTS),
      AsyncStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS),
      AsyncStorage.removeItem(STORAGE_KEYS.RESULTS),
    ]);
  }
}

// ==========================================
// Singleton Instance
// ==========================================

export const abTestManager = new ABTestManager();

// ==========================================
// Helper Functions
// ==========================================

/**
 * Build a prompt from a variant template
 */
export function buildPromptFromVariant(
  variant: PromptVariant,
  params: {
    name: string;
    context: string;
    message: string;
    rules: string;
  }
): string {
  return variant.promptTemplate
    .replace('{name}', params.name)
    .replace('{context}', params.context)
    .replace('{message}', params.message)
    .replace('{rules}', params.rules);
}

/**
 * Create a default flirt response A/B test
 */
export async function createDefaultFlirtTest(): Promise<ABTestConfig> {
  return abTestManager.createTest({
    id: `flirt_test_${Date.now()}`,
    name: 'Flirt Response Prompt Test',
    description: 'Testing different prompt structures for flirt responses',
    promptType: 'flirt_response',
    variants: DEFAULT_FLIRT_VARIANTS,
    trafficSplit: {
      flirt_v1_structured: 0.5,
      flirt_v2_conversational: 0.3,
      flirt_v3_minimal: 0.2,
    },
  });
}

/**
 * Get or create an active flirt test
 */
export async function getOrCreateFlirtTest(): Promise<ABTestConfig> {
  const existing = await abTestManager.getActiveTest('flirt_response');
  if (existing) return existing;
  return createDefaultFlirtTest();
}

/**
 * Record user feedback for A/B testing
 */
export async function recordABTestFeedback(
  testId: string,
  variantId: PromptVariantId,
  metrics: ABTestResult['metrics']
): Promise<void> {
  await abTestManager.recordResult({
    testId,
    variantId,
    timestamp: new Date().toISOString(),
    metrics,
  });
}

// ==========================================
// Export
// ==========================================

export const PromptABTesting = {
  // Manager
  manager: abTestManager,

  // Default variants
  DEFAULT_FLIRT_VARIANTS,

  // Helper functions
  buildPromptFromVariant,
  createDefaultFlirtTest,
  getOrCreateFlirtTest,
  recordABTestFeedback,
};

export default PromptABTesting;
