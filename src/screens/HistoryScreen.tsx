/**
 * HistoryScreen — AI Reply History + Favorites
 *
 * Two tabs: All History | Favorites
 * Shows every AI-generated reply with screen type, timestamp, and star toggle.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useHistory } from '../hooks/useHistory';
import { CopyButton } from '../components/CopyButton';
import type { HistoryEntry, HistoryScreenType } from '../services/historyService';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { RootNavigationProp } from '../types/navigation';

// ==========================================
// Helpers
// ==========================================

const SCREEN_LABELS: Record<HistoryScreenType, { label: string; emoji: string; color: string }> = {
  chat_reply: { label: 'Chat Reply', emoji: '💬', color: accentColors.coral },
  bio: { label: 'Bio', emoji: '📝', color: '#A78BFA' },
  opener: { label: 'Opener', emoji: '👋', color: '#34D399' },
  quick_reply: { label: 'Quick Reply', emoji: '⚡', color: accentColors.gold },
  screenshot: { label: 'Screenshot', emoji: '📸', color: '#60A5FA' },
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ==========================================
// Component
// ==========================================

type Tab = 'all' | 'favorites';

export function HistoryScreen({ navigation }: { navigation: RootNavigationProp }) {
  const { history, favorites, toggleFavorite, remove, clear } = useHistory();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const data = activeTab === 'favorites' ? favorites : history;

  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      Alert.alert('Delete Entry', 'Remove this entry from history?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
              () => {}
            );
            await remove(id);
          },
        },
      ]);
    },
    [remove]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear History', 'Clear all history? Favorites can be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Keep Favorites',
        onPress: () => clear(true),
      },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => clear(false),
      },
    ]);
  }, [clear]);

  const renderItem = useCallback(
    ({ item, index }: { item: HistoryEntry; index: number }) => {
      const screenInfo = SCREEN_LABELS[item.screenType];
      return (
        <Animated.View entering={SlideInRight.delay(Math.min(index * 50, 300))}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, { backgroundColor: screenInfo.color + '20' }]}>
                <Text style={styles.typeBadgeText}>
                  {screenInfo.emoji} {screenInfo.label}
                </Text>
              </View>
              <Text style={styles.timestamp}>{formatRelativeTime(item.timestamp)}</Text>
            </View>

            {/* Input preview */}
            {item.input ? (
              <Text style={styles.inputPreview} numberOfLines={2}>
                <Text style={styles.inputLabel}>Input: </Text>
                {item.input}
              </Text>
            ) : null}

            {/* Output */}
            <Text style={styles.outputText} numberOfLines={4}>
              {item.output}
            </Text>

            {/* Meta tags */}
            {item.meta && Object.keys(item.meta).length > 0 && (
              <View style={styles.metaRow}>
                {Object.entries(item.meta).map(([key, value]) => (
                  <View key={key} style={styles.metaTag}>
                    <Text style={styles.metaTagText}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              <CopyButton text={item.output} size="sm" />
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionButton}
              >
                <Ionicons
                  name={item.isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={item.isFavorite ? accentColors.gold : darkColors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={18} color={darkColors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      );
    },
    [handleCopy, handleToggleFavorite, handleDelete]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>{activeTab === 'favorites' ? '⭐' : '📜'}</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'favorites' ? 'No favorites yet' : 'No history yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'favorites'
          ? 'Star any AI reply to save it here'
          : 'AI-generated replies will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({history.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons
            name="star"
            size={14}
            color={activeTab === 'favorites' ? accentColors.gold : darkColors.textTertiary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, data.length === 0 && styles.listEmpty]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  tabActive: {
    backgroundColor: accentColors.coral + '15',
    borderColor: accentColors.coral + '40',
  },
  tabText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  tabTextActive: {
    color: accentColors.coral,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: darkColors.text,
    fontFamily: fonts.semiBold,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    fontFamily: fonts.regular,
  },
  inputPreview: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  inputLabel: {
    fontWeight: '600',
    color: darkColors.textSecondary,
  },
  outputText: {
    fontSize: fontSizes.sm,
    color: darkColors.text,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  metaTag: {
    backgroundColor: darkColors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  metaTagText: {
    fontSize: 10,
    color: darkColors.textSecondary,
    fontFamily: fonts.medium,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  actionButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    fontFamily: fonts.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});

export default HistoryScreen;
