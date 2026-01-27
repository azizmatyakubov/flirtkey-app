/**
 * Button Component (4.4.7)
 * Reusable button with multiple variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: {
    bg: darkColors.primary,
    text: '#ffffff',
  },
  secondary: {
    bg: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
  },
  outline: {
    bg: 'transparent',
    text: darkColors.primary,
    border: darkColors.primary,
  },
  ghost: {
    bg: 'transparent',
    text: darkColors.primary,
  },
  danger: {
    bg: `${darkColors.error}20`,
    text: darkColors.error,
    border: darkColors.error,
  },
  success: {
    bg: darkColors.success,
    text: '#ffffff',
  },
};

const SIZE_STYLES: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: {
    paddingV: spacing.sm,
    paddingH: spacing.md,
    fontSize: fontSizes.sm,
  },
  md: {
    paddingV: spacing.md,
    paddingH: spacing.lg,
    fontSize: fontSizes.md,
  },
  lg: {
    paddingV: spacing.lg,
    paddingH: spacing.xl,
    fontSize: fontSizes.lg,
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border || 'transparent',
          borderWidth: variantStyle.border ? 1 : 0,
          paddingVertical: sizeStyle.paddingV,
          paddingHorizontal: sizeStyle.paddingH,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: variantStyle.text,
                fontSize: sizeStyle.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
