/**
 * Notification Scheduler Service - Phase 4: Smart Push Notifications
 *
 * Builds on the existing notifications.ts service.
 * Schedules conversation nudges, health alerts, daily tips, weekly reports, and re-engagement.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';
import { ConversationEntry } from '../stores/useStore';
import { ConvoHealth } from './conversationHealth';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY_TIP_INDEX = 'flirtkey-tip-index';
const STORAGE_KEY_NOTIF_PREFS = 'flirtkey-notif-prefs';

const NUDGE_HOURS = 6;
const REENGAGEMENT_HOURS = 48;

// Notification identifiers
const ID_DAILY_TIP = 'daily-flirt-tip';
const ID_WEEKLY_REPORT = 'weekly-report';
const ID_CONVO_NUDGE_PREFIX = 'convo-nudge-';
const ID_HEALTH_ALERT_PREFIX = 'health-alert-';
const ID_HOT_STREAK_PREFIX = 'hot-streak-';
const ID_REENGAGEMENT = 'reengagement';

// ==========================================
// Flirt Tips (30+ hardcoded)
// ==========================================

export const FLIRT_TIPS: string[] = [
  "Mirroring their message length shows you're in sync — don't write a paragraph to their one-liner",
  "Questions that start with 'what's your take on...' get 3x more replies than yes/no questions",
  "The best time to ask for a date is when the energy is HIGH, not when you're running out of things to say",
  "Callbacks to earlier jokes create inside humor — the fastest way to build connection",
  "Replying instantly every time can seem eager. Varying your response time feels more natural",
  "Using their name in messages creates a subconscious bond — but don't overdo it",
  "Voice notes feel 10x more personal than text. Use them when the vibe is right",
  "Ending a convo on a high note makes them look forward to the next one",
  "If they use emojis, mirror them. If she doesn't, keep yours minimal too",
  "'What are you up to?' is the laziest opener. Try sharing something interesting first",
  "Double-texting isn't always bad — it shows confidence when done right",
  "People love talking about their passions. Ask about theirs and watch them light up",
  "Humor > compliments in the early stages. Make them laugh first, then compliment",
  "If they take hours to reply, don't match their timing exactly — that's just playing games",
  "A good flirty text makes them smile AND think. Aim for both",
  "Teasing works because it shows confidence. But know the line between fun and rude",
  "Share a random thought or observation — it feels more natural than forced conversation",
  "'I just thought of you when...' is one of the most effective openers",
  "Don't save all your personality for dates. Show it in texts too",
  "The best response to a one-word reply? Ask something specific, not generic",
  "GIFs and memes can break tension when the conversation feels stuck",
  "If you're overthinking a reply, you're probably overthinking the relationship",
  "Asking for their opinion on something shows you value their thoughts",
  "The strongest move? Being genuinely interested, not just acting interested",
  "A playful challenge ('bet you can't...') creates instant engagement",
  "Don't interview them. Mix questions with statements and stories",
  "Sending a photo of what you're doing feels casual and authentic",
  "If they mention something they like, remember it. Bring it up later — they'll be impressed",
  "The 'push-pull' technique: compliment then tease. 'You're cute... for someone who uses that many emojis 😏'",
  "Late night texts hit different. Use them wisely for deeper conversations",
  "Confidence is replying when YOU want to, not when the 'rules' say to",
  "The funniest people don't try to be funny. They just share genuine reactions",
  "If they share something vulnerable, match their energy. Don't deflect with humor",
  "Story-telling is underrated in texting. Paint a picture instead of just stating facts",
  "Adding '...but I probably shouldn't say that' after a tease creates irresistible curiosity",
];

// ==========================================
// Notification Preferences
// ==========================================

export interface NotificationPreferences {
  conversationNudges: boolean;
  healthAlerts: boolean;
  dailyTips: boolean;
  weeklyReport: boolean;
  hotStreaks: boolean;
  reengagement: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  conversationNudges: true,
  healthAlerts: true,
  dailyTips: true,
  weeklyReport: true,
  hotStreaks: true,
  reengagement: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIF_PREFS);
    if (raw) {
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

export async function setNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences();
  await AsyncStorage.setItem(
    STORAGE_KEY_NOTIF_PREFS,
    JSON.stringify({ ...current, ...prefs })
  );
}

// ==========================================
// Schedule Functions
// ==========================================

/**
 * Schedule all notifications. Call on app open.
 */
export async function scheduleAllNotifications(
  contacts: Contact[],
  getConversations: (contactId: number) => ConversationEntry[],
  healthScores: Record<number, ConvoHealth>
): Promise<void> {
  const prefs = await getNotificationPreferences();

  // Set up Android channels
  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync('conversation', {
        name: 'Conversation Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Nudges and health alerts for your conversations',
      }),
      Notifications.setNotificationChannelAsync('tips', {
        name: 'Daily Flirt Tips',
        importance: Notifications.AndroidImportance.LOW,
        description: 'Daily dating psychology tips',
      }),
      Notifications.setNotificationChannelAsync('reports', {
        name: 'Weekly Reports',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Weekly conversation analytics',
      }),
    ]);
  }

  // Schedule each type
  if (prefs.conversationNudges || prefs.healthAlerts || prefs.hotStreaks) {
    await scheduleConversationCheck(contacts, getConversations, healthScores, prefs);
  }

  if (prefs.dailyTips) {
    await scheduleDailyTip();
  }

  if (prefs.weeklyReport) {
    await scheduleWeeklyReport();
  }

  if (prefs.reengagement) {
    await scheduleReengagement(contacts);
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Check conversations and send nudges / health alerts / hot streaks.
 */
export async function scheduleConversationCheck(
  contacts: Contact[],
  getConversations: (contactId: number) => ConversationEntry[],
  healthScores: Record<number, ConvoHealth>,
  prefs: NotificationPreferences
): Promise<void> {
  const now = Date.now();

  for (const contact of contacts) {
    const convos = getConversations(contact.id);
    if (convos.length === 0) continue;

    const sorted = [...convos].sort((a, b) => b.timestamp - a.timestamp);
    const lastConvo = sorted[0];
    if (!lastConvo) continue;
    const hoursSinceLastMsg = (now - lastConvo.timestamp) / (1000 * 60 * 60);
    const health = healthScores[contact.id];

    // 1. Conversation Nudge — no message in 6+ hours
    if (prefs.conversationNudges && hoursSinceLastMsg >= NUDGE_HOURS && hoursSinceLastMsg < REENGAGEMENT_HOURS) {
      const h = Math.round(hoursSinceLastMsg);
      await safeSchedule({
        identifier: `${ID_CONVO_NUDGE_PREFIX}${contact.id}`,
        content: {
          title: `💬 ${contact.name} hasn't heard from you in ${h}h`,
          body: 'Tap for a follow-up suggestion',
          data: { type: 'nudge', contactId: contact.id },
          sound: 'default',
        },
        trigger: null, // immediate
      });
    }

    if (!health) continue;

    // 2. Convo Health Alert — score < 50
    if (prefs.healthAlerts && health.score < 50 && health.status !== 'dead') {
      await safeSchedule({
        identifier: `${ID_HEALTH_ALERT_PREFIX}${contact.id}`,
        content: {
          title: `⚡ Your convo with ${contact.name} is cooling off`,
          body: '3 rescue ideas ready — tap to see them',
          data: { type: 'health_alert', contactId: contact.id, status: health.status },
          sound: 'default',
        },
        trigger: null,
      });
    }

    // 3. Hot Streak — score > 80 and multiple recent messages
    if (prefs.hotStreaks && health.score > 80) {
      const recentCount = convos.filter(
        (c) => now - c.timestamp < 24 * 60 * 60 * 1000
      ).length;
      if (recentCount >= 3) {
        await safeSchedule({
          identifier: `${ID_HOT_STREAK_PREFIX}${contact.id}`,
          content: {
            title: `🔥 Your convo with ${contact.name} is on fire!`,
            body: 'Keep it going — the energy is perfect right now',
            data: { type: 'hot_streak', contactId: contact.id },
            sound: 'default',
          },
          trigger: null,
        });
      }
    }
  }
}

/**
 * Schedule daily flirt tip at a random time between 10am-8pm.
 */
export async function scheduleDailyTip(): Promise<void> {
  // Cancel existing
  await Notifications.cancelScheduledNotificationAsync(ID_DAILY_TIP).catch(() => {});

  const tip = await getNextTip();

  // Random hour between 10 and 20 (8pm), random minute
  const hour = 10 + Math.floor(Math.random() * 10);
  const minute = Math.floor(Math.random() * 60);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_DAILY_TIP,
      content: {
        title: '💡 Daily Flirt Tip',
        body: tip,
        data: { type: 'daily_tip' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Schedule failed — non-critical
  }
}

/**
 * Schedule weekly report for Sunday at 6pm.
 */
export async function scheduleWeeklyReport(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_WEEKLY_REPORT).catch(() => {});

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_WEEKLY_REPORT,
      content: {
        title: '📊 Your Weekly FlirtKey Report',
        body: 'Tap to see how your conversations went this week',
        data: { type: 'weekly_report' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });
  } catch {
    // Schedule failed — non-critical
  }
}

/**
 * Schedule re-engagement if user hasn't opened app in 48+ hours.
 * We schedule it 48h from now; will be re-scheduled on each app open.
 */
export async function scheduleReengagement(contacts: Contact[]): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_REENGAGEMENT).catch(() => {});

  if (contacts.length === 0) return;

  // Pick a random contact for the notification
  const contact = contacts[Math.floor(Math.random() * contacts.length)];
  if (!contact) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_REENGAGEMENT,
      content: {
        title: `Miss talking to ${contact.name}? 👋`,
        body: "Here's a great way to restart the conversation",
        data: { type: 'reengagement', contactId: contact.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: REENGAGEMENT_HOURS * 60 * 60,
        repeats: false,
      },
    });
  } catch {
    // Schedule failed
  }
}

// ==========================================
// Helpers
// ==========================================

async function getNextTip(): Promise<string> {
  try {
    const indexStr = await AsyncStorage.getItem(STORAGE_KEY_TIP_INDEX);
    let index = indexStr ? parseInt(indexStr, 10) : 0;
    if (isNaN(index) || index >= FLIRT_TIPS.length) {
      index = 0;
    }
    const tip = FLIRT_TIPS[index] ?? FLIRT_TIPS[0] ?? 'Be yourself — authenticity is the most attractive quality.';
    await AsyncStorage.setItem(STORAGE_KEY_TIP_INDEX, String((index + 1) % FLIRT_TIPS.length));
    return tip;
  } catch {
    return FLIRT_TIPS[0] ?? 'Be yourself — authenticity is the most attractive quality.';
  }
}

async function safeSchedule(options: {
  identifier: string;
  content: Notifications.NotificationContentInput;
  trigger: Notifications.NotificationTriggerInput;
}): Promise<void> {
  try {
    // Cancel existing with same identifier first
    await Notifications.cancelScheduledNotificationAsync(options.identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: options.identifier,
      content: options.content,
      trigger: options.trigger,
    });
  } catch {
    // Non-critical
  }
}

// ==========================================
// Export
// ==========================================

export const NotificationScheduler = {
  scheduleAllNotifications,
  cancelAllNotifications,
  scheduleConversationCheck,
  scheduleDailyTip,
  scheduleWeeklyReport,
  scheduleReengagement,
  getNotificationPreferences,
  setNotificationPreferences,
  FLIRT_TIPS,
};

export default NotificationScheduler;
