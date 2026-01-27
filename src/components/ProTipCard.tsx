import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

type TipCategory = 'general' | 'timing' | 'conversation' | 'psychology' | 'humor';

interface ProTipCardProps {
  tip: string;
  category?: TipCategory;
  onSave?: (tip: string) => void;
  onDismiss?: () => void;
  isSaved?: boolean;
  showActions?: boolean;
}

const CATEGORY_CONFIG: Record<TipCategory, { emoji: string; label: string; color: string }> = {
  general: { emoji: '💡', label: 'General', color: '#6366f1' },
  timing: { emoji: '⏰', label: 'Timing', color: '#f59e0b' },
  conversation: { emoji: '💬', label: 'Conversation', color: '#22c55e' },
  psychology: { emoji: '🧠', label: 'Psychology', color: '#8b5cf6' },
  humor: { emoji: '😄', label: 'Humor', color: '#ec4899' },
};

// Tip of the day database
const TIPS_OF_THE_DAY: Record<TipCategory, string[]> = {
  general: [
    "Don't overthink it. She liked you enough to respond.",
    "Match her energy - if she's playful, be playful back.",
    "A good conversation is like tennis, not a monologue.",
    "Quality over quantity - one great message beats five boring ones.",
  ],
  timing: [
    "Don't double text. Wait for her reply.",
    "Texting at night can feel more intimate.",
    "If she takes hours to reply, don't respond instantly.",
    "Best times to text: lunch break and after 8pm.",
  ],
  conversation: [
    "Ask open-ended questions to keep her engaged.",
    "Reference something from her previous messages.",
    "Share a story instead of just answering questions.",
    "Use her name occasionally - it creates connection.",
  ],
  psychology: [
    "Be a little unpredictable. Don't always be available.",
    "End conversations on a high note - leave her wanting more.",
    "Show interest, but don't be desperate.",
    "Confidence is attractive. Own your personality.",
  ],
  humor: [
    "Self-deprecating humor works, but don't overdo it.",
    "Playful teasing shows confidence.",
    "Inside jokes create intimacy.",
    "A well-timed meme can break the ice.",
  ],
};

export function getTipOfTheDay(): { tip: string; category: TipCategory } {
  const categories = Object.keys(TIPS_OF_THE_DAY) as TipCategory[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)] ?? 'general';
  const tips = TIPS_OF_THE_DAY[randomCategory] ?? TIPS_OF_THE_DAY.general;
  const randomTip = tips[Math.floor(Math.random() * tips.length)] ?? tips[0] ?? '';
  return { tip: randomTip, category: randomCategory };
}

export function ProTipCard({
  tip,
  category = 'general',
  onSave,
  onDismiss,
  isSaved = false,
  showActions = true,
}: ProTipCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const config = CATEGORY_CONFIG[category];

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(!saved);
    onSave?.(tip);
    if (!saved) {
      Alert.alert('Saved! 💾', 'Tip saved to your collection');
    }
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `💡 Dating tip: "${tip}" - Shared from FlirtKey`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  return (
    <Animated.View
      entering={SlideInUp.springify()}
      style={[styles.container, { borderColor: config.color }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.label, { color: config.color }]}>PRO TIP</Text>
          <View style={[styles.categoryBadge, { backgroundColor: `${config.color}30` }]}>
            <Text style={[styles.categoryText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tip Content */}
      <Text style={styles.tipText}>{tip}</Text>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.actionButton, saved && styles.actionButtonActive]}
          >
            <Text style={styles.actionIcon}>{saved ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionLabel}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

// Special component for Tip of the Day
export function TipOfTheDay({
  onSave,
  onDismiss,
}: {
  onSave?: (tip: string) => void;
  onDismiss?: () => void;
}) {
  const { tip, category } = getTipOfTheDay();
  
  return (
    <View style={styles.tipOfDayContainer}>
      <Text style={styles.tipOfDayHeader}>✨ Tip of the Day</Text>
      <ProTipCard
        tip={tip}
        category={category}
        onSave={onSave}
        onDismiss={onDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${darkColors.primary}15`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  categoryBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  dismissButton: {
    padding: spacing.xs,
  },
  dismissText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
  tipText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  tipOfDayContainer: {
    marginBottom: spacing.md,
  },
  tipOfDayHeader: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
});
