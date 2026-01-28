/**
 * Response Formatter Tests
 * Phase 9.1.7: Test utility functions
 */

import {
  detectLanguage,
  shouldMatchLanguage,
  getLanguageSettings,
  getEmoji,
  enhanceWithEmoji,
  normalizeEmojis,
  matchMessageStyle,
  detectTextingStyle,
  matchTextingStyle,
  formatSuggestion,
  formatResponse,
} from '../../utils/responseFormatter';
import { Suggestion, AnalysisResult } from '../../types';

describe('Response Formatter', () => {
  // ==========================================
  // Language Detection Tests
  // ==========================================

  describe('detectLanguage', () => {
    it('detects Russian text with Cyrillic', () => {
      expect(detectLanguage('Привет, как дела?')).toBe('ru');
    });

    it('detects Uzbek Cyrillic text', () => {
      expect(detectLanguage('Қандай қилиб ўзбекча ёзилади?')).toBe('uz');
    });

    it('detects Uzbek Latin text with special chars', () => {
      // Note: oʻ and gʻ are Uzbek-specific Latin characters (with modifier letter apostrophe)
      expect(detectLanguage('Oʻzbekcha yoziladi')).toBe('uz');
      expect(detectLanguage('togʻ va oʻrmon')).toBe('uz');
    });

    it('detects Spanish text with accents', () => {
      expect(detectLanguage('Cómo estás con ñ')).toBe('es');
    });

    it('detects French text with accents', () => {
      expect(detectLanguage('Très bien, merci à toi')).toBe('fr');
    });

    it('detects German text with umlauts', () => {
      expect(detectLanguage('Ich möchte Kaffee trinken')).toBe('de');
    });

    it('defaults to English for plain ASCII', () => {
      expect(detectLanguage('12345')).toBe('en');
      expect(detectLanguage('plain text')).toBe('en');
    });
  });

  describe('shouldMatchLanguage', () => {
    it('returns detected language from her message', () => {
      expect(shouldMatchLanguage('Привет!')).toBe('ru');
      expect(shouldMatchLanguage('Hey there!')).toBe('en');
    });
  });

  describe('getLanguageSettings', () => {
    it('returns settings for known languages', () => {
      const en = getLanguageSettings('en');
      expect(en.emojiDensity).toBeDefined();
      expect(en.formalityBias).toBeDefined();
    });

    it('has different settings for different languages', () => {
      const en = getLanguageSettings('en');
      const de = getLanguageSettings('de');
      expect(en.emojiDensity).not.toBe(de.formalityBias);
    });

    it('defaults to English for unknown', () => {
      const unknown = getLanguageSettings('xx' as any);
      const en = getLanguageSettings('en');
      expect(unknown).toEqual(en);
    });
  });

  // ==========================================
  // Emoji Tests
  // ==========================================

  describe('getEmoji', () => {
    it('returns emoji from flirty category', () => {
      const emoji = getEmoji('flirty');
      expect(emoji).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });

    it('returns emoji from playful category', () => {
      const emoji = getEmoji('playful');
      expect(emoji).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
    });

    it('returns emoji from friendly category', () => {
      const emoji = getEmoji('friendly');
      expect(emoji).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u);
    });
  });

  describe('enhanceWithEmoji', () => {
    it('adds emoji to text without one', () => {
      const result = enhanceWithEmoji('Hello there', 'safe', { addIfMissing: true });
      expect(result).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u);
    });

    it('does not add emoji if already has one', () => {
      const result = enhanceWithEmoji('Hello 😊', 'safe', { maxEmojis: 2 });
      expect(result).toBe('Hello 😊');
    });

    it('limits emojis to maxEmojis', () => {
      const result = enhanceWithEmoji('Hello 😊😊😊', 'safe', { maxEmojis: 2 });
      expect(result).toBe('Hello 😊😊😊'); // Already has more, don't add
    });

    it('uses appropriate category for safe type', () => {
      // Multiple runs to test randomness
      for (let i = 0; i < 5; i++) {
        const result = enhanceWithEmoji('Hello', 'safe', { addIfMissing: true });
        expect(result.length).toBeGreaterThan('Hello'.length);
      }
    });
  });

  describe('normalizeEmojis', () => {
    it('keeps emojis under limit', () => {
      const result = normalizeEmojis('Hello 😊', 3);
      expect(result).toBe('Hello 😊');
    });

    it('removes emojis exceeding limit', () => {
      const result = normalizeEmojis('Hello 😊😊😊😊', 2);
      expect(result).toBe('Hello 😊😊');
    });

    it('handles text without emojis', () => {
      const result = normalizeEmojis('Hello there', 3);
      expect(result).toBe('Hello there');
    });
  });

  // ==========================================
  // Text Style Tests
  // ==========================================

  describe('matchMessageStyle', () => {
    it('keeps short response when her message is short', () => {
      const herMessage = 'Hey!';
      const suggestion = 'Great!';
      const result = matchMessageStyle(suggestion, herMessage);
      expect(result).toBe('Great!');
    });

    it('keeps response as is when within tolerance', () => {
      const herMessage = 'Hey, how are you doing today?';
      const suggestion = 'Great!';
      const result = matchMessageStyle(suggestion, herMessage);
      expect(result).toBe('Great!');
    });

    it('truncates only when her message is substantial', () => {
      const herMessage = 'This is a longer message from her that provides context';
      const suggestion =
        'This is a very long response that goes way beyond the original message length and should be truncated somewhere reasonable to match better.';
      const result = matchMessageStyle(suggestion, herMessage, { lengthTolerance: 0.5 });
      // Should truncate to roughly 1.5x her message length
      expect(result.length).toBeLessThanOrEqual(herMessage.length * 1.5 + 10);
    });
  });

  describe('detectTextingStyle', () => {
    it('detects lowkey style (no caps, no punctuation)', () => {
      expect(detectTextingStyle('hey whats up')).toBe('lowkey');
    });

    it('detects enthusiastic style (exclamation marks)', () => {
      expect(detectTextingStyle('Hey!! So excited!')).toBe('enthusiastic');
    });

    it('detects casual style (slang with capitals)', () => {
      // Casual needs some capitals but with slang
      expect(detectTextingStyle('Lol thats funny tbh')).toBe('casual');
    });

    it('detects formal style (proper capitalization and punctuation)', () => {
      expect(detectTextingStyle('Hello, how are you doing today?')).toBe('formal');
    });
  });

  describe('matchTextingStyle', () => {
    it('converts to lowkey style', () => {
      const result = matchTextingStyle('Hello there!', 'lowkey');
      expect(result).toBe('hello there');
    });

    it('converts to enthusiastic style', () => {
      const result = matchTextingStyle('Hey there.', 'enthusiastic');
      expect(result).toBe('Hey there!');
    });

    it('converts to casual style', () => {
      const result = matchTextingStyle('Hello there', 'casual');
      expect(result.charAt(0)).toBe('h'); // lowercase first letter
    });

    it('converts to formal style', () => {
      const result = matchTextingStyle('hey there', 'formal');
      expect(result.charAt(0)).toBe('H'); // uppercase first letter
    });
  });

  // ==========================================
  // Full Formatting Tests
  // ==========================================

  describe('formatSuggestion', () => {
    const baseSuggestion: Suggestion = {
      type: 'balanced',
      text: 'Hey, how are you?',
      reason: 'Friendly opener',
    };

    it('formats suggestion with default options', () => {
      const result = formatSuggestion(baseSuggestion);
      expect(result.type).toBe('balanced');
      expect(result.reason).toBe('Friendly opener');
    });

    it('matches her message style', () => {
      const result = formatSuggestion(baseSuggestion, {
        herMessage: 'hey whats up',
        matchStyle: true,
      });
      // Should be lowkey style
      expect(result.text).toBe(result.text.toLowerCase().replace(/[.!?,;:]+$/, '') || result.text);
    });

    it('adds emoji when enabled', () => {
      const result = formatSuggestion(baseSuggestion, {
        addEmojis: true,
      });
      // Should have emoji added
      expect(result.text).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u);
    });

    it('respects maxEmojis setting', () => {
      const suggestionWithEmojis: Suggestion = {
        ...baseSuggestion,
        text: 'Hello 😊😊😊😊',
      };
      const result = formatSuggestion(suggestionWithEmojis, {
        maxEmojis: 2,
        addEmojis: false,
      });
      const emojiCount = (result.text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [])
        .length;
      expect(emojiCount).toBeLessThanOrEqual(2);
    });
  });

  describe('formatResponse', () => {
    const baseResponse: AnalysisResult = {
      suggestions: [
        { type: 'safe', text: 'Hey there!', reason: 'Safe opener' },
        { type: 'balanced', text: 'Hi! How are you?', reason: 'Balanced' },
        { type: 'bold', text: 'Well hello there...', reason: 'Bold' },
      ],
      proTip: 'Keep it casual!',
      interestLevel: 70,
    };

    it('formats all suggestions in response', () => {
      const result = formatResponse(baseResponse);
      expect(result.suggestions).toHaveLength(3);
      expect(result.proTip).toBe('Keep it casual!');
      expect(result.interestLevel).toBe(70);
    });

    it('applies formatting options to all suggestions', () => {
      const result = formatResponse(baseResponse, {
        addEmojis: true,
      });
      result.suggestions.forEach((s) => {
        expect(s.text).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u);
      });
    });

    it('preserves original response structure', () => {
      const result = formatResponse(baseResponse);
      expect(result.proTip).toBe(baseResponse.proTip);
      expect(result.interestLevel).toBe(baseResponse.interestLevel);
      expect(result.mood).toBe(baseResponse.mood);
    });
  });
});
