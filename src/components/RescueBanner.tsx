/**
 * RescueBanner - Phase 1.4: Conversation Rescue System
 * 
 * Banner that appears in ChatScreen when conversation is "cooling" or "dying".
 * "⚡ This conversation needs a spark!"
 * Expandable with 3 revival suggestions.
 * Dismiss button (don't show again for this convo for 24h).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeOut, SlideInDown } from 'react-native-reanimated';
import {
  ConvoHealth,
  ConvoHealthStatus,
  dismissRescueBanner,
  isRescueBannerDismissed,
} from '../services/conversationHealth';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ==========================================
// Types
// ==========================================

interface RescueBannerProps {
  health: ConvoHealth | null;
  contactId: number;
  contactName: string;
  onGenerateRevival?: () => void;
  loading?: boolean;
}

// ==========================================
// Status config
// ==========================================

const BANNER_CONFIG: Record<ConvoHealthStatus, {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
} | null> = {
  thriving: null, // Don't show banner for thriving
  cooling: {
    icon: '⚡',
    title: 'This conversation needs a spark!',
    subtitle: 'Try pivoting to a new topic or share something interesting',
    color: '#f59e0b',
    bgColor: '#f59e0b15',
  },
  dying: {
    icon: '🚨',
    title: 'Rescue mission needed!',
    subtitle: 'Time for a bold move — try something unexpected',
    color: '#f97316',
    bgColor: '#f9731615',
  },
  dead: {
    icon: '👻',
    title: 'Time to revive this convo',
    subtitle: 'A well-crafted double text can work wonders',
    color: '#6b7280',
    bgColor: '#6b728015',
  },
};

// ==========================================
// Component
// ==========================================

export const RescueBanner = React.memo(function RescueBanner({
  health,
  contactId,
  contactName,
  onGenerateRevival,
  loading = false,
}: RescueBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isDismissChecked, setIsDismissChecked] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Check if banner was recently dismissed
  useEffect(() => {
    let mounted = true;
    isRescueBannerDismissed(contactId).then((result) => {
      if (mounted) {
        setDismissed(result);
        setIsDismissChecked(true);
      }
    });
    return () => { mounted = false; };
  }, [contactId]);

  // Don't render if no health data, thriving, dismissed, or still checking
  if (!health || !isDismissChecked || dismissed) return null;

  const config = BANNER_CONFIG[health.status];
  if (!config) return null; // Thriving — no banner

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDismissed(true);
    await dismissRescueBanner(contactId);
  };

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    
    // If expanding and no revival messages, request generation
    if (!expanded && health.revivalMessages.length === 0 && onGenerateRevival) {
      onGenerateRevival();
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(15)}
      exiting={FadeOut.duration(200)}
    >
      <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]}>
        {/* Main banner row */}
        <TouchableOpacity
          style={styles.mainRow}
          onPress={handleExpand}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: config.color }]}>
              {config.title}
            </Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
          <View style={styles.actions}>
            <Text style={[styles.expandIcon, { color: config.color }]}>
              {expanded ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Score indicator */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Health Score:</Text>
              <View style={[styles.miniScoreBar]}>
                <View
                  style={[
                    styles.miniScoreBarFill,
                    {
                      width: `${health.score}%`,
                      backgroundColor: config.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.scoreValue, { color: config.color }]}>
                {health.score}/100
              </Text>
            </View>

            {/* Signals */}
            {health.signals.length > 0 && (
              <View style={styles.signalsContainer}>
                {health.signals.slice(0, 3).map((signal, i) => (
                  <Text key={i} style={styles.signal}>• {signal}</Text>
                ))}
              </View>
            )}

            {/* Revival suggestions */}
            {health.revivalMessages.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>✨ Try saying:</Text>
                {health.revivalMessages.map((msg, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.suggestionCard,
                      copiedIndex === i && styles.suggestionCardCopied,
                    ]}
                    onPress={() => handleCopy(msg, i)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{msg}</Text>
                    <Text style={styles.copyHint}>
                      {copiedIndex === i ? '✅ Copied!' : '📋 Tap to copy'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>✨ Generating revival ideas for {contactName}...</Text>
              </View>
            ) : onGenerateRevival ? (
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: config.color }]}
                onPress={onGenerateRevival}
              >
                <Text style={styles.generateButtonText}>✨ Generate Revival Messages</Text>
              </TouchableOpacity>
            ) : null}

            {/* Dismiss button */}
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissText}>Dismiss for 24h</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginLeft: spacing.sm,
  },
  expandIcon: {
    fontSize: fontSizes.sm,
  },

  // Expanded
  expandedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    paddingTop: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scoreLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  miniScoreBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.border,
    overflow: 'hidden',
  },
  miniScoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreValue: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },

  // Signals
  signalsContainer: {
    marginBottom: spacing.sm,
  },
  signal: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },

  // Suggestions
  suggestionsContainer: {
    marginTop: spacing.xs,
  },
  suggestionsTitle: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  suggestionCardCopied: {
    borderColor: darkColors.success,
    backgroundColor: darkColors.success + '10',
  },
  suggestionText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  copyHint: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    marginTop: 4,
    textAlign: 'right',
  },

  // Loading
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
  },

  // Generate button
  generateButton: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },

  // Dismiss
  dismissButton: {
    marginTop: spacing.sm,
    alignItems: 'center',
    padding: spacing.xs,
  },
  dismissText: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    textDecorationLine: 'underline',
  },
});

export default RescueBanner;
