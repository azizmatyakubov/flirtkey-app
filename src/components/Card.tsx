/**
 * Card Component (4.4.6)
 * Reusable card container with variants
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { darkColors, spacing, borderRadius, shadows } from '../constants/theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  disabled = false,
  style,
  noPadding = false,
}: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...styles.elevated,
          ...shadows.md,
        };
      case 'outlined':
        return styles.outlined;
      case 'filled':
        return styles.filled;
      default:
        return styles.default;
    }
  };

  const cardStyle = [
    styles.base,
    getVariantStyle(),
    noPadding && styles.noPadding,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  elevated: {
    backgroundColor: darkColors.surface,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  filled: {
    backgroundColor: darkColors.surface,
  },
  noPadding: {
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Card;
