/**
 * useAI Hook (2.4.4)
 * AI API calls management
 */

import { useState, useCallback, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { Girl, Suggestion, AnalysisResult, AsyncStatus, APIError } from '../types';
import { generateFlirtResponse, analyzeScreenshot } from '../services/ai';
import { validateAIResponse } from '../utils/validation';

interface UseAIState {
  status: AsyncStatus;
  suggestions: Suggestion[];
  proTip: string;
  interestLevel?: number;
  mood?: string;
  error: APIError | null;
}

interface UseAIResult extends UseAIState {
  // Actions
  generateSuggestions: (herMessage: string, context?: string) => Promise<AnalysisResult | null>;
  analyzeImage: (imageBase64: string) => Promise<AnalysisResult | null>;
  cancel: () => void;
  reset: () => void;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

const initialState: UseAIState = {
  status: 'idle',
  suggestions: [],
  proTip: '',
  interestLevel: undefined,
  mood: undefined,
  error: null,
};

export const useAI = (girl?: Girl | null): UseAIResult => {
  const [state, setState] = useState<UseAIState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiKey = useStore((s) => s.apiKey);
  const userCulture = useStore((s) => s.userCulture);
  const cacheSuggestions = useStore((s) => s.cacheSuggestions);
  const getCachedSuggestions = useStore((s) => s.getCachedSuggestions);
  const addConversation = useStore((s) => s.addConversation);

  const generateSuggestions = useCallback(
    async (herMessage: string, context?: string): Promise<AnalysisResult | null> => {
      if (!apiKey) {
        setState({
          ...initialState,
          status: 'error',
          error: {
            code: 'INVALID_API_KEY',
            message: 'API key is not set',
            retryable: false,
          },
        });
        return null;
      }

      if (!girl) {
        setState({
          ...initialState,
          status: 'error',
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'No girl selected',
            retryable: false,
          },
        });
        return null;
      }

      // Check cache first
      const cached = getCachedSuggestions(girl.id, herMessage);
      if (cached) {
        const result: AnalysisResult = {
          suggestions: cached.suggestions,
          proTip: cached.proTip || '',
        };
        setState({
          status: 'success',
          suggestions: cached.suggestions,
          proTip: cached.proTip || '',
          interestLevel: undefined,
          mood: undefined,
          error: null,
        });
        return result;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState({ ...initialState, status: 'loading' });

      try {
        const response = await generateFlirtResponse({
          girl,
          herMessage,
          userCulture,
          context,
          apiKey,
        });

        // Validate response
        const validation = validateAIResponse(response);
        if (!validation.success) {
          throw new Error('Invalid AI response format');
        }

        const result: AnalysisResult = {
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
          mood: response.mood,
        };

        // Cache the result
        cacheSuggestions(girl.id, herMessage, response.suggestions, response.proTip);

        // Add to conversation history
        addConversation({
          girlId: girl.id,
          herMessage,
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
        });

        setState({
          status: 'success',
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
          mood: response.mood,
          error: null,
        });

        return result;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setState(initialState);
          return null;
        }

        const apiError: APIError = {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate suggestions',
          retryable: true,
        };

        // Classify error
        if (error instanceof Error) {
          if (error.message.includes('rate limit')) {
            apiError.code = 'RATE_LIMITED';
            apiError.retryable = true;
          } else if (error.message.includes('API key')) {
            apiError.code = 'INVALID_API_KEY';
            apiError.retryable = false;
          } else if (error.message.includes('network')) {
            apiError.code = 'NETWORK_ERROR';
            apiError.retryable = true;
          }
        }

        setState({
          ...initialState,
          status: 'error',
          error: apiError,
        });

        return null;
      }
    },
    [apiKey, girl, userCulture, cacheSuggestions, getCachedSuggestions, addConversation]
  );

  const analyzeImage = useCallback(
    async (imageBase64: string): Promise<AnalysisResult | null> => {
      if (!apiKey) {
        setState({
          ...initialState,
          status: 'error',
          error: {
            code: 'INVALID_API_KEY',
            message: 'API key is not set',
            retryable: false,
          },
        });
        return null;
      }

      if (!girl) {
        setState({
          ...initialState,
          status: 'error',
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'No girl selected',
            retryable: false,
          },
        });
        return null;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState({ ...initialState, status: 'loading' });

      try {
        const response = await analyzeScreenshot({
          girl,
          imageBase64,
          userCulture,
          apiKey,
        });

        const result: AnalysisResult = {
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
          mood: response.mood,
        };

        // Add to conversation history
        addConversation({
          girlId: girl.id,
          herMessage: '[Screenshot Analysis]',
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
        });

        setState({
          status: 'success',
          suggestions: response.suggestions,
          proTip: response.proTip,
          interestLevel: response.interestLevel,
          mood: response.mood,
          error: null,
        });

        return result;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setState(initialState);
          return null;
        }

        const apiError: APIError = {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze screenshot',
          retryable: true,
        };

        setState({
          ...initialState,
          status: 'error',
          error: apiError,
        });

        return null;
      }
    },
    [apiKey, girl, userCulture, addConversation]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(initialState);
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    generateSuggestions,
    analyzeImage,
    cancel,
    reset,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
  };
};

export default useAI;
