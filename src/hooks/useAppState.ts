/**
 * useAppState Hook (2.4.11)
 * Track app foreground/background state
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type AppStateChangeHandler = (state: AppStateStatus) => void;

interface UseAppStateResult {
  // Current state
  appState: AppStateStatus;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;

  // State changes
  lastActiveAt: number | null;
  lastBackgroundAt: number | null;
  timeInBackground: number;
}

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  onChange?: AppStateChangeHandler;
}

export const useAppState = (options: UseAppStateOptions = {}): UseAppStateResult => {
  const { onForeground, onBackground, onChange } = options;

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [lastActiveAt, setLastActiveAt] = useState<number | null>(
    AppState.currentState === 'active' ? Date.now() : null
  );
  const [lastBackgroundAt, setLastBackgroundAt] = useState<number | null>(null);

  const prevStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const prevState = prevStateRef.current;

      // Went to foreground
      if (prevState !== 'active' && nextAppState === 'active') {
        setLastActiveAt(Date.now());
        onForeground?.();
      }

      // Went to background
      if (prevState === 'active' && nextAppState !== 'active') {
        setLastBackgroundAt(Date.now());
        onBackground?.();
      }

      onChange?.(nextAppState);
      prevStateRef.current = nextAppState;
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground, onChange]);

  // Calculate time spent in background
  const timeInBackground =
    lastBackgroundAt && appState === 'active' && lastActiveAt ? lastActiveAt - lastBackgroundAt : 0;

  return {
    appState,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
    lastActiveAt,
    lastBackgroundAt,
    timeInBackground,
  };
};

/**
 * Run a callback when app comes to foreground
 */
export const useOnForeground = (callback: () => void): void => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        savedCallback.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

/**
 * Run a callback when app goes to background
 */
export const useOnBackground = (callback: () => void): void => {
  const savedCallback = useRef(callback);
  const prevStateRef = useRef(AppState.currentState);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (prevStateRef.current === 'active' && state !== 'active') {
        savedCallback.current();
      }
      prevStateRef.current = state;
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

export default useAppState;
