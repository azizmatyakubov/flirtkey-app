// Constants barrel export
export { Config, isDevelopment, isProduction, isStaging, AppInfo } from './config';
export {
  defaultScreenOptions,
  modalScreenOptions,
  fadeScreenOptions,
  screenOptions,
  SCREENS,
} from './navigation';
export { linking, isValidDeepLink, getScreenFromUrl } from './deepLinking';
export {
  // Colors
  darkColors,
  lightColors,
  // Spacing
  spacing,
  // Typography
  fontSizes,
  fontWeights,
  lineHeights,
  // Shadows
  shadows,
  // Border radius
  borderRadius,
  // Complete themes
  darkTheme,
  lightTheme,
  defaultTheme,
  // Component styles
  componentStyles,
} from './theme';

// Prompts (Phase 5.2)
export {
  // Version
  PROMPT_VERSION,
  // Culture & Stage definitions
  CULTURE_STYLES,
  STAGES,
  // Prompt builders
  buildFlirtPrompt,
  buildScreenshotPrompt,
  buildConversationStarterPrompt,
  buildDateIdeaPrompt,
  buildWhatToAvoidPrompt,
  buildInterestLevelPrompt,
  buildRedFlagPrompt,
  buildTimingPrompt,
  // Utilities
  sanitizeInput,
  estimateTokens,
  isPromptWithinLimit,
  // Types
  type PromptType,
  type PromptMetadata,
  type FlirtPromptParams,
  type ScreenshotPromptParams,
  type ConversationStarterParams,
  type DateIdeaParams,
  type WhatToAvoidParams,
  type InterestLevelParams,
  type RedFlagParams,
  type TimingParams,
  // Registry
  PROMPT_TEMPLATES,
  PROMPT_STRATEGIES,
} from './prompts';

// Prompt A/B Testing (Phase 5.2.9)
export {
  // Manager
  abTestManager,
  // Default variants
  DEFAULT_FLIRT_VARIANTS,
  // Helper functions
  buildPromptFromVariant,
  createDefaultFlirtTest,
  getOrCreateFlirtTest,
  recordABTestFeedback,
  // Full module
  PromptABTesting,
  // Types
  type PromptVariant,
  type PromptVariantId,
  type ABTestConfig,
  type ABTestAssignment,
  type ABTestResult,
  type ABTestAnalytics,
} from './promptABTesting';
