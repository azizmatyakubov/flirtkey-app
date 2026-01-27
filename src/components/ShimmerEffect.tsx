import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, borderRadius } from '../constants/theme';

interface ShimmerEffectProps {
  width: number | string;
  height: number;
  borderRadiusValue?: number;
  style?: ViewStyle;
}

export function ShimmerEffect({
  width,
  height,
  borderRadiusValue = borderRadius.md,
  style,
}: ShimmerEffectProps) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-200, 200],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: width as number,
          height,
          borderRadius: borderRadiusValue,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Pre-built shimmer layouts for common use cases
export function SuggestionCardShimmer() {
  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <ShimmerEffect width={20} height={20} borderRadiusValue={10} />
        <ShimmerEffect width={60} height={16} style={{ marginLeft: 8 }} />
      </View>
      <ShimmerEffect width="100%" height={60} style={{ marginTop: 12 }} />
      <ShimmerEffect width="70%" height={14} style={{ marginTop: 12 }} />
    </View>
  );
}

export function LoadingShimmer() {
  return (
    <View style={styles.loadingContainer}>
      <SuggestionCardShimmer />
      <SuggestionCardShimmer />
      <SuggestionCardShimmer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.surface,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    gap: 12,
    padding: 16,
  },
  suggestionCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
