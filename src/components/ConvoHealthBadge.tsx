/**
 * ConvoHealthBadge - Phase 1.4: Conversation Rescue System
 * 
 * Small colored badge on HomeScreen next to each contact's name.
 * Green = thriving, Yellow = cooling, Orange = dying, Gray = dead
 * Tap to see details + revival suggestions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ConvoHealth, ConvoHealthStatus } from '../services/conversationHealth';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

// ==========================================
// Types
// ==========================================

interface ConvoHealthBadgeProps {
  health: ConvoHealth | null;
  size?: 'sm' | 'md';
  onRequestRevival?: () => void;
}

interface HealthDetailModalProps {
  visible: boolean;
  onClose: () => void;
  health: ConvoHealth;
  onCopySuggestion?: (text: string) => void;
}

// ==========================================
// Color mapping
// ==========================================

const STATUS_COLORS: Record<ConvoHealthStatus, string> = {
  thriving: '#22c55e', // green
  cooling: '#f59e0b',  // yellow
  dying: '#f97316',    // orange
  dead: '#6b7280',     // gray
};

const STATUS_LABELS: Record<ConvoHealthStatus, string> = {
  thriving: '🔥 Thriving',
  cooling: '⚡ Cooling',
  dying: '🥶 Dying',
  dead: '💀 Dead',
};

const ACTION_LABELS: Record<string, string> = {
  continue: '✅ Keep doing what you\'re doing',
  pivot_topic: '🔄 Change the topic',
  bold_move: '🎯 Make a bold move',
  send_meme: '😂 Send something funny',
  give_space: '⏳ Give them space',
  double_text: '📱 Double text (with style)',
};

// ==========================================
// Badge Component
// ==========================================

export const ConvoHealthBadge = React.memo(function ConvoHealthBadge({ health, size = 'sm', onRequestRevival }: ConvoHealthBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!health) return null;

  const dotSize = size === 'sm' ? 10 : 14;
  const color = STATUS_COLORS[health.status];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onRequestRevival && (health.status === 'dying' || health.status === 'dead')) {
      onRequestRevival();
    }
    setShowDetails(true);
  };

  const handleCopySuggestion = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={styles.badgeContainer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
            },
          ]}
        />
        {size === 'md' && (
          <Text style={[styles.badgeLabel, { color }]}>
            {health.score}
          </Text>
        )}
      </TouchableOpacity>

      <HealthDetailModal
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        health={health}
        onCopySuggestion={handleCopySuggestion}
      />
    </>
  );
});

// ==========================================
// Detail Modal
// ==========================================

function HealthDetailModal({ visible, onClose, health, onCopySuggestion }: HealthDetailModalProps) {
  const color = STATUS_COLORS[health.status];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {STATUS_LABELS[health.status]}
            </Text>
            <View style={[styles.scoreBadge, { borderColor: color }]}>
              <Text style={[styles.scoreText, { color }]}>
                {health.score}
              </Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${health.score}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Signals */}
            {health.signals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Signals</Text>
                {health.signals.map((signal, i) => (
                  <View key={i} style={styles.signalRow}>
                    <Text style={styles.signalBullet}>•</Text>
                    <Text style={styles.signalText}>{signal}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Action */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Suggested Action</Text>
              <View style={styles.actionCard}>
                <Text style={styles.actionText}>
                  {ACTION_LABELS[health.suggestedAction] || health.suggestedAction}
                </Text>
              </View>
            </View>

            {/* Revival Messages */}
            {health.revivalMessages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Try These Messages</Text>
                {health.revivalMessages.map((msg, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.revivalCard}
                    onPress={() => onCopySuggestion?.(msg)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.revivalText}>{msg}</Text>
                    <Text style={styles.revivalHint}>Tap to copy</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No revival messages */}
            {health.revivalMessages.length === 0 && health.status !== 'thriving' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Revival Tips</Text>
                <View style={styles.revivalCard}>
                  <Text style={styles.revivalText}>
                    Open the chat to generate AI-powered revival messages tailored to this conversation.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: darkColors.text,
  },
  scoreBadge: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreText: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: darkColors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalBody: {
    marginBottom: spacing.md,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: darkColors.text,
    marginBottom: spacing.sm,
  },

  // Signals
  signalRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  signalBullet: {
    color: darkColors.textSecondary,
    marginRight: spacing.xs,
    fontSize: fontSizes.sm,
  },
  signalText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    flex: 1,
  },

  // Action card
  actionCard: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  actionText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
  },

  // Revival cards
  revivalCard: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.primary + '40',
  },
  revivalText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  revivalHint: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Close button
  closeButton: {
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default ConvoHealthBadge;
