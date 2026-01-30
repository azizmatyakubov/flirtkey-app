/**
 * Profile Optimizer Service
 * Hour 2: AI-powered dating profile analysis
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface ProfileScore {
  overall: number; // 1-100
  bioQuality: number;
  photoVariety: number;
  conversationStarters: number;
  overallAppeal: number;
}

export interface ProfileSuggestion {
  id: string;
  category: 'bio' | 'photos' | 'prompts' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  example?: string;
  icon: string;
}

export interface PhotoSuggestion {
  type: 'selfie' | 'activity' | 'group' | 'travel' | 'pet' | 'dressed_up';
  label: string;
  description: string;
  icon: string;
  hasIt: boolean;
}

export interface ProfileReview {
  id: string;
  timestamp: number;
  imageUri?: string;
  score: ProfileScore;
  suggestions: ProfileSuggestion[];
  photoSuggestions: PhotoSuggestion[];
  bioFeedback: string;
  overallFeedback: string;
}

// ==========================================
// Analysis Logic (Heuristic + ready for AI integration)
// ==========================================

const BIO_TIPS: ProfileSuggestion[] = [
  {
    id: 'bio_1',
    category: 'bio',
    priority: 'high',
    title: 'Add Humor',
    description:
      'Profiles with humor get 15% more matches. Add a funny line or self-deprecating joke.',
    example: '"6\'2 because apparently that matters" or "Fluent in sarcasm and GIFs"',
    icon: '😂',
  },
  {
    id: 'bio_2',
    category: 'bio',
    priority: 'high',
    title: "Show, Don't Tell",
    description: 'Instead of "I love adventure", say "Just got back from skydiving in Dubai".',
    example: '"Currently training for my first marathon" > "I\'m athletic"',
    icon: '🎯',
  },
  {
    id: 'bio_3',
    category: 'bio',
    priority: 'medium',
    title: 'Add a Conversation Hook',
    description:
      'End your bio with something easy to respond to — a question, hot take, or unusual fact.',
    example: '"Hot take: pineapple belongs on pizza and I will die on this hill 🍍"',
    icon: '🎣',
  },
  {
    id: 'bio_4',
    category: 'bio',
    priority: 'medium',
    title: 'Keep It Concise',
    description: 'Bios under 150 characters get more engagement. Quality over quantity.',
    icon: '✂️',
  },
  {
    id: 'bio_5',
    category: 'bio',
    priority: 'low',
    title: 'Remove Negativity',
    description:
      'Cut phrases like "no drama", "don\'t waste my time", "swipe left if...". Focus on positives.',
    icon: '🚫',
  },
];

const PHOTO_SUGGESTIONS: PhotoSuggestion[] = [
  {
    type: 'selfie',
    label: 'Clear Face Shot',
    description: 'A well-lit selfie or portrait where your face is clearly visible. No sunglasses.',
    icon: '🤳',
    hasIt: false,
  },
  {
    type: 'activity',
    label: 'Action Shot',
    description: 'You doing something fun — sports, cooking, playing music, hiking.',
    icon: '🏃',
    hasIt: false,
  },
  {
    type: 'group',
    label: 'Social Photo',
    description:
      "A photo with friends (but make sure you're easy to spot). Shows you have a social life.",
    icon: '👫',
    hasIt: false,
  },
  {
    type: 'travel',
    label: 'Travel/Adventure',
    description: 'A photo from a trip or interesting location. Conversation starter built in.',
    icon: '✈️',
    hasIt: false,
  },
  {
    type: 'pet',
    label: 'Pet Photo',
    description:
      'If you have a pet, this is an automatic conversation starter and likability boost.',
    icon: '🐕',
    hasIt: false,
  },
  {
    type: 'dressed_up',
    label: 'Dressed Up',
    description: "A photo where you're looking your best — event, dinner, or occasion.",
    icon: '👔',
    hasIt: false,
  },
];

const PROMPT_SUGGESTIONS: ProfileSuggestion[] = [
  {
    id: 'prompt_1',
    category: 'prompts',
    priority: 'high',
    title: 'Use Specific Details',
    description:
      'Generic prompts bore people. "I love food" → "I make the best homemade pasta from scratch"',
    icon: '📝',
  },
  {
    id: 'prompt_2',
    category: 'prompts',
    priority: 'medium',
    title: 'Show Your Personality',
    description: 'Let your unique voice come through. Be specific about your quirks and passions.',
    icon: '✨',
  },
  {
    id: 'prompt_3',
    category: 'prompts',
    priority: 'medium',
    title: 'Create Easy Replies',
    description: 'Good prompts make it easy for someone to start a conversation with you.',
    example:
      '"Two truths and a lie: I\'ve swum with sharks, I speak 3 languages, I was on a TV show"',
    icon: '💬',
  },
];

const GENERAL_TIPS: ProfileSuggestion[] = [
  {
    id: 'gen_1',
    category: 'general',
    priority: 'high',
    title: 'First Photo Is Everything',
    description:
      'Your first photo gets 2 seconds to make an impression. Use your best clear face shot.',
    icon: '⭐',
  },
  {
    id: 'gen_2',
    category: 'general',
    priority: 'medium',
    title: 'Verify Your Profile',
    description: 'Verified profiles get significantly more matches. It builds trust instantly.',
    icon: '✅',
  },
  {
    id: 'gen_3',
    category: 'general',
    priority: 'low',
    title: 'Update Regularly',
    description: 'Fresh profiles get boosted by algorithms. Update photos/bio every 2-3 weeks.',
    icon: '🔄',
  },
];

/**
 * Analyze a profile and generate a review.
 * Currently uses heuristics; ready for AI integration.
 */
export function analyzeProfile(options?: {
  hasBio?: boolean;
  bioLength?: number;
  photoCount?: number;
  hasPrompts?: boolean;
}): ProfileReview {
  const { hasBio = true, bioLength = 80, photoCount = 3, hasPrompts = true } = options || {};

  // Score calculation
  let bioScore = 50;
  if (hasBio) {
    if (bioLength > 100) bioScore = 70;
    if (bioLength > 50 && bioLength <= 150) bioScore = 80;
    if (bioLength > 150) bioScore = 60; // Too long
  } else {
    bioScore = 20;
  }

  let photoScore = Math.min(100, photoCount * 18 + 10);
  if (photoCount < 3) photoScore = Math.max(20, photoScore - 20);

  let promptScore = hasPrompts ? 70 : 30;
  if (hasPrompts && bioLength > 50) promptScore = 80;

  const appealScore = Math.round((bioScore + photoScore + promptScore) / 3);
  const overall = Math.round(
    bioScore * 0.25 + photoScore * 0.35 + promptScore * 0.2 + appealScore * 0.2
  );

  const score: ProfileScore = {
    overall: Math.min(100, Math.max(1, overall)),
    bioQuality: bioScore,
    photoVariety: photoScore,
    conversationStarters: promptScore,
    overallAppeal: appealScore,
  };

  // Build suggestions based on weaknesses
  const suggestions: ProfileSuggestion[] = [];
  if (bioScore < 70) suggestions.push(...BIO_TIPS.slice(0, 3));
  else suggestions.push(BIO_TIPS[2]!); // Always suggest hook

  if (promptScore < 70) suggestions.push(...PROMPT_SUGGESTIONS);
  else suggestions.push(PROMPT_SUGGESTIONS[0]!);

  suggestions.push(...GENERAL_TIPS.filter((t) => t.priority === 'high'));

  // Photo variety suggestions
  const photoSuggestions = PHOTO_SUGGESTIONS.map((ps, i) => ({
    ...ps,
    hasIt: i < photoCount, // Simulate which they have
  }));

  // Feedback
  let bioFeedback = '';
  if (bioScore >= 80) bioFeedback = 'Your bio looks great! Engaging and the right length.';
  else if (bioScore >= 60)
    bioFeedback = 'Your bio is decent but could use more personality and specificity.';
  else
    bioFeedback =
      'Your bio needs significant improvement. Make it specific, humorous, and concise.';

  let overallFeedback = '';
  if (overall >= 80) overallFeedback = "🔥 Strong profile! A few tweaks and you'll be unstoppable.";
  else if (overall >= 60)
    overallFeedback = '👍 Solid foundation. Focus on the suggestions below to level up.';
  else if (overall >= 40)
    overallFeedback = '💪 Room for improvement. The good news? Small changes = big results.';
  else overallFeedback = "📈 Let's rebuild this profile from the ground up. Follow these tips!";

  return {
    id: `review_${Date.now()}`,
    timestamp: Date.now(),
    score,
    suggestions,
    photoSuggestions,
    bioFeedback,
    overallFeedback,
  };
}

// ==========================================
// Persistence
// ==========================================

const REVIEWS_KEY = 'flirtkey_profile_reviews';

export async function saveReview(review: ProfileReview): Promise<void> {
  const existing = await loadReviews();
  existing.unshift(review);
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(existing.slice(0, 20)));
}

export async function loadReviews(): Promise<ProfileReview[]> {
  const data = await AsyncStorage.getItem(REVIEWS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#2ED573';
  if (score >= 60) return '#FFBE76';
  if (score >= 40) return '#FF8E53';
  return '#FF4757';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Decent';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}
