/**
 * Utils - Export all utility modules
 */

// Validation
export * from './validation';
export { default as validation } from './validation';

// Response Formatting (Phase 5.3.7-5.3.8)
export {
  ResponseFormatter,
  detectLanguage,
  shouldMatchLanguage,
  getLanguageSettings,
  getEmoji,
  enhanceWithEmoji,
  normalizeEmojis,
  matchMessageStyle,
  detectTextingStyle,
  matchTextingStyle,
  formatSuggestion,
  formatResponse,
  type SupportedLanguage,
  type EmojiCategory,
  type TextingStyle,
  type FormatOptions,
} from './responseFormatter';
export { default as responseFormatter } from './responseFormatter';
