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

// Haptics (Phase 8)
export {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSelection,
  triggerHaptic,
  hapticCopy,
  hapticDelete,
  hapticNavigate,
  hapticToggle,
  useHaptics,
} from './haptics';
export type { HapticType } from './haptics';

// Accessibility (Phase 8)
export {
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  getAccessibilityState,
  announceForAccessibility,
  setAccessibilityFocus,
  getSuggestionAccessibilityLabel,
  getInterestLevelAccessibilityLabel,
  getContactCardAccessibilityLabel,
  formatNumberForAccessibility,
  useAccessibilityState,
  useShouldReduceMotion,
  useScreenReader,
  getAnimationDuration,
  getAnimationConfig,
  accessibilityLabels,
  accessibilityHints,
} from './accessibility';
export type { AccessibilityState } from './accessibility';
