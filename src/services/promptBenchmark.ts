/**
 * Prompt Quality Benchmarking Service
 * Phase 5.2.18: Benchmark prompt quality
 *
 * Comprehensive benchmarking system for measuring and comparing
 * prompt performance across multiple dimensions.
 */

import type { Contact, Culture, AnalysisResult, Suggestion } from '../types';
import { AIService, scoreResponseQuality } from './ai';
import { PromptTestingService, generateTestInputs } from './promptTesting';
import type { TestInput } from './promptTesting';
import { buildFlirtPrompt, estimateTokens, PROMPT_VERSION } from '../constants/prompts';

// ==========================================
// Benchmark Types
// ==========================================

export interface BenchmarkMetrics {
  // Quality metrics (0-100)
  responseQuality: number;
  suggestionDiversity: number;
  toneAccuracy: number;
  culturalAppropriateness: number;
  contextUtilization: number;

  // Efficiency metrics
  tokenEfficiency: number; // quality per token
  avgTokenCount: number;
  maxTokenCount: number;

  // Consistency metrics
  consistencyScore: number;
  failureRate: number;

  // Overall score
  overallScore: number;
}

export interface BenchmarkRun {
  id: string;
  promptVersion: string;
  timestamp: string;
  metrics: BenchmarkMetrics;
  sampleSize: number;
  configuration: BenchmarkConfiguration;
  details: BenchmarkDetail[];
}

export interface BenchmarkDetail {
  inputId: string;
  prompt: string;
  response?: AnalysisResult;
  metrics: {
    quality: number;
    tokens: number;
    latencyMs?: number;
    error?: string;
  };
}

export interface BenchmarkConfiguration {
  cultures: Culture[];
  stages: string[];
  sampleSize: number;
  includeEdgeCases: boolean;
  measureLatency: boolean;
}

export interface BenchmarkComparison {
  baselineId: string;
  comparisonId: string;
  improvements: Record<keyof BenchmarkMetrics, number>; // % change
  winner: 'baseline' | 'comparison' | 'tie';
  summary: string;
}

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_CONFIG: BenchmarkConfiguration = {
  cultures: ['uzbek', 'russian', 'western', 'asian', 'universal'],
  stages: ['just_met', 'talking', 'flirting', 'dating', 'serious'],
  sampleSize: 20,
  includeEdgeCases: true,
  measureLatency: false,
};

// ==========================================
// Quality Scorers
// ==========================================

/**
 * Score suggestion diversity (how different are safe/balanced/bold)
 */
function scoreSuggestionDiversity(suggestions: Suggestion[]): number {
  if (suggestions.length < 2) return 0;

  let totalDifferenceScore = 0;
  let comparisons = 0;

  for (let i = 0; i < suggestions.length; i++) {
    for (let j = i + 1; j < suggestions.length; j++) {
      const a = suggestions[i]!;
      const b = suggestions[j]!;

      // Calculate text similarity (Jaccard-like)
      const wordsA = new Set(a.text.toLowerCase().split(/\s+/));
      const wordsB = new Set(b.text.toLowerCase().split(/\s+/));

      const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
      const union = new Set([...wordsA, ...wordsB]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      const difference = 1 - similarity;

      totalDifferenceScore += difference;
      comparisons++;
    }
  }

  return comparisons > 0 ? (totalDifferenceScore / comparisons) * 100 : 0;
}

/**
 * Score tone accuracy based on relationship stage
 */
function scoreToneAccuracy(response: AnalysisResult, contact: Contact): number {
  const stage = contact.relationshipStage || 'just_met';
  let score = 50; // Start neutral

  // Get suggestion texts
  const allText = response.suggestions.map((s) => s.text.toLowerCase()).join(' ');

  // Stage-specific tone indicators
  const toneIndicators: Record<string, { positive: string[]; negative: string[] }> = {
    just_met: {
      positive: ['nice', 'cool', 'interesting', 'hi', 'hey', 'hello'],
      negative: ['love', 'miss you', 'babe', 'baby', 'always'],
    },
    talking: {
      positive: ['really', 'actually', 'tell me more', "that's interesting"],
      negative: ['love you', 'forever', 'marry'],
    },
    flirting: {
      positive: ['cute', 'fun', 'tease', '😏', 'wink', 'playful'],
      negative: ['commitment', 'future', 'serious'],
    },
    dating: {
      positive: ['next time', 'together', 'our', 'we should'],
      negative: ['stranger', 'maybe someday'],
    },
    serious: {
      positive: ['love', 'always', 'together', 'support', 'here for you'],
      negative: ['casual', 'hook up', 'whatever'],
    },
  };

  const indicators = toneIndicators[stage];
  if (indicators) {
    for (const word of indicators.positive) {
      if (allText.includes(word)) score += 5;
    }
    for (const word of indicators.negative) {
      if (allText.includes(word)) score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score cultural appropriateness
 */
function scoreCulturalAppropriateness(response: AnalysisResult, culture: Culture): number {
  let score = 70; // Start with good baseline

  const allText = response.suggestions.map((s) => s.text.toLowerCase()).join(' ');

  // Culture-specific checks
  const culturalRules: Record<Culture, { boost: string[]; penalty: string[] }> = {
    uzbek: {
      boost: ['respect', 'family', 'traditional', 'tea'],
      penalty: ['sex', 'hook up', 'one night', 'fwb'],
    },
    russian: {
      boost: ['beautiful', 'intelligent', 'strong', 'romantic'],
      penalty: ['cheap', 'broke', 'whatever'],
    },
    western: {
      boost: ['chill', 'hang out', 'grab a drink', 'fun'],
      penalty: ['marry me', 'forever', 'destined'],
    },
    asian: {
      boost: ['care', 'support', 'understand', 'patient'],
      penalty: ['aggressive', 'pushy', 'demand'],
    },
    universal: {
      boost: ['genuine', 'authentic', 'listen', 'interesting'],
      penalty: ['generic', 'copy paste', 'boring'],
    },
  };

  const rules = culturalRules[culture];
  if (rules) {
    for (const word of rules.boost) {
      if (allText.includes(word)) score += 5;
    }
    for (const word of rules.penalty) {
      if (allText.includes(word)) score -= 15;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score context utilization (uses contact's info effectively)
 */
function scoreContextUtilization(response: AnalysisResult, contact: Contact): number {
  let score = 50;
  let possibleContextItems = 0;
  let usedItems = 0;

  const allText =
    response.suggestions.map((s) => s.text.toLowerCase()).join(' ') +
    ' ' +
    (response.proTip || '').toLowerCase();

  // Check if context is utilized
  const contextChecks = [
    { field: contact.name, weight: 2 },
    { field: contact.interests, weight: 3 },
    { field: contact.personality, weight: 2 },
    { field: contact.insideJokes, weight: 4 },
    { field: contact.greenLights, weight: 3 },
    { field: contact.lastTopic, weight: 3 },
  ];

  for (const check of contextChecks) {
    if (check.field && check.field.length > 2) {
      possibleContextItems += check.weight;
      // Check if any significant word from the field appears
      const words = check.field
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      for (const word of words) {
        if (allText.includes(word)) {
          usedItems += check.weight;
          break;
        }
      }
    }
  }

  if (possibleContextItems > 0) {
    score = (usedItems / possibleContextItems) * 100;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate token efficiency
 */
function calculateTokenEfficiency(quality: number, tokens: number): number {
  if (tokens === 0) return 0;
  // Quality points per 100 tokens (higher is better)
  return (quality / tokens) * 100;
}

// ==========================================
// Benchmark Runner
// ==========================================

/**
 * Run a single benchmark test
 */
async function runSingleBenchmark(
  input: TestInput,
  apiKey: string,
  measureLatency: boolean
): Promise<BenchmarkDetail> {
  const { prompt } = buildFlirtPrompt({
    contact: input.contact,
    theirMessage: input.message || '',
    userCulture: input.culture,
  });

  const tokens = estimateTokens(prompt);
  const startTime = measureLatency ? Date.now() : undefined;

  try {
    const response = await AIService.generateFlirtResponse({
      contact: input.contact,
      theirMessage: input.message || '',
      userCulture: input.culture,
      apiKey,
      useCache: false,
    });

    const latencyMs = measureLatency ? Date.now() - startTime! : undefined;
    const quality = scoreResponseQuality(response);

    return {
      inputId: input.id,
      prompt,
      response,
      metrics: {
        quality,
        tokens,
        latencyMs,
      },
    };
  } catch (error) {
    return {
      inputId: input.id,
      prompt,
      metrics: {
        quality: 0,
        tokens,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Calculate aggregated metrics from benchmark details
 */
function calculateMetrics(details: BenchmarkDetail[], inputs: TestInput[]): BenchmarkMetrics {
  const successful = details.filter((d) => d.response && !d.metrics.error);
  const failed = details.filter((d) => d.metrics.error);

  if (successful.length === 0) {
    return {
      responseQuality: 0,
      suggestionDiversity: 0,
      toneAccuracy: 0,
      culturalAppropriateness: 0,
      contextUtilization: 0,
      tokenEfficiency: 0,
      avgTokenCount: 0,
      maxTokenCount: 0,
      consistencyScore: 0,
      failureRate: 1,
      overallScore: 0,
    };
  }

  // Calculate individual metrics
  let totalQuality = 0;
  let totalDiversity = 0;
  let totalToneAccuracy = 0;
  let totalCultural = 0;
  let totalContext = 0;
  let totalTokens = 0;
  let maxTokens = 0;
  const qualityScores: number[] = [];

  for (const detail of successful) {
    const input = inputs.find((i) => i.id === detail.inputId)!;
    const response = detail.response!;

    totalQuality += detail.metrics.quality;
    qualityScores.push(detail.metrics.quality);

    totalDiversity += scoreSuggestionDiversity(response.suggestions);
    totalToneAccuracy += scoreToneAccuracy(response, input.contact);
    totalCultural += scoreCulturalAppropriateness(response, input.culture);
    totalContext += scoreContextUtilization(response, input.contact);

    totalTokens += detail.metrics.tokens;
    maxTokens = Math.max(maxTokens, detail.metrics.tokens);
  }

  const n = successful.length;
  const avgQuality = totalQuality / n;
  const avgTokenCount = totalTokens / n;

  // Calculate consistency (standard deviation based)
  const variance = qualityScores.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 100 - stdDev * 2); // Lower variance = higher consistency

  const metrics: BenchmarkMetrics = {
    responseQuality: avgQuality,
    suggestionDiversity: totalDiversity / n,
    toneAccuracy: totalToneAccuracy / n,
    culturalAppropriateness: totalCultural / n,
    contextUtilization: totalContext / n,
    tokenEfficiency: calculateTokenEfficiency(avgQuality, avgTokenCount),
    avgTokenCount,
    maxTokenCount: maxTokens,
    consistencyScore,
    failureRate: failed.length / details.length,
    overallScore: 0, // Calculated below
  };

  // Calculate overall score (weighted average)
  metrics.overallScore =
    metrics.responseQuality * 0.25 +
    metrics.suggestionDiversity * 0.15 +
    metrics.toneAccuracy * 0.15 +
    metrics.culturalAppropriateness * 0.15 +
    metrics.contextUtilization * 0.1 +
    metrics.consistencyScore * 0.1 +
    (1 - metrics.failureRate) * 100 * 0.1;

  return metrics;
}

/**
 * Run full benchmark suite
 */
export async function runBenchmark(
  apiKey: string,
  config: Partial<BenchmarkConfiguration> = {}
): Promise<BenchmarkRun> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate test inputs
  let inputs = generateTestInputs();

  // Filter by configuration
  if (!fullConfig.includeEdgeCases) {
    inputs = inputs.filter((i) => i.category !== 'edge_case' && i.category !== 'security');
  }

  // Limit sample size
  if (inputs.length > fullConfig.sampleSize) {
    // Stratified sampling - take proportional from each category
    const categories = [...new Set(inputs.map((i) => i.category))];
    const perCategory = Math.ceil(fullConfig.sampleSize / categories.length);

    const sampled: TestInput[] = [];
    for (const cat of categories) {
      const catInputs = inputs.filter((i) => i.category === cat);
      sampled.push(...catInputs.slice(0, perCategory));
    }
    inputs = sampled.slice(0, fullConfig.sampleSize);
  }

  // Run benchmarks
  const details: BenchmarkDetail[] = [];

  for (const input of inputs) {
    const detail = await runSingleBenchmark(input, apiKey, fullConfig.measureLatency);
    details.push(detail);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Calculate metrics
  const metrics = calculateMetrics(details, inputs);

  const run: BenchmarkRun = {
    id: `benchmark_${Date.now()}`,
    promptVersion: PROMPT_VERSION,
    timestamp: new Date().toISOString(),
    metrics,
    sampleSize: inputs.length,
    configuration: fullConfig,
    details,
  };

  return run;
}

/**
 * Run quick benchmark (offline, no API calls)
 */
export function runQuickBenchmark(config: Partial<BenchmarkConfiguration> = {}): BenchmarkRun {
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    sampleSize: Math.min(config.sampleSize || 10, 10),
  };

  let inputs = generateTestInputs();

  if (!fullConfig.includeEdgeCases) {
    inputs = inputs.filter((i) => i.category !== 'edge_case' && i.category !== 'security');
  }

  inputs = inputs.slice(0, fullConfig.sampleSize);

  // Run prompt validation only (no API calls)
  const details: BenchmarkDetail[] = inputs.map((input) => {
    const result = PromptTestingService.runPromptTest(input);

    return {
      inputId: input.id,
      prompt: result.prompt,
      metrics: {
        quality: result.passed ? 75 : 25, // Simplified scoring
        tokens: result.tokenCount,
        error: result.issues.length > 0 ? result.issues.join('; ') : undefined,
      },
    };
  });

  // Simplified metrics for offline benchmark
  const successful = details.filter((d) => !d.metrics.error);
  const avgQuality =
    successful.length > 0
      ? successful.reduce((sum, d) => sum + d.metrics.quality, 0) / successful.length
      : 0;
  const avgTokens = details.reduce((sum, d) => sum + d.metrics.tokens, 0) / details.length;

  const metrics: BenchmarkMetrics = {
    responseQuality: avgQuality,
    suggestionDiversity: 60, // Assumed for offline
    toneAccuracy: 70,
    culturalAppropriateness: 70,
    contextUtilization: 60,
    tokenEfficiency: calculateTokenEfficiency(avgQuality, avgTokens),
    avgTokenCount: avgTokens,
    maxTokenCount: Math.max(...details.map((d) => d.metrics.tokens)),
    consistencyScore: 80,
    failureRate: 1 - successful.length / details.length,
    overallScore: avgQuality * 0.7 + 30, // Simplified
  };

  return {
    id: `quick_benchmark_${Date.now()}`,
    promptVersion: PROMPT_VERSION,
    timestamp: new Date().toISOString(),
    metrics,
    sampleSize: inputs.length,
    configuration: fullConfig,
    details,
  };
}

/**
 * Compare two benchmark runs
 */
export function compareBenchmarks(
  baseline: BenchmarkRun,
  comparison: BenchmarkRun
): BenchmarkComparison {
  const improvements: Record<keyof BenchmarkMetrics, number> = {} as Record<
    keyof BenchmarkMetrics,
    number
  >;

  const metricKeys = Object.keys(baseline.metrics) as Array<keyof BenchmarkMetrics>;
  let totalImprovement = 0;

  for (const key of metricKeys) {
    const baseValue = baseline.metrics[key];
    const compValue = comparison.metrics[key];

    if (baseValue === 0) {
      improvements[key] = compValue > 0 ? 100 : 0;
    } else {
      improvements[key] = ((compValue - baseValue) / baseValue) * 100;
    }

    // Invert for metrics where lower is better
    if (key === 'failureRate' || key === 'avgTokenCount' || key === 'maxTokenCount') {
      improvements[key] = -improvements[key];
    }

    totalImprovement += improvements[key];
  }

  const avgImprovement = totalImprovement / metricKeys.length;

  let winner: 'baseline' | 'comparison' | 'tie';
  if (avgImprovement > 5) {
    winner = 'comparison';
  } else if (avgImprovement < -5) {
    winner = 'baseline';
  } else {
    winner = 'tie';
  }

  const significantChanges = metricKeys
    .filter((k) => Math.abs(improvements[k]) > 10)
    .map((k) => `${k}: ${improvements[k] > 0 ? '+' : ''}${improvements[k].toFixed(1)}%`);

  const summary = `Comparison: ${baseline.promptVersion} vs ${comparison.promptVersion}
Winner: ${winner === 'tie' ? 'No significant difference' : winner}
Average Change: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}%
${significantChanges.length > 0 ? `\nSignificant changes:\n${significantChanges.join('\n')}` : ''}`;

  return {
    baselineId: baseline.id,
    comparisonId: comparison.id,
    improvements,
    winner,
    summary,
  };
}

/**
 * Generate benchmark report
 */
export function generateReport(run: BenchmarkRun): string {
  const { metrics, sampleSize, promptVersion, timestamp } = run;

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const formatMetric = (name: string, value: number, isPercentage: boolean = true): string => {
    const formatted = isPercentage ? `${value.toFixed(1)}%` : value.toFixed(1);
    const grade = getGrade(isPercentage ? value : (value / 100) * 100);
    return `${name.padEnd(30)} ${formatted.padStart(8)} [${grade}]`;
  };

  return `
╔══════════════════════════════════════════════════════════════╗
║           FLIRTKEY PROMPT QUALITY BENCHMARK REPORT           ║
╠══════════════════════════════════════════════════════════════╣
║  Version: ${promptVersion.padEnd(20)} Date: ${timestamp.slice(0, 10).padEnd(20)} ║
║  Sample Size: ${sampleSize.toString().padEnd(48)} ║
╠══════════════════════════════════════════════════════════════╣
║  QUALITY METRICS                                             ║
╠══════════════════════════════════════════════════════════════╣
║  ${formatMetric('Response Quality', metrics.responseQuality).padEnd(58)} ║
║  ${formatMetric('Suggestion Diversity', metrics.suggestionDiversity).padEnd(58)} ║
║  ${formatMetric('Tone Accuracy', metrics.toneAccuracy).padEnd(58)} ║
║  ${formatMetric('Cultural Appropriateness', metrics.culturalAppropriateness).padEnd(58)} ║
║  ${formatMetric('Context Utilization', metrics.contextUtilization).padEnd(58)} ║
╠══════════════════════════════════════════════════════════════╣
║  EFFICIENCY METRICS                                          ║
╠══════════════════════════════════════════════════════════════╣
║  ${formatMetric('Token Efficiency', metrics.tokenEfficiency, false).padEnd(58)} ║
║  ${`Avg Token Count:`.padEnd(30)} ${metrics.avgTokenCount.toFixed(0).padStart(8)}        ║
║  ${`Max Token Count:`.padEnd(30)} ${metrics.maxTokenCount.toFixed(0).padStart(8)}        ║
╠══════════════════════════════════════════════════════════════╣
║  RELIABILITY METRICS                                         ║
╠══════════════════════════════════════════════════════════════╣
║  ${formatMetric('Consistency Score', metrics.consistencyScore).padEnd(58)} ║
║  ${formatMetric('Success Rate', (1 - metrics.failureRate) * 100).padEnd(58)} ║
╠══════════════════════════════════════════════════════════════╣
║  OVERALL SCORE: ${metrics.overallScore.toFixed(1).padStart(5)}% [${getGrade(metrics.overallScore)}]                                     ║
╚══════════════════════════════════════════════════════════════╝
`.trim();
}

// ==========================================
// Export
// ==========================================

export const PromptBenchmarkService = {
  // Runners
  runBenchmark,
  runQuickBenchmark,

  // Analysis
  compareBenchmarks,
  generateReport,

  // Scorers (for external use)
  scoreSuggestionDiversity,
  scoreToneAccuracy,
  scoreCulturalAppropriateness,
  scoreContextUtilization,
  calculateTokenEfficiency,

  // Configuration
  DEFAULT_CONFIG,
};

export default PromptBenchmarkService;
