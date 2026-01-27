/**
 * Select/Dropdown Component (4.4.2)
 * Reusable selection component with visual options
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export interface SelectOption<T extends string = string> {
  key: T;
  label: string;
  emoji?: string;
  description?: string;
}

export interface SelectProps<T extends string = string> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  horizontal?: boolean;
  wrap?: boolean;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export function Select<T extends string = string>({
  label,
  value,
  options,
  onChange,
  error,
  required,
  horizontal = true,
  wrap = true,
  containerStyle,
  disabled = false,
}: SelectProps<T>) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View
        style={[
          styles.optionsContainer,
          horizontal && styles.horizontal,
          wrap && styles.wrap,
        ]}
      >
        {options.map((option) => {
          const isSelected = value === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
              onPress={() => !disabled && onChange(option.key)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              {option.emoji && (
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              )}
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  required: {
    color: darkColors.error,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  horizontal: {
    flexDirection: 'row',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  option: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionSelected: {
    backgroundColor: `${darkColors.primary}20`,
    borderColor: darkColors.primary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionEmoji: {
    fontSize: fontSizes.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  optionTextSelected: {
    color: darkColors.text,
    fontWeight: '500',
  },
  optionDescription: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  error: {
    color: darkColors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});

export default Select;
