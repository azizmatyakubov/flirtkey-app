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

// Dev-only testing services (networkTesting, promptTesting, promptBenchmark)
// Import directly from their modules when needed for development.

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
// Dev-only: networkTestingService, promptTestingService, promptBenchmarkService
// Import directly from their modules for development use.
export { default as ocrService } from './ocr';
export { default as offlineQueueService } from './offlineQueue';
export { default as responseCacheService } from './responseCache';
