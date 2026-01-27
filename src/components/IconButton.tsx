/**
 * IconButton Component (4.4.8)
 * Circular button with icon/emoji
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { darkColors } from '../constants/theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: string | React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<IconButtonVariant, { bg: string; iconColor: string; border?: string }> = {
  primary: {
    bg: darkColors.primary,
    iconColor: '#ffffff',
  },
  secondary: {
    bg: darkColors.surface,
    iconColor: darkColors.text,
    border: darkColors.border,
  },
  outline: {
    bg: 'transparent',
    iconColor: darkColors.primary,
    border: darkColors.primary,
  },
  ghost: {
    bg: 'transparent',
    iconColor: darkColors.textSecondary,
  },
  danger: {
    bg: `${darkColors.error}20`,
    iconColor: darkColors.error,
    border: darkColors.error,
  },
};

const SIZE_STYLES: Record<IconButtonSize, { size: number; iconSize: number }> = {
  sm: { size: 32, iconSize: 16 },
  md: { size: 44, iconSize: 20 },
  lg: { size: 56, iconSize: 24 },
};

export function IconButton({
  icon,
  onPress,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
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
          width: sizeStyle.size,
          height: sizeStyle.size,
          borderRadius: sizeStyle.size / 2,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.iconColor} size="small" />
      ) : typeof icon === 'string' ? (
        <Text style={[styles.icon, { fontSize: sizeStyle.iconSize }]}>{icon}</Text>
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
