/**
 * Style Analyzer Service
 * Phase 1.1: "Sound Like Me" Engine
 * 
 * Analyzes user's texting style and builds personalized prompts.
 */

import axios from 'axios';
import { UserStyle, StyleAnalysisResult } from '../types';

/**
 * Analyze an array of user messages to extract style patterns.
 * Uses GPT-4o-mini for intelligent analysis.
 */
export async function analyzeMessages(
  messages: string[],
  apiKey: string
): Promise<StyleAnalysisResult> {
  if (messages.length < 5) {
    throw new Error('Need at least 5 messages to analyze your style');
  }

  const messagesText = messages.map((m, i) => `${i + 1}. "${m}"`).join('\n');

  const prompt = `Analyze these text messages from a user to determine their texting style. These are messages they've sent to people they're dating/interested in.

MESSAGES:
${messagesText}

Analyze and return JSON only:
{
  "vocabulary": { "word_or_phrase": frequency_count, ... },
  "emojiPattern": { "emoji": frequency_count, ... },
  "avgLength": number_of_chars,
  "formality": 0.0_to_1.0,
  "humorStyle": "dry" | "silly" | "sarcastic" | "none",
  "useAbbreviations": true_or_false,
  "summary": "one sentence describing their texting style"
}

ANALYSIS GUIDELINES:
- vocabulary: top 10 most characteristic words/phrases they use
- emojiPattern: emojis they use with counts (empty {} if none)
- avgLength: average character count across messages
- formality: 0.0 = very casual (lol, nah, bruh) to 1.0 = very formal (complete sentences, proper grammar)
- humorStyle: dominant humor type or "none"
- useAbbreviations: do they use "u", "ur", "lol", "ngl", etc.?
- summary: e.g. "You text casually, use 😂🔥 often, average 15 words, dry humor"`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a text style analyst. Always respond with valid JSON only. No markdown, no code blocks.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse style analysis response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as StyleAnalysisResult;

    // Validate and normalize
    return {
      vocabulary: parsed.vocabulary || {},
      emojiPattern: parsed.emojiPattern || {},
      avgLength: Math.max(1, Math.round(parsed.avgLength || computeAvgLength(messages))),
      formality: Math.max(0, Math.min(1, parsed.formality ?? 0.5)),
      humorStyle: ['dry', 'silly', 'sarcastic', 'none'].includes(parsed.humorStyle)
        ? parsed.humorStyle
        : 'none',
      useAbbreviations: parsed.useAbbreviations ?? true,
      summary: parsed.summary || 'Style analysis complete',
    };
  } catch (error) {
    // Fallback to local analysis if API fails
    if (axios.isAxiosError(error)) {
      throw error;
    }
    return localAnalyzeMessages(messages);
  }
}

/**
 * Local fallback analysis without API call.
 */
function localAnalyzeMessages(messages: string[]): StyleAnalysisResult {
  const allText = messages.join(' ');
  const avgLength = computeAvgLength(messages);

  // Extract emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = allText.match(emojiRegex) || [];
  const emojiPattern: Record<string, number> = {};
  emojis.forEach((e) => {
    emojiPattern[e] = (emojiPattern[e] || 0) + 1;
  });

  // Check abbreviations
  const abbreviations = ['u', 'ur', 'lol', 'ngl', 'tbh', 'rn', 'nah', 'bruh', 'omg', 'imo'];
  const lowerText = allText.toLowerCase();
  const useAbbreviations = abbreviations.some((a) => lowerText.includes(a));

  // Rough formality check
  const hasProperSentences = messages.filter((m) => /^[A-Z].*[.!?]$/.test(m.trim())).length;
  const formality = Math.min(1, hasProperSentences / messages.length);

  // Word frequency
  const words = lowerText.split(/\s+/).filter((w) => w.length > 2);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length > 2) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });

  // Top 10 words
  const vocabulary: Record<string, number> = {};
  Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([word, count]) => {
      vocabulary[word] = count;
    });

  const emojiStr = Object.keys(emojiPattern).slice(0, 3).join('');
  const estimatedWords = Math.round(avgLength / 5);
  const summary = `You text ${formality < 0.3 ? 'very casually' : formality < 0.6 ? 'casually' : 'formally'}${emojiStr ? `, use ${emojiStr} often` : ''}, average ~${avgLength} chars (~${estimatedWords} words) per message`;

  return {
    vocabulary,
    emojiPattern,
    avgLength,
    formality,
    humorStyle: 'none',
    useAbbreviations,
    summary,
  };
}

function computeAvgLength(messages: string[]): number {
  if (messages.length === 0) return 0;
  const totalChars = messages.reduce((sum, m) => sum + m.length, 0);
  return Math.round(totalChars / messages.length);
}

/**
 * Build a few-shot prompt section from user's style profile.
 * This is injected into the main AI prompt to match the user's voice.
 */
export function buildStylePrompt(style: UserStyle): string {
  const parts: string[] = ['## YOUR TEXTING STYLE (match this voice):'];

  // Formality
  if (style.formality < 0.3) {
    parts.push('- Very casual: lowercase, abbreviations, short messages');
  } else if (style.formality < 0.6) {
    parts.push('- Casual: relaxed but readable, some proper grammar');
  } else {
    parts.push('- More formal: proper sentences, good grammar');
  }

  // Abbreviations
  if (style.useAbbreviations) {
    parts.push('- Uses abbreviations like "u", "ur", "lol", "ngl", "tbh"');
  } else {
    parts.push('- Spells out words fully, no text abbreviations');
  }

  // Humor
  if (style.humorStyle && style.humorStyle !== 'none') {
    parts.push(`- Humor style: ${style.humorStyle}`);
  }

  // Average length
  if (style.avgLength) {
    parts.push(`- Average message length: ~${style.avgLength} characters`);
  }

  // Emojis
  if (style.emojiPattern && Object.keys(style.emojiPattern).length > 0) {
    const topEmojis = Object.entries(style.emojiPattern)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emoji]) => emoji)
      .join(' ');
    parts.push(`- Favorite emojis: ${topEmojis}`);
  } else {
    parts.push('- Rarely uses emojis');
  }

  // Vocabulary
  if (style.vocabulary && Object.keys(style.vocabulary).length > 0) {
    const topWords = Object.entries(style.vocabulary)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
      .join(', ');
    parts.push(`- Common words/phrases: ${topWords}`);
  }

  // Example messages
  if (style.sampleMessages && style.sampleMessages.length > 0) {
    parts.push('\nEXAMPLE MESSAGES (match this style):');
    style.sampleMessages.slice(0, 5).forEach((msg) => {
      parts.push(`- "${msg}"`);
    });
  }

  return parts.join('\n');
}

/**
 * Convert a StyleAnalysisResult + messages into a UserStyle object.
 */
export function toUserStyle(
  analysis: StyleAnalysisResult,
  sampleMessages: string[]
): UserStyle {
  return {
    sampleMessages,
    vocabulary: analysis.vocabulary,
    emojiPattern: analysis.emojiPattern,
    avgLength: analysis.avgLength,
    formality: analysis.formality,
    humorStyle: analysis.humorStyle,
    useAbbreviations: analysis.useAbbreviations,
  };
}

export default {
  analyzeMessages,
  buildStylePrompt,
  toUserStyle,
};
