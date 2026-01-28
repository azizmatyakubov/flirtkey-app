import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  gap?: number;
}

// ==========================================
// Base Skeleton Component
// ==========================================

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useTheme();
  const { accessibility } = useSettingsStore();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (accessibility.reduceMotion) return;

    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [accessibility.reduceMotion]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      {!accessibility.reduceMotion && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        />
      )}
    </View>
  );
}

// ==========================================
// Preset Skeletons
// ==========================================

export function SkeletonText({
  lines = 1,
  width = '100%',
}: {
  lines?: number;
  width?: DimensionValue;
}) {
  const widths: DimensionValue[] = Array(lines)
    .fill(0)
    .map((_, i) => (i === lines - 1 && lines > 1 ? '60%' : width));

  return (
    <View style={styles.textContainer}>
      {widths.map((w, i) => (
        <Skeleton key={i} width={w} height={14} style={i > 0 ? { marginTop: 8 } : undefined} />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonButton({ width = 120, height = 44 }: { width?: number; height?: number }) {
  return <Skeleton width={width} height={height} borderRadius={12} />;
}

export function SkeletonCard({ height = 120 }: { height?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Skeleton height={height - 32} />
    </View>
  );
}

// ==========================================
// Screen Skeletons
// ==========================================

export function GirlListSkeleton({ count = 3 }: SkeletonListProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.listContainer}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <View
            key={i}
            style={[
              styles.girlCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <SkeletonAvatar size={56} />
            <View style={styles.girlInfo}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
            </View>
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        ))}
    </View>
  );
}

export function ChatSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.chatContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface }]}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <View style={styles.chatHeaderInfo}>
          <SkeletonAvatar size={40} />
          <View style={{ marginLeft: 12 }}>
            <Skeleton width={100} height={16} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Messages area */}
      <View style={styles.chatMessages}>
        <View style={styles.messagePlaceholder}>
          <Skeleton width={200} height={60} borderRadius={16} />
        </View>
        <View style={[styles.messagePlaceholder, { alignSelf: 'flex-end' }]}>
          <Skeleton width={180} height={50} borderRadius={16} />
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.suggestionsArea}>
        <SuggestionSkeleton />
        <SuggestionSkeleton />
        <SuggestionSkeleton />
      </View>

      {/* Input area */}
      <View style={[styles.inputArea, { backgroundColor: theme.colors.surface }]}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton height={44} style={{ flex: 1, marginHorizontal: 12 }} borderRadius={22} />
        <Skeleton width={70} height={44} borderRadius={12} />
      </View>
    </View>
  );
}

export function SuggestionSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.suggestionCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.suggestionHeader}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <SkeletonText lines={2} />
      <View style={styles.suggestionFooter}>
        <Skeleton width={40} height={14} />
        <Skeleton width={60} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.profileHeader, { backgroundColor: theme.colors.surface }]}>
        <SkeletonAvatar size={80} />
        <Skeleton width={150} height={24} style={{ marginTop: 16 }} />
        <Skeleton width={100} height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Fields */}
      <View style={styles.profileFields}>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <View key={i} style={styles.profileField}>
              <Skeleton width={80} height={14} />
              <Skeleton height={44} style={{ marginTop: 8 }} />
            </View>
          ))}
      </View>
    </View>
  );
}

export function ScreenshotAnalysisSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.analysisContainer, { backgroundColor: theme.colors.background }]}>
      {/* Image placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
        <Skeleton width="100%" height={200} />
      </View>

      {/* Analysis results */}
      <View style={styles.analysisResults}>
        <Skeleton width={150} height={20} style={{ marginBottom: 16 }} />

        {/* Interest level */}
        <View style={styles.interestSection}>
          <Skeleton width={100} height={14} />
          <Skeleton height={8} style={{ marginTop: 8 }} borderRadius={4} />
        </View>

        {/* Key points */}
        <View style={styles.keyPointsSection}>
          <Skeleton width={120} height={16} style={{ marginBottom: 12 }} />
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <View key={i} style={styles.keyPoint}>
                <Skeleton width={8} height={8} borderRadius={4} />
                <Skeleton width="80%" height={14} style={{ marginLeft: 8 }} />
              </View>
            ))}
        </View>

        {/* Suggestions */}
        <SuggestionSkeleton />
      </View>
    </View>
  );
}

export function SettingsSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.settingsContainer, { backgroundColor: theme.colors.background }]}>
      {/* Sections */}
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <View
            key={i}
            style={[
              styles.settingsSection,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingsSectionHeader}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={120} height={18} style={{ marginLeft: 12 }} />
            </View>
          </View>
        ))}
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  textContainer: {
    width: '100%',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  girlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  girlInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  chatMessages: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  messagePlaceholder: {
    maxWidth: '80%',
  },
  suggestionsArea: {
    padding: 16,
    gap: 12,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 80,
  },
  profileFields: {
    padding: 16,
    gap: 16,
  },
  profileField: {},
  analysisContainer: {
    flex: 1,
  },
  imagePlaceholder: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analysisResults: {
    padding: 16,
  },
  interestSection: {
    marginBottom: 20,
  },
  keyPointsSection: {
    marginBottom: 20,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 80,
    gap: 8,
  },
  settingsSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
