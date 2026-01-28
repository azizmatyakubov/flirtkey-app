/**
 * Validation Utilities Tests
 * Phase 9.1.5, 9.1.13, 9.1.14: Test validation functions and edge cases
 */

import {
  sanitizeString,
  sanitizeName,
  sanitizeNumber,
  validatePhone,
  validateAge,
  validateName,
  validateApiKey,
  validateGirl,
  validateCreateGirl,
  validateUser,
  validateSuggestion,
  validateAIResponse,
  getValidationError,
  ValidationErrors,
  CultureSchema,
  RelationshipStageSchema,
  GirlSchema,
} from '../../utils/validation';

describe('Validation Utilities', () => {
  // ==========================================
  // Sanitization Tests (9.1.5)
  // ==========================================

  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('normalizes multiple spaces', () => {
      expect(sanitizeString('hello   world')).toBe('hello world');
    });

    it('removes HTML-like characters', () => {
      expect(sanitizeString('<script>alert()</script>')).toBe('scriptalert()/script');
    });

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('handles string with only whitespace', () => {
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('sanitizeName', () => {
    it('sanitizes basic name', () => {
      expect(sanitizeName('  Anna  ')).toBe('Anna');
    });

    it('keeps valid special characters', () => {
      expect(sanitizeName("Mary-Jane O'Brien")).toBe("Mary-Jane O'Brien");
    });

    it('removes invalid characters', () => {
      expect(sanitizeName('Anna123!')).toBe('Anna');
    });

    it('handles Cyrillic names', () => {
      expect(sanitizeName('Анна')).toBe('Анна');
    });

    it('truncates long names', () => {
      const longName = 'A'.repeat(150);
      expect(sanitizeName(longName).length).toBe(100);
    });

    it('handles empty string', () => {
      expect(sanitizeName('')).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('converts string to number', () => {
      expect(sanitizeNumber('25')).toBe(25);
    });

    it('returns number as is', () => {
      expect(sanitizeNumber(30)).toBe(30);
    });

    it('returns undefined for empty string', () => {
      expect(sanitizeNumber('')).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(sanitizeNumber(null)).toBeUndefined();
    });

    it('returns undefined for NaN', () => {
      expect(sanitizeNumber('abc')).toBeUndefined();
    });

    it('handles float strings', () => {
      expect(sanitizeNumber('25.5')).toBe(25.5);
    });
  });

  // ==========================================
  // Phone Validation Tests (9.1.5)
  // ==========================================

  describe('validatePhone', () => {
    it('validates valid phone with +', () => {
      const result = validatePhone('+1234567890');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('+1234567890');
    });

    it('validates valid phone without +', () => {
      const result = validatePhone('1234567890');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('+1234567890');
    });

    it('validates phone with formatting', () => {
      const result = validatePhone('+1 (234) 567-8901');
      expect(result.valid).toBe(true);
    });

    it('rejects too short phone', () => {
      const result = validatePhone('12345');
      expect(result.valid).toBe(false);
    });

    it('rejects phone starting with 0', () => {
      const result = validatePhone('01234567890');
      expect(result.valid).toBe(false);
    });
  });

  // ==========================================
  // Age Validation Tests (9.1.5)
  // ==========================================

  describe('validateAge', () => {
    it('validates valid age', () => {
      const result = validateAge(25);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(25);
    });

    it('allows undefined age', () => {
      const result = validateAge(undefined);
      expect(result.valid).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('rejects age below 18', () => {
      const result = validateAge(17);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('18');
    });

    it('rejects age above 120', () => {
      const result = validateAge(121);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('120');
    });

    it('converts string age', () => {
      const result = validateAge('25');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(25);
    });

    it('handles edge case: exactly 18', () => {
      const result = validateAge(18);
      expect(result.valid).toBe(true);
    });

    it('handles edge case: exactly 120', () => {
      const result = validateAge(120);
      expect(result.valid).toBe(true);
    });
  });

  // ==========================================
  // Name Validation Tests (9.1.5)
  // ==========================================

  describe('validateName', () => {
    it('validates valid name', () => {
      const result = validateName('Anna');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Anna');
    });

    it('rejects empty name', () => {
      const result = validateName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('sanitizes name with numbers (removes them)', () => {
      // validateName sanitizes first, so numbers get stripped
      const result = validateName('Anna123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Anna');
    });

    it('accepts hyphenated names', () => {
      const result = validateName('Mary-Jane');
      expect(result.valid).toBe(true);
    });

    it('accepts apostrophes', () => {
      const result = validateName("O'Brien");
      expect(result.valid).toBe(true);
    });

    it('sanitizes before validation', () => {
      const result = validateName('  Anna  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Anna');
    });
  });

  // ==========================================
  // API Key Validation Tests (9.1.5)
  // ==========================================

  describe('validateApiKey', () => {
    it('validates valid API key format', () => {
      const result = validateApiKey('sk-abcd1234567890abcdef1234567890');
      expect(result.valid).toBe(true);
    });

    it('rejects key without sk- prefix', () => {
      const result = validateApiKey('abcd1234567890abcdef1234567890');
      expect(result.valid).toBe(false);
    });

    it('rejects too short key', () => {
      const result = validateApiKey('sk-short');
      expect(result.valid).toBe(false);
    });

    it('trims whitespace', () => {
      const result = validateApiKey('  sk-abcd1234567890abcdef1234567890  ');
      expect(result.valid).toBe(true);
    });

    it('rejects empty key', () => {
      const result = validateApiKey('');
      expect(result.valid).toBe(false);
    });

    it('allows keys with hyphens and underscores', () => {
      const result = validateApiKey('sk-proj_abc123-def456_ghi789');
      expect(result.valid).toBe(true);
    });
  });

  // ==========================================
  // Schema Tests (9.1.5)
  // ==========================================

  describe('CultureSchema', () => {
    it('accepts valid cultures', () => {
      expect(CultureSchema.safeParse('uzbek').success).toBe(true);
      expect(CultureSchema.safeParse('russian').success).toBe(true);
      expect(CultureSchema.safeParse('western').success).toBe(true);
      expect(CultureSchema.safeParse('asian').success).toBe(true);
      expect(CultureSchema.safeParse('universal').success).toBe(true);
    });

    it('rejects invalid culture', () => {
      expect(CultureSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('RelationshipStageSchema', () => {
    it('accepts valid stages', () => {
      expect(RelationshipStageSchema.safeParse('just_met').success).toBe(true);
      expect(RelationshipStageSchema.safeParse('talking').success).toBe(true);
      expect(RelationshipStageSchema.safeParse('flirting').success).toBe(true);
      expect(RelationshipStageSchema.safeParse('dating').success).toBe(true);
      expect(RelationshipStageSchema.safeParse('serious').success).toBe(true);
    });

    it('rejects invalid stage', () => {
      expect(RelationshipStageSchema.safeParse('married').success).toBe(false);
    });
  });

  // ==========================================
  // Full Object Validation Tests (9.1.5, 9.1.14)
  // ==========================================

  describe('validateGirl', () => {
    const validGirl = {
      id: 1,
      name: 'Anna',
      messageCount: 5,
      relationshipStage: 'talking',
    };

    it('validates valid girl', () => {
      const result = validateGirl(validGirl);
      expect(result.success).toBe(true);
    });

    it('validates girl with all optional fields', () => {
      const fullGirl = {
        ...validGirl,
        nickname: 'Annie',
        age: 25,
        culture: 'western',
        personality: 'Funny and smart',
        interests: 'Music, travel',
        occupation: 'Designer',
        howMet: 'Dating app',
        insideJokes: 'The coffee incident',
      };
      const result = validateGirl(fullGirl);
      expect(result.success).toBe(true);
    });

    it('rejects girl without name', () => {
      const noName = { ...validGirl, name: '' };
      const result = validateGirl(noName);
      expect(result.success).toBe(false);
    });

    it('rejects girl with invalid age', () => {
      const underAge = { ...validGirl, age: 17 };
      const result = validateGirl(underAge);
      expect(result.success).toBe(false);
    });

    it('rejects girl with negative message count', () => {
      const negativeCount = { ...validGirl, messageCount: -1 };
      const result = validateGirl(negativeCount);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCreateGirl', () => {
    it('validates minimal girl creation', () => {
      const minGirl = { name: 'Anna' };
      const result = validateCreateGirl(minGirl);
      expect(result.success).toBe(true);
    });

    it('does not require id or messageCount', () => {
      const girl = { name: 'Anna', age: 25 };
      const result = validateCreateGirl(girl);
      expect(result.success).toBe(true);
    });
  });

  describe('validateSuggestion', () => {
    it('validates valid suggestion', () => {
      const suggestion = {
        type: 'balanced',
        text: 'Hey there!',
        reason: 'Friendly opener',
      };
      const result = validateSuggestion(suggestion);
      expect(result.success).toBe(true);
    });

    it('rejects empty text', () => {
      const suggestion = {
        type: 'balanced',
        text: '',
        reason: 'Friendly opener',
      };
      const result = validateSuggestion(suggestion);
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const suggestion = {
        type: 'invalid',
        text: 'Hey!',
        reason: 'test',
      };
      const result = validateSuggestion(suggestion);
      expect(result.success).toBe(false);
    });
  });

  describe('validateAIResponse', () => {
    it('validates valid AI response', () => {
      const response = {
        suggestions: [
          { type: 'safe', text: 'Hey!', reason: 'Safe opener' },
          { type: 'balanced', text: 'Hi there!', reason: 'Balanced' },
          { type: 'bold', text: 'Well hello...', reason: 'Bold move' },
        ],
        proTip: 'Keep it light!',
        interestLevel: 75,
        mood: 'playful',
      };
      const result = validateAIResponse(response);
      expect(result.success).toBe(true);
    });

    it('rejects response without suggestions', () => {
      const response = { proTip: 'Keep it light!' };
      const result = validateAIResponse(response);
      expect(result.success).toBe(false);
    });

    it('accepts interest level 0-100', () => {
      const response = {
        suggestions: [{ type: 'safe', text: 'Hey!', reason: 'Test' }],
        proTip: 'Tip',
        interestLevel: 0,
      };
      expect(validateAIResponse(response).success).toBe(true);

      response.interestLevel = 100;
      expect(validateAIResponse(response).success).toBe(true);
    });

    it('rejects interest level > 100', () => {
      const response = {
        suggestions: [{ type: 'safe', text: 'Hey!', reason: 'Test' }],
        proTip: 'Tip',
        interestLevel: 101,
      };
      expect(validateAIResponse(response).success).toBe(false);
    });
  });

  // ==========================================
  // Error Messages Tests (9.1.5)
  // ==========================================

  describe('ValidationErrors', () => {
    it('has all expected error messages', () => {
      expect(ValidationErrors.NAME_REQUIRED).toBeDefined();
      expect(ValidationErrors.NAME_TOO_LONG).toBeDefined();
      expect(ValidationErrors.AGE_TOO_YOUNG).toBeDefined();
      expect(ValidationErrors.AGE_TOO_OLD).toBeDefined();
      expect(ValidationErrors.INVALID_API_KEY).toBeDefined();
    });
  });

  describe('getValidationError', () => {
    it('extracts error message from Zod error', () => {
      const result = GirlSchema.safeParse({ id: 1, name: '' });
      if (!result.success) {
        const message = getValidationError(result.error);
        expect(message).toContain('Name');
      }
    });
  });
});
