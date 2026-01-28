/**
 * AnimatedSuggestionCard Component (Optimized with React.memo)
 * Memoized suggestion card for performance optimization
 */

import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Suggestion } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, accentColors, fontSizes, spacing, borderRadius, shadows } from '../constants/theme';
import { fonts } from '../constants/fonts';

const SUGGESTION_COLORS = {
  safe: { bg: `${darkColors.safe}15`, border: darkColors.safe, label: 'SAFE' },
  balanced: { bg: `${darkColors.balanced}15`, border: darkColors.balanced, label: 'BALANCED' },
  bold: { bg: `${darkColors.bold}15`, border: darkColors.bold, label: 'BOLD' },
};

interface AnimatedSuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onUse?: (suggestion: Suggestion) => void;
  onSendThis?: (suggestion: Suggestion) => void;
  onFavorite?: (suggestion: Suggestion) => void;
  onEdit?: (suggestion: Suggestion) => void;
  onFeedback?: (suggestion: Suggestion, positive: boolean) => void;
  isFavorite?: boolean;
}

const areEqual = (
  prevProps: AnimatedSuggestionCardProps,
  nextProps: AnimatedSuggestionCardProps
) => {
  return (
    prevProps.suggestion.type === nextProps.suggestion.type &&
    prevProps.suggestion.text === nextProps.suggestion.text &&
    prevProps.suggestion.reason === nextProps.suggestion.reason &&
    prevProps.index === nextProps.index &&
    prevProps.isFavorite === nextProps.isFavorite
  );
};

function AnimatedSuggestionCardBase({
  suggestion,
  index,
  onUse,
  onSendThis,
  onFavorite,
  onEdit,
  onFeedback,
  isFavorite = false,
}: AnimatedSuggestionCardProps) {
  const colors = SUGGESTION_COLORS[suggestion.type];
  const scale = useSharedValue(1);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCopy = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(suggestion.text);
    setCopied(true);
    onUse?.(suggestion);

    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });

    Alert.alert('Copied!', 'Paste it in your chat');

    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendThis = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(suggestion.text);
    setSent(true);
    onSendThis?.(suggestion);

    scale.value = withSpring(0.93, {}, () => {
      scale.value = withSpring(1);
    });

    setTimeout(() => setSent(false), 3000);
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
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity onPress={handleCopy} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: `${colors.border}25` }]}>
            <View style={[styles.typeDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.type, { color: colors.border }]}>
              {colors.label}
            </Text>
          </View>
          <View style={styles.copyHintContainer}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={14}
              color={copied ? darkColors.success : darkColors.textSecondary}
            />
            <Text style={[styles.copyHint, copied && { color: darkColors.success }]}>
              {copied ? 'Copied!' : 'Tap to copy'}
            </Text>
          </View>
        </View>

        {/* Text */}
        <Text style={styles.text}>{suggestion.text}</Text>

        {/* Reason */}
        <Text style={styles.reason}>{suggestion.reason}</Text>
      </TouchableOpacity>

      {/* Send This Button */}
      {onSendThis && (
        <TouchableOpacity
          onPress={handleSendThis}
          activeOpacity={0.8}
          style={styles.sendThisWrapper}
        >
          <LinearGradient
            colors={sent
              ? [darkColors.success, darkColors.success]
              : [accentColors.gradientStart, accentColors.gradientEnd]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendThisButton}
          >
            <Ionicons
              name={sent ? 'checkmark-circle' : 'send'}
              size={16}
              color="#fff"
            />
            <Text style={styles.sendThisText}>
              {sent ? 'Copied! Go send it 💬' : 'Send This'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

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
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? accentColors.rose : darkColors.textSecondary}
            />
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
            <Ionicons name="pencil" size={18} color={darkColors.textSecondary} />
          </TouchableOpacity>
        )}

        {onFeedback && (
          <View style={styles.feedbackContainer}>
            <TouchableOpacity onPress={() => handleFeedback(true)} style={styles.actionButton}>
              <Ionicons name="thumbs-up-outline" size={18} color={darkColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFeedback(false)} style={styles.actionButton}>
              <Ionicons name="thumbs-down-outline" size={18} color={darkColors.textSecondary} />
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
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  type: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  copyHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyHint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
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
  sendThisWrapper: {
    marginTop: spacing.sm,
  },
  sendThisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  sendThisText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${darkColors.border}80`,
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
});

export const AnimatedSuggestionCard = memo(AnimatedSuggestionCardBase, areEqual);
AnimatedSuggestionCard.displayName = 'AnimatedSuggestionCard';

export default AnimatedSuggestionCard;
