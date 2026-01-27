import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface InterestLevelDisplayProps {
  level: number;
  previousLevel?: number;
  mood?: string;
  showTrend?: boolean;
  showVibeCheck?: boolean;
}

const getColorForLevel = (level: number): [string, string] => {
  // Color gradient: red (low) -> yellow (medium) -> green (high)
  if (level <= 3) {
    return ['#ef4444', '#f87171']; // Red
  } else if (level <= 5) {
    return ['#f59e0b', '#fbbf24']; // Orange/Yellow
  } else if (level <= 7) {
    return ['#22c55e', '#4ade80']; // Green
  } else {
    return ['#6366f1', '#818cf8']; // Purple/Blue (very high)
  }
};

const getTrendIndicator = (current: number, previous?: number) => {
  if (previous === undefined) return null;
  if (current > previous) return { icon: '↑', color: '#22c55e', text: 'Rising' };
  if (current < previous) return { icon: '↓', color: '#ef4444', text: 'Dropping' };
  return { icon: '→', color: '#888', text: 'Stable' };
};

const getVibeCheck = (level: number): { emoji: string; text: string; color: string } => {
  if (level <= 2) return { emoji: '😬', text: "She's not feeling it", color: '#ef4444' };
  if (level <= 4) return { emoji: '😐', text: 'Lukewarm - step it up', color: '#f59e0b' };
  if (level <= 6) return { emoji: '😊', text: "She's engaged", color: '#22c55e' };
  if (level <= 8) return { emoji: '😍', text: 'Really into you!', color: '#6366f1' };
  return { emoji: '🔥', text: 'On fire! Keep it going!', color: '#ec4899' };
};

const getLowInterestWarning = (level: number): string | null => {
  if (level <= 2) {
    return "⚠️ Interest is very low. Consider switching topics or giving her space.";
  }
  if (level <= 3) {
    return "💡 Tip: Try asking about something she's passionate about.";
  }
  return null;
};

export function InterestLevelDisplay({
  level,
  previousLevel,
  mood,
  showTrend = true,
  showVibeCheck = true,
}: InterestLevelDisplayProps) {
  const colors = getColorForLevel(level);
  const trend = showTrend ? getTrendIndicator(level, previousLevel) : null;
  const vibeCheck = showVibeCheck ? getVibeCheck(level) : null;
  const warning = getLowInterestWarning(level);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Her Interest Level</Text>
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendIcon, { color: trend.color }]}>
              {trend.icon}
            </Text>
            <Text style={[styles.trendText, { color: trend.color }]}>
              {trend.text}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar with Gradient */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${level * 10}%` }]}
          />
        </View>
        <Text style={styles.value}>{level}/10</Text>
      </View>

      {/* Mood indicator */}
      {mood && (
        <View style={styles.moodContainer}>
          <Text style={styles.moodLabel}>Her mood:</Text>
          <Text style={styles.moodText}>{mood}</Text>
        </View>
      )}

      {/* Vibe Check */}
      {vibeCheck && (
        <Animated.View
          entering={SlideInLeft.delay(200)}
          style={[styles.vibeCheck, { backgroundColor: `${vibeCheck.color}20` }]}
        >
          <Text style={styles.vibeEmoji}>{vibeCheck.emoji}</Text>
          <Text style={[styles.vibeText, { color: vibeCheck.color }]}>
            {vibeCheck.text}
          </Text>
        </Animated.View>
      )}

      {/* Low Interest Warning */}
      {warning && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    marginRight: 4,
  },
  trendText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: darkColors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  value: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  moodLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginRight: spacing.xs,
  },
  moodText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  vibeCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  vibeEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  vibeText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  warning: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#ef444420',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.error,
  },
  warningText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
});
