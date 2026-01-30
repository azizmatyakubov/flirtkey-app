/**
 * Tests for Conversation Coach Service
 */

import {
  COACH_SCENARIOS,
  CoachDifficulty,
  createSession,
  addUserMessage,
  getDifficultyInfo,
  generateMatchResponse,
} from '../../services/coachService';

describe('CoachService', () => {
  describe('COACH_SCENARIOS', () => {
    it('should have at least 9 scenarios', () => {
      expect(COACH_SCENARIOS.length).toBeGreaterThanOrEqual(9);
    });

    it('should have scenarios for each difficulty', () => {
      const easy = COACH_SCENARIOS.filter((s) => s.difficulty === 'easy');
      const medium = COACH_SCENARIOS.filter((s) => s.difficulty === 'medium');
      const hard = COACH_SCENARIOS.filter((s) => s.difficulty === 'hard');
      expect(easy.length).toBeGreaterThanOrEqual(3);
      expect(medium.length).toBeGreaterThanOrEqual(3);
      expect(hard.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique IDs', () => {
      const ids = COACH_SCENARIOS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each scenario has required fields', () => {
      COACH_SCENARIOS.forEach((s) => {
        expect(s.id).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.description).toBeTruthy();
        expect(s.matchName).toBeTruthy();
        expect(s.matchPersonality).toBeTruthy();
        expect(s.context).toBeTruthy();
        expect(['easy', 'medium', 'hard']).toContain(s.difficulty);
      });
    });
  });

  describe('createSession', () => {
    it('should create a session from a scenario', () => {
      const scenario = COACH_SCENARIOS[0]!;
      const session = createSession(scenario);
      expect(session.id).toBeTruthy();
      expect(session.difficulty).toBe(scenario.difficulty);
      expect(session.matchName).toBe(scenario.matchName);
      expect(session.totalScore).toBe(0);
      expect(session.messageCount).toBe(0);
      expect(session.startedAt).toBeGreaterThan(0);
      expect(session.averageScore).toBe(0);
    });

    it('should include opening message if scenario has one', () => {
      const scenario = COACH_SCENARIOS[0]!; // easy_1 has opening
      const session = createSession(scenario);
      expect(session.messages.length).toBe(1);
      expect(session.messages[0]!.role).toBe('match');
      expect(session.messages[0]!.text).toBe(scenario.openingMessage);
    });

    it('should not include opening message if empty', () => {
      const ghostScenario = COACH_SCENARIOS.find((s) => s.id === 'hard_2')!;
      const session = createSession(ghostScenario);
      expect(session.messages.length).toBe(0);
    });
  });

  describe('addUserMessage', () => {
    it('should add user message, coach feedback, and match reply', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const updated = addUserMessage(
        session,
        'Hey! I love the trails in Yosemite! What about you?'
      );

      // Should have opening + user + coach + match = 4
      expect(updated.messages.length).toBe(4);
      expect(updated.messages[1]!.role).toBe('user');
      expect(updated.messages[2]!.role).toBe('coach');
      expect(updated.messages[3]!.role).toBe('match');
    });

    it('should increment message count', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const updated = addUserMessage(session, 'Hello!');
      expect(updated.messageCount).toBe(1);

      const updated2 = addUserMessage(updated, 'How are you?');
      expect(updated2.messageCount).toBe(2);
    });

    it('should calculate average score', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const updated = addUserMessage(
        session,
        'Great question! I love the mountain trails near here. Have you tried the sunset hike?'
      );
      expect(updated.averageScore).toBeGreaterThan(0);
      expect(updated.averageScore).toBeLessThanOrEqual(5);
    });

    it('should give user messages a score', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const updated = addUserMessage(session, 'Hello there!');
      const userMsg = updated.messages.find((m) => m.role === 'user');
      expect(userMsg!.score).toBeDefined();
      expect(userMsg!.score).toBeGreaterThanOrEqual(1);
      expect(userMsg!.score).toBeLessThanOrEqual(5);
    });

    it('should give coach messages feedback text', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const updated = addUserMessage(session, 'Hello!');
      const coachMsg = updated.messages.find((m) => m.role === 'coach');
      expect(coachMsg!.text).toBeTruthy();
      expect(coachMsg!.text.length).toBeGreaterThan(5);
    });
  });

  describe('generateMatchResponse', () => {
    it('should return matchReply, feedback, and score', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const result = generateMatchResponse(
        session,
        'This is a decent message with some personality!'
      );
      expect(result.matchReply).toBeTruthy();
      expect(result.feedback).toBeTruthy();
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(5);
    });

    it('should penalize generic openers', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const genericResult = generateMatchResponse(session, 'hey');
      const goodResult = generateMatchResponse(
        session,
        'Haha that trail sounds amazing! I actually did a sunrise hike last week that was incredible 🌅'
      );
      expect(goodResult.score).toBeGreaterThan(genericResult.score);
    });

    it('should penalize very short messages', () => {
      const session = createSession(COACH_SCENARIOS[0]!);
      const shortResult = generateMatchResponse(session, 'hi');
      expect(shortResult.score).toBeLessThanOrEqual(2.5);
    });
  });

  describe('getDifficultyInfo', () => {
    it('should return info for all difficulties', () => {
      const difficulties: CoachDifficulty[] = ['easy', 'medium', 'hard'];
      difficulties.forEach((d) => {
        const info = getDifficultyInfo(d);
        expect(info.label).toBeTruthy();
        expect(info.emoji).toBeTruthy();
        expect(info.color).toMatch(/^#/);
        expect(info.description).toBeTruthy();
      });
    });

    it('should have distinct colors', () => {
      const easy = getDifficultyInfo('easy');
      const medium = getDifficultyInfo('medium');
      const hard = getDifficultyInfo('hard');
      expect(easy.color).not.toBe(medium.color);
      expect(medium.color).not.toBe(hard.color);
    });
  });
});
