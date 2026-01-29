/**
 * PremiumCard — Elevated card with optional gradient border and glow.
 * The go-to card component for a polished, premium look.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  darkColors,
  spacing,
  borderRadius,
  shadows,
  PREMIUM_COLORS,
} from '../../constants/theme';

export interface PremiumCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Elevation level: 'flat' | 'raised' | 'floating' */
  elevation?: 'flat' | 'raised' | 'floating';
  /** Show gradient border (e.g., for selected/premium items) */
  gradientBorder?: boolean;
  /** Custom gradient for border */
  borderGradient?: readonly string[];
  /** No padding inside */
  noPadding?: boolean;
  disabled?: boolean;
}

export function PremiumCard({
  children,
  onPress,
  style,
  elevation = 'raised',
  gradientBorder = false,
  borderGradient = PREMIUM_COLORS.gradientPrimary,
  noPadding = false,
  disabled = false,
}: PremiumCardProps) {
  const elevationStyle = elevation === 'floating' ? shadows.lg : elevation === 'raised' ? shadows.md : shadows.none;

  const innerContent = (
    <View
      style={[
        styles.inner,
        !noPadding && styles.padded,
        !gradientBorder && styles.border,
        gradientBorder && styles.gradientInner,
        style,
      ]}
    >
      {children}
    </View>
  );

  const card = gradientBorder ? (
    <LinearGradient
      colors={[...borderGradient] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientWrapper, elevationStyle]}
    >
      {innerContent}
    </LinearGradient>
  ) : (
    <View style={[styles.base, elevationStyle]}>
      {innerContent}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {card}
      </TouchableOpacity>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientWrapper: {
    borderRadius: borderRadius.lg + 1.5,
    padding: 1.5, // Thin gradient border
  },
  inner: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientInner: {
    // When inside gradient border, don't add extra border
  },
  border: {
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  padded: {
    padding: spacing.md,
  },
});

export default PremiumCard;
