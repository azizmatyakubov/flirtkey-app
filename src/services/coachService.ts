/**
 * Conversation Coach Service
 * Hour 1: AI-powered dating conversation practice
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type CoachDifficulty = 'easy' | 'medium' | 'hard';

export interface CoachMessage {
  id: string;
  role: 'user' | 'match' | 'coach';
  text: string;
  timestamp: number;
  score?: number; // 1-5 stars for user messages
  feedback?: string; // Coach feedback text
}

export interface CoachSession {
  id: string;
  difficulty: CoachDifficulty;
  matchName: string;
  matchPersonality: string;
  messages: CoachMessage[];
  totalScore: number;
  messageCount: number;
  startedAt: number;
  completedAt?: number;
  averageScore: number;
}

export interface CoachScenario {
  id: string;
  title: string;
  description: string;
  difficulty: CoachDifficulty;
  matchName: string;
  matchPersonality: string;
  openingMessage: string;
  context: string;
}

// ==========================================
// Scenarios
// ==========================================

export const COACH_SCENARIOS: CoachScenario[] = [
  // Easy - Clear Interest
  {
    id: 'easy_1',
    title: 'The Enthusiastic Match',
    description: 'She matched with you and sent the first message! She seems really interested.',
    difficulty: 'easy',
    matchName: 'Sophie',
    matchPersonality: 'Enthusiastic, uses emojis, asks questions, clearly interested',
    openingMessage: "Hey! I saw you like hiking too! 🥾 What's your favorite trail?",
    context: 'Matched on a dating app. She messaged first about shared hiking interest.',
  },
  {
    id: 'easy_2',
    title: 'The Coffee Date Setup',
    description: "You've been chatting and she's dropping hints about meeting up.",
    difficulty: 'easy',
    matchName: 'Emma',
    matchPersonality: 'Warm, flirty, dropping hints about wanting to meet',
    openingMessage:
      "So I just discovered this amazing coffee place downtown... it's so cute inside 😍",
    context: 'Been chatting for 2 days. Great chemistry. She wants to meet but wants you to ask.',
  },
  {
    id: 'easy_3',
    title: 'Shared Music Taste',
    description: 'She noticed you both love the same band.',
    difficulty: 'easy',
    matchName: 'Mia',
    matchPersonality: 'Fun, music lover, easy to talk to, responds quickly',
    openingMessage: "OMG you like Arctic Monkeys too?! What's your fav album? 🎸",
    context: 'Just matched. She noticed shared music taste and is excited about it.',
  },
  // Medium - Mixed Signals
  {
    id: 'medium_1',
    title: 'The Slow Texter',
    description:
      'She replies but takes hours. Her responses are short but she keeps the conversation going.',
    difficulty: 'medium',
    matchName: 'Olivia',
    matchPersonality: 'Busy, replies in 2-4 hours, short but engaged responses, slightly guarded',
    openingMessage: 'Hey',
    context:
      'Matched 3 days ago. She takes hours to reply but always does. Trying to gauge interest.',
  },
  {
    id: 'medium_2',
    title: 'The Topic Changer',
    description: 'She deflects personal questions but stays engaged on surface topics.',
    difficulty: 'medium',
    matchName: 'Ava',
    matchPersonality: 'Smart, deflects personal Qs, interested but cautious, witty',
    openingMessage: 'So what do you do for fun? Besides being on dating apps obviously 😄',
    context: 'Chatting for a day. She avoids personal details but keeps responding with wit.',
  },
  {
    id: 'medium_3',
    title: 'The Comeback Challenge',
    description: "She's testing you with playful teasing. Can you keep up?",
    difficulty: 'medium',
    matchName: 'Luna',
    matchPersonality: 'Sarcastic, playful teaser, tests with banter, respects good comebacks',
    openingMessage: "Your bio says you're funny... prove it 😏",
    context: 'Just matched. She likes banter and is testing your wit before investing more.',
  },
  // Hard - Barely Responding
  {
    id: 'hard_1',
    title: 'The One-Word Wonder',
    description: 'She matched but gives minimal responses. Can you spark her interest?',
    difficulty: 'hard',
    matchName: 'Jade',
    matchPersonality: 'Gives one-word answers, distracted, needs something compelling to engage',
    openingMessage: 'hi',
    context: 'Matched but she seems disinterested. Probably has many matches. Need to stand out.',
  },
  {
    id: 'hard_2',
    title: 'The Ghost Reviver',
    description: "She stopped replying 3 days ago. You're sending a re-engagement message.",
    difficulty: 'hard',
    matchName: 'Zara',
    matchPersonality: 'Was interested, got busy/distracted, needs a creative re-engagement',
    openingMessage: '',
    context:
      'Had good chemistry for 2 days then she ghosted. You need to re-engage without being needy.',
  },
  {
    id: 'hard_3',
    title: 'The Interview Avoider',
    description: 'She hates Q&A style texting. Every question you ask gets a flat response.',
    difficulty: 'hard',
    matchName: 'Riley',
    matchPersonality:
      'Hates being interviewed, responds well to statements and humor, bored by questions',
    openingMessage: 'lol sure',
    context:
      'She matched but typical questions bore her. Need creative, non-question based approach.',
  },
];

// ==========================================
// AI Response Generation (Mock for now, uses same AI service pattern)
// ==========================================

export function generateMatchResponse(
  session: CoachSession,
  userMessage: string
): { matchReply: string; feedback: string; score: number } {
  const { difficulty } = session;

  // Score based on message quality heuristics
  let score = 3;
  const msg = userMessage.toLowerCase();

  // Positive signals
  if (msg.length > 20 && msg.length < 200) score += 0.5; // Good length
  if (msg.includes('?') && !msg.startsWith('?')) score += 0.3; // Has a question but isn't just a question
  if (/😂|😄|😊|🔥|😏|😜|🎉/.test(msg)) score += 0.2; // Appropriate emoji use
  if (msg.includes('haha') || msg.includes('lol') || msg.includes('lmao')) score += 0.2; // Shows humor

  // Negative signals
  if (msg.length < 5) score -= 1; // Too short
  if (msg.length > 300) score -= 0.5; // Too long
  if (msg === 'hey' || msg === 'hi' || msg === 'hello') score -= 1.5; // Generic opener
  if (msg.includes('???') || msg.includes('!!!')) score -= 0.5; // Desperate punctuation
  if (/why don't you|why aren't you|you never/.test(msg)) score -= 1; // Needy/accusatory
  if (msg.split('?').length > 3) score -= 0.5; // Too many questions (interview style)

  // Difficulty adjustments
  if (difficulty === 'hard') score -= 0.3;
  if (difficulty === 'easy') score += 0.3;

  // Clamp score
  score = Math.min(5, Math.max(1, Math.round(score * 2) / 2));

  // Generate feedback based on score
  let feedback = '';
  if (score >= 4.5) {
    feedback = getRandomItem(FEEDBACK_EXCELLENT);
  } else if (score >= 3.5) {
    feedback = getRandomItem(FEEDBACK_GOOD);
  } else if (score >= 2.5) {
    feedback = getRandomItem(FEEDBACK_OK);
  } else {
    feedback = getRandomItem(FEEDBACK_NEEDS_WORK);
  }

  // Generate match response based on difficulty and score
  let matchReply = '';
  if (difficulty === 'easy') {
    matchReply =
      score >= 3 ? getRandomItem(EASY_POSITIVE_REPLIES) : getRandomItem(EASY_NEUTRAL_REPLIES);
  } else if (difficulty === 'medium') {
    matchReply =
      score >= 4 ? getRandomItem(MEDIUM_POSITIVE_REPLIES) : getRandomItem(MEDIUM_NEUTRAL_REPLIES);
  } else {
    matchReply =
      score >= 4 ? getRandomItem(HARD_POSITIVE_REPLIES) : getRandomItem(HARD_NEUTRAL_REPLIES);
  }

  return { matchReply, feedback, score };
}

// ==========================================
// Feedback Templates
// ==========================================

const FEEDBACK_EXCELLENT = [
  '🌟 Perfect! Great balance of interest and playfulness.',
  '🔥 Nailed it! That response shows confidence without being try-hard.',
  '💯 Excellent! You kept the energy flowing naturally.',
  '⭐ Amazing comeback! Shows wit and emotional intelligence.',
  '🎯 Spot on! Engaging, fun, and leaves room for more.',
];

const FEEDBACK_GOOD = [
  '👍 Good response! Try adding a bit more personality.',
  '✨ Solid! You could make it more playful though.',
  '💪 Nice! Adding a light tease would take this to the next level.',
  '👌 Good energy. Consider ending with something that invites a fun reply.',
  '😊 Well done! A little more specificity would make it memorable.',
];

const FEEDBACK_OK = [
  '💡 Decent, but a bit generic. Try referencing something specific.',
  "🤔 It works, but it won't stand out. Add some personality!",
  '📝 Try making it less interview-like. Statements > Questions.',
  '💬 Could be more engaging. Think: would YOU want to reply to this?',
  "🔄 It's safe but forgettable. Take a small risk!",
];

const FEEDBACK_NEEDS_WORK = [
  '⚠️ Too generic. You need to stand out from the crowd.',
  '🚫 This comes across as low effort. She gets 50 messages like this daily.',
  '📉 Too short/boring. Show some personality and interest!',
  '❌ This might come off as needy or aggressive. Try a lighter touch.',
  '🔧 Rethink this one. Put yourself in her shoes — would you engage?',
];

const EASY_POSITIVE_REPLIES = [
  'Haha I love that! 😂 Tell me more!',
  "Omg same! That's so cool 🥰",
  "You're actually really funny lol",
  "Okay I'm intrigued... go on 👀",
  "Hahaha you're fun to talk to! 😊",
];

const EASY_NEUTRAL_REPLIES = ['Haha yeah', "That's cool!", 'Oh nice 😊', 'Mm interesting'];

const MEDIUM_POSITIVE_REPLIES = [
  'Okay that was actually smooth 😏',
  'Haha fair point',
  "You're not wrong lol",
  "Okay I'll give you that one 😄",
];

const MEDIUM_NEUTRAL_REPLIES = ['Lol', 'Hmm', 'Maybe 🤷‍♀️', 'I guess'];

const HARD_POSITIVE_REPLIES = [
  '...okay that actually made me laugh 😂',
  'Fine, you have my attention',
  "Lol okay that's different",
  'Haha wait what 😄',
];

const HARD_NEUTRAL_REPLIES = ['k', 'lol', 'cool', 'oh', 'sure'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ==========================================
// Session Persistence
// ==========================================

const SESSIONS_KEY = 'flirtkey_coach_sessions';

export async function saveSessions(sessions: CoachSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('[Coach] Failed to save sessions:', error);
  }
}

export async function loadSessions(): Promise<CoachSession[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Coach] Failed to load sessions:', error);
    return [];
  }
}

export function createSession(scenario: CoachScenario): CoachSession {
  const session: CoachSession = {
    id: `coach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    difficulty: scenario.difficulty,
    matchName: scenario.matchName,
    matchPersonality: scenario.matchPersonality,
    messages: [],
    totalScore: 0,
    messageCount: 0,
    startedAt: Date.now(),
    averageScore: 0,
  };

  // Add opening message if scenario has one
  if (scenario.openingMessage) {
    session.messages.push({
      id: `msg_${Date.now()}`,
      role: 'match',
      text: scenario.openingMessage,
      timestamp: Date.now(),
    });
  }

  return session;
}

export function addUserMessage(session: CoachSession, text: string): CoachSession {
  const { matchReply, feedback, score } = generateMatchResponse(session, text);

  const now = Date.now();
  const updatedMessages = [
    ...session.messages,
    // User's message
    {
      id: `msg_${now}_user`,
      role: 'user' as const,
      text,
      timestamp: now,
      score,
      feedback,
    },
    // Coach feedback
    {
      id: `msg_${now}_coach`,
      role: 'coach' as const,
      text: feedback,
      timestamp: now + 1,
      score,
    },
    // Match reply
    {
      id: `msg_${now}_match`,
      role: 'match' as const,
      text: matchReply,
      timestamp: now + 2,
    },
  ];

  const newTotalScore = session.totalScore + score;
  const newMessageCount = session.messageCount + 1;

  return {
    ...session,
    messages: updatedMessages,
    totalScore: newTotalScore,
    messageCount: newMessageCount,
    averageScore: newTotalScore / newMessageCount,
  };
}

export function getDifficultyInfo(difficulty: CoachDifficulty): {
  label: string;
  emoji: string;
  color: string;
  description: string;
} {
  switch (difficulty) {
    case 'easy':
      return {
        label: 'Easy',
        emoji: '💚',
        color: '#2ED573',
        description: 'Clear interest, responsive match',
      };
    case 'medium':
      return {
        label: 'Medium',
        emoji: '💛',
        color: '#FFBE76',
        description: 'Mixed signals, needs game',
      };
    case 'hard':
      return {
        label: 'Hard',
        emoji: '❤️‍🔥',
        color: '#FF4757',
        description: 'Barely responding, stand out',
      };
  }
}
