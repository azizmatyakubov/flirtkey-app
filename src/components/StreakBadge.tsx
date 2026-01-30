/**
 * StreakBadge — Shows consecutive days using the app
 * Engagement feature: motivates daily usage
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';
import { useSettingsStore } from '../stores/settingsStore';

function StreakBadgeBase() {
  const stats = useSettingsStore((s) => s.stats);
  const streak = useStreakCount(stats);

  if (streak < 2) return null;

  const isHot = streak >= 7;
  const isFire = streak >= 14;

  return (
    <View
      style={[
        styles.container,
        isFire && styles.containerFire,
        isHot && !isFire && styles.containerHot,
      ]}
    >
      <Text style={styles.emoji}>{isFire ? '🔥' : isHot ? '⚡' : '✨'}</Text>
      <Text style={[styles.count, isFire && styles.countFire, isHot && !isFire && styles.countHot]}>
        {streak}
      </Text>
      <Text style={styles.label}>day streak</Text>
    </View>
  );
}

/**
 * Calculate streak from app stats.
 * Uses lastOpenDate and firstOpenDate to estimate streak.
 * A more robust implementation would track each open date.
 */
function useStreakCount(stats: {
  lastOpenDate: string | null;
  firstOpenDate: string | null;
  appOpens: number;
}): number {
  if (!stats.lastOpenDate || !stats.firstOpenDate) return 0;

  const lastOpen = new Date(stats.lastOpenDate);
  const now = new Date();

  // If last open was more than 36 hours ago, streak is broken
  const hoursSinceLastOpen = (now.getTime() - lastOpen.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastOpen > 36) return 0;

  // Estimate streak from first open date and app opens
  const firstOpen = new Date(stats.firstOpenDate);
  const daysSinceFirst = Math.floor((now.getTime() - firstOpen.getTime()) / (1000 * 60 * 60 * 24));

  // Use opens per day ratio to estimate streak
  // If they open every day, streak ≈ days since first open
  // Cap at actual days elapsed
  if (daysSinceFirst <= 0) return 1;

  const opensPerDay = stats.appOpens / Math.max(daysSinceFirst, 1);

  // If opening at least once per day on average, streak is active
  if (opensPerDay >= 0.8) {
    return Math.min(daysSinceFirst + 1, stats.appOpens);
  }

  // Otherwise, estimate recent streak (simplified)
  return Math.min(Math.ceil(opensPerDay * 3), 7);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  containerHot: {
    backgroundColor: '#FF8E5315',
    borderColor: '#FF8E5340',
  },
  containerFire: {
    backgroundColor: '#FF4757 15',
    borderColor: '#FF475740',
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    fontFamily: fonts.extraBold,
  },
  countHot: {
    color: accentColors.coral,
  },
  countFire: {
    color: '#FF4757',
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
  },
});

export const StreakBadge = memo(StreakBadgeBase);
StreakBadge.displayName = 'StreakBadge';

export default StreakBadge;
