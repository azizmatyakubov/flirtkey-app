// 6.2.14 Suggestion history
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';
import { ConversationEntry } from '../stores/useStore';
import { Suggestion } from '../types';

const SUGGESTION_COLORS = {
  safe: { bg: '#22c55e20', border: '#22c55e', emoji: '🟢' },
  balanced: { bg: '#f59e0b20', border: '#f59e0b', emoji: '🟡' },
  bold: { bg: '#ef444420', border: '#ef4444', emoji: '🔴' },
};

interface SuggestionHistoryProps {
  visible: boolean;
  onClose: () => void;
  history: ConversationEntry[];
  onReuse: (suggestion: Suggestion) => void;
}

export function SuggestionHistory({ visible, onClose, history, onReuse }: SuggestionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCopy = async (text: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied! 📋', 'Message copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const renderEntry = useCallback(({ item }: { item: ConversationEntry }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.entry}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.entryHeader}>
          <Text style={styles.theirMessage} numberOfLines={isExpanded ? undefined : 2}>
            "{item.theirMessage}"
          </Text>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
        </View>

        {/* Interest level */}
        {item.interestLevel && (
          <View style={styles.interestRow}>
            <Text style={styles.interestLabel}>Interest:</Text>
            <View style={styles.interestBar}>
              <View
                style={[
                  styles.interestFill,
                  { width: `${item.interestLevel}%` },
                  {
                    backgroundColor:
                      item.interestLevel > 70
                        ? darkColors.safe
                        : item.interestLevel > 40
                          ? darkColors.balanced
                          : darkColors.bold,
                  },
                ]}
              />
            </View>
            <Text style={styles.interestValue}>{item.interestLevel}%</Text>
          </View>
        )}

        {/* Suggestions */}
        {isExpanded && (
          <Animated.View entering={FadeIn} style={styles.suggestions}>
            {item.suggestions.map((suggestion, index) => {
              const colors = SUGGESTION_COLORS[suggestion.type];
              return (
                <View
                  key={`${suggestion.type}-${index}`}
                  style={[
                    styles.suggestionItem,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionEmoji}>{colors.emoji}</Text>
                    <Text style={[styles.suggestionType, { color: colors.border }]}>
                      {suggestion.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>

                  <View style={styles.suggestionActions}>
                    <TouchableOpacity
                      onPress={() => handleCopy(suggestion.text)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="copy-outline" size={12} color={darkColors.textSecondary} />
                      <Text style={styles.actionText}> Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onReuse(suggestion);
                        onClose();
                      }}
                      style={[styles.actionBtn, styles.reuseBtn]}
                    >
                      <Ionicons name="refresh-outline" size={12} color={darkColors.primary} />
                      <Text style={styles.reuseText}> Reuse</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Pro tip */}
            {item.proTip && (
              <View style={styles.proTipItem}>
                <Text style={styles.proTipLabel}><Ionicons name="bulb-outline" size={12} color={darkColors.primary} /> Pro Tip</Text>
                <Text style={styles.proTipText}>{item.proTip}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Expand indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={darkColors.textSecondary} />
          <Text style={styles.expandIndicator}>{isExpanded ? ' Collapse' : ' Tap to expand'}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [expandedId, onReuse, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View entering={SlideInUp.springify()} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="time-outline" size={20} color={darkColors.text} />
              <Text style={styles.title}>Suggestion History</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtext}>Generated suggestions will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              renderItem={renderEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.lg,
  },
  list: {
    padding: spacing.md,
  },
  entry: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  entryHeader: {
    marginBottom: spacing.sm,
  },
  theirMessage: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  timestamp: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  interestLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginRight: spacing.sm,
  },
  interestBar: {
    flex: 1,
    height: 4,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  interestFill: {
    height: '100%',
    borderRadius: 2,
  },
  interestValue: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  suggestions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  suggestionItem: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  suggestionEmoji: {
    fontSize: fontSizes.sm,
    marginRight: spacing.xs,
  },
  suggestionType: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  suggestionText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  suggestionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  reuseBtn: {
    backgroundColor: darkColors.primary + '30',
    borderRadius: borderRadius.sm,
  },
  reuseText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  proTipItem: {
    backgroundColor: darkColors.primary + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  proTipLabel: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  proTipText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  expandIndicator: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});
