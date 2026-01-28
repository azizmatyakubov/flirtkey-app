/**
 * Accessibility Utils Tests
 * Phase 9: Test accessibility utilities
 */

// Mock expo-haptics before importing modules that depend on it
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

import {
  getSuggestionAccessibilityLabel,
  getInterestLevelAccessibilityLabel,
  getGirlCardAccessibilityLabel,
  formatNumberForAccessibility,
  getAnimationDuration,
  getAnimationConfig,
  accessibilityLabels,
  accessibilityHints,
} from '../../utils/accessibility';

describe('Accessibility Utils', () => {
  // ==========================================
  // Suggestion Accessibility Labels
  // ==========================================

  describe('getSuggestionAccessibilityLabel', () => {
    it('generates label for safe suggestion', () => {
      const label = getSuggestionAccessibilityLabel('safe', 'Hey, how are you?', 'Friendly opener');
      expect(label).toContain('Safe');
      expect(label).toContain('Hey, how are you?');
    });

    it('generates label for balanced suggestion', () => {
      const label = getSuggestionAccessibilityLabel('balanced', 'Hi there!', 'Balanced approach');
      expect(label).toContain('Balanced');
    });

    it('generates label for bold suggestion', () => {
      const label = getSuggestionAccessibilityLabel('bold', 'Well hello...', 'Bold move');
      expect(label).toContain('Bold');
    });

    it('includes reason when provided', () => {
      const label = getSuggestionAccessibilityLabel('balanced', 'Hey!', 'Friendly opener');
      expect(label).toContain('Friendly opener');
    });

    it('handles empty reason', () => {
      const label = getSuggestionAccessibilityLabel('safe', 'Hello', '');
      expect(label).toBeDefined();
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Interest Level Accessibility
  // ==========================================

  describe('getInterestLevelAccessibilityLabel', () => {
    it('describes very low interest', () => {
      const label = getInterestLevelAccessibilityLabel(10);
      expect(label.toLowerCase()).toMatch(/low|cold|minimal/);
    });

    it('describes low interest', () => {
      const label = getInterestLevelAccessibilityLabel(30);
      expect(label.toLowerCase()).toMatch(/low|cool|lukewarm/);
    });

    it('describes medium interest', () => {
      const label = getInterestLevelAccessibilityLabel(50);
      expect(label.toLowerCase()).toMatch(/medium|moderate|warm/);
    });

    it('describes high interest', () => {
      const label = getInterestLevelAccessibilityLabel(75);
      expect(label.toLowerCase()).toMatch(/high|interested|good/);
    });

    it('describes very high interest', () => {
      const label = getInterestLevelAccessibilityLabel(95);
      expect(label.toLowerCase()).toMatch(/very|high|excellent|great/);
    });

    it('handles edge cases', () => {
      expect(getInterestLevelAccessibilityLabel(0)).toBeDefined();
      expect(getInterestLevelAccessibilityLabel(100)).toBeDefined();
    });

    it('handles undefined', () => {
      const label = getInterestLevelAccessibilityLabel(undefined as unknown as number);
      expect(label).toBeDefined();
    });
  });

  // ==========================================
  // Girl Card Accessibility
  // ==========================================

  describe('getGirlCardAccessibilityLabel', () => {
    it('includes name', () => {
      const label = getGirlCardAccessibilityLabel('Anna', 'flirting', 10);
      expect(label).toContain('Anna');
    });

    it('includes relationship stage', () => {
      const label = getGirlCardAccessibilityLabel('Anna', 'flirting', 10);
      expect(label.toLowerCase()).toContain('flirt');
    });

    it('includes message count', () => {
      const label = getGirlCardAccessibilityLabel('Anna', 'talking', 10);
      expect(label).toContain('10');
    });

    it('handles zero messages', () => {
      const label = getGirlCardAccessibilityLabel('Maria', 'talking', 0);
      expect(label).toContain('Maria');
      expect(label).toContain('0');
    });

    it('generates proper sentence', () => {
      const label = getGirlCardAccessibilityLabel('Sofia', 'dating', 25);
      expect(label).toContain('Sofia');
      expect(label).toContain('dating');
      expect(label).toContain('25');
    });
  });

  // ==========================================
  // Number Formatting
  // ==========================================

  describe('formatNumberForAccessibility', () => {
    it('formats small numbers', () => {
      const result = formatNumberForAccessibility(5);
      expect(result).toBe('5');
    });

    it('formats thousands', () => {
      const result = formatNumberForAccessibility(1500);
      expect(result).toMatch(/1.*5.*thousand|1500/i);
    });

    it('formats millions', () => {
      const result = formatNumberForAccessibility(2500000);
      expect(result).toMatch(/2.*5.*million|2500000/i);
    });

    it('handles zero', () => {
      const result = formatNumberForAccessibility(0);
      expect(result).toBe('0');
    });

    it('handles negative numbers', () => {
      const result = formatNumberForAccessibility(-100);
      expect(result).toContain('100');
    });
  });

  // ==========================================
  // Animation Configuration
  // ==========================================

  describe('getAnimationDuration', () => {
    it('returns duration for normal mode', () => {
      const duration = getAnimationDuration(300, false);
      expect(duration).toBe(300);
    });

    it('returns reduced duration for reduce motion', () => {
      const duration = getAnimationDuration(300, true);
      expect(duration).toBe(0);
    });

    it('handles different base durations', () => {
      expect(getAnimationDuration(500, false)).toBe(500);
      expect(getAnimationDuration(1000, true)).toBe(0);
    });
  });

  describe('getAnimationConfig', () => {
    it('returns spring config for normal mode', () => {
      const config = getAnimationConfig(false);
      expect(config).toBeDefined();
    });

    it('returns instant config for reduce motion', () => {
      const config = getAnimationConfig(true);
      expect(config.duration).toBe(0);
    });
  });

  // ==========================================
  // Static Labels
  // ==========================================

  describe('accessibilityLabels', () => {
    it('has common labels defined', () => {
      expect(accessibilityLabels).toBeDefined();
      expect(typeof accessibilityLabels).toBe('object');
    });
  });

  describe('accessibilityHints', () => {
    it('has common hints defined', () => {
      expect(accessibilityHints).toBeDefined();
      expect(typeof accessibilityHints).toBe('object');
    });
  });
});
