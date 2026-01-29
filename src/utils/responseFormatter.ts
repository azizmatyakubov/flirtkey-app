/**
 * Response Formatter - Format and enhance AI responses
 * Phase 5.3.7-5.3.8: Multi-language and formatting
 */

import { Suggestion, AnalysisResult } from '../types';

// ==========================================
// 5.3.7: Multi-language Support
// ==========================================

export type SupportedLanguage = 'en' | 'ru' | 'uz' | 'es' | 'fr' | 'de';

// Language detection (simple heuristic)
export function detectLanguage(text: string): SupportedLanguage {
  // Check for Cyrillic characters (Russian/Uzbek Cyrillic)
  const cyrillicPattern = /[\u0400-\u04FF]/;
  if (cyrillicPattern.test(text)) {
    // Check for Uzbek-specific characters
    const uzbekPattern = /[ўқғҳ]/i;
    if (uzbekPattern.test(text)) {
      return 'uz';
    }
    return 'ru';
  }

  // Check for Latin Uzbek characters (oʻ and gʻ with modifier letter apostrophe)
  // Must match the actual digraph, not just 'o' or 'g' alone
  const uzbekLatinPattern = /[oO]ʻ|[gG]ʻ|oʼ|gʼ/;
  if (uzbekLatinPattern.test(text)) {
    return 'uz';
  }

  // Check for Spanish-specific patterns
  const spanishPattern = /[ñáéíóúü]|¿|¡/i;
  if (spanishPattern.test(text)) {
    return 'es';
  }

  // Check for French-specific patterns
  const frenchPattern = /[àâçéèêëîïôûùü]|qu'|c'est/i;
  if (frenchPattern.test(text)) {
    return 'fr';
  }

  // Check for German-specific patterns
  const germanPattern = /[äöüß]|sch|ich|und/i;
  if (germanPattern.test(text)) {
    return 'de';
  }

  // Default to English
  return 'en';
}

// Match response language to input
export function shouldMatchLanguage(theirMessage: string): SupportedLanguage {
  return detectLanguage(theirMessage);
}

// Language-specific adjustments
const languageAdjustments: Record<
  SupportedLanguage,
  { emojiDensity: number; formalityBias: number }
> = {
  en: { emojiDensity: 0.7, formalityBias: 0 },
  ru: { emojiDensity: 0.5, formalityBias: 0.2 },
  uz: { emojiDensity: 0.4, formalityBias: 0.4 },
  es: { emojiDensity: 0.8, formalityBias: -0.1 },
  fr: { emojiDensity: 0.6, formalityBias: 0.1 },
  de: { emojiDensity: 0.5, formalityBias: 0.3 },
};

export function getLanguageSettings(lang: SupportedLanguage) {
  return languageAdjustments[lang] || languageAdjustments.en;
}

// ==========================================
// 5.3.8: Response Formatting (Emojis)
// ==========================================

// Emoji categories
const EMOJIS = {
  flirty: ['😏', '😉', '🔥', '💋', '😍', '🥰', '😘', '💕'],
  playful: ['😜', '😝', '🤪', '😋', '🤭', '😸', '🎉', '✨'],
  friendly: ['😊', '🙂', '😄', '👋', '💪', '🤝', '👍', '☺️'],
  romantic: ['❤️', '💗', '💖', '💘', '💓', '🌹', '💑', '💞'],
  funny: ['😂', '🤣', '😹', '💀', '😆', '🙈', '🤡', '😅'],
  thinking: ['🤔', '🧐', '💭', '🤷', '👀', '🙃'],
  cool: ['😎', '🆒', '💯', '⚡', '🌟', '✨'],
};

export type EmojiCategory = keyof typeof EMOJIS;

// Get random emoji from category
export function getEmoji(category: EmojiCategory): string {
  const emojis = EMOJIS[category];
  const index = Math.floor(Math.random() * emojis.length);
  return emojis[index] ?? '😊';
}

// Enhance text with appropriate emoji
export function enhanceWithEmoji(
  text: string,
  type: 'safe' | 'balanced' | 'bold',
  options: { addIfMissing?: boolean; maxEmojis?: number } = {}
): string {
  const { addIfMissing = false, maxEmojis = 2 } = options;

  // Check if already has emoji
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const existingEmojis = text.match(emojiPattern) || [];

  if (existingEmojis.length >= maxEmojis) {
    return text;
  }

  if (!addIfMissing && existingEmojis.length > 0) {
    return text;
  }

  // Add emoji based on suggestion type
  const categoryMap: Record<'safe' | 'balanced' | 'bold', EmojiCategory[]> = {
    safe: ['friendly', 'playful'],
    balanced: ['playful', 'flirty'],
    bold: ['flirty', 'romantic', 'cool'],
  };

  const categories = categoryMap[type];
  const categoryIndex = Math.floor(Math.random() * categories.length);
  const category = categories[categoryIndex] ?? 'friendly';
  const emoji = getEmoji(category);

  // Add at end if text doesn't end with punctuation
  if (!/[.!?]$/.test(text.trim())) {
    return `${text.trim()} ${emoji}`;
  }

  return `${text.trim()} ${emoji}`;
}

// Remove excessive emojis
export function normalizeEmojis(text: string, maxEmojis: number = 3): string {
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiPattern) || [];

  if (emojis.length <= maxEmojis) {
    return text;
  }

  // Keep first few emojis
  let count = 0;
  return text.replace(emojiPattern, (match) => {
    count++;
    return count <= maxEmojis ? match : '';
  });
}

// ==========================================
// Text Formatting
// ==========================================

// Match message length/style
export function matchMessageStyle(
  suggestion: string,
  theirMessage: string,
  options: { lengthTolerance?: number } = {}
): string {
  const { lengthTolerance = 0.5 } = options;

  const herLength = theirMessage.length;
  const suggestionLength = suggestion.length;

  // If suggestion is way longer, truncate smartly
  const maxLength = Math.ceil(herLength * (1 + lengthTolerance));

  if (suggestionLength > maxLength && herLength > 20) {
    // Find a good breaking point
    const truncated = suggestion.slice(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    if (lastSentenceEnd > maxLength * 0.5) {
      return truncated.slice(0, lastSentenceEnd + 1);
    }

    // Break at last space
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) {
      return truncated.slice(0, lastSpace) + '...';
    }
  }

  return suggestion;
}

// Detect and match texting style
export type TextingStyle = 'formal' | 'casual' | 'lowkey' | 'enthusiastic';

export function detectTextingStyle(text: string): TextingStyle {
  const hasCapitals = /[A-Z]/.test(text);
  const hasPunctuation = /[.!?]/.test(text);
  const hasExcessive = /!{2,}|\.{3,}|\?{2,}/.test(text);
  const hasSlang = /\b(lol|lmao|omg|ngl|tbh|fr|rn)\b/i.test(text);

  if (!hasCapitals && !hasPunctuation) {
    return 'lowkey';
  }

  if (hasExcessive || /!/.test(text)) {
    return 'enthusiastic';
  }

  if (hasSlang && !hasCapitals) {
    return 'casual';
  }

  return hasCapitals && hasPunctuation ? 'formal' : 'casual';
}

// Match texting style
export function matchTextingStyle(text: string, style: TextingStyle): string {
  switch (style) {
    case 'lowkey':
      // Lowercase, minimal punctuation
      return text.toLowerCase().replace(/[.!?,;:]+$/, '');

    case 'enthusiastic':
      // Add energy if missing
      if (!/[!]/.test(text)) {
        return text.replace(/[.?]$/, '!');
      }
      return text;

    case 'casual':
      // First letter lowercase, casual punctuation
      return text.charAt(0).toLowerCase() + text.slice(1);

    case 'formal':
    default:
      // Ensure proper capitalization
      return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

// ==========================================
// Full Response Formatting
// ==========================================

export interface FormatOptions {
  language?: SupportedLanguage;
  theirMessage?: string;
  addEmojis?: boolean;
  matchLength?: boolean;
  matchStyle?: boolean;
  maxEmojis?: number;
}

export function formatSuggestion(suggestion: Suggestion, options: FormatOptions = {}): Suggestion {
  let text = suggestion.text;

  const {
    theirMessage,
    addEmojis = true,
    matchLength = true,
    matchStyle = true,
    maxEmojis = 2,
  } = options;

  // Match length if their message provided
  if (matchLength && theirMessage) {
    text = matchMessageStyle(text, theirMessage);
  }

  // Match texting style
  if (matchStyle && theirMessage) {
    const style = detectTextingStyle(theirMessage);
    text = matchTextingStyle(text, style);
  }

  // Normalize emojis
  text = normalizeEmojis(text, maxEmojis);

  // Add emoji if enabled and missing
  if (addEmojis) {
    text = enhanceWithEmoji(text, suggestion.type, { addIfMissing: true, maxEmojis });
  }

  return {
    ...suggestion,
    text,
  };
}

export function formatResponse(
  response: AnalysisResult,
  options: FormatOptions = {}
): AnalysisResult {
  return {
    ...response,
    suggestions: response.suggestions.map((s) => formatSuggestion(s, options)),
  };
}

// ==========================================
// Export
// ==========================================

export const ResponseFormatter = {
  // Language
  detectLanguage,
  shouldMatchLanguage,
  getLanguageSettings,

  // Emojis
  getEmoji,
  enhanceWithEmoji,
  normalizeEmojis,

  // Text
  matchMessageStyle,
  detectTextingStyle,
  matchTextingStyle,

  // Full formatting
  formatSuggestion,
  formatResponse,
};

export default ResponseFormatter;
