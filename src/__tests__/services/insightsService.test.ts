/**
 * Tests for Insights Service
 */

import {
  ConversationRecord,
  BADGE_DEFINITIONS,
  calculateResponseRate,
  getResponseTypeBreakdown,
  getActiveHours,
  getBestHour,
  getConversationTrend,
  generateWeeklyReport,
  calculateBadges,
} from '../../services/insightsService';

function createRecord(overrides?: Partial<ConversationRecord>): ConversationRecord {
  return {
    id: `rec_${Math.random()}`,
    contactName: 'Test',
    startedAt: Date.now(),
    lastMessageAt: Date.now(),
    messagesSent: 3,
    gotReply: true,
    responseType: 'balanced',
    hourOfDay: 14,
    dayOfWeek: 3,
    ...overrides,
  };
}

describe('InsightsService', () => {
  describe('calculateResponseRate', () => {
    it('should return 0 for empty records', () => {
      expect(calculateResponseRate([])).toBe(0);
    });

    it('should calculate correct rate', () => {
      const records = [
        createRecord({ gotReply: true }),
        createRecord({ gotReply: true }),
        createRecord({ gotReply: false }),
        createRecord({ gotReply: false }),
      ];
      expect(calculateResponseRate(records)).toBe(50);
    });

    it('should return 100 for all replies', () => {
      const records = [createRecord({ gotReply: true }), createRecord({ gotReply: true })];
      expect(calculateResponseRate(records)).toBe(100);
    });

    it('should return 0 for no replies', () => {
      const records = [createRecord({ gotReply: false }), createRecord({ gotReply: false })];
      expect(calculateResponseRate(records)).toBe(0);
    });
  });

  describe('getResponseTypeBreakdown', () => {
    it('should return breakdown for all types', () => {
      const records = [
        createRecord({ responseType: 'safe' }),
        createRecord({ responseType: 'safe' }),
        createRecord({ responseType: 'balanced' }),
        createRecord({ responseType: 'bold' }),
      ];
      const breakdown = getResponseTypeBreakdown(records);
      expect(breakdown.length).toBe(3);

      const safe = breakdown.find((b) => b.type === 'Safe')!;
      expect(safe.count).toBe(2);
      expect(safe.percentage).toBe(50);

      const bold = breakdown.find((b) => b.type === 'Bold')!;
      expect(bold.count).toBe(1);
      expect(bold.percentage).toBe(25);
    });

    it('should handle empty records', () => {
      const breakdown = getResponseTypeBreakdown([]);
      expect(breakdown.length).toBe(3);
      breakdown.forEach((b) => {
        expect(b.count).toBe(0);
        expect(b.percentage).toBe(0);
      });
    });
  });

  describe('getActiveHours', () => {
    it('should return 24 hours', () => {
      const hours = getActiveHours([]);
      expect(hours.length).toBe(24);
    });

    it('should count records by hour', () => {
      const records = [
        createRecord({ hourOfDay: 14 }),
        createRecord({ hourOfDay: 14 }),
        createRecord({ hourOfDay: 20 }),
      ];
      const hours = getActiveHours(records);
      expect(hours[14]!.count).toBe(2);
      expect(hours[20]!.count).toBe(1);
      expect(hours[0]!.count).toBe(0);
    });
  });

  describe('getBestHour', () => {
    it('should return the hour with most activity', () => {
      const records = [
        createRecord({ hourOfDay: 9 }),
        createRecord({ hourOfDay: 20 }),
        createRecord({ hourOfDay: 20 }),
        createRecord({ hourOfDay: 20 }),
      ];
      const best = getBestHour(records);
      expect(best.hour).toBe(20);
    });
  });

  describe('getConversationTrend', () => {
    it('should return 7 days of data', () => {
      const trend = getConversationTrend([]);
      expect(trend.length).toBe(7);
    });

    it('each day should have a label and count', () => {
      const trend = getConversationTrend([]);
      trend.forEach((d) => {
        expect(d.day).toBeTruthy();
        expect(typeof d.count).toBe('number');
      });
    });
  });

  describe('generateWeeklyReport', () => {
    it('should generate a valid report', () => {
      const records = [
        createRecord({ startedAt: Date.now() - 86400000, gotReply: true }),
        createRecord({ startedAt: Date.now() - 172800000, gotReply: false }),
      ];
      const report = generateWeeklyReport(records, 5);

      expect(report.totalConversations).toBe(2);
      expect(report.responseRate).toBeDefined();
      expect(report.streakDays).toBe(5);
      expect(report.topResponseType).toBeTruthy();
      expect(typeof report.bestHour).toBe('number');
      expect(report.bestDay).toBeTruthy();
    });

    it('should handle empty records', () => {
      const report = generateWeeklyReport([], 0);
      expect(report.totalConversations).toBe(0);
      expect(report.responseRate).toBe(0);
    });
  });

  describe('calculateBadges', () => {
    it('should return all badge definitions', () => {
      const badges = calculateBadges(0, 0, 0, 0, 0, 0);
      expect(badges.length).toBe(BADGE_DEFINITIONS.length);
    });

    it('should mark badges as earned when requirements met', () => {
      const badges = calculateBadges(10, 5, 7, 5, 5, 10);

      const iceBreaker = badges.find((b) => b.id === 'conv_1')!;
      expect(iceBreaker.earned).toBe(true);

      const conv10 = badges.find((b) => b.id === 'conv_10')!;
      expect(conv10.earned).toBe(true);

      const streak7 = badges.find((b) => b.id === 'streak_7')!;
      expect(streak7.earned).toBe(true);
    });

    it('should mark badges as locked when requirements not met', () => {
      const badges = calculateBadges(1, 0, 1, 0, 0, 0);

      const conv50 = badges.find((b) => b.id === 'conv_50')!;
      expect(conv50.earned).toBe(false);

      const streak30 = badges.find((b) => b.id === 'streak_30')!;
      expect(streak30.earned).toBe(false);
    });

    it('should track progress correctly', () => {
      const badges = calculateBadges(7, 3, 5, 2, 3, 4);

      const conv10 = badges.find((b) => b.id === 'conv_10')!;
      expect(conv10.currentProgress).toBe(7);

      const boldBadge = badges.find((b) => b.id === 'bold_5')!;
      expect(boldBadge.currentProgress).toBe(2);
    });
  });

  describe('BADGE_DEFINITIONS', () => {
    it('should have unique IDs', () => {
      const ids = BADGE_DEFINITIONS.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each badge has required fields', () => {
      BADGE_DEFINITIONS.forEach((b) => {
        expect(b.id).toBeTruthy();
        expect(b.title).toBeTruthy();
        expect(b.description).toBeTruthy();
        expect(b.emoji).toBeTruthy();
        expect(b.color).toMatch(/^#/);
        expect(b.requirement).toBeGreaterThan(0);
        expect(['conversations', 'streaks', 'milestones', 'skills']).toContain(b.category);
      });
    });
  });
});
