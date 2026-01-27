/**
 * useNetworkStatus Hook (2.4.12)
 * Track network connectivity status
 *
 * Note: This is a simplified implementation.
 * For production, consider using @react-native-community/netinfo
 */

import { useState, useEffect, useCallback, useRef } from 'react';

type ConnectionType = 'wifi' | 'cellular' | 'unknown' | 'none';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
}

interface UseNetworkStatusResult extends NetworkStatus {
  // Actions
  refresh: () => Promise<void>;

  // Convenience
  isOnline: boolean;
  isOffline: boolean;
}

interface UseNetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  pingUrl?: string;
  pingInterval?: number; // ms, 0 to disable
}

const DEFAULT_PING_URL = 'https://www.google.com/generate_204';
const DEFAULT_PING_INTERVAL = 30000; // 30 seconds

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}): UseNetworkStatusResult => {
  const {
    onOnline,
    onOffline,
    pingUrl = DEFAULT_PING_URL,
    pingInterval = DEFAULT_PING_INTERVAL,
  } = options;

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially
    isInternetReachable: null,
    connectionType: 'unknown',
  });

  const wasOnlineRef = useRef(true);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  }, [pingUrl]);

  const refresh = useCallback(async () => {
    const isReachable = await checkConnectivity();

    setStatus((prev) => {
      const newStatus = {
        ...prev,
        isConnected: isReachable,
        isInternetReachable: isReachable,
      };

      // Trigger callbacks on status change
      if (wasOnlineRef.current && !isReachable) {
        onOffline?.();
      } else if (!wasOnlineRef.current && isReachable) {
        onOnline?.();
      }

      wasOnlineRef.current = isReachable;
      return newStatus;
    });
  }, [checkConnectivity, onOnline, onOffline]);

  // Initial check
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic ping if enabled
  useEffect(() => {
    if (pingInterval <= 0) return;

    const intervalId = setInterval(refresh, pingInterval);
    return () => clearInterval(intervalId);
  }, [pingInterval, refresh]);

  return {
    ...status,
    refresh,
    isOnline: status.isConnected && status.isInternetReachable !== false,
    isOffline: !status.isConnected || status.isInternetReachable === false,
  };
};

/**
 * Simple online check hook
 */
export const useIsOnline = (): boolean => {
  const { isOnline } = useNetworkStatus({ pingInterval: 0 });
  return isOnline;
};

export default useNetworkStatus;
