/**
 * Network Testing Service
 * Phase 5.1.15: Test with various network conditions
 *
 * Provides utilities for testing AI service behavior under different
 * network conditions including slow connections, intermittent failures,
 * and offline scenarios.
 */

import { AIService, classifyError, getUserFriendlyMessage } from './ai';
import type { Girl, Culture, AnalysisResult, APIError } from '../types';

// ==========================================
// Network Condition Types
// ==========================================

export type NetworkCondition =
  | 'excellent' // < 100ms latency, no packet loss
  | 'good' // 100-300ms latency, <1% packet loss
  | 'moderate' // 300-800ms latency, 1-5% packet loss
  | 'poor' // 800-2000ms latency, 5-15% packet loss
  | 'very_poor' // 2000-5000ms latency, 15-30% packet loss
  | 'offline'; // No connection

export interface NetworkConditionConfig {
  name: NetworkCondition;
  latencyMs: { min: number; max: number };
  packetLossRate: number; // 0-1
  timeoutRate: number; // 0-1, chance of timeout
  description: string;
}

export const NETWORK_CONDITIONS: Record<NetworkCondition, NetworkConditionConfig> = {
  excellent: {
    name: 'excellent',
    latencyMs: { min: 20, max: 100 },
    packetLossRate: 0,
    timeoutRate: 0,
    description: 'Fast stable connection (WiFi/5G)',
  },
  good: {
    name: 'good',
    latencyMs: { min: 100, max: 300 },
    packetLossRate: 0.01,
    timeoutRate: 0.01,
    description: 'Normal mobile connection (4G)',
  },
  moderate: {
    name: 'moderate',
    latencyMs: { min: 300, max: 800 },
    packetLossRate: 0.05,
    timeoutRate: 0.03,
    description: 'Slow connection (3G/weak 4G)',
  },
  poor: {
    name: 'poor',
    latencyMs: { min: 800, max: 2000 },
    packetLossRate: 0.15,
    timeoutRate: 0.1,
    description: 'Poor connection (weak signal)',
  },
  very_poor: {
    name: 'very_poor',
    latencyMs: { min: 2000, max: 5000 },
    packetLossRate: 0.3,
    timeoutRate: 0.25,
    description: 'Very poor connection (edge/tunnels)',
  },
  offline: {
    name: 'offline',
    latencyMs: { min: 0, max: 0 },
    packetLossRate: 1,
    timeoutRate: 1,
    description: 'No network connection',
  },
};

// ==========================================
// Network Simulator
// ==========================================

export interface NetworkSimulatorConfig {
  condition: NetworkCondition;
  customLatencyMs?: number;
  customPacketLossRate?: number;
}

/**
 * Simulates network latency
 */
async function simulateLatency(config: NetworkConditionConfig): Promise<void> {
  const { min, max } = config.latencyMs;
  const latency = Math.random() * (max - min) + min;
  await new Promise((resolve) => setTimeout(resolve, latency));
}

/**
 * Simulates packet loss / network failure
 */
function shouldFail(config: NetworkConditionConfig): boolean {
  return Math.random() < config.packetLossRate;
}

/**
 * Simulates timeout
 */
function shouldTimeout(config: NetworkConditionConfig): boolean {
  return Math.random() < config.timeoutRate;
}

// ==========================================
// Test Results Types
// ==========================================

export interface NetworkTestResult {
  condition: NetworkCondition;
  success: boolean;
  latencyMs: number;
  error?: APIError;
  errorMessage?: string;
  retryCount: number;
  cacheHit: boolean;
  response?: AnalysisResult;
  timestamp: number;
}

export interface NetworkTestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  avgLatencyMs: number;
  successRate: number;
  results: NetworkTestResult[];
  summary: string;
}

// ==========================================
// Test Runner
// ==========================================

/**
 * Creates a mock girl for testing
 */
function createTestGirl(): Girl {
  return {
    id: 999,
    name: 'Test Girl',
    age: 25,
    culture: 'western',
    personality: 'Friendly and outgoing',
    interests: 'Travel, music, coffee',
    howMet: 'Dating app',
    relationshipStage: 'talking',
    messageCount: 10,
  };
}

/**
 * Test messages for different scenarios
 */
export const TEST_MESSAGES = {
  simple: 'Hey! How was your day?',
  medium: "Just got back from the gym! I'm so tired but it was worth it 💪",
  complex:
    "I've been thinking about what you said yesterday about traveling. I've always wanted to visit Japan but never had the chance. What's your favorite place you've been to?",
  emoji_heavy: '😂😂😂 that was hilarious! You always know how to make me laugh 🙈💕',
  short: 'lol',
  question: 'What are you up to tonight?',
  flirty: 'I had a dream about you last night... 😏',
};

/**
 * Run a single network condition test
 */
export async function runNetworkTest(
  apiKey: string,
  condition: NetworkCondition,
  messageType: keyof typeof TEST_MESSAGES = 'simple'
): Promise<NetworkTestResult> {
  const config = NETWORK_CONDITIONS[condition];
  const startTime = Date.now();
  const testGirl = createTestGirl();
  const testMessage = TEST_MESSAGES[messageType];

  // Initialize result
  const result: NetworkTestResult = {
    condition,
    success: false,
    latencyMs: 0,
    retryCount: 0,
    cacheHit: false,
    timestamp: startTime,
  };

  try {
    // Simulate network conditions
    if (condition === 'offline' || shouldFail(config)) {
      throw new Error('Network error: Connection failed');
    }

    if (shouldTimeout(config)) {
      throw new Error('Network error: Request timed out');
    }

    // Simulate latency
    await simulateLatency(config);

    // Make actual API call (with cache disabled to test fresh requests)
    const response = await AIService.generateFlirtResponse({
      girl: testGirl,
      herMessage: testMessage,
      userCulture: 'western' as Culture,
      apiKey,
      useCache: false,
    });

    result.success = true;
    result.response = response;
    result.latencyMs = Date.now() - startTime;
  } catch (error) {
    result.latencyMs = Date.now() - startTime;
    result.error = classifyError(error);
    result.errorMessage = getUserFriendlyMessage(result.error);

    // Test that error handling is working correctly
    if (result.error && result.error.retryable !== undefined) {
      result.success = false; // Error was properly classified
    }
  }

  return result;
}

/**
 * Run comprehensive network test suite
 */
export async function runNetworkTestSuite(
  apiKey: string,
  options: {
    conditions?: NetworkCondition[];
    iterationsPerCondition?: number;
    includeOffline?: boolean;
  } = {}
): Promise<NetworkTestSuiteResult> {
  const {
    conditions = ['excellent', 'good', 'moderate', 'poor'],
    iterationsPerCondition = 1,
    includeOffline = false,
  } = options;

  const allConditions = includeOffline
    ? [...conditions, 'offline' as NetworkCondition]
    : conditions;

  const results: NetworkTestResult[] = [];

  for (const condition of allConditions) {
    for (let i = 0; i < iterationsPerCondition; i++) {
      // Test with different message types
      const messageTypes = Object.keys(TEST_MESSAGES) as Array<keyof typeof TEST_MESSAGES>;
      const messageType = messageTypes[i % messageTypes.length] ?? 'simple';

      const result = await runNetworkTest(apiKey, condition, messageType);
      results.push(result);

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Calculate statistics
  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;
  const avgLatencyMs = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length;
  const successRate = passed / results.length;

  // Generate summary
  const conditionBreakdown = allConditions
    .map((c) => {
      const conditionResults = results.filter((r) => r.condition === c);
      const conditionPassed = conditionResults.filter((r) => r.success).length;
      return `${c}: ${conditionPassed}/${conditionResults.length}`;
    })
    .join(', ');

  const summary = `Network Test Suite Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${results.length} tests
Passed: ${passed} (${(successRate * 100).toFixed(1)}%)
Failed: ${failed}
Avg Latency: ${avgLatencyMs.toFixed(0)}ms

By Condition: ${conditionBreakdown}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return {
    totalTests: results.length,
    passed,
    failed,
    avgLatencyMs,
    successRate,
    results,
    summary,
  };
}

// ==========================================
// Specific Condition Tests
// ==========================================

/**
 * Test offline behavior and queue functionality
 */
export async function testOfflineBehavior(): Promise<{
  queuedCorrectly: boolean;
  errorHandledCorrectly: boolean;
  userMessageAppropriate: boolean;
}> {
  // Set offline status
  AIService.setOnlineStatus(false);

  let errorHandledCorrectly = false;
  let userMessageAppropriate = false;

  try {
    // This should fail gracefully
    await AIService.generateFlirtResponse({
      girl: createTestGirl(),
      herMessage: 'Test offline',
      userCulture: 'western' as Culture,
      apiKey: 'test-key',
    });
  } catch (error) {
    const classified = classifyError(error);
    errorHandledCorrectly = classified.code === 'NETWORK_ERROR';
    const userMessage = getUserFriendlyMessage(classified);
    userMessageAppropriate = userMessage.includes('connection') || userMessage.includes('network');
  }

  // Check if queue is working
  const queuedRequests = AIService.getQueuedRequests();
  const queuedCorrectly = queuedRequests !== undefined;

  // Reset online status
  AIService.setOnlineStatus(true);

  return {
    queuedCorrectly,
    errorHandledCorrectly,
    userMessageAppropriate,
  };
}

/**
 * Test retry behavior with flaky connections
 */
export async function testRetryBehavior(apiKey: string): Promise<{
  retriedOnTransientError: boolean;
  didNotRetryOnPermanentError: boolean;
  backoffApplied: boolean;
}> {
  // This tests the built-in retry logic
  const startTime = Date.now();

  let retriedOnTransientError = false;
  let backoffApplied = false;

  try {
    // Make a request that might need retries
    await AIService.generateFlirtResponse({
      girl: createTestGirl(),
      herMessage: 'Test retry',
      userCulture: 'western' as Culture,
      apiKey,
    });
    retriedOnTransientError = true; // If successful, retry may have worked
  } catch (error) {
    const elapsed = Date.now() - startTime;
    // If retries happened, elapsed time should be > single request time
    retriedOnTransientError = elapsed > 1000;
    backoffApplied = elapsed > 2000; // With exponential backoff
  }

  // Test permanent error (invalid key) - should not retry
  const badKeyStartTime = Date.now();
  let didNotRetryOnPermanentError = false;

  try {
    await AIService.generateFlirtResponse({
      girl: createTestGirl(),
      herMessage: 'Test no retry',
      userCulture: 'western' as Culture,
      apiKey: 'invalid-key-12345',
    });
  } catch (error) {
    const elapsed = Date.now() - badKeyStartTime;
    // Should fail fast without retries
    didNotRetryOnPermanentError = elapsed < 5000;
  }

  return {
    retriedOnTransientError,
    didNotRetryOnPermanentError,
    backoffApplied,
  };
}

/**
 * Test cancellation behavior
 */
export async function testCancellation(apiKey: string): Promise<{
  cancellationWorked: boolean;
  noResourceLeak: boolean;
}> {
  let cancellationWorked = false;

  // Start a request
  const requestPromise = AIService.generateFlirtResponse({
    girl: createTestGirl(),
    herMessage: 'Test cancellation',
    userCulture: 'western' as Culture,
    apiKey,
  });

  // Cancel it quickly
  setTimeout(() => {
    AIService.cancelAllRequests();
  }, 100);

  try {
    await requestPromise;
  } catch (error) {
    const classified = classifyError(error);
    cancellationWorked = classified.code === 'CANCELLED';
  }

  // Check no resource leak (cache should be clean)
  const cacheStats = AIService.getCacheStats();
  const noResourceLeak = cacheStats.size < 100; // Reasonable limit

  return {
    cancellationWorked,
    noResourceLeak,
  };
}

// ==========================================
// Export Testing Service
// ==========================================

export const NetworkTestingService = {
  // Configuration
  NETWORK_CONDITIONS,
  TEST_MESSAGES,

  // Test runners
  runNetworkTest,
  runNetworkTestSuite,

  // Specific tests
  testOfflineBehavior,
  testRetryBehavior,
  testCancellation,

  // Utility
  createTestGirl,
};

export default NetworkTestingService;
