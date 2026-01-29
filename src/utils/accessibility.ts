import { AccessibilityInfo, Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { useEffect, useState } from 'react';

// ==========================================
// Types
// ==========================================

export interface AccessibilityState {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  boldTextEnabled: boolean;
  invertColorsEnabled: boolean;
  grayscaleEnabled: boolean;
  reduceTransparencyEnabled: boolean;
}

// ==========================================
// System Accessibility Checks
// ==========================================

/**
 * Check if screen reader is enabled (VoiceOver/TalkBack)
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Check if reduce motion is enabled at system level
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isReduceMotionEnabled();
};

/**
 * Check if bold text is enabled (iOS only)
 */
export const isBoldTextEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isBoldTextEnabled?.() ?? false;
};

/**
 * Check if invert colors is enabled (iOS only)
 */
export const isInvertColorsEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isInvertColorsEnabled?.() ?? false;
};

/**
 * Check if grayscale is enabled (iOS only)
 */
export const isGrayscaleEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isGrayscaleEnabled?.() ?? false;
};

/**
 * Check if reduce transparency is enabled (iOS only)
 */
export const isReduceTransparencyEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isReduceTransparencyEnabled?.() ?? false;
};

/**
 * Get all accessibility states
 */
export const getAccessibilityState = async (): Promise<AccessibilityState> => {
  const [
    screenReaderEnabled,
    reduceMotionEnabled,
    boldTextEnabled,
    invertColorsEnabled,
    grayscaleEnabled,
    reduceTransparencyEnabled,
  ] = await Promise.all([
    isScreenReaderEnabled(),
    isReduceMotionEnabled(),
    isBoldTextEnabled(),
    isInvertColorsEnabled(),
    isGrayscaleEnabled(),
    isReduceTransparencyEnabled(),
  ]);

  return {
    screenReaderEnabled,
    reduceMotionEnabled,
    boldTextEnabled,
    invertColorsEnabled,
    grayscaleEnabled,
    reduceTransparencyEnabled,
  };
};

// ==========================================
// Accessibility Announcements
// ==========================================

/**
 * Announce a message to screen readers
 */
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Announce that screen reader should focus on a specific element
 */
export const setAccessibilityFocus = (reactTag: number): void => {
  AccessibilityInfo.setAccessibilityFocus(reactTag);
};

// ==========================================
// Accessibility-friendly text
// ==========================================

/**
 * Generate accessibility label for suggestion type
 */
export const getSuggestionAccessibilityLabel = (
  type: 'safe' | 'balanced' | 'bold',
  text: string,
  reason: string
): string => {
  const typeLabels = {
    safe: 'Safe suggestion',
    balanced: 'Balanced suggestion',
    bold: 'Bold suggestion',
  };
  return `${typeLabels[type]}. ${text}. Reasoning: ${reason}. Double tap to copy.`;
};

/**
 * Generate accessibility label for interest level
 */
export const getInterestLevelAccessibilityLabel = (level: number): string => {
  let description = '';
  if (level >= 80) description = 'Very high interest';
  else if (level >= 60) description = 'High interest';
  else if (level >= 40) description = 'Moderate interest';
  else if (level >= 20) description = 'Low interest';
  else description = 'Very low interest';

  return `Interest level: ${level}%. ${description}`;
};

/**
 * Generate accessibility label for contact profile card
 */
export const getContactCardAccessibilityLabel = (
  name: string,
  stage: string,
  messageCount: number
): string => {
  return `${name}, ${stage} stage, ${messageCount} messages. Double tap to open profile.`;
};

/**
 * Format number for screen readers
 */
export const formatNumberForAccessibility = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
};

// ==========================================
// Accessibility Hooks
// ==========================================

/**
 * Hook to get current accessibility state
 */
export function useAccessibilityState(): AccessibilityState & { loading: boolean } {
  const [state, setState] = useState<AccessibilityState>({
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    boldTextEnabled: false,
    invertColorsEnabled: false,
    grayscaleEnabled: false,
    reduceTransparencyEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      const accessibilityState = await getAccessibilityState();
      if (mounted) {
        setState(accessibilityState);
        setLoading(false);
      }
    };

    loadState();

    // Listen for changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        if (mounted) {
          setState((prev) => ({ ...prev, screenReaderEnabled: isEnabled }));
        }
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        if (mounted) {
          setState((prev) => ({ ...prev, reduceMotionEnabled: isEnabled }));
          // Sync with app settings
          useSettingsStore.getState().setAccessibility({ reduceMotion: isEnabled });
        }
      }
    );

    return () => {
      mounted = false;
      screenReaderListener.remove();
      reduceMotionListener.remove();
    };
  }, []);

  return { ...state, loading };
}

/**
 * Hook to check if animations should be reduced
 */
export function useShouldReduceMotion(): boolean {
  const appReduceMotion = useSettingsStore((state) => state.accessibility.reduceMotion);
  const { reduceMotionEnabled: systemReduceMotion } = useAccessibilityState();

  return appReduceMotion || systemReduceMotion;
}

/**
 * Hook to check if screen reader is active
 */
export function useScreenReader(): boolean {
  const { screenReaderEnabled } = useAccessibilityState();
  return screenReaderEnabled;
}

// ==========================================
// Accessibility-aware animation configs
// ==========================================

export const getAnimationDuration = (baseDuration: number, reduceMotion: boolean): number => {
  return reduceMotion ? 0 : baseDuration;
};

export const getAnimationConfig = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : 300,
  useNativeDriver: true,
});

// ==========================================
// Accessibility Labels for Common Elements
// ==========================================

export const accessibilityLabels = {
  // Navigation
  backButton: 'Go back',
  closeButton: 'Close',
  menuButton: 'Open menu',
  settingsButton: 'Open settings',

  // Actions
  copyButton: 'Copy to clipboard',
  shareButton: 'Share',
  deleteButton: 'Delete',
  editButton: 'Edit',
  saveButton: 'Save',
  cancelButton: 'Cancel',

  // Chat
  generateButton: 'Generate suggestions',
  screenshotButton: 'Analyze screenshot',
  sendButton: 'Send message',

  // Lists
  refreshList: 'Pull to refresh',
  swipeToDelete: 'Swipe left to delete',

  // Forms
  requiredField: 'Required field',
  optionalField: 'Optional field',

  // Status
  loading: 'Loading',
  success: 'Success',
  error: 'Error',
};

// ==========================================
// Accessibility Hints
// ==========================================

export const accessibilityHints = {
  copyHint: 'Double tap to copy to clipboard',
  deleteHint: 'Double tap to delete',
  editHint: 'Double tap to edit',
  selectHint: 'Double tap to select',
  openHint: 'Double tap to open',
  toggleHint: 'Double tap to toggle',
  swipeHint: 'Swipe to see more options',
  pullRefreshHint: 'Pull down to refresh',
};
