/**
 * Hooks - Export all custom hooks
 * Phase 2.4: Custom Hooks
 */

// Navigation
export { useNavigationPersistence } from './useNavigationPersistence';

// Data hooks
export { useContact } from './useContact';
export { useContacts } from './useContacts';
export type { SortOption, SortDirection, ContactsFilter } from './useContacts';
export { useSettings } from './useSettings';
export { useAI } from './useAI';

// Utility hooks
export { useClipboard } from './useClipboard';
export { useImagePicker } from './useImagePicker';
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce';
export { useAsyncState, useAsyncEffect } from './useAsyncState';
export { useForm } from './useForm';

// Platform hooks
export { useKeyboard, useKeyboardHeight } from './useKeyboard';
export { useAppState, useOnForeground, useOnBackground } from './useAppState';
export {
  useNetworkStatus,
  useIsOnline,
  useOnReconnect,
  useOfflineFirst,
  type NetworkStatus,
  type UseNetworkStatusResult,
  type UseNetworkStatusOptions,
  type ConnectionType,
} from './useNetworkStatus';

// Orientation & Layout hooks (6.1.19, 6.1.20)
export {
  useOrientation,
  useResponsiveValue,
  useResponsiveStyles,
  useLayoutConfig,
  useResponsiveSpacing,
  useResponsiveFontSizes,
} from './useOrientation';

// Haptic Feedback hook (Phase 8)
export { useHaptics } from './useHaptics';
export type { HapticType } from './useHaptics';

// Offline AI hook
export { useOfflineAI } from './useOfflineAI';
export type { UseOfflineAIResult } from './useOfflineAI';
