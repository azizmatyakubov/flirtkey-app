/**
 * useShareIntent Hook (Phase 7.4)
 *
 * Handles incoming share intents from other apps:
 * - 7.4.3: Handle shared images
 * - 7.4.4: Deep link to analysis
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootNavigationProp } from '../types/navigation';
import {
  getInitialURL,
  subscribeToURLEvents,
  processSharedContent,
  cleanupSharedFiles,
  parseDeepLink,
  DEEP_LINK_PATHS,
  type SharedContent,
} from '../utils/shareHandler';

// ==========================================
// Types
// ==========================================

export interface UseShareIntentResult {
  sharedContent: SharedContent | null;
  isProcessing: boolean;
  error: string | null;
  clearSharedContent: () => void;
  processURL: (url: string) => Promise<void>;
}

// ==========================================
// Hook Implementation
// ==========================================

export function useShareIntent(): UseShareIntentResult {
  const navigation = useNavigation<RootNavigationProp>();
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const hasProcessedInitial = useRef(false);

  // Process a URL (share intent or deep link)
  const processURL = useCallback(
    async (url: string) => {
      if (!url) return;

      setIsProcessing(true);
      setError(null);

      try {
        // Check if it's a simple deep link navigation
        const parsed = parseDeepLink(url);
        if (!parsed) {
          setError('Invalid URL format');
          return;
        }

        // Handle navigation-only deep links
        if (parsed.path === DEEP_LINK_PATHS.analyze || parsed.path === DEEP_LINK_PATHS.screenshot) {
          const imageUri = parsed.params['imageUri'];
          const imageBase64 = parsed.params['imageBase64'];
          const contactIdParam = parsed.params['contactId'];
          const contactId = contactIdParam ? parseInt(contactIdParam, 10) : undefined;

          // If we have image data, process it
          if (imageUri || imageBase64) {
            const result = await processSharedContent(url);

            if (result.success && result.content) {
              setSharedContent(result.content);

              // Navigate to analysis screen with content
              navigation.navigate('ScreenshotAnalysis', {
                imageUri: result.content.uri,
                imageBase64: result.content.data,
                contactId,
              });
            } else {
              setError(result.error || 'Failed to process shared content');
            }
          } else {
            // Just navigate to the screen
            navigation.navigate('ScreenshotAnalysis', {
              contactId,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process share';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [navigation]
  );

  // Handle initial URL (app opened via share)
  useEffect(() => {
    if (hasProcessedInitial.current) return;

    const checkInitialURL = async () => {
      hasProcessedInitial.current = true;
      const url = await getInitialURL();
      if (url) {
        await processURL(url);
      }
    };

    checkInitialURL();
  }, [processURL]);

  // Subscribe to URL events (app already open)
  useEffect(() => {
    const unsubscribe = subscribeToURLEvents(async (url) => {
      await processURL(url);
    });

    return unsubscribe;
  }, [processURL]);

  // Handle app state changes (for when coming from share extension)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          // App has come to foreground - check for pending share
          const url = await getInitialURL();
          if (url && url !== appState.current) {
            await processURL(url);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, [processURL]);

  // Cleanup shared files periodically
  useEffect(() => {
    // Clean up old shared files on mount
    cleanupSharedFiles();

    // Clean up when content is cleared
    return () => {
      if (sharedContent?.uri) {
        // Don't await - fire and forget
        cleanupSharedFiles();
      }
    };
  }, [sharedContent?.uri]);

  // Clear shared content
  const clearSharedContent = useCallback(() => {
    setSharedContent(null);
    setError(null);
  }, []);

  return {
    sharedContent,
    isProcessing,
    error,
    clearSharedContent,
    processURL,
  };
}

export default useShareIntent;
