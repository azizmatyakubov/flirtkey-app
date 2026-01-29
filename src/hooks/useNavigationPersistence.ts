import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationState } from '@react-navigation/native';

const NAVIGATION_STATE_KEY = 'NAVIGATION_STATE';

interface UseNavigationPersistenceResult {
  isReady: boolean;
  initialState: NavigationState | undefined;
  onStateChange: (state: NavigationState | undefined) => void;
}

/**
 * Hook to persist and restore navigation state
 * Useful for restoring the app to the same screen after a restart
 *
 * Usage:
 * const { isReady, initialState, onStateChange } = useNavigationPersistence();
 *
 * if (!isReady) return <SplashScreen />;
 *
 * <NavigationContainer
 *   initialState={initialState}
 *   onStateChange={onStateChange}
 * >
 */
export function useNavigationPersistence(
  enabled: boolean = __DEV__ // Only enable in development by default
): UseNavigationPersistenceResult {
  const [isReady, setIsReady] = useState(!enabled);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();

  useEffect(() => {
    if (!enabled) return;

    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedStateString) {
          const state = JSON.parse(savedStateString) as NavigationState;
          setInitialState(state);
        }
      } catch (e) {
        // Ignore errors - just don't restore state
        if (__DEV__) console.warn('Failed to restore navigation state:', e);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [enabled]);

  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (!enabled || !state) return;

      // Debounce the save to avoid too many writes
      AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state)).catch((e) => {
        if (__DEV__) console.warn('Failed to save navigation state:', e);
      });
    },
    [enabled]
  );

  return {
    isReady,
    initialState,
    onStateChange,
  };
}

/**
 * Clear persisted navigation state
 * Useful when the user logs out or you need to reset the app
 */
export async function clearNavigationState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch (e) {
    if (__DEV__) console.warn('Failed to clear navigation state:', e);
  }
}

export default useNavigationPersistence;
