/**
 * Services - Export all service modules
 * Phase 5: AI Integration
 */

// AI Service exports
export {
  // Main functions
  generateFlirtResponse,
  analyzeScreenshot,
  generateConversationStarter,
  generateDateIdeas,
  analyzeWhatToAvoid,
  analyzeInterestLevel,
  detectRedFlags,
  getTimingSuggestion,

  // Legacy functions (backward compatibility)
  generateResponse,
  analyzeScreenshotLegacy,

  // Request management
  cancelAllRequests,

  // Error handling (5.4)
  classifyError,
  getUserFriendlyMessage,

  // Response quality (5.3.9)
  scoreResponseQuality,

  // Constants
  MODELS,
  CULTURE_STYLES,
  STAGES,

  // Default export as named
  AIService,

  // Types
  type AIModel,
  type ModelConfig,
  type GenerateFlirtRequest,
  type AnalyzeScreenshotRequest,
} from './ai';

// Storage exports
export * from './storage';

// Feedback Service (5.3.10-5.3.12)
export {
  FeedbackService,
  type ResponseLog,
  type FeedbackEntry,
  type PromptInsight,
} from './feedback';

// Network Testing Service (5.1.15)
export {
  NetworkTestingService,
  runNetworkTest,
  runNetworkTestSuite,
  testOfflineBehavior,
  testRetryBehavior,
  testCancellation,
  NETWORK_CONDITIONS,
  TEST_MESSAGES,
  type NetworkCondition,
  type NetworkConditionConfig,
  type NetworkTestResult,
  type NetworkTestSuiteResult,
} from './networkTesting';

// Prompt Testing Service (5.2.15)
export {
  PromptTestingService,
  generateTestInputs,
  runPromptTest,
  runPromptTestSuite,
  runCategoryTests,
  type TestInput,
  type TestCategory,
  type TestResult,
  type TestSuiteResult,
} from './promptTesting';

// Prompt Benchmark Service (5.2.18)
export {
  PromptBenchmarkService,
  runBenchmark,
  runQuickBenchmark,
  compareBenchmarks,
  generateReport,
  type BenchmarkMetrics,
  type BenchmarkRun,
  type BenchmarkDetail,
  type BenchmarkConfiguration,
  type BenchmarkComparison,
} from './promptBenchmark';

// OCR Service (7.2.12)
export {
  OCRService,
  extractTextFromImage,
  extractMessagesFromScreenshot,
  fallbackOCR,
  performOCR,
  analyzeWithOCRFallback,
  type OCRResult,
  type MessageExtraction,
  type ExtractedMessage,
} from './ocr';

// Offline Queue Service
export {
  OfflineQueueService,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getQueuedRequests,
  getPendingCount,
  getQueueStats,
  type QueuedRequest,
  type OfflineQueueState,
  type QueueStats,
} from './offlineQueue';

// Response Cache Service
export {
  ResponseCacheService,
  getCachedResponse,
  cacheResponse,
  getCachedResponsesForGirl,
  getCacheStats,
  clearCache,
  clearCacheForGirl,
  cleanupExpired,
  type CachedResponse,
} from './responseCache';

// Default exports
export { default as aiService } from './ai';
export { default as storageService } from './storage';
export { default as feedbackService } from './feedback';
export { default as networkTestingService } from './networkTesting';
export { default as promptTestingService } from './promptTesting';
export { default as promptBenchmarkService } from './promptBenchmark';
export { default as ocrService } from './ocr';
export { default as offlineQueueService } from './offlineQueue';
export { default as responseCacheService } from './responseCache';
