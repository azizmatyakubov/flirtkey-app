/**
 * UsageMeter - Daily suggestion usage indicator
 * Phase 3, Task 1
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import type { RootNavigationProp } from '../types/navigation';

export const UsageMeter = React.memo(function UsageMeter() {
  const { getRemainingToday, isPro } = useSubscriptionStore();
  const navigation = useNavigation<RootNavigationProp>();

  // Pro users: don't show meter
  if (isPro()) {
    return null;
  }

  const remaining = getRemainingToday();
  const limit = 5;
  const used = limit - remaining;
  const progress = used / limit;
  const isExhausted = remaining <= 0;

  if (isExhausted) {
    return (
      <TouchableOpacity
        style={styles.exhaustedContainer}
        onPress={() => navigation.navigate('Paywall')}
        activeOpacity={0.7}
      >
        <Text style={styles.exhaustedIcon}>🔒</Text>
        <View style={styles.exhaustedTextWrap}>
          <Text style={styles.exhaustedTitle}>Daily limit reached</Text>
          <Text style={styles.exhaustedSubtitle}>Upgrade for unlimited suggestions</Text>
        </View>
        <Text style={styles.exhaustedArrow}>→</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.label}>
          {remaining}/{limit} suggestions left today
        </Text>
        {remaining <= 2 && (
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
            <Text style={styles.upgradeLink}>Get unlimited</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: remaining <= 1 ? darkColors.error : remaining <= 2 ? darkColors.warning : darkColors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: 15,
    marginTop: spacing.sm,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  upgradeLink: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  exhaustedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: 15,
    marginTop: spacing.sm,
    backgroundColor: '#6366f120',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  exhaustedIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  exhaustedTextWrap: {
    flex: 1,
  },
  exhaustedTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  exhaustedSubtitle: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
  },
  exhaustedArrow: {
    color: darkColors.primary,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
});

export default UsageMeter;
