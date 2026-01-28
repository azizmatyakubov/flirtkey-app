// 6.1.18 Quick action shortcuts
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { darkColors, accentColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphName;
  label: string;
  action: () => void;
  color?: string;
  gradientColors?: [string, string];
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
      icon: 'flame' as any,
      label: 'Bold reply',
      action: onGenerateFlirty,
      gradientColors: [darkColors.bold, '#FF8888'],
    },
    {
      id: 'safe',
      icon: 'shield-checkmark' as any,
      label: 'Safe reply',
      action: onGenerateSafe,
      gradientColors: [darkColors.safe, '#5DE0A0'],
    },
    {
      id: 'screenshot',
      icon: 'camera' as any,
      label: 'Analyze',
      action: onAnalyzeScreenshot,
      gradientColors: [accentColors.coral, accentColors.gradientEnd],
    },
    {
      id: 'starter',
      icon: 'chatbubble' as any,
      label: 'Starter',
      action: onGetConversationStarter,
      gradientColors: [accentColors.gradientPurple, '#C084FC'],
    },
    {
      id: 'date',
      icon: 'calendar' as any,
      label: 'Date idea',
      action: onGetDateIdea,
      gradientColors: [accentColors.gold, '#FFE566'],
    },
    {
      id: 'history',
      icon: 'time' as any,
      label: 'History',
      action: onViewHistory,
      gradientColors: ['#3B82F6', '#60A5FA'],
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
            <LinearGradient
              colors={action.gradientColors || [accentColors.gradientStart, accentColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons name={action.icon as any} size={22} color="#FFFFFF" />
            </LinearGradient>
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
        <Ionicons name="sparkles" size={18} color={accentColors.coral} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress(onScreenshot)} style={styles.toolbarButton}>
        <Ionicons name="camera" size={18} color={accentColors.coral} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handlePress(onHistory)} style={styles.toolbarButton}>
        <Ionicons name="time" size={18} color={accentColors.coral} />
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
  // toolbarIcon removed - using Ionicons
});
