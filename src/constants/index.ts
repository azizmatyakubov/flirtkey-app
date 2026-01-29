// Constants barrel export
export { fonts } from './fonts';
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
// Dev-only: import directly from './promptABTesting' when needed.
