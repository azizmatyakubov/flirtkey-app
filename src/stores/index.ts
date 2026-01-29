/**
 * Stores - Export all Zustand stores
 */

// Main app store
export { useStore } from './useStore';
export type { ConversationEntry, CachedSuggestion } from './useStore';
export {
  selectContactById,
  selectContactsSortedByRecent,
  selectContactsByStage,
  selectTotalMessageCount,
  selectContactsCount,
  selectHasData,
  selectHasApiKey,
  selectRecentConversations,
  selectConversationCountForContact,
  selectContactsBySearch,
  selectCacheStats,
} from './useStore';

// Settings store (Phase 8)
export { useSettingsStore } from './settingsStore';
export type {
  ResponseTone,
  ResponseLength,
  ThemeMode,
  Language,
  AutoLockTimeout,
  DataRetention,
  NotificationSettings,
  PrivacySettings,
  UserPreferences,
  AccessibilitySettings,
  AppStats,
} from './settingsStore';
export {
  selectShouldShowRatePrompt,
  selectShouldReduceMotion,
  selectHapticEnabled,
} from './settingsStore';
