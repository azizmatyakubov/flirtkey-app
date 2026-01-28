// 6.1.18 Quick action shortcuts
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: () => void;
  color?: string;
}

interface QuickActionShortcutsProps {
  onGenerateFlirty: () => void;
  onGenerateSafe: () => void;
  onAnalyzeScreenshot: () => void;
  onGetConversationStarter: () => void;
  onGetDateIdea: () => void;
  onViewHistory: () => void;
  visible?: boolean;
}

export function QuickActionShortcuts({
  onGenerateFlirty,
  onGenerateSafe,
  onAnalyzeScreenshot,
  onGetConversationStarter,
  onGetDateIdea,
  onViewHistory,
  visible = true,
}: QuickActionShortcutsProps) {
  const actions: QuickAction[] = [
    {
      id: 'flirty',
      icon: '🔥',
      label: 'Bold reply',
      action: onGenerateFlirty,
      color: darkColors.bold,
    },
    {
      id: 'safe',
      icon: '💚',
      label: 'Safe reply',
      action: onGenerateSafe,
      color: darkColors.safe,
    },
    {
      id: 'screenshot',
      icon: '📸',
      label: 'Analyze',
      action: onAnalyzeScreenshot,
    },
    {
      id: 'starter',
      icon: '💬',
      label: 'Starter',
      action: onGetConversationStarter,
    },
    {
      id: 'date',
      icon: '📅',
      label: 'Date idea',
      action: onGetDateIdea,
    },
    {
      id: 'history',
      icon: '📜',
      label: 'History',
      action: onViewHistory,
    },
  ];

  const handlePress = async (action: QuickAction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.action();
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handlePress(action)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconContainer, action.color ? { borderColor: action.color } : null]}
            >
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// Compact version for toolbar
export function QuickActionToolbar({
  onGenerate,
  onScreenshot,
  onHistory,
}: {
  onGenerate: () => void;
  onScreenshot: () => void;
  onHistory: () => void;
}) {
  const handlePress = async (action: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  return (
    <View style={styles.toolbar}>
      <TouchableOpacity onPress={() => handlePress(onGenerate)} style={styles.toolbarButton}>
        <Text style={styles.toolbarIcon}>✨</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress(onScreenshot)} style={styles.toolbarButton}>
        <Text style={styles.toolbarIcon}>📸</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress(onHistory)} style={styles.toolbarButton}>
        <Text style={styles.toolbarIcon}>📜</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  title: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 60,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  // Toolbar styles
  toolbar: {
    flexDirection: 'row',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.background,
  },
  toolbarIcon: {
    fontSize: 18,
  },
});
