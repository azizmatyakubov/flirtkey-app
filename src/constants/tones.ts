/**
 * Tones - Tone definitions for AI response generation
 * Phase 1.1: Core AI Upgrades
 */

export const TONES = {
  flirty: { name: 'Flirty', emoji: '🔥', prompt: 'playful, teasing, suggestive but tasteful, confident' },
  witty: { name: 'Witty', emoji: '😏', prompt: 'clever wordplay, puns, intellectual humor, sharp' },
  bold: { name: 'Bold', emoji: '💪', prompt: 'direct, confident, assertive, alpha energy' },
  sweet: { name: 'Sweet', emoji: '🥰', prompt: 'caring, romantic, gentle, thoughtful, warm' },
  funny: { name: 'Funny', emoji: '😂', prompt: 'humor-first, jokes, memes, light-hearted' },
  chill: { name: 'Chill', emoji: '😎', prompt: 'laid-back, casual, low-effort, effortless cool' },
  deep: { name: 'Deep', emoji: '🧠', prompt: 'intellectual, philosophical, meaningful, thought-provoking' },
} as const;

export type ToneKey = keyof typeof TONES;

export interface ToneConfig {
  name: string;
  emoji: string;
  prompt: string;
}

export const TONE_KEYS = Object.keys(TONES) as ToneKey[];

export default TONES;
