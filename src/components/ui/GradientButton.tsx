/**
 * GradientButton — Premium CTA button with gradient background, glow shadow, and haptic feedback.
 * Used on PaywallScreen, OnboardingFlow, and anywhere we need a hero-level CTA.
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PREMIUM_COLORS, spacing, fontSizes, borderRadius as BR, shadows, darkColors } from '../../constants/theme';

export interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: readonly string[];
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg';
  glow?: boolean;
  glowColor?: string;
  icon?: string;
  subtitle?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton = React.memo(function GradientButton({
  title,
  onPress,
  gradient = PREMIUM_COLORS.gradientPrimary,
  disabled = false,
  loading = false,
  size = 'lg',
  glow = true,
  glowColor,
  icon,
  subtitle,
  style,
  textStyle,
}: GradientButtonProps) {
  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, loading, onPress]);

  const height = size === 'lg' ? 56 : 48;
  const resolvedGlowColor = glowColor || (gradient[0] as string);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        glow && !disabled && shadows.glow(resolvedGlowColor),
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? [darkColors.border, darkColors.border] : [...gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          { height, borderRadius: BR.lg },
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <View style={subtitle ? styles.textColumn : undefined}>
              <Text style={[styles.title, size === 'md' && styles.titleMd, textStyle]}>
                {title}
              </Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textColumn: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  title: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleMd: {
    fontSize: fontSizes.md,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSizes.xs,
    marginTop: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;
