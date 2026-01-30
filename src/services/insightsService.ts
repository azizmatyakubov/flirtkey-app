/**
 * Match Insights & Analytics Service
 * Hour 4: Dating stats, badges, progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface ConversationRecord {
  id: string;
  contactName: string;
  startedAt: number;
  lastMessageAt: number;
  messagesSent: number;
  gotReply: boolean;
  responseType: 'safe' | 'balanced' | 'bold';
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sun-Sat)
}

export interface WeeklyReport {
  weekStart: number;
  weekEnd: number;
  totalConversations: number;
  responseRate: number; // 0-100
  avgMessagesPerConvo: number;
  topResponseType: string;
  bestHour: number;
  bestDay: string;
  streakDays: number;
  improvement: number; // % change from last week
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  requirement: number;
  currentProgress: number;
  earned: boolean;
  earnedAt?: number;
  category: 'conversations' | 'streaks' | 'milestones' | 'skills';
}

export interface InsightsData {
  records: ConversationRecord[];
  badges: Badge[];
  streakDays: number;
  lastActiveDate: string;
  totalConversations: number;
  totalReplies: number;
}

// ==========================================
// Badges Definition
// ==========================================

export const BADGE_DEFINITIONS: Omit<Badge, 'currentProgress' | 'earned' | 'earnedAt'>[] = [
  // Conversations
  {
    id: 'conv_1',
    title: 'Ice Breaker',
    description: 'Start your first conversation',
    emoji: '🧊',
    color: '#64B5F6',
    requirement: 1,
    category: 'conversations',
  },
  {
    id: 'conv_5',
    title: 'Social Butterfly',
    description: 'Start 5 conversations',
    emoji: '🦋',
    color: '#BA68C8',
    requirement: 5,
    category: 'conversations',
  },
  {
    id: 'conv_10',
    title: 'Smooth Operator',
    description: 'Start 10 conversations',
    emoji: '😎',
    color: '#FF8E53',
    requirement: 10,
    category: 'conversations',
  },
  {
    id: 'conv_25',
    title: 'Conversation King',
    description: 'Start 25 conversations',
    emoji: '👑',
    color: '#FFD700',
    requirement: 25,
    category: 'conversations',
  },
  {
    id: 'conv_50',
    title: 'Dating Legend',
    description: 'Start 50 conversations',
    emoji: '🏆',
    color: '#FF6B6B',
    requirement: 50,
    category: 'conversations',
  },
  {
    id: 'conv_100',
    title: 'Rizz Master',
    description: 'Start 100 conversations',
    emoji: '💎',
    color: '#A855F7',
    requirement: 100,
    category: 'conversations',
  },

  // Streaks
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: '3-day usage streak',
    emoji: '🔥',
    color: '#FF6B6B',
    requirement: 3,
    category: 'streaks',
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: '7-day usage streak',
    emoji: '🔥',
    color: '#FF4757',
    requirement: 7,
    category: 'streaks',
  },
  {
    id: 'streak_14',
    title: 'Dedicated',
    description: '14-day usage streak',
    emoji: '💪',
    color: '#2ED573',
    requirement: 14,
    category: 'streaks',
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: '30-day usage streak',
    emoji: '⚡',
    color: '#FFD700',
    requirement: 30,
    category: 'streaks',
  },

  // Milestones
  {
    id: 'reply_1',
    title: 'First Reply',
    description: 'Get your first reply',
    emoji: '💌',
    color: '#FF69B4',
    requirement: 1,
    category: 'milestones',
  },
  {
    id: 'reply_10',
    title: 'Reply Magnet',
    description: 'Get 10 replies',
    emoji: '🧲',
    color: '#FF8E53',
    requirement: 10,
    category: 'milestones',
  },
  {
    id: 'reply_50',
    title: 'Irresistible',
    description: 'Get 50 replies',
    emoji: '💘',
    color: '#FF6B6B',
    requirement: 50,
    category: 'milestones',
  },

  // Skills
  {
    id: 'bold_5',
    title: 'Bold Move',
    description: 'Use 5 bold suggestions',
    emoji: '🎲',
    color: '#FF4757',
    requirement: 5,
    category: 'skills',
  },
  {
    id: 'safe_5',
    title: 'Playing Safe',
    description: 'Use 5 safe suggestions',
    emoji: '🛡️',
    color: '#2ED573',
    requirement: 5,
    category: 'skills',
  },
  {
    id: 'balanced_10',
    title: 'Balanced Approach',
    description: 'Use 10 balanced suggestions',
    emoji: '⚖️',
    color: '#FFBE76',
    requirement: 10,
    category: 'skills',
  },
];

// ==========================================
// Analytics Calculations
// ==========================================

export function calculateResponseRate(records: ConversationRecord[]): number {
  if (records.length === 0) return 0;
  const replied = records.filter((r) => r.gotReply).length;
  return Math.round((replied / records.length) * 100);
}

export function getResponseTypeBreakdown(records: ConversationRecord[]): {
  type: string;
  count: number;
  percentage: number;
  color: string;
}[] {
  const total = records.length || 1;
  const types = [
    { type: 'Safe', key: 'safe', color: '#2ED573' },
    { type: 'Balanced', key: 'balanced', color: '#FFBE76' },
    { type: 'Bold', key: 'bold', color: '#FF4757' },
  ];

  return types.map((t) => {
    const count = records.filter((r) => r.responseType === t.key).length;
    return {
      type: t.type,
      count,
      percentage: Math.round((count / total) * 100),
      color: t.color,
    };
  });
}

export function getActiveHours(records: ConversationRecord[]): {
  hour: number;
  label: string;
  count: number;
}[] {
  const hourCounts = new Array(24).fill(0);
  records.forEach((r) => {
    hourCounts[r.hourOfDay]++;
  });

  return hourCounts.map((count, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }));
}

export function getBestHour(records: ConversationRecord[]): { hour: number; label: string } {
  const hours = getActiveHours(records);
  const best = hours.reduce((a, b) => (a.count > b.count ? a : b), hours[0]!);
  return { hour: best.hour, label: best.label };
}

export function getConversationTrend(records: ConversationRecord[]): {
  day: string;
  count: number;
}[] {
  const last7Days: { day: string; count: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString(undefined, { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];

    const count = records.filter((r) => {
      const rDate = new Date(r.startedAt).toISOString().split('T')[0];
      return rDate === dateStr;
    }).length;

    last7Days.push({ day: dayStr, count });
  }

  return last7Days;
}

export function generateWeeklyReport(
  records: ConversationRecord[],
  streakDays: number
): WeeklyReport {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeek = records.filter((r) => r.startedAt >= weekAgo);
  const lastWeek = records.filter((r) => r.startedAt >= twoWeeksAgo && r.startedAt < weekAgo);

  const responseRate = calculateResponseRate(thisWeek);
  const lastWeekRate = calculateResponseRate(lastWeek);
  const improvement = lastWeekRate > 0 ? responseRate - lastWeekRate : 0;

  const typeBreakdown = getResponseTypeBreakdown(thisWeek);
  const topType = typeBreakdown.reduce((a, b) => (a.count > b.count ? a : b), typeBreakdown[0]!);

  const bestHourResult = getBestHour(thisWeek);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);
  thisWeek.forEach((r) => dayCounts[r.dayOfWeek]++);
  const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));

  const avgMessages =
    thisWeek.length > 0
      ? Math.round(thisWeek.reduce((sum, r) => sum + r.messagesSent, 0) / thisWeek.length)
      : 0;

  return {
    weekStart: weekAgo,
    weekEnd: now,
    totalConversations: thisWeek.length,
    responseRate,
    avgMessagesPerConvo: avgMessages,
    topResponseType: topType.type,
    bestHour: bestHourResult.hour,
    bestDay: dayNames[bestDayIdx] || 'N/A',
    streakDays,
    improvement,
  };
}

// ==========================================
// Badge Calculation
// ==========================================

export function calculateBadges(
  totalConversations: number,
  totalReplies: number,
  streakDays: number,
  boldCount: number,
  safeCount: number,
  balancedCount: number
): Badge[] {
  return BADGE_DEFINITIONS.map((def) => {
    let currentProgress = 0;

    switch (def.category) {
      case 'conversations':
        currentProgress = totalConversations;
        break;
      case 'streaks':
        currentProgress = streakDays;
        break;
      case 'milestones':
        currentProgress = totalReplies;
        break;
      case 'skills':
        if (def.id.startsWith('bold')) currentProgress = boldCount;
        else if (def.id.startsWith('safe')) currentProgress = safeCount;
        else if (def.id.startsWith('balanced')) currentProgress = balancedCount;
        break;
    }

    return {
      ...def,
      currentProgress,
      earned: currentProgress >= def.requirement,
      earnedAt: currentProgress >= def.requirement ? Date.now() : undefined,
    };
  });
}

// ==========================================
// Persistence
// ==========================================

const INSIGHTS_KEY = 'flirtkey_insights';

export async function saveInsights(data: InsightsData): Promise<void> {
  await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(data));
}

export async function loadInsights(): Promise<InsightsData> {
  const raw = await AsyncStorage.getItem(INSIGHTS_KEY);
  if (raw) return JSON.parse(raw);
  return {
    records: [],
    badges: [],
    streakDays: 0,
    lastActiveDate: '',
    totalConversations: 0,
    totalReplies: 0,
  };
}

export async function addConversationRecord(record: Omit<ConversationRecord, 'id'>): Promise<void> {
  const data = await loadInsights();
  const newRecord: ConversationRecord = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  };
  data.records.push(newRecord);
  data.totalConversations++;
  if (record.gotReply) data.totalReplies++;

  // Update streak
  const today = new Date().toISOString().split('T')[0]!;
  if (data.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    data.streakDays = data.lastActiveDate === yesterday ? data.streakDays + 1 : 1;
    data.lastActiveDate = today;
  }

  await saveInsights(data);
}
