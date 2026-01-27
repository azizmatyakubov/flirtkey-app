/**
 * LoadingSpinner Component (4.4.12)
 * Loading indicators and skeleton screens
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<SpinnerSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

export function LoadingSpinner({
  size = 'md',
  color = darkColors.primary,
  message,
  fullScreen = false,
  overlay = false,
  style,
}: LoadingSpinnerProps) {
  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={SIZE_MAP[size]} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>{content}</View>
      </View>
    );
  }

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

// Pulsing dots animation
export interface PulsingDotsProps {
  color?: string;
  size?: number;
}

export function PulsingDots({ color = darkColors.primary, size = 8 }: PulsingDotsProps) {
  const animations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animate = (index: number) => {
      const anim = animations[index];
      if (!anim) return;
      Animated.sequence([
        Animated.delay(index * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    animations.forEach((_, i) => animate(i));
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Skeleton loader for content placeholders
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [
              {
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-200, 200],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

// Card skeleton preset
export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.cardSkeletonContent}>
        <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

// List skeleton preset
export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  message: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    backgroundColor: darkColors.primary,
  },
  skeleton: {
    backgroundColor: darkColors.surface,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  cardSkeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listSkeleton: {
    padding: spacing.md,
  },
});

export default LoadingSpinner;
