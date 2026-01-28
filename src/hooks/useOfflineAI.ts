/**
 * useOfflineAI Hook
 * Integrates offline queue, response cache, and network status for AI requests
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisResult, Girl, Culture } from '../types';
import {
  OfflineQueueService,
  addToQueue,
  getPendingCount,
  getQueueStats,
  type QueuedRequest,
  type QueueStats,
} from '../services/offlineQueue';
import {
  getCachedResponse,
  cacheResponse,
  getCachedResponsesForGirl,
} from '../services/responseCache';
import { generateFlirtResponse } from '../services/ai';
import { useNetworkStatus } from './useNetworkStatus';

// ==========================================
// Types
// ==========================================

export interface UseOfflineAIResult {
  // State
  isOnline: boolean;
  pendingCount: number;
  queueStats: QueueStats | null;
  isProcessingQueue: boolean;

  // Actions
  generateResponse: (
    girl: Girl,
    message: string,
    culture: Culture,
    apiKey: string
  ) => Promise<{ result: AnalysisResult | null; source: 'api' | 'cache' | 'queued' }>;

  getCachedResponses: (girlId: string) => Promise<AnalysisResult[]>;
  refreshQueueStats: () => void;

  // Queue management
  getQueuedRequests: () => QueuedRequest[];
  removeFromQueue: (id: string) => Promise<boolean>;
  clearQueue: () => Promise<void>;
  processQueue: () => Promise<{ processed: number; failed: number }>;
}

// ==========================================
// Hook
// ==========================================

export function useOfflineAI(): UseOfflineAIResult {
  const { isOnline, isOffline } = useNetworkStatus();

  const [pendingCount, setPendingCount] = useState(0);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const isInitializedRef = useRef(false);

  // Initialize offline queue service
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Set up the process callback
    OfflineQueueService.setProcessCallback(async (request: QueuedRequest) => {
      try {
        // Extract params and make the API call
        const { girl, herMessage, userCulture, apiKey } = request.params as {
          girl: Girl;
          herMessage: string;
          userCulture: Culture;
          apiKey: string;
        };

        const result = await generateFlirtResponse({
          girl,
          herMessage,
          userCulture,
          apiKey,
        });

        // Cache the result
        await cacheResponse(String(girl.id), herMessage, result);

        return true;
      } catch (error) {
        console.error('[useOfflineAI] Failed to process queued request:', error);
        return false;
      }
    });

    // Initialize the queue service
    OfflineQueueService.initialize();

    return () => {
      OfflineQueueService.cleanup();
    };
  }, []);

  // Subscribe to queue state changes
  useEffect(() => {
    const unsubscribe = OfflineQueueService.subscribe((state) => {
      setPendingCount(state.queue.length);
      setIsProcessingQueue(state.isProcessing);
    });

    return unsubscribe;
  }, []);

  // Refresh queue stats
  const refreshQueueStats = useCallback(() => {
    setQueueStats(getQueueStats());
    setPendingCount(getPendingCount());
  }, []);

  // Process when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      OfflineQueueService.processQueue();
    }
  }, [isOnline, pendingCount]);

  // Generate response with offline support
  const generateResponseWithOfflineSupport = useCallback(
    async (
      girl: Girl,
      message: string,
      culture: Culture,
      apiKey: string
    ): Promise<{ result: AnalysisResult | null; source: 'api' | 'cache' | 'queued' }> => {
      const girlIdStr = String(girl.id);

      // If offline, try cache first
      if (isOffline) {
        const cached = await getCachedResponse(girlIdStr, message);
        if (cached) {
          return { result: cached, source: 'cache' };
        }

        // Queue for later
        await addToQueue(
          'flirt',
          { girl, herMessage: message, userCulture: culture, apiKey },
          girlIdStr,
          girl.name
        );
        refreshQueueStats();

        return { result: null, source: 'queued' };
      }

      // Online - try API first
      try {
        const result = await generateFlirtResponse({
          girl,
          herMessage: message,
          userCulture: culture,
          apiKey,
        });

        // Cache the result
        await cacheResponse(girlIdStr, message, result);

        return { result, source: 'api' };
      } catch (error) {
        // On API error, try cache
        const cached = await getCachedResponse(girlIdStr, message);
        if (cached) {
          return { result: cached, source: 'cache' };
        }

        // Queue for retry
        await addToQueue(
          'flirt',
          { girl, herMessage: message, userCulture: culture, apiKey },
          girlIdStr,
          girl.name
        );
        refreshQueueStats();

        throw error;
      }
    },
    [isOffline, refreshQueueStats]
  );

  // Get cached responses for a girl
  const getCachedResponses = useCallback(async (girlId: string): Promise<AnalysisResult[]> => {
    const cached = await getCachedResponsesForGirl(girlId);
    return cached.map((c) => c.response);
  }, []);

  // Queue management
  const getQueuedRequests = useCallback((): QueuedRequest[] => {
    return OfflineQueueService.getQueuedRequests();
  }, []);

  const removeFromQueueHandler = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await OfflineQueueService.removeFromQueue(id);
      refreshQueueStats();
      return result;
    },
    [refreshQueueStats]
  );

  const clearQueueHandler = useCallback(async (): Promise<void> => {
    await OfflineQueueService.clearQueue();
    refreshQueueStats();
  }, [refreshQueueStats]);

  const processQueueHandler = useCallback(async (): Promise<{
    processed: number;
    failed: number;
  }> => {
    const result = await OfflineQueueService.processQueue();
    refreshQueueStats();
    return result;
  }, [refreshQueueStats]);

  return {
    // State
    isOnline,
    pendingCount,
    queueStats,
    isProcessingQueue,

    // Actions
    generateResponse: generateResponseWithOfflineSupport,
    getCachedResponses,
    refreshQueueStats,

    // Queue management
    getQueuedRequests,
    removeFromQueue: removeFromQueueHandler,
    clearQueue: clearQueueHandler,
    processQueue: processQueueHandler,
  };
}

export default useOfflineAI;
