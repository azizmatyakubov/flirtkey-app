import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

// ==========================================
// Types
// ==========================================

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

// ==========================================
// Haptic Feedback Functions
// ==========================================

/**
 * Check if haptic feedback is enabled in settings
 */
const isHapticEnabled = (): boolean => {
  return useSettingsStore.getState().accessibility.hapticFeedback;
};

/**
 * Trigger light impact feedback
 * Use for: button taps, selections, toggles
 */
export const hapticLight = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail on devices without haptic support
  }
};

/**
 * Trigger medium impact feedback
 * Use for: confirming actions, drag interactions
 */
export const hapticMedium = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail
  }
};

/**
 * Trigger heavy impact feedback
 * Use for: significant actions, errors, warnings
 */
export const hapticHeavy = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail
  }
};

/**
 * Trigger success notification feedback
 * Use for: successful operations, confirmations
 */
export const hapticSuccess = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail
  }
};

/**
 * Trigger warning notification feedback
 * Use for: warnings, cautions
 */
export const hapticWarning = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silently fail
  }
};

/**
 * Trigger error notification feedback
 * Use for: errors, failed operations
 */
export const hapticError = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail
  }
};

/**
 * Trigger selection changed feedback
 * Use for: scrolling through options, picker changes
 */
export const hapticSelection = async (): Promise<void> => {
  if (!isHapticEnabled()) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail
  }
};

/**
 * Trigger haptic feedback by type
 */
export const triggerHaptic = async (type: HapticType): Promise<void> => {
  switch (type) {
    case 'light':
      return hapticLight();
    case 'medium':
      return hapticMedium();
    case 'heavy':
      return hapticHeavy();
    case 'success':
      return hapticSuccess();
    case 'warning':
      return hapticWarning();
    case 'error':
      return hapticError();
    case 'selection':
      return hapticSelection();
    default:
      return hapticLight();
  }
};

// ==========================================
// Context-Specific Haptics
// ==========================================

/**
 * Haptic feedback for copying text
 */
export const hapticCopy = hapticSuccess;

/**
 * Haptic feedback for deleting items
 */
export const hapticDelete = hapticWarning;

/**
 * Haptic feedback for navigation
 */
export const hapticNavigate = hapticLight;

/**
 * Haptic feedback for toggling options
 */
export const hapticToggle = hapticLight;

/**
 * Haptic feedback for pulling to refresh
 */
export const hapticPullRefresh = hapticMedium;

/**
 * Haptic feedback for swipe actions
 */
export const hapticSwipe = hapticSelection;

/**
 * Haptic feedback for long press
 */
export const hapticLongPress = hapticMedium;

/**
 * Haptic feedback for generating suggestions
 */
export const hapticGenerate = hapticLight;

/**
 * Haptic feedback for successful generation
 */
export const hapticGenerateComplete = hapticSuccess;

/**
 * Haptic feedback for errors
 */
export const hapticErrorFeedback = hapticError;

// ==========================================
// Hook for easy access
// ==========================================

import { useCallback } from 'react';

export function useHaptics() {
  const isEnabled = useSettingsStore((state) => state.accessibility.hapticFeedback);

  const trigger = useCallback(
    async (type: HapticType = 'light') => {
      if (!isEnabled) return;
      await triggerHaptic(type);
    },
    [isEnabled]
  );

  return {
    isEnabled,
    trigger,
    light: hapticLight,
    medium: hapticMedium,
    heavy: hapticHeavy,
    success: hapticSuccess,
    warning: hapticWarning,
    error: hapticError,
    selection: hapticSelection,
    // Context-specific
    copy: hapticCopy,
    delete: hapticDelete,
    navigate: hapticNavigate,
    toggle: hapticToggle,
    pullRefresh: hapticPullRefresh,
    swipe: hapticSwipe,
    longPress: hapticLongPress,
    generate: hapticGenerate,
    generateComplete: hapticGenerateComplete,
  };
}
