/**
 * useKeyboard Hook (2.4.10)
 * Keyboard visibility and height tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, KeyboardEvent, Platform, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UseKeyboardResult {
  // State
  isKeyboardVisible: boolean;
  keyboardHeight: number;

  // Actions
  dismiss: () => void;

  // Animation helpers
  animateLayout: () => void;
}

interface UseKeyboardOptions {
  enableAnimation?: boolean;
}

export const useKeyboard = (options: UseKeyboardOptions = {}): UseKeyboardResult => {
  const { enableAnimation = true } = options;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);

  const animateLayout = useCallback(() => {
    if (enableAnimation) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [enableAnimation]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      if (enableAnimation) {
        animateLayout();
      }
      const height = event.endCoordinates.height;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
    };

    const handleKeyboardHide = () => {
      if (enableAnimation) {
        animateLayout();
      }
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enableAnimation, animateLayout]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
    dismiss,
    animateLayout,
  };
};

/**
 * Hook that returns the current keyboard height for use in animations
 */
export const useKeyboardHeight = (): number => {
  const { keyboardHeight } = useKeyboard({ enableAnimation: false });
  return keyboardHeight;
};

export default useKeyboard;
