/**
 * Smart Reply Templates Service
 * Hour 3: Template library with categories, search, tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type TemplateCategory =
  | 'first_message'
  | 'comeback'
  | 'flirty'
  | 'funny'
  | 'deep'
  | 'closing';

export interface ReplyTemplate {
  id: string;
  category: TemplateCategory;
  text: string;
  blanks?: string[]; // Customizable parts e.g. ["{name}", "{interest}"]
  tags: string[];
  copyCount: number;
  successRate?: number; // Future: track success
}

export interface TemplateStats {
  templateId: string;
  copyCount: number;
  lastUsed: number;
}

// ==========================================
// Category Info
// ==========================================

export interface CategoryInfo {
  key: TemplateCategory;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    key: 'first_message',
    label: 'First Message',
    emoji: '👋',
    color: '#FF6B6B',
    description: 'Openers that get replies',
  },
  {
    key: 'comeback',
    label: 'Comebacks',
    emoji: '🔥',
    color: '#FF8E53',
    description: 'Witty replies to teasing',
  },
  {
    key: 'flirty',
    label: 'Flirty',
    emoji: '😏',
    color: '#FF69B4',
    description: 'Turn up the heat',
  },
  {
    key: 'funny',
    label: 'Funny',
    emoji: '😂',
    color: '#FFD700',
    description: 'Make them laugh',
  },
  {
    key: 'deep',
    label: 'Deep',
    emoji: '💭',
    color: '#A855F7',
    description: 'Meaningful conversations',
  },
  {
    key: 'closing',
    label: 'Get Number',
    emoji: '📱',
    color: '#2ED573',
    description: 'Seal the deal',
  },
];

// ==========================================
// Template Library
// ==========================================

export const TEMPLATES: ReplyTemplate[] = [
  // ===== FIRST MESSAGE =====
  {
    id: 'fm_1',
    category: 'first_message',
    text: 'I have a theory about your {interest} pic... want to hear it?',
    blanks: ['{interest}'],
    tags: ['curious', 'playful'],
    copyCount: 0,
  },
  {
    id: 'fm_2',
    category: 'first_message',
    text: "Your profile gives off main character energy and I'm here for it",
    tags: ['confident', 'compliment'],
    copyCount: 0,
  },
  {
    id: 'fm_3',
    category: 'first_message',
    text: "Ok I'll be honest — I swiped right before I even read your bio. But now that I have, even better",
    tags: ['honest', 'bold'],
    copyCount: 0,
  },
  {
    id: 'fm_4',
    category: 'first_message',
    text: "Two truths and a lie: I just made the best pasta of my life, I've never been on this app before, and I think we'd have an amazing conversation. Your guess?",
    tags: ['creative', 'game'],
    copyCount: 0,
  },
  {
    id: 'fm_5',
    category: 'first_message',
    text: "I was going to start with 'hey' but you seem like you deserve more than that",
    tags: ['smooth', 'effort'],
    copyCount: 0,
  },
  {
    id: 'fm_6',
    category: 'first_message',
    text: 'Your {interest} photo is either really impressive or really concerning. Either way, I need the story',
    blanks: ['{interest}'],
    tags: ['curious', 'funny'],
    copyCount: 0,
  },
  {
    id: 'fm_7',
    category: 'first_message',
    text: "I have a feeling we're going to end up arguing about {topic} and I'm already excited about it",
    blanks: ['{topic}'],
    tags: ['playful', 'confident'],
    copyCount: 0,
  },
  {
    id: 'fm_8',
    category: 'first_message',
    text: "Bold prediction: we're going to be one of those couples that met on a dating app and tells everyone we met at a bookstore",
    tags: ['bold', 'funny'],
    copyCount: 0,
  },
  {
    id: 'fm_9',
    category: 'first_message',
    text: "I see we both like {shared_interest}. Are you actually good at it or do you just enjoy it? (No judgment, I'm terrible)",
    blanks: ['{shared_interest}'],
    tags: ['shared_interest', 'self-deprecating'],
    copyCount: 0,
  },
  {
    id: 'fm_10',
    category: 'first_message',
    text: 'Your smile in that third pic made me stop scrolling. Had to say something',
    tags: ['sincere', 'compliment'],
    copyCount: 0,
  },

  // ===== COMEBACKS =====
  {
    id: 'cb_1',
    category: 'comeback',
    text: "I'd be offended but you're too cute for me to be mad at",
    tags: ['smooth', 'deflect'],
    copyCount: 0,
  },
  {
    id: 'cb_2',
    category: 'comeback',
    text: 'Wow and here I thought we were getting along 😂',
    tags: ['playful', 'humor'],
    copyCount: 0,
  },
  {
    id: 'cb_3',
    category: 'comeback',
    text: "That's fair. But at least I'm entertaining right?",
    tags: ['self-aware', 'charm'],
    copyCount: 0,
  },
  {
    id: 'cb_4',
    category: 'comeback',
    text: "You say that now, but give it a week and you'll be obsessed 😏",
    tags: ['confident', 'bold'],
    copyCount: 0,
  },
  {
    id: 'cb_5',
    category: 'comeback',
    text: "I'm going to screenshot this so when we're dating I can remind you of how mean you were at first",
    tags: ['bold', 'assumptive'],
    copyCount: 0,
  },
  {
    id: 'cb_6',
    category: 'comeback',
    text: 'Noted. Adding that to the list of things to prove you wrong about',
    tags: ['determined', 'playful'],
    copyCount: 0,
  },
  {
    id: 'cb_7',
    category: 'comeback',
    text: "That's okay, I wasn't trying to impress you anyway... okay maybe a little 😅",
    tags: ['vulnerable', 'charm'],
    copyCount: 0,
  },
  {
    id: 'cb_8',
    category: 'comeback',
    text: 'Bold words from someone who matched with me 👀',
    tags: ['witty', 'counter'],
    copyCount: 0,
  },
  {
    id: 'cb_9',
    category: 'comeback',
    text: 'Ouch 😂 but honestly I walked right into that one',
    tags: ['self-aware', 'humor'],
    copyCount: 0,
  },
  {
    id: 'cb_10',
    category: 'comeback',
    text: "I respect that. Most people can't handle my energy anyway",
    tags: ['confident', 'mysterious'],
    copyCount: 0,
  },

  // ===== FLIRTY =====
  {
    id: 'fl_1',
    category: 'flirty',
    text: "You're dangerously charming and I think you know it",
    tags: ['direct', 'compliment'],
    copyCount: 0,
  },
  {
    id: 'fl_2',
    category: 'flirty',
    text: "I'm trying to play it cool but you're making it really hard",
    tags: ['honest', 'vulnerable'],
    copyCount: 0,
  },
  {
    id: 'fl_3',
    category: 'flirty',
    text: "Something tells me you're the kind of trouble I'd enjoy",
    tags: ['bold', 'suggestive'],
    copyCount: 0,
  },
  {
    id: 'fl_4',
    category: 'flirty',
    text: "If you keep making me laugh like this, I'm going to have to take you out",
    tags: ['escalating', 'humor'],
    copyCount: 0,
  },
  {
    id: 'fl_5',
    category: 'flirty',
    text: "You have this energy that just makes people want to know more. It's working on me",
    tags: ['sincere', 'compliment'],
    copyCount: 0,
  },
  {
    id: 'fl_6',
    category: 'flirty',
    text: "I had a dream about someone like you. Except you're real and somehow better",
    tags: ['smooth', 'creative'],
    copyCount: 0,
  },
  {
    id: 'fl_7',
    category: 'flirty',
    text: "The more I talk to you, the more I realize I should've swiped right sooner",
    tags: ['sweet', 'regret'],
    copyCount: 0,
  },
  {
    id: 'fl_8',
    category: 'flirty',
    text: "Be honest with me... is it weird that I'm already looking forward to your next message?",
    tags: ['vulnerable', 'eager'],
    copyCount: 0,
  },
  {
    id: 'fl_9',
    category: 'flirty',
    text: 'If I told you you had a beautiful mind, would you hold it against me? 😏',
    tags: ['clever', 'classic'],
    copyCount: 0,
  },
  {
    id: 'fl_10',
    category: 'flirty',
    text: "I should warn you — I'm really good at making people fall for me. You've been warned",
    tags: ['confident', 'playful'],
    copyCount: 0,
  },

  // ===== FUNNY =====
  {
    id: 'fn_1',
    category: 'funny',
    text: 'On a scale of 1 to stepping on a LEGO, how much do you miss me already?',
    tags: ['random', 'absurd'],
    copyCount: 0,
  },
  {
    id: 'fn_2',
    category: 'funny',
    text: "I'm not saying we're soulmates, but my horoscope app just sent me a notification so...",
    tags: ['self-deprecating', 'quirky'],
    copyCount: 0,
  },
  {
    id: 'fn_3',
    category: 'funny',
    text: "Just googled 'what to say to someone way out of my league' and here I am",
    tags: ['self-deprecating', 'charm'],
    copyCount: 0,
  },
  {
    id: 'fn_4',
    category: 'funny',
    text: "My dog just approved your photos. He's very picky so this is a big deal",
    tags: ['pet', 'playful'],
    copyCount: 0,
  },
  {
    id: 'fn_5',
    category: 'funny',
    text: "I'm the kind of person who'll double text and not even feel bad about it. Consider this my warning",
    tags: ['honest', 'bold'],
    copyCount: 0,
  },
  {
    id: 'fn_6',
    category: 'funny',
    text: "Fun fact: the average person spends 2 weeks of their life waiting for traffic lights. I'd rather spend it texting you",
    tags: ['random', 'sweet'],
    copyCount: 0,
  },
  {
    id: 'fn_7',
    category: 'funny',
    text: 'I was going to send you a pickup line but I have the emotional range of a potato today',
    tags: ['self-deprecating', 'relatable'],
    copyCount: 0,
  },
  {
    id: 'fn_8',
    category: 'funny',
    text: 'You seem like the kind of person whose fridge has actual food in it. Very attractive quality',
    tags: ['random', 'mature'],
    copyCount: 0,
  },
  {
    id: 'fn_9',
    category: 'funny',
    text: 'Not to brag but I once microwaved something for the exact right amount of time',
    tags: ['absurd', 'flex'],
    copyCount: 0,
  },
  {
    id: 'fn_10',
    category: 'funny',
    text: "I promise I'm funnier in person. Or maybe I'm just more awkward. Either way it'll be entertaining",
    tags: ['honest', 'charming'],
    copyCount: 0,
  },

  // ===== DEEP =====
  {
    id: 'dp_1',
    category: 'deep',
    text: "What's something you believe that most people would disagree with?",
    tags: ['philosophical', 'thought-provoking'],
    copyCount: 0,
  },
  {
    id: 'dp_2',
    category: 'deep',
    text: 'Tell me about a moment that completely changed how you see the world',
    tags: ['personal', 'deep'],
    copyCount: 0,
  },
  {
    id: 'dp_3',
    category: 'deep',
    text: 'If you could master any skill overnight, what would it be and why?',
    tags: ['creative', 'revealing'],
    copyCount: 0,
  },
  {
    id: 'dp_4',
    category: 'deep',
    text: "What's the most spontaneous thing you've ever done? I feel like your answer will tell me a lot about you",
    tags: ['adventurous', 'curious'],
    copyCount: 0,
  },
  {
    id: 'dp_5',
    category: 'deep',
    text: "What's your love language? And before you say 'food' — same",
    tags: ['romantic', 'humor'],
    copyCount: 0,
  },
  {
    id: 'dp_6',
    category: 'deep',
    text: 'What do you want your life to look like in 5 years? Not career, just the vibe of it',
    tags: ['future', 'vision'],
    copyCount: 0,
  },
  {
    id: 'dp_7',
    category: 'deep',
    text: "What's one thing you're really proud of that you don't usually talk about?",
    tags: ['vulnerable', 'meaningful'],
    copyCount: 0,
  },
  {
    id: 'dp_8',
    category: 'deep',
    text: 'Do you think people can really change, or do we just get better at hiding who we are?',
    tags: ['philosophical', 'provocative'],
    copyCount: 0,
  },
  {
    id: 'dp_9',
    category: 'deep',
    text: 'If you could have dinner with anyone — alive or dead — who and what would you ask them?',
    tags: ['creative', 'classic'],
    copyCount: 0,
  },
  {
    id: 'dp_10',
    category: 'deep',
    text: 'What makes you feel most alive? Not the Instagram answer — the real one',
    tags: ['authentic', 'personal'],
    copyCount: 0,
  },

  // ===== CLOSING (GET NUMBER) =====
  {
    id: 'cl_1',
    category: 'closing',
    text: "I feel like we've outgrown this app. What's your number? 📱",
    tags: ['direct', 'confident'],
    copyCount: 0,
  },
  {
    id: 'cl_2',
    category: 'closing',
    text: 'This conversation deserves better than a dating app notification. Can I text you for real?',
    tags: ['smooth', 'escalating'],
    copyCount: 0,
  },
  {
    id: 'cl_3',
    category: 'closing',
    text: "I'd rather hear your voice than read your texts. Can I call you sometime?",
    tags: ['bold', 'romantic'],
    copyCount: 0,
  },
  {
    id: 'cl_4',
    category: 'closing',
    text: "I'm having too much fun talking to you to leave it to this app's mercy. Number swap?",
    tags: ['casual', 'natural'],
    copyCount: 0,
  },
  {
    id: 'cl_5',
    category: 'closing',
    text: "My phone is way more fun to check when it's a text from you. Just saying... 📱",
    tags: ['subtle', 'hinting'],
    copyCount: 0,
  },
  {
    id: 'cl_6',
    category: 'closing',
    text: "So are we doing this? Because I'm ready to take you from 'match' to 'favorite contact'",
    tags: ['bold', 'playful'],
    copyCount: 0,
  },
  {
    id: 'cl_7',
    category: 'closing',
    text: 'I want to keep this going but I keep forgetting to check this app. Save me? 📲',
    tags: ['honest', 'natural'],
    copyCount: 0,
  },
  {
    id: 'cl_8',
    category: 'closing',
    text: 'I think we should move this to real life. Coffee this week?',
    tags: ['direct', 'action'],
    copyCount: 0,
  },
  {
    id: 'cl_9',
    category: 'closing',
    text: "I'm going to be bold here — let me take you out. What day works?",
    tags: ['bold', 'confident'],
    copyCount: 0,
  },
  {
    id: 'cl_10',
    category: 'closing',
    text: "So what's next? I vote for your number, a coffee, and maybe an argument about {topic}",
    blanks: ['{topic}'],
    tags: ['creative', 'specific'],
    copyCount: 0,
  },
];

// ==========================================
// Template Functions
// ==========================================

export function getTemplatesByCategory(category: TemplateCategory): ReplyTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): ReplyTemplate[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return TEMPLATES;
  return TEMPLATES.filter(
    (t) => t.text.toLowerCase().includes(lower) || t.tags.some((tag) => tag.includes(lower))
  );
}

export function getMostUsedTemplates(stats: TemplateStats[]): ReplyTemplate[] {
  const statsMap = new Map(stats.map((s) => [s.templateId, s]));
  return [...TEMPLATES]
    .map((t) => ({
      ...t,
      copyCount: statsMap.get(t.id)?.copyCount || t.copyCount,
    }))
    .filter((t) => t.copyCount > 0)
    .sort((a, b) => b.copyCount - a.copyCount);
}

export function customizeTemplate(template: ReplyTemplate, values: Record<string, string>): string {
  let result = template.text;
  if (template.blanks) {
    template.blanks.forEach((blank) => {
      const value = values[blank];
      if (value) {
        result = result.replace(blank, value);
      }
    });
  }
  return result;
}

export function getCategoryInfo(category: TemplateCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.key === category)!;
}

// ==========================================
// Stats Persistence
// ==========================================

const STATS_KEY = 'flirtkey_template_stats';

export async function loadTemplateStats(): Promise<TemplateStats[]> {
  const data = await AsyncStorage.getItem(STATS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function recordTemplateCopy(templateId: string): Promise<void> {
  const stats = await loadTemplateStats();
  const existing = stats.find((s) => s.templateId === templateId);
  if (existing) {
    existing.copyCount++;
    existing.lastUsed = Date.now();
  } else {
    stats.push({ templateId, copyCount: 1, lastUsed: Date.now() });
  }
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
