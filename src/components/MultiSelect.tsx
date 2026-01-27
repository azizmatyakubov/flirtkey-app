/**
 * MultiSelect Component (4.4.3)
 * Multi-selection component with chips
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

export interface MultiSelectOption<T extends string = string> {
  key: T;
  label: string;
  emoji?: string;
}

export interface MultiSelectProps<T extends string = string> {
  label?: string;
  values: T[];
  options: MultiSelectOption<T>[];
  onChange: (values: T[]) => void;
  error?: string;
  required?: boolean;
  maxSelections?: number;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export function MultiSelect<T extends string = string>({
  label,
  values,
  options,
  onChange,
  error,
  required,
  maxSelections,
  containerStyle,
  disabled = false,
}: MultiSelectProps<T>) {
  const handleToggle = (key: T) => {
    if (disabled) return;
    
    if (values.includes(key)) {
      onChange(values.filter((v) => v !== key));
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return;
      }
      onChange([...values, key]);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {maxSelections && (
            <Text style={styles.counter}>
              {values.length}/{maxSelections}
            </Text>
          )}
        </View>
      )}

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = values.includes(option.key);
          const isDisabled =
            disabled ||
            (!isSelected && maxSelections && values.length >= maxSelections);

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                isSelected ? styles.optionSelected : undefined,
                isDisabled ? styles.optionDisabled : undefined,
              ]}
              onPress={() => handleToggle(option.key)}
              activeOpacity={isDisabled ? 1 : 0.7}
            >
              {option.emoji && (
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              )}
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  required: {
    color: darkColors.error,
  },
  counter: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    fontSize: fontSizes.sm,
  },
  optionText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  optionTextSelected: {
    color: darkColors.text,
    fontWeight: '500',
  },
  checkmark: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  error: {
    color: darkColors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});

export default MultiSelect;
