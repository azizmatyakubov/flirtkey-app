/**
 * CopyButton — Reusable copy-to-clipboard button with haptic feedback
 *
 * Used across all AI response screens: chat reply, bio, opener, quick reply, screenshot analysis.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

// ==========================================
// Types
// ==========================================

interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label override (default: "Copy") */
  label?: string;
  /** Show label text? (default: true for md/lg, false for sm) */
  showLabel?: boolean;
  /** Called after successful copy */
  onCopied?: () => void;
  /** Custom style */
  style?: object;
}

// ==========================================
// Component
// ==========================================

const FEEDBACK_DURATION = 2000;

export function CopyButton({
  text,
  size = 'md',
  label = 'Copy',
  showLabel,
  onCopied,
  style,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve showLabel default based on size
  const shouldShowLabel = showLabel ?? size !== 'sm';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCopied(true);
      onCopied?.();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), FEEDBACK_DURATION);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [text, onCopied]);

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const containerStyle = [
    styles.container,
    size === 'sm' && styles.containerSm,
    size === 'lg' && styles.containerLg,
    copied && styles.containerCopied,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={handleCopy}
      style={containerStyle}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={copied ? 'Copied to clipboard' : `Copy ${label}`}
      accessibilityRole="button"
    >
      <Ionicons
        name={copied ? 'checkmark-circle' : 'copy-outline'}
        size={iconSize}
        color={copied ? darkColors.success : accentColors.coral}
      />
      {shouldShowLabel && (
        <Text
          style={[
            styles.label,
            size === 'sm' && styles.labelSm,
            size === 'lg' && styles.labelLg,
            copied && styles.labelCopied,
          ]}
        >
          {copied ? 'Copied!' : label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: accentColors.coral + '15',
  },
  containerSm: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 4,
  },
  containerLg: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    borderRadius: borderRadius.lg,
  },
  containerCopied: {
    backgroundColor: darkColors.success + '15',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: accentColors.coral,
    fontFamily: fonts.semiBold,
  },
  labelSm: {
    fontSize: fontSizes.xs,
  },
  labelLg: {
    fontSize: fontSizes.md,
  },
  labelCopied: {
    color: darkColors.success,
  },
});

export default CopyButton;
