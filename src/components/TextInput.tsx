/**
 * TextInput Component (4.4.1)
 * Reusable text input with label, error state, and validation
 */

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  multiline?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      labelStyle,
      multiline = false,
      maxLength,
      showCharCount = false,
      value = '',
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const charCount = value?.length || 0;

    const handleFocus = (e: Parameters<NonNullable<React.ComponentProps<typeof RNTextInput>['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: Parameters<NonNullable<React.ComponentProps<typeof RNTextInput>['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const getBorderColor = () => {
      if (error) return darkColors.error;
      if (isFocused) return darkColors.primary;
      return darkColors.border;
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <View
          style={[
            styles.inputContainer,
            { borderColor: getBorderColor() },
            multiline && styles.multilineContainer,
            error && styles.inputError,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              multiline ? styles.multilineInput : undefined,
              inputStyle,
            ]}
            placeholderTextColor={darkColors.textSecondary}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            maxLength={maxLength}
            textAlignVertical={multiline ? 'top' : 'center'}
            {...props}
          />

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>

        <View style={styles.bottomRow}>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : hint ? (
            <Text style={styles.hint}>{hint}</Text>
          ) : (
            <View />
          )}

          {showCharCount && maxLength && (
            <Text
              style={[
                styles.charCount,
                charCount >= maxLength && styles.charCountMax,
              ]}
            >
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  required: {
    color: darkColors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  multilineContainer: {
    alignItems: 'flex-start',
  },
  inputError: {
    borderColor: darkColors.error,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  leftIcon: {
    paddingLeft: spacing.md,
  },
  rightIcon: {
    paddingRight: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    minHeight: 18,
  },
  error: {
    color: darkColors.error,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  hint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  charCount: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  charCountMax: {
    color: darkColors.warning,
  },
});

export default TextInput;
