import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Girl } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface ConversationContextProps {
  girl: Girl;
  onViewHistory?: () => void;
}

const getTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'No messages yet';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getStageEmoji = (stage: Girl['relationshipStage']): string => {
  const emojis: Record<string, string> = {
    just_met: '👋',
    talking: '💬',
    flirting: '😏',
    dating: '❤️',
    serious: '💕',
  };
  return emojis[stage] || '👋';
};

export function ConversationContext({ girl, onViewHistory }: ConversationContextProps) {
  if (!girl) return null;

  const lastMessageTime = getTimeAgo(girl.lastMessageDate);
  const hasContext = girl.lastTopic || girl.insideJokes || girl.greenLights;

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{girl.messageCount}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{getStageEmoji(girl.relationshipStage)}</Text>
          <Text style={styles.statLabel}>{girl.relationshipStage.replace('_', ' ')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>🕐</Text>
          <Text style={styles.statLabel}>{lastMessageTime}</Text>
        </View>
      </View>

      {/* Last Topic */}
      {girl.lastTopic && (
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="document-text-outline" size={12} color={darkColors.textSecondary} />
            <Text style={styles.sectionLabel}>Last topic:</Text>
          </View>
          <Text style={styles.sectionText} numberOfLines={2}>
            "{girl.lastTopic}"
          </Text>
        </View>
      )}

      {/* Inside Jokes */}
      {girl.insideJokes && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>😂 Inside jokes:</Text>
          <Text style={styles.sectionText} numberOfLines={2}>
            {girl.insideJokes}
          </Text>
        </View>
      )}

      {/* Green Lights */}
      {girl.greenLights && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🟢 What works:</Text>
          <Text style={styles.sectionText} numberOfLines={2}>
            {girl.greenLights}
          </Text>
        </View>
      )}

      {/* No context hint */}
      {!hasContext && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            💡 Add more details in her profile to get better suggestions!
          </Text>
        </View>
      )}

      {/* View History Button */}
      {onViewHistory && girl.messageCount > 0 && (
        <TouchableOpacity onPress={onViewHistory} style={styles.historyButton}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={styles.historyButtonText}>View conversation history</Text>
            <Ionicons name="chevron-forward" size={14} color={darkColors.primary} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Compact version for the header
export function LastTopicIndicator({ topic }: { topic?: string }) {
  if (!topic) return null;

  return (
    <View style={styles.lastTopicIndicator}>
      <Text style={styles.lastTopicLabel}>Last topic:</Text>
      <Text style={styles.lastTopicText} numberOfLines={1}>
        {topic}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
    marginBottom: spacing.sm,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  statLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: darkColors.border,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: 4,
  },
  sectionText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
  },
  hintContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${darkColors.primary}20`,
    borderRadius: borderRadius.md,
  },
  hintText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  historyButton: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  historyButtonText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  // Last topic indicator styles
  lastTopicIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${darkColors.primary}20`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  lastTopicLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginRight: 4,
  },
  lastTopicText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
    flex: 1,
  },
});
