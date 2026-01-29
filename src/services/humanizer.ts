/**
 * Humanizer Service
 * Phase 1.2: Post-processor that makes AI output sound natural
 * 
 * Applies human imperfections and natural texting patterns to AI-generated text.
 */

export interface HumanizeOptions {
  /** 0.0 = formal, 1.0 = very casual */
  casualLevel: number;
  /** Add occasional typos */
  addTypos: boolean;
  /** Use text abbreviations (u, ur, lol, ngl) */
  useAbbreviations: boolean;
  /** Match energy level of their message length */
  matchEnergyLevel: boolean;
  /** Maximum output length in characters */
  maxLength?: number;
  /** Their message length to match energy */
  theirMessageLength?: number;
  /** Optional seed for deterministic random (0-1). When set, all random choices use this instead of Math.random(). */
  seed?: number;
}

// Seeded random number generator for deterministic/testable output
// Uses a mutable state object to avoid module-level global mutation issues
interface RandomState {
  seed: number | undefined;
}

function createRandomState(seed?: number): RandomState {
  return {
    seed: seed !== undefined ? Math.floor(seed * 2147483646) + 1 : undefined,
  };
}

function seededRandomFrom(state: RandomState): number {
  if (state.seed === undefined) return Math.random();
  // Simple LCG PRNG
  state.seed = (state.seed * 16807 + 0) % 2147483647;
  return (state.seed - 1) / 2147483646;
}

// Module-level state for backward compatibility (non-concurrent use)
let _rng: RandomState = { seed: undefined };
function seededRandom(): number {
  return seededRandomFrom(_rng);
}

const DEFAULT_OPTIONS: HumanizeOptions = {
  casualLevel: 0.6,
  addTypos: false,
  useAbbreviations: true,
  matchEnergyLevel: true,
  maxLength: undefined,
  theirMessageLength: undefined,
};

// Filler words/phrases that make text sound natural
const FILLERS = ['honestly', 'lowkey', 'ngl', 'tbh', 'actually', 'fr', 'imo'];
const THINKING_WORDS = ['hmm', 'ok so', 'well', 'i mean', 'like'];
const CASUAL_STARTERS = ['haha', 'lol', 'ooh', 'yo', 'ayy', 'damn'];

// Common abbreviation mappings
const ABBREVIATIONS: Record<string, string> = {
  'you': 'u',
  'your': 'ur',
  "you're": 'ur',
  'are': 'r',
  'before': 'b4',
  'tonight': '2nite',
  'tomorrow': 'tmrw',
  'because': 'cuz',
  'probably': 'prob',
  'definitely': 'def',
  'something': 'smth',
  'someone': 'sm1',
  'about': 'abt',
  'people': 'ppl',
  'though': 'tho',
  'through': 'thru',
  'right': 'rite',
  'please': 'pls',
  'going to': 'gonna',
  'want to': 'wanna',
  'got to': 'gotta',
  'kind of': 'kinda',
  'sort of': 'sorta',
};

// Common typo patterns (letter swaps for adjacent keys)
const TYPO_SWAPS: Record<string, string> = {
  'e': 'r',
  'i': 'o',
  'a': 's',
  't': 'r',
  'n': 'm',
  'o': 'p',
  'h': 'j',
};

/**
 * Main humanize function - applies natural imperfections to AI text.
 */
export function humanize(text: string, options: Partial<HumanizeOptions> = {}): string {
  const opts: HumanizeOptions = { ...DEFAULT_OPTIONS, ...options };
  // Set up seeded random if provided — use isolated state to avoid concurrent mutation
  _rng = createRandomState(opts.seed);
  let result = text;

  // Step 1: Match energy level (message length)
  if (opts.matchEnergyLevel && opts.theirMessageLength !== undefined) {
    result = matchEnergy(result, opts.theirMessageLength);
  }

  // Step 2: Apply casualness transforms
  if (opts.casualLevel > 0.3) {
    result = applyCasualTransforms(result, opts.casualLevel);
  }

  // Step 3: Apply abbreviations
  if (opts.useAbbreviations && opts.casualLevel > 0.4) {
    result = applyAbbreviations(result, opts.casualLevel);
  }

  // Step 4: Add fillers occasionally
  if (opts.casualLevel > 0.5 && seededRandom() < 0.3) {
    result = addFiller(result, opts.casualLevel);
  }

  // Step 5: Add typos (very sparingly)
  if (opts.addTypos && seededRandom() < 0.15) {
    result = addTypo(result);
  }

  // Step 6: Apply max length
  if (opts.maxLength && result.length > opts.maxLength) {
    result = truncateNaturally(result, opts.maxLength);
  }

  return result.trim();
}

/**
 * Match the energy/length of their message.
 * Short their message = short response. Long = can be longer.
 */
function matchEnergy(text: string, herLength: number): string {
  // If their message is very short (< 20 chars), keep response short too
  if (herLength < 20 && text.length > 80) {
    // Take first sentence or first 80 chars
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 80) {
      return firstSentence;
    }
    return text.substring(0, 80).trim();
  }

  // If their message is medium (20-80), keep response moderate
  if (herLength < 80 && text.length > 150) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let result = '';
    for (const sentence of sentences) {
      if ((result + sentence).length > 150) break;
      result += (result ? ' ' : '') + sentence;
    }
    return result || text.substring(0, 150).trim();
  }

  return text;
}

/**
 * Apply casual text transforms.
 */
function applyCasualTransforms(text: string, level: number): string {
  let result = text;

  // Lowercase first letter (very casual)
  if (level > 0.6 && seededRandom() < level) {
    result = result.charAt(0).toLowerCase() + result.slice(1);
  }

  // Remove trailing period (casual texters don't end with periods)
  if (level > 0.3) {
    result = result.replace(/\.$/g, '');
  }

  // Remove periods mid-text for very casual
  if (level > 0.7) {
    // Replace "sentence. Next" with "sentence next" (sometimes)
    result = result.replace(/\. ([a-z])/g, (_, letter) => {
      return seededRandom() < 0.4 ? ` ${letter}` : `. ${letter}`;
    });
  }

  // Add ellipsis trailing sometimes
  if (level > 0.5 && seededRandom() < 0.15 && !result.endsWith('...')) {
    result = result.replace(/[.!?]?$/, '...');
  }

  return result;
}

/**
 * Replace words with text abbreviations.
 */
function applyAbbreviations(text: string, level: number): string {
  let result = text;

  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    // Only apply some abbreviations based on casualness
    if (seededRandom() < level * 0.5) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      result = result.replace(regex, abbr);
    }
  }

  return result;
}

/**
 * Add a natural filler word/phrase.
 */
function addFiller(text: string, level: number): string {
  const pool = level > 0.7 ? [...FILLERS, ...THINKING_WORDS, ...CASUAL_STARTERS] : FILLERS;
  const filler = pool[Math.floor(seededRandom() * pool.length)];

  // Add at start sometimes
  if (seededRandom() < 0.6) {
    return `${filler} ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }

  // Insert after first phrase
  const commaIndex = text.indexOf(',');
  if (commaIndex > 0 && commaIndex < 30) {
    return `${text.substring(0, commaIndex + 1)} ${filler}${text.substring(commaIndex + 1)}`;
  }

  return text;
}

/**
 * Add a natural-looking typo (very sparingly).
 */
function addTypo(text: string): string {
  const words = text.split(' ');
  if (words.length < 3) return text;

  // Pick a random word (not first or last)
  const wordIndex = 1 + Math.floor(seededRandom() * (words.length - 2));
  const word = words[wordIndex];
  if (!word || word.length < 4) return text;

  // Swap one letter
  const charIndex = 1 + Math.floor(seededRandom() * (word.length - 2));
  const char = word[charIndex]?.toLowerCase();
  if (char && TYPO_SWAPS[char]) {
    const typoWord = word.substring(0, charIndex) + TYPO_SWAPS[char] + word.substring(charIndex + 1);
    words[wordIndex] = typoWord;
    return words.join(' ');
  }

  return text;
}

/**
 * Truncate text naturally at a word boundary.
 */
function truncateNaturally(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace);
  }

  return truncated;
}

/**
 * Break a long message into multiple shorter natural-sounding messages.
 * Returns an array of message parts.
 */
export function breakIntoMessages(text: string, maxPerMessage: number = 100): string[] {
  if (text.length <= maxPerMessage) return [text];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const messages: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxPerMessage && current.length > 0) {
      messages.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) {
    messages.push(current.trim());
  }

  return messages.length > 0 ? messages : [text];
}

export default { humanize, breakIntoMessages };
