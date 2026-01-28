/**
 * CelebrationAnimation Component
 * Shows confetti/particle celebration when text is copied
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Particle colors matching app theme
const PARTICLE_COLORS = ['#FF6B6B', '#FF8E53', '#ec4899', '#f59e0b', '#10b981', '#A855F7'];
const EMOJI_OPTIONS = ['✨', '🎉', '💖', '🔥', '⭐', '💫'];

interface ParticleProps {
  index: number;
  totalParticles: number;
  onComplete?: () => void;
  isLast: boolean;
}

const Particle: React.FC<ParticleProps> = React.memo(
  ({ index, totalParticles, onComplete, isLast }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    // Distribute particles in a burst pattern
    const angle = (index / totalParticles) * Math.PI * 2;
    const distance = 60 + Math.random() * 80;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance - 40; // Bias upward

    useEffect(() => {
      const delay = index * 15; // Stagger animation

      scale.value = withDelay(delay, withSpring(1, { damping: 4, stiffness: 200 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
      rotation.value = withDelay(delay, withTiming(Math.random() * 720 - 360, { duration: 800 }));

      translateX.value = withDelay(
        delay,
        withTiming(endX, { duration: 600, easing: Easing.out(Easing.quad) })
      );

      translateY.value = withDelay(
        delay,
        withSequence(
          withTiming(endY - 20, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(endY + 60, { duration: 500, easing: Easing.in(Easing.quad) })
        )
      );

      // Fade out
      opacity.value = withDelay(
        delay + 400,
        withTiming(0, { duration: 400 }, (finished) => {
          if (finished && isLast && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      scale.value = withDelay(delay + 400, withTiming(0.5, { duration: 400 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    }));

    const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
    const emoji = EMOJI_OPTIONS[index % EMOJI_OPTIONS.length];
    const isEmoji = index % 3 === 0;

    return (
      <Animated.View style={[styles.particle, animatedStyle]}>
        {isEmoji ? (
          <Animated.Text style={styles.emoji}>{emoji}</Animated.Text>
        ) : (
          <View style={[styles.dot, { backgroundColor: color }]} />
        )}
      </Animated.View>
    );
  }
);

Particle.displayName = 'Particle';

interface CopiedBadgeProps {
  onComplete?: () => void;
}

const CopiedBadge: React.FC<CopiedBadgeProps> = React.memo(({ onComplete: _onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Entrance
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 12 });

    // Exit after delay
    const timeout = setTimeout(() => {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-20, { duration: 200 });
    }, 1200);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Animated.Text style={styles.badgeText}>✓ Copied!</Animated.Text>
    </Animated.View>
  );
});

CopiedBadge.displayName = 'CopiedBadge';

interface CelebrationAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  centerX?: number;
  centerY?: number;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = React.memo(
  ({ visible, onComplete, centerX = SCREEN_WIDTH / 2, centerY = 100 }) => {
    const PARTICLE_COUNT = 18;

    const handleComplete = useCallback(() => {
      onComplete?.();
    }, [onComplete]);

    // Trigger haptic on mount
    useEffect(() => {
      if (visible) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <View style={[styles.container, { left: centerX, top: centerY }]} pointerEvents="none">
        <CopiedBadge />
        {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
          <Particle
            key={index}
            index={index}
            totalParticles={PARTICLE_COUNT}
            onComplete={handleComplete}
            isLast={index === PARTICLE_COUNT - 1}
          />
        ))}
      </View>
    );
  }
);

CelebrationAnimation.displayName = 'CelebrationAnimation';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  particle: {
    position: 'absolute',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emoji: {
    fontSize: 16,
  },
  badge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    top: -40,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CelebrationAnimation;
