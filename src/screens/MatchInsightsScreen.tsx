/**
 * MatchInsightsScreen - Dating Analytics & Badges
 * Hour 4: Match Insights & Analytics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  InsightsData,
  WeeklyReport,
  Badge,
  loadInsights,
  calculateResponseRate,
  getResponseTypeBreakdown,
  getActiveHours,
  getConversationTrend,
  generateWeeklyReport,
  calculateBadges,
} from '../services/insightsService';
import { useStore } from '../stores/useStore';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 2;

// ==========================================
// Sub-components
// ==========================================

function StatCard({
  value,
  label,
  icon,
  color,
  delay = 0,
}: {
  value: string;
  label: string;
  icon: string;
  color: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function MiniBarChart({
  data,
  maxHeight = 80,
}: {
  data: { label: string; value: number }[];
  maxHeight?: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.barChart}>
      {data.map((item, i) => (
        <View key={item.label} style={styles.barColumn}>
          <View style={styles.barWrapper}>
            <Animated.View
              entering={FadeInDown.delay(i * 80)}
              style={[
                styles.bar,
                {
                  height: Math.max(4, (item.value / maxValue) * maxHeight),
                  backgroundColor: item.value === maxValue ? accentColors.coral : darkColors.border,
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function TypeBreakdownBar({
  data,
}: {
  data: { type: string; percentage: number; color: string }[];
}) {
  return (
    <View style={styles.breakdownContainer}>
      <View style={styles.breakdownBar}>
        {data.map((item) => (
          <Animated.View
            key={item.type}
            entering={FadeInRight.delay(200)}
            style={[
              styles.breakdownSegment,
              {
                flex: Math.max(item.percentage, 1),
                backgroundColor: item.color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.breakdownLegend}>
        {data.map((item) => (
          <View key={item.type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.type} {item.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <View
      style={[
        styles.badgeCard,
        badge.earned && { borderColor: badge.color + '44', backgroundColor: badge.color + '08' },
        !badge.earned && styles.badgeLocked,
      ]}
    >
      <Text style={[styles.badgeEmoji, !badge.earned && styles.badgeEmojiLocked]}>
        {badge.emoji}
      </Text>
      <Text style={[styles.badgeTitle, badge.earned && { color: badge.color }]} numberOfLines={1}>
        {badge.title}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {badge.description}
      </Text>
      {!badge.earned && (
        <View style={styles.badgeProgress}>
          <View style={styles.badgeProgressTrack}>
            <View
              style={[
                styles.badgeProgressFill,
                {
                  width: `${Math.min(100, (badge.currentProgress / badge.requirement) * 100)}%`,
                  backgroundColor: badge.color,
                },
              ]}
            />
          </View>
          <Text style={styles.badgeProgressText}>
            {badge.currentProgress}/{badge.requirement}
          </Text>
        </View>
      )}
      {badge.earned && (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={badge.color}
          style={styles.badgeCheckmark}
        />
      )}
    </View>
  );
}

function WeeklyReportCard({ report }: { report: WeeklyReport }) {
  return (
    <Animated.View entering={FadeInDown.delay(200)} style={styles.weeklyCard}>
      <View style={styles.weeklyHeader}>
        <Text style={styles.weeklyTitle}>📊 Weekly Report</Text>
        <View
          style={[
            styles.improvementBadge,
            {
              backgroundColor: report.improvement >= 0 ? '#2ED573' + '22' : '#FF4757' + '22',
            },
          ]}
        >
          <Ionicons
            name={report.improvement >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={report.improvement >= 0 ? '#2ED573' : '#FF4757'}
          />
          <Text
            style={[
              styles.improvementText,
              { color: report.improvement >= 0 ? '#2ED573' : '#FF4757' },
            ]}
          >
            {report.improvement >= 0 ? '+' : ''}
            {report.improvement}%
          </Text>
        </View>
      </View>

      <View style={styles.weeklyStats}>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{report.totalConversations}</Text>
          <Text style={styles.weeklyStatLabel}>Conversations</Text>
        </View>
        <View style={styles.weeklyDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{report.responseRate}%</Text>
          <Text style={styles.weeklyStatLabel}>Reply Rate</Text>
        </View>
        <View style={styles.weeklyDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{report.streakDays}🔥</Text>
          <Text style={styles.weeklyStatLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.weeklyDetails}>
        <View style={styles.weeklyDetailRow}>
          <Ionicons name="time-outline" size={16} color={darkColors.textTertiary} />
          <Text style={styles.weeklyDetailText}>Best time: {report.bestHour}:00</Text>
        </View>
        <View style={styles.weeklyDetailRow}>
          <Ionicons name="calendar-outline" size={16} color={darkColors.textTertiary} />
          <Text style={styles.weeklyDetailText}>Best day: {report.bestDay}</Text>
        </View>
        <View style={styles.weeklyDetailRow}>
          <Ionicons name="chatbubbles-outline" size={16} color={darkColors.textTertiary} />
          <Text style={styles.weeklyDetailText}>Avg messages: {report.avgMessagesPerConvo}</Text>
        </View>
        <View style={styles.weeklyDetailRow}>
          <Ionicons name="flame-outline" size={16} color={darkColors.textTertiary} />
          <Text style={styles.weeklyDetailText}>Top style: {report.topResponseType}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ==========================================
// Tab selector
// ==========================================

type TabKey = 'overview' | 'badges' | 'trends';

function TabBar({ selected, onSelect }: { selected: TabKey; onSelect: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'stats-chart' },
    { key: 'badges', label: 'Badges', icon: 'trophy' },
    { key: 'trends', label: 'Trends', icon: 'trending-up' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, selected === tab.key && styles.tabActive]}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(tab.key);
          }}
        >
          <Ionicons
            name={tab.icon as any}
            size={18}
            color={selected === tab.key ? accentColors.coral : darkColors.textTertiary}
          />
          <Text style={[styles.tabText, selected === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ==========================================
// Main Screen
// ==========================================

interface Props {
  navigation?: { goBack: () => void };
}

export function MatchInsightsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const conversationHistory = useStore((s) => s.conversationHistory);

  const loadData = useCallback(async () => {
    const data = await loadInsights();
    setInsights(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Generate sample data from conversation history if no records
  const records = useMemo(() => {
    if (insights && insights.records.length > 0) return insights.records;
    // Use conversation history as fallback
    return conversationHistory.map((ch) => ({
      id: ch.id,
      contactName: `Contact ${ch.contactId}`,
      startedAt: ch.timestamp,
      lastMessageAt: ch.timestamp,
      messagesSent: 1,
      gotReply: !!ch.selectedSuggestion,
      responseType: (ch.selectedSuggestion?.type || 'balanced') as 'safe' | 'balanced' | 'bold',
      hourOfDay: new Date(ch.timestamp).getHours(),
      dayOfWeek: new Date(ch.timestamp).getDay(),
    }));
  }, [insights, conversationHistory]);

  const responseRate = useMemo(() => calculateResponseRate(records), [records]);
  const typeBreakdown = useMemo(() => getResponseTypeBreakdown(records), [records]);
  const trend = useMemo(() => getConversationTrend(records), [records]);
  const weeklyReport = useMemo(
    () => generateWeeklyReport(records, insights?.streakDays || 0),
    [records, insights]
  );

  const badges = useMemo(() => {
    const boldCount = records.filter((r) => r.responseType === 'bold').length;
    const safeCount = records.filter((r) => r.responseType === 'safe').length;
    const balancedCount = records.filter((r) => r.responseType === 'balanced').length;
    return calculateBadges(
      records.length,
      records.filter((r) => r.gotReply).length,
      insights?.streakDays || 0,
      boldCount,
      safeCount,
      balancedCount
    );
  }, [records, insights]);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📈 Insights</Text>
        <View style={{ width: 40 }} />
      </View>

      <TabBar selected={activeTab} onSelect={setActiveTab} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColors.coral}
          />
        }
      >
        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <View style={styles.statGrid}>
              <StatCard
                value={`${records.length}`}
                label="Conversations"
                icon="💬"
                color="#FF6B6B"
                delay={100}
              />
              <StatCard
                value={`${responseRate}%`}
                label="Reply Rate"
                icon="📬"
                color="#2ED573"
                delay={200}
              />
              <StatCard
                value={`${insights?.streakDays || 0}`}
                label="Day Streak"
                icon="🔥"
                color="#FF8E53"
                delay={300}
              />
              <StatCard
                value={`${earnedBadges.length}`}
                label="Badges"
                icon="🏆"
                color="#FFD700"
                delay={400}
              />
            </View>

            {/* Weekly Report */}
            <WeeklyReportCard report={weeklyReport} />

            {/* Response Type Breakdown */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Response Style Mix</Text>
              <TypeBreakdownBar data={typeBreakdown} />
            </Animated.View>
          </>
        )}

        {/* ===== BADGES TAB ===== */}
        {activeTab === 'badges' && (
          <>
            {earnedBadges.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Earned ({earnedBadges.length})</Text>
                <View style={styles.badgeGrid}>
                  {earnedBadges.map((b) => (
                    <BadgeCard key={b.id} badge={b} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔒 Locked ({lockedBadges.length})</Text>
              <View style={styles.badgeGrid}>
                {lockedBadges.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </View>
            </View>
          </>
        )}

        {/* ===== TRENDS TAB ===== */}
        {activeTab === 'trends' && (
          <>
            {/* 7-day conversation trend */}
            <Animated.View entering={FadeInDown} style={styles.section}>
              <Text style={styles.sectionTitle}>📅 This Week</Text>
              <View style={styles.chartCard}>
                <MiniBarChart
                  data={trend.map((t) => ({
                    label: t.day,
                    value: t.count,
                  }))}
                />
              </View>
            </Animated.View>

            {/* Active Hours */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Most Active Hours</Text>
              <View style={styles.chartCard}>
                <MiniBarChart
                  data={getActiveHours(records)
                    .filter((_item, idx) => idx % 3 === 0)
                    .map((h) => ({
                      label: `${h.hour}h`,
                      value: h.count,
                    }))}
                  maxHeight={60}
                />
              </View>
            </Animated.View>

            {/* Fun summary */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Dating Stats Summary</Text>
              <Text style={styles.summaryText}>
                {records.length === 0
                  ? 'Start analyzing conversations to see your dating stats here! 📊'
                  : `You've had ${records.length} conversation${records.length !== 1 ? 's' : ''} with a ${responseRate}% reply rate. ${
                      responseRate >= 50
                        ? "You're doing great! 🔥"
                        : 'Keep practicing and your numbers will improve! 💪'
                    } Your most used style is ${weeklyReport.topResponseType.toLowerCase()}.`}
              </Text>
            </Animated.View>
          </>
        )}
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  tabActive: {
    backgroundColor: darkColors.background,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: darkColors.textTertiary,
    fontFamily: fonts.medium,
  },
  tabTextActive: {
    color: accentColors.coral,
  },
  // Stats
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    width: (CHART_WIDTH - spacing.sm) / 2,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderLeftWidth: 3,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    fontFamily: fonts.extraBold,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: spacing.sm,
    fontFamily: fonts.semiBold,
  },
  // Bar Chart
  chartCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    minWidth: 8,
    borderRadius: 4,
    alignSelf: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: darkColors.textTertiary,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  // Type Breakdown
  breakdownContainer: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    gap: 2,
  },
  breakdownSegment: {
    borderRadius: 6,
  },
  breakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  // Weekly Report
  weeklyCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weeklyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  improvementText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  weeklyStat: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: fonts.bold,
  },
  weeklyStatLabel: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  weeklyDivider: {
    width: 1,
    backgroundColor: darkColors.border,
  },
  weeklyDetails: {
    gap: 8,
  },
  weeklyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyDetailText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    width: (CHART_WIDTH - spacing.sm * 2) / 3,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    alignItems: 'center',
    minHeight: 110,
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: fonts.semiBold,
  },
  badgeDesc: {
    fontSize: 9,
    color: darkColors.textTertiary,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  badgeProgress: {
    width: '100%',
    marginTop: 6,
  },
  badgeProgressTrack: {
    height: 3,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 8,
    color: darkColors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  badgeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  // Summary
  summaryCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  summaryTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: spacing.sm,
    fontFamily: fonts.semiBold,
  },
  summaryText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
});
