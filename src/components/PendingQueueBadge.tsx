/**
 * PendingQueueBadge Component
 * Shows the number of pending offline requests
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { OfflineQueueService, type OfflineQueueState } from '../services/offlineQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { spacing, fontSizes, borderRadius } from '../constants/theme';

interface PendingQueueBadgeProps {
  onPress?: () => void;
  showWhenEmpty?: boolean;
  style?: object;
}

export const PendingQueueBadge: React.FC<PendingQueueBadgeProps> = React.memo(
  ({ onPress, showWhenEmpty = false, style }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const { isOnline } = useNetworkStatus();

    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    // Subscribe to queue state
    useEffect(() => {
      const unsubscribe = OfflineQueueService.subscribe((state: OfflineQueueState) => {
        setPendingCount(state.queue.length);
        setIsProcessing(state.isProcessing);
      });

      return unsubscribe;
    }, []);

    // Animate visibility
    useEffect(() => {
      if (pendingCount > 0 || showWhenEmpty) {
        opacity.value = withTiming(1, { duration: 200 });
        // Bounce effect when count changes
        scale.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withSpring(1, { damping: 10 })
        );
      } else {
        opacity.value = withTiming(0, { duration: 200 });
      }
    }, [pendingCount, showWhenEmpty]);

    // Spin animation when processing
    useEffect(() => {
      if (isProcessing) {
        rotation.value = withRepeat(
          withTiming(360, { duration: 1000 }),
          -1, // Infinite
          false
        );
      } else {
        rotation.value = withTiming(0, { duration: 200 });
      }
    }, [isProcessing]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));

    if (pendingCount === 0 && !showWhenEmpty) {
      return null;
    }

    const getBadgeColor = () => {
      if (isProcessing) return '#3b82f6'; // Blue when processing
      if (!isOnline) return '#f59e0b'; // Orange when offline
      return '#8b5cf6'; // Purple when ready
    };

    const getStatusText = () => {
      if (isProcessing) return 'Syncing...';
      if (!isOnline) return 'Offline';
      return 'Pending';
    };

    return (
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.badge,
            { backgroundColor: getBadgeColor() },
            pressed && styles.badgePressed,
          ]}
        >
          <Animated.Text style={[styles.icon, iconAnimatedStyle]}>
            {isProcessing ? '⟳' : '📤'}
          </Animated.Text>
          <View style={styles.content}>
            <Text style={styles.count}>{pendingCount}</Text>
            <Text style={styles.label}>{getStatusText()}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

PendingQueueBadge.displayName = 'PendingQueueBadge';

/**
 * Compact version for header/nav
 */
export const PendingQueueBadgeCompact: React.FC<{
  onPress?: () => void;
  style?: object;
}> = React.memo(({ onPress, style }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOnline } = useNetworkStatus();

  const scale = useSharedValue(1);

  useEffect(() => {
    const unsubscribe = OfflineQueueService.subscribe((state: OfflineQueueState) => {
      setPendingCount(state.queue.length);
      setIsProcessing(state.isProcessing);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [pendingCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Pressable onPress={onPress} style={style}>
      <Animated.View
        style={[
          styles.compactBadge,
          {
            backgroundColor: isProcessing ? '#3b82f6' : !isOnline ? '#f59e0b' : '#8b5cf6',
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.compactCount}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
      </Animated.View>
    </Pressable>
  );
});

PendingQueueBadgeCompact.displayName = 'PendingQueueBadgeCompact';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  content: {
    alignItems: 'flex-start',
  },
  count: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    lineHeight: fontSizes.lg * 1.2,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  // Compact styles
  compactBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  compactCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PendingQueueBadge;
