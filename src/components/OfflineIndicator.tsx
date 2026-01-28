/**
 * OfflineIndicator Component
 * Shows a banner when the device is offline
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSizes, borderRadius } from '../constants/theme';

interface OfflineIndicatorProps {
  onRetry?: () => void;
  showWhenOnline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = React.memo(
  ({ onRetry, showWhenOnline = false }) => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [connectionType, setConnectionType] = useState<string>('unknown');
    const [isWeak, setIsWeak] = useState(false);
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    const translateY = useSharedValue(-60);
    const opacity = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    // Monitor network status
    useEffect(() => {
      const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const connected = state.isConnected ?? false;
        const type = state.type;

        // Detect weak connection
        const weak = state.isInternetReachable === false && connected;

        setConnectionType(type);
        setIsWeak(weak);

        // Track if we were offline to show recovery message
        if (!connected) {
          setWasOffline(true);
        }

        // Show "back online" message when recovering
        if (connected && wasOffline) {
          setShowOnlineMessage(true);
          setTimeout(() => {
            setShowOnlineMessage(false);
            setWasOffline(false);
          }, 2000);
        }

        setIsConnected(connected);
      });

      return () => unsubscribe();
    }, [wasOffline]);

    // Animate visibility
    useEffect(() => {
      const shouldShow = !isConnected || isWeak || (showOnlineMessage && showWhenOnline);

      if (shouldShow) {
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 200 });

        // Pulse animation for attention
        if (!isConnected) {
          pulseScale.value = withSequence(
            withTiming(1.02, { duration: 500 }),
            withTiming(1, { duration: 500 })
          );
        }
      } else {
        translateY.value = withTiming(-60, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
      }
    }, [isConnected, isWeak, showOnlineMessage, showWhenOnline]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }, { scale: pulseScale.value }],
      opacity: opacity.value,
    }));

    const handleRetry = () => {
      // Refresh network info
      NetInfo.refresh();
      onRetry?.();
    };

    // Determine banner content
    const getBannerContent = () => {
      if (showOnlineMessage) {
        return {
          iconName: 'checkmark-circle' as const,
          text: 'Back online!',
          color: '#10b981',
          showRetry: false,
        };
      }

      if (!isConnected) {
        return {
          iconName: 'cloud-offline' as const,
          text: 'No internet connection',
          color: '#ef4444',
          showRetry: true,
        };
      }

      if (isWeak) {
        return {
          iconName: 'warning' as const,
          text: `Weak ${connectionType} connection`,
          color: '#f59e0b',
          showRetry: true,
        };
      }

      return null;
    };

    const content = getBannerContent();
    if (!content) return null;

    return (
      <Animated.View style={[styles.container, { backgroundColor: content.color }, animatedStyle]}>
        <View style={styles.content}>
          <Ionicons name={content.iconName as any} size={16} color="#fff" style={{ marginRight: spacing.sm }} />
          <Text style={styles.text}>{content.text}</Text>
        </View>

        {content.showRetry && onRetry && (
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </Animated.View>
    );
  }
);

OfflineIndicator.displayName = 'OfflineIndicator';

/**
 * useNetworkStatus hook
 * Returns current network status for conditional rendering
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50, // Safe area
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  text: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  retryButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
