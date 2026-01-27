import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Suggestion } from '../types';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

const SUGGESTION_COLORS = {
  safe: { bg: '#22c55e20', border: '#22c55e', emoji: '🟢' },
  balanced: { bg: '#f59e0b20', border: '#f59e0b', emoji: '🟡' },
  bold: { bg: '#ef444420', border: '#ef4444', emoji: '🔴' },
};

interface AnimatedSuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onUse?: (suggestion: Suggestion) => void;
  onFavorite?: (suggestion: Suggestion) => void;
  onEdit?: (suggestion: Suggestion) => void;
  onFeedback?: (suggestion: Suggestion, positive: boolean) => void;
  isFavorite?: boolean;
}

export function AnimatedSuggestionCard({
  suggestion,
  index,
  onUse,
  onFavorite,
  onEdit,
  onFeedback,
  isFavorite = false,
}: AnimatedSuggestionCardProps) {
  const colors = SUGGESTION_COLORS[suggestion.type];
  const scale = useSharedValue(1);
  const [copied, setCopied] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCopy = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(suggestion.text);
    setCopied(true);
    onUse?.(suggestion);
    
    // Visual feedback
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });

    Alert.alert('Copied! 📋', 'Paste it in your chat');
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (positive: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFeedback?.(suggestion, positive);
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100).springify()}
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.border },
        animatedStyle,
      ]}
    >
      <TouchableOpacity onPress={handleCopy} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{colors.emoji}</Text>
          <Text style={[styles.type, { color: colors.border }]}>
            {suggestion.type.toUpperCase()}
          </Text>
          <Text style={styles.copyHint}>
            {copied ? '✓ Copied!' : 'Tap to copy'}
          </Text>
        </View>

        {/* Text */}
        <Text style={styles.text}>{suggestion.text}</Text>

        {/* Reason */}
        <Text style={styles.reason}>{suggestion.reason}</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        {onFavorite && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFavorite(suggestion);
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
        
        {onEdit && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(suggestion);
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>✏️</Text>
          </TouchableOpacity>
        )}

        {onFeedback && (
          <View style={styles.feedbackContainer}>
            <TouchableOpacity
              onPress={() => handleFeedback(true)}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFeedback(false)}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>👎</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: fontSizes.md,
    marginRight: spacing.sm,
  },
  type: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  copyHint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginLeft: 'auto',
  },
  text: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  reason: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionText: {
    fontSize: 18,
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
});
