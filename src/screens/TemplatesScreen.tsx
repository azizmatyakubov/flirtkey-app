/**
 * TemplatesScreen - Smart Reply Template Library
 * Hour 3: Templates with categories, search, copy tracking
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  TEMPLATES,
  CATEGORIES,
  ReplyTemplate,
  TemplateCategory,
  CategoryInfo,
  TemplateStats,
  getTemplatesByCategory,
  searchTemplates,
  customizeTemplate,
  loadTemplateStats,
  recordTemplateCopy,
} from '../services/templateService';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

// ==========================================
// Sub-components
// ==========================================

function CategoryChip({
  info,
  selected,
  onPress,
}: {
  info: CategoryInfo;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selected && { backgroundColor: info.color + '22', borderColor: info.color },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryEmoji}>{info.emoji}</Text>
      <Text style={[styles.categoryLabel, selected && { color: info.color }]}>{info.label}</Text>
    </TouchableOpacity>
  );
}

function TemplateCard({
  template,
  stats,
  onCopy,
  onCustomize,
}: {
  template: ReplyTemplate;
  stats: TemplateStats | undefined;
  onCopy: (t: ReplyTemplate) => void;
  onCustomize: (t: ReplyTemplate) => void;
}) {
  const copyCount = stats?.copyCount || template.copyCount;
  const hasBlanks = template.blanks && template.blanks.length > 0;

  return (
    <Animated.View entering={FadeIn.delay(50)}>
      <View style={styles.templateCard}>
        <Text style={styles.templateText}>{template.text}</Text>

        <View style={styles.templateFooter}>
          <View style={styles.templateTags}>
            {template.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {copyCount > 0 && <Text style={styles.copyCountText}>📋 {copyCount}</Text>}
          </View>

          <View style={styles.templateActions}>
            {hasBlanks && (
              <TouchableOpacity style={styles.customizeBtn} onPress={() => onCustomize(template)}>
                <Ionicons name="create-outline" size={18} color={accentColors.coral} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => onCopy(template)}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color="#FFF" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ==========================================
// Sort Options
// ==========================================

type SortMode = 'default' | 'most_used';

// ==========================================
// Main Screen
// ==========================================

interface Props {
  navigation?: { goBack: () => void };
}

export function TemplatesScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [stats, setStats] = useState<TemplateStats[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplateStats().then(setStats);
  }, []);

  const filteredTemplates = useMemo(() => {
    let result: ReplyTemplate[];

    if (searchQuery.trim()) {
      result = searchTemplates(searchQuery);
    } else if (selectedCategory === 'all') {
      result = [...TEMPLATES];
    } else {
      result = getTemplatesByCategory(selectedCategory);
    }

    if (sortMode === 'most_used') {
      const statsMap = new Map(stats.map((s) => [s.templateId, s]));
      result = result.sort((a, b) => {
        const aCopies = statsMap.get(a.id)?.copyCount || 0;
        const bCopies = statsMap.get(b.id)?.copyCount || 0;
        return bCopies - aCopies;
      });
    }

    return result;
  }, [selectedCategory, searchQuery, sortMode, stats]);

  const statsMap = useMemo(() => new Map(stats.map((s) => [s.templateId, s])), [stats]);

  const handleCopy = useCallback(async (template: ReplyTemplate) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(template.text);
    await recordTemplateCopy(template.id);

    // Update local stats
    setStats((prev) => {
      const existing = prev.find((s) => s.templateId === template.id);
      if (existing) {
        return prev.map((s) =>
          s.templateId === template.id
            ? { ...s, copyCount: s.copyCount + 1, lastUsed: Date.now() }
            : s
        );
      }
      return [...prev, { templateId: template.id, copyCount: 1, lastUsed: Date.now() }];
    });

    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCustomize = useCallback((template: ReplyTemplate) => {
    if (!template.blanks || template.blanks.length === 0) return;

    const blank = template.blanks[0]!;
    const cleanLabel = blank.replace(/[{}]/g, '');

    Alert.prompt(
      'Customize Template',
      `Enter a value for "${cleanLabel}":`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async (value: string | undefined) => {
            if (value) {
              const customized = customizeTemplate(template, { [blank]: value });
              await Clipboard.setStringAsync(customized);
              await recordTemplateCopy(template.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ],
      'plain-text'
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Templates</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            Haptics.selectionAsync();
            setSortMode(sortMode === 'default' ? 'most_used' : 'default');
          }}
        >
          <Ionicons
            name={sortMode === 'most_used' ? 'trending-up' : 'list'}
            size={20}
            color={sortMode === 'most_used' ? accentColors.coral : darkColors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={darkColors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          placeholderTextColor={darkColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={darkColors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={[
          {
            key: 'all' as const,
            label: 'All',
            emoji: '✨',
            color: accentColors.coral,
            description: '',
          },
          ...CATEGORIES,
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <CategoryChip
            info={item as CategoryInfo}
            selected={selectedCategory === item.key}
            onPress={() => setSelectedCategory(item.key as TemplateCategory | 'all')}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryScroll}
      />

      {/* Sort indicator */}
      {sortMode === 'most_used' && (
        <View style={styles.sortIndicator}>
          <Ionicons name="trending-up" size={14} color={accentColors.coral} />
          <Text style={styles.sortIndicatorText}>Sorted by most used</Text>
        </View>
      )}

      {/* Copied toast */}
      {copiedId && (
        <Animated.View entering={SlideInUp.duration(200)} style={styles.copiedToast}>
          <Ionicons name="checkmark-circle" size={16} color="#2ED573" />
          <Text style={styles.copiedToastText}>Copied to clipboard!</Text>
        </Animated.View>
      )}

      {/* Templates List */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            stats={statsMap.get(item.id)}
            onCopy={handleCopy}
            onCustomize={handleCustomize}
          />
        )}
        contentContainerStyle={styles.templateList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No templates found</Text>
            <Text style={styles.emptyDesc}>Try a different search or category</Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </Text>
        }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: fonts.bold,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
  },
  // Categories
  categoryScroll: {
    maxHeight: 44,
    marginBottom: spacing.sm,
  },
  categoryList: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.medium,
  },
  // Sort
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  sortIndicatorText: {
    fontSize: fontSizes.xs,
    color: accentColors.coral,
    fontFamily: fonts.medium,
  },
  // Copied toast
  copiedToast: {
    position: 'absolute',
    top: 120,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2ED573' + '44',
    zIndex: 100,
  },
  copiedToastText: {
    color: '#2ED573',
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  // Templates
  templateList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    marginBottom: spacing.sm,
    fontFamily: fonts.regular,
  },
  templateCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  templateText: {
    fontSize: fontSizes.md,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: spacing.sm,
    fontFamily: fonts.regular,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: darkColors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 10,
    color: darkColors.textTertiary,
    fontFamily: fonts.regular,
  },
  copyCountText: {
    fontSize: 10,
    color: darkColors.textTertiary,
    fontFamily: fonts.regular,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customizeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: darkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: accentColors.coral,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  copyBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.semiBold,
  },
  emptyDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
});
