// 6.2.10 Swipe between suggestions
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Suggestion } from '../types';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_SPACING = spacing.md;

const SUGGESTION_COLORS = {
  safe: { bg: '#22c55e20', border: '#22c55e', emoji: '🟢', label: 'SAFE' },
  balanced: { bg: '#f59e0b20', border: '#f59e0b', emoji: '🟡', label: 'BALANCED' },
  bold: { bg: '#ef444420', border: '#ef4444', emoji: '🔴', label: 'BOLD' },
};

interface SwipeableSuggestionsProps {
  suggestions: Suggestion[];
  onCopy?: (suggestion: Suggestion) => void;
  onFavorite?: (suggestion: Suggestion) => void;
  onEdit?: (suggestion: Suggestion) => void;
  onRegenerate?: (type: Suggestion['type']) => void;
  onShare?: (suggestion: Suggestion) => void;
  favorites?: string[];
}

export function SwipeableSuggestions({
  suggestions,
  onCopy,
  onFavorite,
  onEdit,
  onRegenerate,
  onShare,
  favorites = [],
}: SwipeableSuggestionsProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleCopy = async (suggestion: Suggestion) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(suggestion.text);
    Alert.alert('Copied! 📋', 'Paste it in your chat');
    onCopy?.(suggestion);
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== activeIndex && index >= 0 && index < suggestions.length) {
      setActiveIndex(index);
      Haptics.selectionAsync();
    }
  };

  const renderSuggestion = ({ item, index }: { item: Suggestion; index: number }) => {
    const colors = SUGGESTION_COLORS[item.type];
    const isFavorite = favorites.includes(item.text);

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>{colors.emoji}</Text>
            <Text style={[styles.type, { color: colors.border }]}>{colors.label}</Text>
            <Text style={styles.counter}>
              {index + 1}/{suggestions.length}
            </Text>
          </View>

          {/* Text */}
          <Text style={styles.text}>{item.text}</Text>

          {/* Reason */}
          <Text style={styles.reason}>{item.reason}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleCopy(item)}
              style={[styles.actionButton, styles.copyButton]}
            >
              <Text style={styles.copyText}>📋 Copy</Text>
            </TouchableOpacity>

            {onFavorite && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onFavorite(item);
                }}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            )}

            {onEdit && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEdit(item);
                }}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>✏️</Text>
              </TouchableOpacity>
            )}

            {onShare && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onShare(item);
                }}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>📤</Text>
              </TouchableOpacity>
            )}

            {onRegenerate && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRegenerate(item.type);
                }}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>🔄</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {suggestions.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
              setActiveIndex(index);
            }}
          >
            <View style={[styles.dot, index === activeIndex && styles.activeDot]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>← Swipe to see more →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    minHeight: 200,
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
    flex: 1,
  },
  counter: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  text: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
    flex: 1,
  },
  reason: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  copyText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  iconButton: {
    padding: spacing.sm,
  },
  iconText: {
    fontSize: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.border,
  },
  activeDot: {
    backgroundColor: darkColors.primary,
    width: 24,
  },
  swipeHint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
