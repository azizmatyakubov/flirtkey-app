// 6.2.13 Suggestion regeneration
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Suggestion } from '../types';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface RegenerateButtonProps {
  onRegenerate: (type?: Suggestion['type']) => Promise<void>;
  disabled?: boolean;
  type?: Suggestion['type'];
  compact?: boolean;
}

export function RegenerateButton({
  onRegenerate,
  disabled = false,
  type,
  compact = false,
}: RegenerateButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleRegenerate = async () => {
    if (disabled || isRegenerating) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRegenerating(true);

    // Start spinning animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    try {
      await onRegenerate(type);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to regenerate. Please try again.');
    } finally {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
      setIsRegenerating(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handleRegenerate}
        disabled={disabled || isRegenerating}
        style={[styles.compactButton, disabled && styles.disabled]}
      >
        <Animated.View style={animatedStyle}>
          <Ionicons name="refresh-outline" size={18} color={darkColors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleRegenerate}
      disabled={disabled || isRegenerating}
      style={[styles.button, disabled && styles.disabled]}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name="refresh-outline" size={18} color={darkColors.textSecondary} />
      </Animated.View>
      <Text style={styles.text}>
        {isRegenerating ? 'Generating...' : type ? `New ${type}` : 'Regenerate All'}
      </Text>
    </TouchableOpacity>
  );
}

interface RegeneratePanelProps {
  onRegenerateAll: () => Promise<void>;
  onRegenerateSafe: () => Promise<void>;
  onRegenerateBalanced: () => Promise<void>;
  onRegenerateBold: () => Promise<void>;
  disabled?: boolean;
}

export function RegeneratePanel({
  onRegenerateAll,
  onRegenerateSafe,
  onRegenerateBalanced,
  onRegenerateBold,
  disabled = false,
}: RegeneratePanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Regenerate</Text>
      <View style={styles.panelButtons}>
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRegenerateAll();
          }}
          disabled={disabled}
          style={[styles.panelButton, styles.allButton]}
        >
          <Ionicons name="sparkles" size={16} color={darkColors.primary} />
          <Text style={styles.panelButtonText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRegenerateSafe();
          }}
          disabled={disabled}
          style={[styles.panelButton, styles.safeButton]}
        >
          <Text style={styles.panelButtonIcon}>🟢</Text>
          <Text style={styles.panelButtonText}>Safe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRegenerateBalanced();
          }}
          disabled={disabled}
          style={[styles.panelButton, styles.balancedButton]}
        >
          <Text style={styles.panelButtonIcon}>🟡</Text>
          <Text style={styles.panelButtonText}>Balanced</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRegenerateBold();
          }}
          disabled={disabled}
          style={[styles.panelButton, styles.boldButton]}
        >
          <Text style={styles.panelButtonIcon}>🔴</Text>
          <Text style={styles.panelButtonText}>Bold</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.sm,
  },
  compactButton: {
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  // Panel styles
  panel: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  panelTitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  panelButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  panelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.background,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  panelButtonIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  panelButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
  },
  allButton: {
    borderColor: darkColors.primary,
  },
  safeButton: {
    borderColor: darkColors.safe,
  },
  balancedButton: {
    borderColor: darkColors.balanced,
  },
  boldButton: {
    borderColor: darkColors.bold,
  },
});
