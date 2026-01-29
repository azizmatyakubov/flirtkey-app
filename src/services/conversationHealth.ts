/**
 * Conversation Health Service - Phase 1.4: Conversation Rescue System
 * 
 * Analyzes conversation health and generates revival suggestions.
 * Detects dying conversations and provides actionable rescue strategies.
 */

import axios from 'axios';
import { Contact } from '../types';
import { ConversationEntry } from '../stores/useStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type ConvoHealthStatus = 'thriving' | 'cooling' | 'dying' | 'dead';
export type SuggestedAction = 'continue' | 'pivot_topic' | 'bold_move' | 'send_meme' | 'give_space' | 'double_text';

export interface ConvoHealth {
  status: ConvoHealthStatus;
  score: number; // 0-100
  signals: string[]; // e.g., ["their replies getting shorter", "24h gap", "no questions from them"]
  suggestedAction: SuggestedAction;
  revivalMessages: string[]; // 3 AI-generated revival suggestions
  lastAnalyzed: Date;
}

export interface ConvoSignals {
  avgHerReplyLength: number;
  avgYourReplyLength: number;
  herReplyLengthTrend: 'increasing' | 'stable' | 'decreasing';
  timeSinceLastMessage: number; // hours
  whoSentLast: 'you' | 'them';
  herQuestionCount: number; // in last 10 messages
  emojiTrend: 'more' | 'same' | 'less';
  consecutiveShortReplies: number;
}

// Storage for health scores and dismiss state
const HEALTH_STORAGE_KEY = 'flirtkey-convo-health';
const DISMISS_STORAGE_KEY = 'flirtkey-rescue-dismiss';

// ==========================================
// Signal Analysis
// ==========================================

/**
 * Extract conversation signals from recent messages.
 * Uses ConversationEntry which has theirMessage (what they said).
 */
export function getConvoSignals(messages: ConversationEntry[]): ConvoSignals {
  // Sort by timestamp ascending (oldest first)
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  // Separate their messages
  const theirMessages = sorted
    .filter(m => m.theirMessage && m.theirMessage.trim().length > 0)
    .map(m => m.theirMessage);
  
  // Calculate average their reply length
  const avgHerReplyLength = theirMessages.length > 0
    ? theirMessages.reduce((sum, msg) => sum + msg.length, 0) / theirMessages.length
    : 0;

  // Calculate average your reply length (from suggestions that were used)
  const yourMessages = sorted
    .filter(m => m.selectedSuggestion?.text)
    .map(m => m.selectedSuggestion!.text);
  const avgYourReplyLength = yourMessages.length > 0
    ? yourMessages.reduce((sum, msg) => sum + msg.length, 0) / yourMessages.length
    : 0;

  // Their reply length trend (compare first half vs second half)
  let herReplyLengthTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (theirMessages.length >= 4) {
    const midpoint = Math.floor(theirMessages.length / 2);
    const firstHalf = theirMessages.slice(0, midpoint);
    const secondHalf = theirMessages.slice(midpoint);
    const firstAvg = firstHalf.reduce((s, m) => s + m.length, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.length, 0) / secondHalf.length;
    const ratio = secondAvg / (firstAvg || 1);
    if (ratio > 1.2) herReplyLengthTrend = 'increasing';
    else if (ratio < 0.8) herReplyLengthTrend = 'decreasing';
  }

  // Time since last message
  const lastMsg = sorted[sorted.length - 1];
  const timeSinceLastMessage = lastMsg
    ? (Date.now() - lastMsg.timestamp) / (1000 * 60 * 60) // hours
    : Infinity;

  // Who sent last - ConversationEntry represents an exchange where they sent a message
  // and the user generated a response. If the last entry has a selectedSuggestion,
  // the user sent last (they used a suggestion). Otherwise, they sent last (user saw
  // their message but didn't respond yet).
  const lastEntry = sorted[sorted.length - 1];
  const whoSentLast: 'you' | 'them' = lastEntry?.selectedSuggestion?.text
    ? 'you'
    : 'them';

  // Count their questions in last 10 messages
  const recentHerMessages = theirMessages.slice(-10);
  const herQuestionCount = recentHerMessages.filter(msg => msg.includes('?')).length;

  // Emoji trend
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/gu;
  let emojiTrend: 'more' | 'same' | 'less' = 'same';
  if (theirMessages.length >= 4) {
    const emojiMidpoint = Math.floor(theirMessages.length / 2);
    const firstHalfEmojis = theirMessages.slice(0, emojiMidpoint).join('').match(emojiRegex)?.length || 0;
    const secondHalfEmojis = theirMessages.slice(emojiMidpoint).join('').match(emojiRegex)?.length || 0;
    const firstAvgEmoji = firstHalfEmojis / emojiMidpoint;
    const secondAvgEmoji = secondHalfEmojis / (theirMessages.length - emojiMidpoint);
    if (secondAvgEmoji > firstAvgEmoji * 1.3) emojiTrend = 'more';
    else if (secondAvgEmoji < firstAvgEmoji * 0.7) emojiTrend = 'less';
  }

  // Consecutive short replies (< 20 chars) from them at end
  let consecutiveShortReplies = 0;
  for (let i = theirMessages.length - 1; i >= 0; i--) {
    if ((theirMessages[i]?.length ?? 0) < 20) {
      consecutiveShortReplies++;
    } else {
      break;
    }
  }

  return {
    avgHerReplyLength,
    avgYourReplyLength,
    herReplyLengthTrend,
    timeSinceLastMessage,
    whoSentLast,
    herQuestionCount,
    emojiTrend,
    consecutiveShortReplies,
  };
}

// ==========================================
// Health Scoring
// ==========================================

/**
 * Analyze conversation health based on contact profile and recent messages.
 */
export function analyzeConversationHealth(
  _contact: Contact,
  recentMessages: ConversationEntry[]
): ConvoHealth {
  // No messages = can't analyze
  if (recentMessages.length === 0) {
    return {
      status: 'dead',
      score: 0,
      signals: ['No conversation history'],
      suggestedAction: 'double_text',
      revivalMessages: [],
      lastAnalyzed: new Date(),
    };
  }

  const signals = getConvoSignals(recentMessages);
  const detectedSignals: string[] = [];
  let score = 50; // Start neutral

  // === Time-based scoring ===
  if (signals.timeSinceLastMessage < 2) {
    score += 15;
  } else if (signals.timeSinceLastMessage < 6) {
    score += 10;
  } else if (signals.timeSinceLastMessage < 12) {
    score += 0; // neutral
  } else if (signals.timeSinceLastMessage < 24) {
    score -= 10;
    detectedSignals.push(`${Math.round(signals.timeSinceLastMessage)}h gap since last message`);
  } else if (signals.timeSinceLastMessage < 48) {
    score -= 25;
    detectedSignals.push(`${Math.round(signals.timeSinceLastMessage)}h gap — conversation going cold`);
  } else {
    score -= 40;
    detectedSignals.push(`${Math.round(signals.timeSinceLastMessage)}h+ since last message — conversation may be dead`);
  }

  // === Reply length scoring ===
  if (signals.avgHerReplyLength > 80) {
    score += 15;
  } else if (signals.avgHerReplyLength > 40) {
    score += 8;
  } else if (signals.avgHerReplyLength > 15) {
    score += 0;
  } else {
    score -= 15;
    detectedSignals.push('Her replies are very short');
  }

  // === Reply length trend ===
  if (signals.herReplyLengthTrend === 'increasing') {
    score += 10;
    detectedSignals.push('Her replies are getting longer ✨');
  } else if (signals.herReplyLengthTrend === 'decreasing') {
    score -= 12;
    detectedSignals.push('Her replies are getting shorter');
  }

  // === Question count (engagement) ===
  if (signals.herQuestionCount >= 3) {
    score += 15;
    detectedSignals.push('She\'s asking you questions — high engagement');
  } else if (signals.herQuestionCount >= 1) {
    score += 5;
  } else {
    score -= 10;
    detectedSignals.push('No questions from them — low engagement');
  }

  // === Emoji trend ===
  if (signals.emojiTrend === 'more') {
    score += 5;
  } else if (signals.emojiTrend === 'less') {
    score -= 8;
    detectedSignals.push('Fewer emojis — energy dropping');
  }

  // === Consecutive short replies ===
  if (signals.consecutiveShortReplies >= 3) {
    score -= 15;
    detectedSignals.push(`${signals.consecutiveShortReplies} short replies in a row`);
  } else if (signals.consecutiveShortReplies >= 2) {
    score -= 8;
  }

  // === Who sent last ===
  if (signals.whoSentLast === 'you' && signals.timeSinceLastMessage > 12) {
    score -= 10;
    detectedSignals.push('You sent last — they haven't replied');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: ConvoHealthStatus;
  if (score >= 80) status = 'thriving';
  else if (score >= 50) status = 'cooling';
  else if (score >= 20) status = 'dying';
  else status = 'dead';

  // Determine suggested action
  let suggestedAction: SuggestedAction;
  if (status === 'thriving') {
    suggestedAction = 'continue';
  } else if (status === 'cooling') {
    suggestedAction = 'pivot_topic';
  } else if (status === 'dying') {
    if (signals.whoSentLast === 'you') {
      suggestedAction = 'give_space';
    } else {
      suggestedAction = 'bold_move';
    }
  } else {
    // dead
    if (signals.whoSentLast === 'you' && signals.timeSinceLastMessage > 48) {
      suggestedAction = 'double_text';
    } else {
      suggestedAction = 'send_meme';
    }
  }

  return {
    status,
    score,
    signals: detectedSignals,
    suggestedAction,
    revivalMessages: [], // Will be populated by generateRevivalSuggestions
    lastAnalyzed: new Date(),
  };
}

// ==========================================
// AI Revival Suggestions
// ==========================================

/**
 * Generate 3 revival message suggestions using OpenAI.
 */
export async function generateRevivalSuggestions(
  contact: Contact,
  health: ConvoHealth,
  apiKey: string
): Promise<string[]> {
  if (!apiKey) return getLocalRevivalSuggestions(health.status, contact);

  const statusPrompts: Record<ConvoHealthStatus, string> = {
    thriving: `The conversation with ${contact.name} is going great! Generate 3 fun, engaging messages to keep the momentum going. Match the energy.`,
    cooling: `The conversation with ${contact.name} is cooling off — replies getting shorter, less engagement. Generate 3 topic-pivot messages that feel natural, not desperate. Examples: "btw I just saw something that reminded me of you", callback to a shared interest, an interesting question.`,
    dying: `The conversation with ${contact.name} is dying — one-word replies, long gaps, no questions. Generate 3 bold revival messages: one humorous/self-aware, one vulnerable/real, one spontaneous ("ok real talk — let's do something different"). Make them feel authentic, not try-hard.`,
    dead: `The conversation with ${contact.name} has been dead for days — no reply, total silence. Generate 3 last-chance double-text messages: one funny self-aware opener ("I know this is random but..."), one that references something specific about them, one bold/direct. These should feel confident, not needy.`,
  };

  const contextParts: string[] = [];
  if (contact.interests) contextParts.push(`Her interests: ${contact.interests}`);
  if (contact.personality) contextParts.push(`Her personality: ${contact.personality}`);
  if (contact.insideJokes) contextParts.push(`Inside jokes: ${contact.insideJokes}`);
  if (contact.lastTopic) contextParts.push(`Last topic discussed: ${contact.lastTopic}`);
  if (contact.howMet) contextParts.push(`How you met: ${contact.howMet}`);
  if (contact.relationshipStage) contextParts.push(`Stage: ${contact.relationshipStage}`);

  const prompt = `${statusPrompts[health.status]}

${contextParts.length > 0 ? `Context about them:\n${contextParts.join('\n')}\n` : ''}
Health signals: ${health.signals.join(', ')}
Suggested action: ${health.suggestedAction}

IMPORTANT: Return ONLY a JSON array of 3 strings. No markdown, no explanation.
Example: ["message 1", "message 2", "message 3"]`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a dating coach helping craft natural, authentic messages. Always respond with a raw JSON array of 3 strings only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) return getLocalRevivalSuggestions(health.status, contact);

    try {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 1) {
          return parsed.slice(0, 3).map((s: unknown) => String(s));
        }
      }
    } catch {
      // Parse failed, use local
    }

    return getLocalRevivalSuggestions(health.status, contact);
  } catch {
    return getLocalRevivalSuggestions(health.status, contact);
  }
}

/**
 * Local fallback revival suggestions (no API needed).
 */
function getLocalRevivalSuggestions(status: ConvoHealthStatus, _contact: Contact): string[] {
  const name = _contact.name;

  const suggestions: Record<ConvoHealthStatus, string[]> = {
    thriving: [
      'Keep matching their energy — ask about something they mentioned',
      `Tell ${name} something funny that happened to you today`,
      'Share something you\'re excited about and ask their opinion',
    ],
    cooling: [
      `btw I just saw something that made me think of you ${_contact.interests ? `— related to ${_contact.interests}` : ''}`,
      'Ok random question — if you could be anywhere right now, where would you be?',
      `I need your opinion on something... (then ask about something ${name} would find interesting)`,
    ],
    dying: [
      'Ok real talk — we should do something spontaneous this week 👀',
      `I\'m not gonna lie, I\'ve been thinking about ${_contact.lastTopic || 'our last conversation'} and...`,
      `Hot take incoming... (share a fun/controversial opinion ${name} would react to)`,
    ],
    dead: [
      `I know this is random but I just thought of you — ${_contact.insideJokes || 'how have you been?'}`,
      `Ok I disappeared for a bit but I\'m back and I have a story for you 😂`,
      `Alright ${name}, I need to ask you something important... what\'s the best pizza topping? (I know, life-changing question)`,
    ],
  };

  return suggestions[status];
}

// ==========================================
// Alert Logic
// ==========================================

/**
 * Determine if the user should be alerted about this conversation's health.
 */
export function shouldAlert(health: ConvoHealth): boolean {
  return health.status === 'cooling' || health.status === 'dying';
}

// ==========================================
// Health Storage
// ==========================================

interface HealthCache {
  [contactId: number]: {
    health: ConvoHealth;
    cachedAt: number;
  };
}

/**
 * Save health scores to persistent storage.
 */
export async function saveHealthScores(scores: Record<number, ConvoHealth>): Promise<void> {
  try {
    const cache: HealthCache = {};
    for (const [id, health] of Object.entries(scores)) {
      cache[Number(id)] = {
        health,
        cachedAt: Date.now(),
      };
    }
    await AsyncStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Silently fail — health is non-critical
  }
}

/**
 * Load cached health scores.
 */
export async function loadHealthScores(): Promise<Record<number, ConvoHealth>> {
  try {
    const data = await AsyncStorage.getItem(HEALTH_STORAGE_KEY);
    if (!data) return {};
    
    const cache: HealthCache = JSON.parse(data);
    const result: Record<number, ConvoHealth> = {};
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    
    for (const [id, entry] of Object.entries(cache)) {
      // Only return if cached within last 6 hours
      if (Date.now() - entry.cachedAt < SIX_HOURS) {
        result[Number(id)] = {
          ...entry.health,
          lastAnalyzed: new Date(entry.health.lastAnalyzed),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ==========================================
// Dismiss Tracking
// ==========================================

interface DismissCache {
  [contactId: number]: number; // timestamp of dismiss
}

/**
 * Record that the rescue banner was dismissed for a contact.
 */
export async function dismissRescueBanner(contactId: number): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(DISMISS_STORAGE_KEY);
    const cache: DismissCache = data ? JSON.parse(data) : {};
    cache[contactId] = Date.now();
    await AsyncStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Silently fail
  }
}

/**
 * Check if the rescue banner was recently dismissed (within 24h).
 */
export async function isRescueBannerDismissed(contactId: number): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(DISMISS_STORAGE_KEY);
    if (!data) return false;
    const cache: DismissCache = JSON.parse(data);
    const dismissedAt = cache[contactId];
    if (!dismissedAt) return false;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < TWENTY_FOUR_HOURS;
  } catch {
    return false;
  }
}

// ==========================================
// Notification Templates
// ==========================================

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function getNotificationContent(
  contact: Contact,
  health: ConvoHealth
): NotificationTemplate | null {
  const hoursSinceLastMessage = contact.lastMessageDate
    ? Math.round((Date.now() - new Date(contact.lastMessageDate).getTime()) / (1000 * 60 * 60))
    : null;

  switch (health.status) {
    case 'thriving':
      return {
        title: '🔥 Keep it going!',
        body: `Your convo with ${contact.name} is on fire! Keep it going`,
        data: { contactId: contact.id, status: 'thriving' },
      };
    case 'cooling':
      return {
        title: '⚡ Time to spark it up',
        body: `Your convo with ${contact.name} is cooling off — try one of these`,
        data: { contactId: contact.id, status: 'cooling' },
      };
    case 'dying':
      return {
        title: '💬 Don\'t let it die',
        body: hoursSinceLastMessage
          ? `${contact.name} hasn't heard from you in ${hoursSinceLastMessage}h — tap for a great follow-up`
          : `Your convo with ${contact.name} needs a rescue — tap for ideas`,
        data: { contactId: contact.id, status: 'dying' },
      };
    case 'dead':
      return {
        title: '👻 Revival time',
        body: `It's been a while with ${contact.name} — we've got a perfect comeback message`,
        data: { contactId: contact.id, status: 'dead' },
      };
    default:
      return null;
  }
}

// ==========================================
// Background Health Check
// ==========================================

/**
 * Analyze all active conversations and return health scores.
 * Call on app open or every 6 hours.
 */
export function analyzeAllConversations(
  contacts: Contact[],
  getConversationsForContact: (contactId: number) => ConversationEntry[]
): Record<number, ConvoHealth> {
  const results: Record<number, ConvoHealth> = {};

  for (const contact of contacts) {
    const conversations = getConversationsForContact(contact.id);
    if (conversations.length === 0) {
      // Use contact's lastMessageDate if available
      if (contact.lastMessageDate) {
        const hoursSince = (Date.now() - new Date(contact.lastMessageDate).getTime()) / (1000 * 60 * 60);
        results[contact.id] = {
          status: hoursSince > 48 ? 'dead' : hoursSince > 24 ? 'dying' : 'cooling',
          score: Math.max(0, Math.round(50 - hoursSince)),
          signals: [`${Math.round(hoursSince)}h since last activity`],
          suggestedAction: hoursSince > 48 ? 'double_text' : 'pivot_topic',
          revivalMessages: [],
          lastAnalyzed: new Date(),
        };
      }
      continue;
    }

    results[contact.id] = analyzeConversationHealth(contact, conversations);
  }

  return results;
}

// ==========================================
// Export
// ==========================================

export const ConversationHealthService = {
  analyzeConversationHealth,
  generateRevivalSuggestions,
  getConvoSignals,
  shouldAlert,
  analyzeAllConversations,
  saveHealthScores,
  loadHealthScores,
  dismissRescueBanner,
  isRescueBannerDismissed,
  getNotificationContent,
};

export default ConversationHealthService;
