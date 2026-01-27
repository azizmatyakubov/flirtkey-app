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

// Default exports
export { default as aiService } from './ai';
export { default as storageService } from './storage';
export { default as feedbackService } from './feedback';
