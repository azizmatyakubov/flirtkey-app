/**
 * useNetworkStatus Hook
 * Track network connectivity status using @react-native-community/netinfo
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

// ==========================================
// Types
// ==========================================

export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'bluetooth'
  | 'vpn'
  | 'unknown'
  | 'none';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  details: {
    isWifiEnabled?: boolean;
    ssid?: string | null;
    strength?: number | null;
    cellularGeneration?: '2g' | '3g' | '4g' | '5g' | null;
    carrier?: string | null;
  };
}

export interface UseNetworkStatusResult extends NetworkStatus {
  // Actions
  refresh: () => Promise<void>;

  // Convenience
  isOnline: boolean;
  isOffline: boolean;
  isWeak: boolean;
}

export interface UseNetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  onWeakConnection?: () => void;
}

// ==========================================
// Helpers
// ==========================================

function mapConnectionType(type: NetInfoStateType): ConnectionType {
  switch (type) {
    case 'wifi':
      return 'wifi';
    case 'cellular':
      return 'cellular';
    case 'ethernet':
      return 'ethernet';
    case 'bluetooth':
      return 'bluetooth';
    case 'vpn':
      return 'vpn';
    case 'none':
      return 'none';
    default:
      return 'unknown';
  }
}

function extractDetails(state: NetInfoState): NetworkStatus['details'] {
  const details: NetworkStatus['details'] = {};

  if (state.type === 'wifi' && state.details) {
    details.isWifiEnabled = state.details.isConnectionExpensive !== true;
    details.ssid = state.details.ssid || null;
    details.strength = state.details.strength ?? null;
  }

  if (state.type === 'cellular' && state.details) {
    details.cellularGeneration = state.details.cellularGeneration as
      | '2g'
      | '3g'
      | '4g'
      | '5g'
      | null;
    details.carrier = state.details.carrier || null;
  }

  return details;
}

// ==========================================
// Hook
// ==========================================

export function useNetworkStatus(options: UseNetworkStatusOptions = {}): UseNetworkStatusResult {
  const { onOnline, onOffline, onWeakConnection } = options;

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially
    isInternetReachable: null,
    connectionType: 'unknown',
    details: {},
  });

  const wasOnlineRef = useRef(true);
  const wasWeakRef = useRef(false);

  const handleNetworkChange = useCallback(
    (state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      const connectionType = mapConnectionType(state.type);
      const details = extractDetails(state);

      // Determine if connection is weak
      const isWeak = isConnected && isInternetReachable === false;

      // Determine online status
      const isOnline = isConnected && isInternetReachable !== false;

      setStatus({
        isConnected,
        isInternetReachable,
        connectionType,
        details,
      });

      // Trigger callbacks on status change
      if (wasOnlineRef.current && !isOnline) {
        onOffline?.();
      } else if (!wasOnlineRef.current && isOnline) {
        onOnline?.();
      }

      // Trigger weak connection callback
      if (!wasWeakRef.current && isWeak) {
        onWeakConnection?.();
      }

      wasOnlineRef.current = isOnline;
      wasWeakRef.current = isWeak;
    },
    [onOnline, onOffline, onWeakConnection]
  );

  const refresh = useCallback(async () => {
    const state = await NetInfo.refresh();
    handleNetworkChange(state);
  }, [handleNetworkChange]);

  // Subscribe to network changes
  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  const isOnline = status.isConnected && status.isInternetReachable !== false;
  const isOffline = !status.isConnected || status.isInternetReachable === false;
  const isWeak = status.isConnected && status.isInternetReachable === false;

  return {
    ...status,
    refresh,
    isOnline,
    isOffline,
    isWeak,
  };
}

// ==========================================
// Simple Hooks
// ==========================================

/**
 * Simple online check hook
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

/**
 * Hook that returns true once when coming back online
 */
export function useOnReconnect(callback: () => void): void {
  const wasOfflineRef = useRef(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      callback();
    }
  }, [isOnline, callback]);
}

/**
 * Hook for offline-first patterns
 */
export function useOfflineFirst<T>(
  onlineValue: T | null,
  cachedValue: T | null,
  isLoading: boolean
): { value: T | null; isStale: boolean; source: 'online' | 'cache' | 'none' } {
  const { isOnline } = useNetworkStatus();

  if (isOnline && onlineValue !== null) {
    return { value: onlineValue, isStale: false, source: 'online' };
  }

  if (cachedValue !== null) {
    return { value: cachedValue, isStale: !isOnline || isLoading, source: 'cache' };
  }

  return { value: null, isStale: false, source: 'none' };
}

export default useNetworkStatus;
