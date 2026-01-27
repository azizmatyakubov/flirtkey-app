/**
 * Hooks - Export all custom hooks
 * Phase 2.4: Custom Hooks
 */

// Navigation
export { useNavigationPersistence } from './useNavigationPersistence';

// Data hooks
export { useGirl } from './useGirl';
export { useGirls } from './useGirls';
export type { SortOption, SortDirection, GirlsFilter } from './useGirls';
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
export { useNetworkStatus, useIsOnline } from './useNetworkStatus';
