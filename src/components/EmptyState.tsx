/**
 * EmptyState Component
 * Display when lists are empty
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button, ButtonProps } from './Button';
import { darkColors, accentColors, spacing, fontSizes } from '../constants/theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: ButtonProps['variant'];
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant={action.variant || 'primary'}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${accentColors.coral}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 42,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  action: {
    marginTop: spacing.md,
  },
});

export default EmptyState;
