/**
 * ProgressBar — Animated progress bar with color/gradient support.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, PREMIUM_COLORS } from '../../constants/theme';

export interface ProgressBarProps {
  /** Progress 0..1 */
  progress: number;
  /** Height in px */
  height?: number;
  /** Solid color (overridden by gradient) */
  color?: string;
  /** Use gradient fill */
  gradient?: readonly string[];
  /** Track (background) color */
  trackColor?: string;
  /** Animation duration ms */
  duration?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  gradient,
  trackColor,
  duration = 500,
  style,
}: ProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clampedProgress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, duration]);

  const widthInterp = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const resolvedTrack = trackColor || darkColors.border;
  const resolvedGradient = gradient || [PREMIUM_COLORS.gradientStart, PREMIUM_COLORS.gradientEnd];
  const resolvedColor = color || darkColors.primary;

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: resolvedTrack },
        style,
      ]}
    >
      <Animated.View style={[styles.fill, { width: widthInterp, height, borderRadius: height / 2 }]}>
        {gradient || !color ? (
          <LinearGradient
            colors={[...resolvedGradient] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: resolvedColor, borderRadius: height / 2 },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    overflow: 'hidden',
  },
});

export default ProgressBar;
