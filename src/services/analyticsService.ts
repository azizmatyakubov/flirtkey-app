/**
 * Analytics Service - Flirting Progress Tracking
 * Phase 3, Task 2
 *
 * Local-first analytics stored in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface FlirtAnalytics {
  suggestionsGenerated: number;
  suggestionsCopied: number;
  suggestionsEdited: number;
  toneUsage: Record<string, number>; // tone -> count
  dailyUsage: Record<string, number>; // YYYY-MM-DD -> count
  conversationHealthHistory: Record<string, number[]>; // contactId -> health scores over time
  openersSent: number;
  biosGenerated: number;
  gifsUsed: number;
  streak: number;
  lastActiveDate: string;
}

export interface WeeklyStats {
  totalSuggestions: number;
  dailyBreakdown: { day: string; count: number; label: string }[];
  topTone: string | null;
  toneBreakdown: { tone: string; count: number }[];
  activeConversations: number;
  streak: number;
}

// ==========================================
// Constants
// ==========================================

const ANALYTICS_KEY = 'flirtkey_analytics';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ==========================================
// Storage
// ==========================================

function getDefaultAnalytics(): FlirtAnalytics {
  return {
    suggestionsGenerated: 0,
    suggestionsCopied: 0,
    suggestionsEdited: 0,
    toneUsage: {},
    dailyUsage: {},
    conversationHealthHistory: {},
    openersSent: 0,
    biosGenerated: 0,
    gifsUsed: 0,
    streak: 0,
    lastActiveDate: '',
  };
}

async function loadAnalytics(): Promise<FlirtAnalytics> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (raw) {
      return { ...getDefaultAnalytics(), ...JSON.parse(raw) };
    }
  } catch {
    // no-op
  }
  return getDefaultAnalytics();
}

async function saveAnalytics(data: FlirtAnalytics): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch {
    // no-op
  }
}

// ==========================================
// Helpers
// ==========================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0] as string);
  }
  return dates;
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1).getTime();
  const d2 = new Date(dateStr2).getTime();
  return Math.abs(Math.round((d2 - d1) / (24 * 60 * 60 * 1000)));
}

// ==========================================
// Public API
// ==========================================

/**
 * Track a generic event.
 */
export async function trackEvent(event: string, _data?: Record<string, unknown>): Promise<void> {
  const analytics = await loadAnalytics();
  const today = getTodayString();

  switch (event) {
    case 'suggestion_generated':
      // Note: don't increment suggestionsGenerated here — trackSuggestionUsed handles it
      // to avoid double-counting. Only track the daily usage for non-tone-specific events.
      break;
    case 'suggestion_copied':
      analytics.suggestionsCopied++;
      break;
    case 'suggestion_edited':
      analytics.suggestionsEdited++;
      break;
    case 'opener_sent':
      analytics.openersSent++;
      break;
    case 'bio_generated':
      analytics.biosGenerated++;
      break;
    case 'gif_used':
      analytics.gifsUsed++;
      break;
    default:
      break;
  }

  // Update streak — only increment once per new day
  // Only update for events that represent actual user activity
  if (event !== 'suggestion_generated') {
    if (analytics.lastActiveDate && analytics.lastActiveDate !== today) {
      const diff = daysBetween(analytics.lastActiveDate, today);
      if (diff === 1) {
        analytics.streak++;
      } else if (diff > 1) {
        analytics.streak = 1;
      }
    } else if (!analytics.lastActiveDate) {
      analytics.streak = 1;
    }
    analytics.lastActiveDate = today;
  }

  await saveAnalytics(analytics);
}

/**
 * Track a suggestion generation with tone & contact context.
 */
export async function trackSuggestionUsed(tone: string, _contactId: string): Promise<void> {
  const analytics = await loadAnalytics();
  const today = getTodayString();

  analytics.suggestionsGenerated++;
  analytics.dailyUsage[today] = (analytics.dailyUsage[today] || 0) + 1;
  analytics.toneUsage[tone] = (analytics.toneUsage[tone] || 0) + 1;

  // Update streak — only increment once per new day
  if (analytics.lastActiveDate && analytics.lastActiveDate !== today) {
    const diff = daysBetween(analytics.lastActiveDate, today);
    if (diff === 1) {
      analytics.streak++;
    } else if (diff > 1) {
      analytics.streak = 1;
    }
  } else if (!analytics.lastActiveDate) {
    analytics.streak = 1;
  }
  analytics.lastActiveDate = today;

  await saveAnalytics(analytics);
}

/**
 * Record conversation health score for a contact.
 */
export async function recordHealthScore(contactId: string, score: number): Promise<void> {
  const analytics = await loadAnalytics();
  if (!analytics.conversationHealthHistory[contactId]) {
    analytics.conversationHealthHistory[contactId] = [];
  }
  analytics.conversationHealthHistory[contactId].push(score);
  // Keep last 30 scores
  if (analytics.conversationHealthHistory[contactId].length > 30) {
    analytics.conversationHealthHistory[contactId] =
      analytics.conversationHealthHistory[contactId].slice(-30);
  }
  await saveAnalytics(analytics);
}

/**
 * Get weekly stats.
 */
export async function getWeeklyStats(activeConvoCount: number = 0): Promise<WeeklyStats> {
  const analytics = await loadAnalytics();
  const weekDates = getWeekDates();

  // Daily breakdown
  const dailyBreakdown = weekDates.map((date, i) => ({
    day: date,
    count: analytics.dailyUsage[date] || 0,
    label: DAY_LABELS[i] ?? 'N/A',
  }));

  const totalSuggestions = dailyBreakdown.reduce((sum, d) => sum + d.count, 0);

  // Tone breakdown
  const toneBreakdown = Object.entries(analytics.toneUsage)
    .map(([tone, count]) => ({ tone, count }))
    .sort((a, b) => b.count - a.count);

  const topTone = toneBreakdown.length > 0 ? toneBreakdown[0]!.tone : null;

  return {
    totalSuggestions,
    dailyBreakdown,
    topTone,
    toneBreakdown,
    activeConversations: activeConvoCount,
    streak: analytics.streak,
  };
}

/**
 * Get streak count.
 */
export async function getStreakCount(): Promise<number> {
  const analytics = await loadAnalytics();
  const today = getTodayString();

  if (!analytics.lastActiveDate) return 0;

  const diff = daysBetween(analytics.lastActiveDate, today);
  if (diff > 1) return 0; // streak broken
  return analytics.streak;
}

/**
 * Get best tone.
 */
export async function getBestTone(): Promise<string | null> {
  const analytics = await loadAnalytics();
  const entries = Object.entries(analytics.toneUsage);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]![0];
}

/**
 * Get full analytics data.
 */
export async function getFullAnalytics(): Promise<FlirtAnalytics> {
  return loadAnalytics();
}

/**
 * Reset analytics.
 */
export async function resetAnalytics(): Promise<void> {
  await saveAnalytics(getDefaultAnalytics());
}

// ==========================================
// Default Export
// ==========================================

export const AnalyticsService = {
  trackEvent,
  trackSuggestionUsed,
  recordHealthScore,
  getWeeklyStats,
  getStreakCount,
  getBestTone,
  getFullAnalytics,
  resetAnalytics,
};

export default AnalyticsService;
