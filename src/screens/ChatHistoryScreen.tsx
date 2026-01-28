/**
 * ChatHistoryScreen — Beautiful chat timeline
 * Displays conversation history like iMessage/WhatsApp
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../stores/useStore';
import { darkColors, accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatHistory'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

// ==========================================
// Date Helpers
// ==========================================

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) return 'Today';
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

// ==========================================
// Sub-Components
// ==========================================

function DateSeparator({ label }: { label: string }) {
  return (
    <Animated.View entering={FadeIn.delay(100)} style={styles.dateSeparator}>
      <View style={styles.datePill}>
        <Text style={styles.dateText}>{label}</Text>
      </View>
    </Animated.View>
  );
}

function HerBubble({ text, time, index }: { text: string; time: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInLeft.delay(index * 80).duration(400)}
      style={styles.herBubbleContainer}
    >
      <View style={styles.herBubble}>
        <Text style={styles.herBubbleText}>{text}</Text>
      </View>
      <Text style={styles.timestamp}>{time}</Text>
    </Animated.View>
  );
}

function YourBubble({ text, time, index }: { text: string; time: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80 + 100).duration(400)}
      style={styles.yourBubbleContainer}
    >
      <LinearGradient
        colors={[accentColors.rose, accentColors.coral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.yourBubble}
      >
        <Text style={styles.yourBubbleText}>{text}</Text>
      </LinearGradient>
      <Text style={[styles.timestamp, styles.timestampRight]}>{time}</Text>
    </Animated.View>
  );
}

function NoReplyIndicator({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 80 + 100).duration(300)}
      style={styles.noReplyContainer}
    >
      <View style={styles.noReplyPill}>
        <Ionicons name="ellipsis-horizontal" size={14} color={darkColors.textTertiary} />
        <Text style={styles.noReplyText}>No reply chosen</Text>
      </View>
    </Animated.View>
  );
}

function InterestIndicator({ level, index }: { level: number; index: number }) {
  const getColor = (l: number) => {
    if (l >= 7) return darkColors.success;
    if (l >= 4) return darkColors.warning;
    return darkColors.error;
  };

  const getEmoji = (l: number) => {
    if (l >= 8) return '🔥';
    if (l >= 6) return '😊';
    if (l >= 4) return '😐';
    return '😬';
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 80 + 50).duration(300)}
      style={styles.interestContainer}
    >
      <View style={[styles.interestPill, { borderColor: getColor(level) + '40' }]}>
        <Text style={styles.interestEmoji}>{getEmoji(level)}</Text>
        <Text style={[styles.interestText, { color: getColor(level) }]}>
          Interest: {level}/10
        </Text>
      </View>
    </Animated.View>
  );
}

function ProTipIndicator({ tip, index }: { tip: string; index: number }) {
  return (
    <Animated.View
      entering={SlideInUp.delay(index * 80 + 50).duration(400)}
      style={styles.proTipContainer}
    >
      <View style={styles.proTipCard}>
        <View style={styles.proTipHeader}>
          <Ionicons name="bulb" size={14} color={accentColors.gold} />
          <Text style={styles.proTipLabel}>Pro Tip</Text>
        </View>
        <Text style={styles.proTipText}>{tip}</Text>
      </View>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
      <LinearGradient
        colors={[accentColors.gradientStart + '20', accentColors.gradientEnd + '20']}
        style={styles.emptyIcon}
      >
        <Ionicons name="chatbubbles-outline" size={48} color={accentColors.rose} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No conversation history yet</Text>
      <Text style={styles.emptySubtitle}>
        Start by getting suggestions!{'\n'}Your chat timeline will appear here.
      </Text>
    </Animated.View>
  );
}

// ==========================================
// Main Screen
// ==========================================

export function ChatHistoryScreen({ navigation, route }: Props) {
  const { girlId } = route.params;
  const { girls, getConversationsForGirl } = useStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const girl = girls.find((g) => g.id === girlId);
  const conversations = useMemo(() => {
    return getConversationsForGirl(girlId).sort((a, b) => a.timestamp - b.timestamp);
  }, [girlId, getConversationsForGirl]);

  // Auto-scroll to bottom on mount
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 500);
  }, []);

  if (!girl) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Girl not found</Text>
      </View>
    );
  }

  // Build timeline items with date separators
  const renderTimeline = () => {
    if (conversations.length === 0) {
      return <EmptyState />;
    }

    const items: React.ReactNode[] = [];
    let lastDate: number | null = null;
    let itemIndex = 0;

    conversations.forEach((entry) => {
      // Date separator
      if (!lastDate || !isSameDay(lastDate, entry.timestamp)) {
        items.push(
          <DateSeparator key={`date-${entry.id}`} label={getDateLabel(entry.timestamp)} />
        );
        lastDate = entry.timestamp;
      }

      // Her message (left side)
      items.push(
        <HerBubble
          key={`her-${entry.id}`}
          text={entry.herMessage}
          time={formatTime(entry.timestamp)}
          index={itemIndex++}
        />
      );

      // Interest level indicator
      if (entry.interestLevel) {
        items.push(
          <InterestIndicator
            key={`interest-${entry.id}`}
            level={entry.interestLevel}
            index={itemIndex++}
          />
        );
      }

      // Pro tip
      if (entry.proTip) {
        items.push(
          <ProTipIndicator
            key={`tip-${entry.id}`}
            tip={entry.proTip}
            index={itemIndex++}
          />
        );
      }

      // Your chosen reply (right side) or "no reply chosen"
      if (entry.selectedSuggestion) {
        items.push(
          <YourBubble
            key={`your-${entry.id}`}
            text={entry.selectedSuggestion.text}
            time={formatTime(entry.timestamp)}
            index={itemIndex++}
          />
        );
      } else {
        items.push(
          <NoReplyIndicator key={`noreply-${entry.id}`} index={itemIndex++} />
        );
      }
    });

    return items;
  };

  // Get initials for avatar
  const initials = girl.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {girl.avatar ? (
            <Animated.Image
              entering={FadeIn}
              source={{ uri: girl.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <LinearGradient
              colors={['#ffffff30', '#ffffff15']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{girl.name}</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} exchange{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Chat Timeline */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.timeline}
        contentContainerStyle={styles.timelineContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTimeline()}
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

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
  headerAvatar: {
    marginLeft: spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  headerInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '800',
    fontFamily: fonts.extraBold,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    marginTop: 1,
  },

  // Timeline
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingVertical: spacing.lg,
  },

  // Date separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  datePill: {
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  dateText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },

  // Her bubble (left)
  herBubbleContainer: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  herBubble: {
    backgroundColor: darkColors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  herBubbleText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },

  // Your bubble (right)
  yourBubbleContainer: {
    alignSelf: 'flex-end',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  yourBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  yourBubbleText: {
    color: '#fff',
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },

  // Timestamps
  timestamp: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs - 1,
    fontFamily: fonts.regular,
    marginTop: 3,
    marginLeft: 4,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },

  // No reply indicator
  noReplyContainer: {
    alignSelf: 'flex-end',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  noReplyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
    opacity: 0.6,
  },
  noReplyText: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
  },

  // Interest level indicator
  interestContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  interestEmoji: {
    fontSize: 12,
  },
  interestText: {
    fontSize: fontSizes.xs - 1,
    fontFamily: fonts.medium,
  },

  // Pro tip
  proTipContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  proTipCard: {
    backgroundColor: accentColors.gold + '10',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: accentColors.gold + '20',
    width: '100%',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  proTipLabel: {
    color: accentColors.gold,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },
  proTipText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
