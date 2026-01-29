/**
 * AnalyticsScreen - Flirting Progress Dashboard
 * Phase 3, Task 2
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useStore } from '../stores/useStore';
import {
  getWeeklyStats,
  getFullAnalytics,
  type WeeklyStats,
  type FlirtAnalytics,
} from '../services/analyticsService';
import { analyzeAllConversations, type ConvoHealth } from '../services/conversationHealth';
import { TONES } from '../constants/tones';
import {
  darkColors,
  spacing,
  borderRadius,
  fontSizes,
  shadows,
  PREMIUM_COLORS,
  TYPOGRAPHY,
} from '../constants/theme';

// ==========================================
// Sub-components
// ==========================================

const StatCard = React.memo(function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const WeeklyBarChart = React.memo(function WeeklyBarChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>📅 This Week</Text>
      <View style={styles.barChart}>
        {data.map((day, i) => {
          const height = Math.max((day.count / maxVal) * 100, 4);
          return (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: day.count > 0 ? darkColors.primary : darkColors.border,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{day.label}</Text>
              {day.count > 0 && <Text style={styles.barCount}>{day.count}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const ConvoHealthList = React.memo(function ConvoHealthList({
  healthScores,
  contacts,
}: {
  healthScores: Record<number, ConvoHealth>;
  contacts: { id: number; name: string }[];
}) {
  if (contacts.length === 0) return null;

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'thriving':
        return '🟢';
      case 'cooling':
        return '🟡';
      case 'dying':
        return '🔴';
      case 'dead':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'thriving':
        return 'Thriving';
      case 'cooling':
        return 'Cooling';
      case 'dying':
        return 'Dying';
      case 'dead':
        return 'Dead';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💬 Response Rates</Text>
      {contacts.map((contact) => {
        const health = healthScores[contact.id];
        if (!health) return null;
        return (
          <View key={contact.id} style={styles.convoRow}>
            <Text style={styles.convoName}>{contact.name}</Text>
            <View style={styles.convoStatus}>
              <Text style={styles.convoStatusEmoji}>{getStatusEmoji(health.status)}</Text>
              <Text style={styles.convoStatusText}>{getStatusLabel(health.status)}</Text>
            </View>
            <View style={styles.convoScoreBar}>
              <View
                style={[
                  styles.convoScoreFill,
                  {
                    width: `${health.score}%`,
                    backgroundColor:
                      health.score >= 80
                        ? darkColors.success
                        : health.score >= 50
                          ? darkColors.warning
                          : darkColors.error,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
});

const ToneBreakdown = React.memo(function ToneBreakdown({
  tones,
}: {
  tones: { tone: string; count: number }[];
}) {
  if (tones.length === 0) return null;
  const total = tones.reduce((s, t) => s + t.count, 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Top Tones</Text>
      {tones.slice(0, 5).map((item, i) => {
        const toneConfig = TONES[item.tone as keyof typeof TONES];
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

        return (
          <View key={i} style={styles.toneRow}>
            <Text style={styles.toneEmoji}>{toneConfig?.emoji || '🎵'}</Text>
            <Text style={styles.toneName}>{toneConfig?.name || item.tone}</Text>
            <View style={styles.toneBarWrap}>
              <View style={[styles.toneBar, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.tonePct}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
});

// ==========================================
// Main Screen
// ==========================================

export function AnalyticsScreen({ navigation }: any) {
  const { contacts } = useStore();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [analytics, setAnalytics] = useState<FlirtAnalytics | null>(null);
  const [healthScores, setHealthScores] = useState<Record<number, ConvoHealth>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const activeContacts = contacts.length;
    const stats = await getWeeklyStats(activeContacts);
    const full = await getFullAnalytics();
    // Use getState() to avoid dependency on the function reference
    const getConvos = useStore.getState().getConversationsForContact;
    const scores = analyzeAllConversations(contacts, getConvos);

    setWeeklyStats(stats);
    setAnalytics(full);
    setHealthScores(scores);
  }, [contacts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Compute averages — memoized
  const avgHealth = useMemo(() => {
    const vals = Object.values(healthScores);
    return vals.length > 0 ? Math.round(vals.reduce((s, h) => s + h.score, 0) / vals.length) : 0;
  }, [healthScores]);

  const topToneName = useMemo(() => {
    return weeklyStats?.topTone
      ? TONES[weeklyStats.topTone as keyof typeof TONES]?.name || weeklyStats.topTone
      : '—';
  }, [weeklyStats?.topTone]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkColors.primary}
          />
        }
      >
        {/* Empty State for new users */}
        {(!analytics || (analytics.suggestionsGenerated === 0 && contacts.length === 0)) && (
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📊</Text>
            <Text style={styles.emptyStateTitle}>No analytics yet</Text>
            <Text style={styles.emptyStateText}>
              Start chatting to see your stats here! 📊{'\n'}
              Generate suggestions, track your progress, and level up your dating game.
            </Text>
          </Animated.View>
        )}

        {/* Stat Cards */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.statsRow}>
          <StatCard icon="💬" label="Active Convos" value={String(contacts.length)} />
          <StatCard
            icon="✨"
            label="This Week"
            value={String(weeklyStats?.totalSuggestions || 0)}
          />
          <StatCard icon="💖" label="Avg Health" value={`${avgHealth}%`} />
          <StatCard icon="🎯" label="Best Tone" value={topToneName} />
        </Animated.View>

        {/* Hot Streak */}
        {weeklyStats && weeklyStats.streak > 0 && (
          <Animated.View entering={SlideInDown.delay(200)} style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>{weeklyStats.streak} Day Hot Streak!</Text>
              <Text style={styles.streakSubtitle}>Keep chatting to keep your streak alive</Text>
            </View>
          </Animated.View>
        )}

        {/* Weekly Chart */}
        {weeklyStats && (
          <Animated.View entering={FadeIn.delay(300)}>
            <WeeklyBarChart data={weeklyStats.dailyBreakdown} />
          </Animated.View>
        )}

        {/* Convo Health */}
        <Animated.View entering={FadeIn.delay(400)}>
          <ConvoHealthList healthScores={healthScores} contacts={contacts} />
        </Animated.View>

        {/* Tone Breakdown */}
        {weeklyStats && weeklyStats.toneBreakdown.length > 0 && (
          <Animated.View entering={FadeIn.delay(500)}>
            <ToneBreakdown tones={weeklyStats.toneBreakdown} />
          </Animated.View>
        )}

        {/* Weekly Summary */}
        {weeklyStats && (
          <Animated.View entering={FadeIn.delay(600)} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📝 Weekly Summary</Text>
            <Text style={styles.summaryText}>
              You had {contacts.length} conversation{contacts.length !== 1 ? 's' : ''} this week.{' '}
              {Object.values(healthScores).filter((h) => h.status !== 'dying').length} are still
              active.{' '}
              {weeklyStats.topTone
                ? `Your most successful tone was ${topToneName}.`
                : 'Try generating some suggestions to see your top tone!'}
            </Text>
          </Animated.View>
        )}

        {/* Quick Stats */}
        {analytics && (
          <Animated.View entering={FadeIn.delay(700)} style={styles.section}>
            <Text style={styles.sectionTitle}>📈 All Time</Text>
            <View style={styles.allTimeGrid}>
              <View style={styles.allTimeItem}>
                <Text style={styles.allTimeValue}>{analytics.suggestionsGenerated}</Text>
                <Text style={styles.allTimeLabel}>Generated</Text>
              </View>
              <View style={styles.allTimeItem}>
                <Text style={styles.allTimeValue}>{analytics.suggestionsCopied}</Text>
                <Text style={styles.allTimeLabel}>Copied</Text>
              </View>
              <View style={styles.allTimeItem}>
                <Text style={styles.allTimeValue}>{analytics.biosGenerated}</Text>
                <Text style={styles.allTimeLabel}>Bios</Text>
              </View>
              <View style={styles.allTimeItem}>
                <Text style={styles.allTimeValue}>{analytics.openersSent}</Text>
                <Text style={styles.allTimeLabel}>Openers</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: darkColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  backButton: {
    color: darkColors.primary,
    ...TYPOGRAPHY.body,
  },
  headerTitle: {
    color: darkColors.text,
    ...TYPOGRAPHY.h2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: darkColors.text,
    ...TYPOGRAPHY.h2,
  },
  statLabel: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    marginTop: 4,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PREMIUM_COLORS.gold + '12',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: PREMIUM_COLORS.gold + '30',
    gap: spacing.md,
    ...shadows.sm,
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakTitle: {
    color: PREMIUM_COLORS.gold,
    ...TYPOGRAPHY.bodyBold,
  },
  streakSubtitle: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    marginTop: 2,
  },

  // Chart
  chartContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: darkColors.text,
    ...TYPOGRAPHY.bodyBold,
    marginBottom: spacing.sm,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    marginTop: spacing.xs,
  },
  barCount: {
    color: darkColors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },

  // Convo Health
  convoRow: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.sm,
  },
  convoName: {
    color: darkColors.text,
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  convoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  convoStatusEmoji: {
    fontSize: 14,
  },
  convoStatusText: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
  },
  convoScoreBar: {
    height: 5,
    backgroundColor: darkColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  convoScoreFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Tone Breakdown
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  toneEmoji: {
    fontSize: 18,
  },
  toneName: {
    color: darkColors.text,
    ...TYPOGRAPHY.caption,
    width: 75,
  },
  toneBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: darkColors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  toneBar: {
    height: '100%',
    backgroundColor: darkColors.primary,
    borderRadius: 4,
  },
  tonePct: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    width: 38,
    textAlign: 'right',
  },

  // Summary
  summaryCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryTitle: {
    color: darkColors.text,
    ...TYPOGRAPHY.bodyBold,
    marginBottom: spacing.sm,
  },
  summaryText: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.caption,
    lineHeight: 22,
  },

  // All Time
  allTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allTimeItem: {
    flex: 1,
    minWidth: '20%',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.sm,
  },
  allTimeValue: {
    color: darkColors.primary,
    ...TYPOGRAPHY.h2,
  },
  allTimeLabel: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    marginTop: spacing.xs,
  },
});

export default AnalyticsScreen;
