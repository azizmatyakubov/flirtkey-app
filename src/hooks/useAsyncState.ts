/**
 * useAsyncState Hook (2.4.8)
 * Manage async operation state with loading, success, error states
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AsyncState, APIError } from '../types';

interface UseAsyncStateResult<T> extends AsyncState<T> {
  // Actions
  execute: (promise: Promise<T>) => Promise<T | null>;
  setData: (data: T) => void;
  setError: (error: APIError) => void;
  reset: () => void;

  // Derived states
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseAsyncStateOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
}

export function useAsyncState<T>(options: UseAsyncStateOptions<T> = {}): UseAsyncStateResult<T> {
  const { initialData = null, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
    lastUpdated: null,
  });

  const mountedRef = useRef(true);
  const latestPromiseRef = useRef<Promise<T> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (promise: Promise<T>): Promise<T | null> => {
      // Track the latest promise to handle race conditions
      latestPromiseRef.current = promise;

      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      try {
        const data = await promise;

        // Only update if this is still the latest promise and component is mounted
        if (mountedRef.current && latestPromiseRef.current === promise) {
          setState({
            status: 'success',
            data,
            error: null,
            lastUpdated: Date.now(),
          });
          onSuccess?.(data);
        }

        return data;
      } catch (err) {
        // Only update if this is still the latest promise and component is mounted
        if (mountedRef.current && latestPromiseRef.current === promise) {
          const apiError: APIError =
            err instanceof Error
              ? {
                  code: 'UNKNOWN_ERROR',
                  message: err.message,
                  retryable: true,
                }
              : {
                  code: 'UNKNOWN_ERROR',
                  message: 'An unknown error occurred',
                  retryable: true,
                };

          setState({
            status: 'error',
            data: state.data, // Keep previous data on error
            error: apiError,
            lastUpdated: Date.now(),
          });
          onError?.(apiError);
        }

        return null;
      }
    },
    [onSuccess, onError, state.data]
  );

  const setData = useCallback((data: T) => {
    setState({
      status: 'success',
      data,
      error: null,
      lastUpdated: Date.now(),
    });
  }, []);

  const setError = useCallback((error: APIError) => {
    setState((prev) => ({
      ...prev,
      status: 'error',
      error,
      lastUpdated: Date.now(),
    }));
  }, []);

  const reset = useCallback(() => {
    latestPromiseRef.current = null;
    setState({
      status: 'idle',
      data: initialData,
      error: null,
      lastUpdated: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    setData,
    setError,
    reset,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
}

/**
 * Execute async function on mount
 */
export function useAsyncEffect<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): UseAsyncStateResult<T> {
  const asyncState = useAsyncState<T>();

  useEffect(() => {
    asyncState.execute(asyncFn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return asyncState;
}

export default useAsyncState;
