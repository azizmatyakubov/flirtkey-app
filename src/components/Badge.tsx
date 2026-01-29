/**
 * Badge Component (4.4.5)
 * Status badges for relationship stages and other labels
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  text: string;
  emoji?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  outline?: boolean;
  containerStyle?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
  },
  primary: {
    bg: `${darkColors.primary}20`,
    text: darkColors.primary,
    border: darkColors.primary,
  },
  success: {
    bg: `${darkColors.success}20`,
    text: darkColors.success,
    border: darkColors.success,
  },
  warning: {
    bg: `${darkColors.warning}20`,
    text: darkColors.warning,
    border: darkColors.warning,
  },
  error: {
    bg: `${darkColors.error}20`,
    text: darkColors.error,
    border: darkColors.error,
  },
  info: {
    bg: '#3b82f620',
    text: '#3b82f6',
    border: '#3b82f6',
  },
};

const SIZE_STYLES: Record<BadgeSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: {
    paddingV: spacing.xs / 2,
    paddingH: spacing.sm,
    fontSize: fontSizes.xs,
  },
  md: {
    paddingV: spacing.xs,
    paddingH: spacing.sm,
    fontSize: fontSizes.sm,
  },
  lg: {
    paddingV: spacing.sm,
    paddingH: spacing.md,
    fontSize: fontSizes.md,
  },
};

export const Badge = React.memo(function Badge({
  text,
  emoji,
  variant = 'default',
  size = 'md',
  outline = false,
  containerStyle,
}: BadgeProps) {
  const colors = VARIANT_COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: outline ? 'transparent' : colors.bg,
          borderColor: colors.border,
          paddingVertical: sizeStyle.paddingV,
          paddingHorizontal: sizeStyle.paddingH,
        },
        containerStyle,
      ]}
    >
      {emoji && <Text style={[styles.emoji, { fontSize: sizeStyle.fontSize }]}>{emoji}</Text>}
      <Text style={[styles.text, { color: colors.text, fontSize: sizeStyle.fontSize }]}>
        {text}
      </Text>
    </View>
  );
});

// Convenience component for relationship stages
export type RelationshipStageBadgeProps = {
  stage: 'just_met' | 'talking' | 'flirting' | 'dating' | 'serious';
  size?: BadgeSize;
};

const STAGE_CONFIG: Record<
  RelationshipStageBadgeProps['stage'],
  { text: string; emoji: string; variant: BadgeVariant }
> = {
  just_met: { text: 'Just Met', emoji: '🆕', variant: 'info' },
  talking: { text: 'Talking', emoji: '💬', variant: 'default' },
  flirting: { text: 'Flirting', emoji: '😏', variant: 'warning' },
  dating: { text: 'Dating', emoji: '❤️', variant: 'error' },
  serious: { text: 'Serious', emoji: '💑', variant: 'success' },
};

export const StageBadge = React.memo(function StageBadge({ stage, size = 'md' }: RelationshipStageBadgeProps) {
  const config = STAGE_CONFIG[stage];
  return (
    <Badge
      text={config.text}
      emoji={config.emoji}
      variant={config.variant}
      size={size}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emoji: {
    textAlign: 'center',
  },
  text: {
    fontWeight: '500',
  },
});

export default Badge;
