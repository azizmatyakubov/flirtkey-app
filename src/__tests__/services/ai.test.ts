/**
 * AI Service Tests
 * Phase 9.1.6, 9.1.9, 9.1.10: Test AI service functions, prompt builders, response parsers
 */

import axios from 'axios';
import {
  classifyError,
  getUserFriendlyMessage,
  scoreResponseQuality,
  MODELS,
  AIService,
} from '../../services/ai';
import { APIError } from '../../types';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Error Classification Tests (9.1.13)
  // ==========================================

  describe('classifyError', () => {
    it('classifies cancelled requests', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(true);
      const error = { message: 'Request cancelled by user' };
      const result = classifyError(error);
      expect(result.code).toBe('CANCELLED');
      expect(result.retryable).toBe(false);
    });

    it('classifies network timeout', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        response: undefined,
      };
      const result = classifyError(error);
      expect(result.code).toBe('TIMEOUT');
      expect(result.retryable).toBe(true);
    });

    it('classifies network error', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        code: 'NETWORK_ERROR',
        response: undefined,
      };
      const result = classifyError(error);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    it('classifies 401 as invalid API key', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      };
      const result = classifyError(error);
      expect(result.code).toBe('INVALID_API_KEY');
      expect(result.retryable).toBe(false);
    });

    it('classifies 429 as rate limited', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 429, data: {} },
      };
      const result = classifyError(error);
      expect(result.code).toBe('RATE_LIMITED');
      expect(result.retryable).toBe(true);
    });

    it('classifies 402/403 as insufficient quota', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 402, data: {} },
      };
      const result = classifyError(error);
      expect(result.code).toBe('INSUFFICIENT_QUOTA');
      expect(result.retryable).toBe(false);
    });

    it('classifies 500-504 as server error', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      [500, 502, 503, 504].forEach((status) => {
        const error = {
          isAxiosError: true,
          response: { status, data: {} },
        };
        const result = classifyError(error);
        expect(result.code).toBe('SERVER_ERROR');
        expect(result.retryable).toBe(true);
      });
    });

    it('classifies unknown errors', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      const error = new Error('Unknown error');
      const result = classifyError(error);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(false);
    });

    it('handles non-Error objects', () => {
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      const result = classifyError('string error');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  // ==========================================
  // User-Friendly Messages Tests
  // ==========================================

  describe('getUserFriendlyMessage', () => {
    it('returns friendly message for network error', () => {
      const error: APIError = { code: 'NETWORK_ERROR', message: 'Network failed', retryable: true };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('connection');
    });

    it('returns friendly message for timeout', () => {
      const error: APIError = { code: 'TIMEOUT', message: 'Timeout', retryable: true };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('long');
    });

    it('returns friendly message for rate limit', () => {
      const error: APIError = { code: 'RATE_LIMITED', message: 'Rate limited', retryable: true };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('requests');
    });

    it('returns friendly message for invalid API key', () => {
      const error: APIError = { code: 'INVALID_API_KEY', message: 'Invalid', retryable: false };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('API key');
    });

    it('returns friendly message for quota exceeded', () => {
      const error: APIError = { code: 'INSUFFICIENT_QUOTA', message: 'Quota', retryable: false };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('quota');
    });

    it('returns friendly message for server error', () => {
      const error: APIError = { code: 'SERVER_ERROR', message: 'Server', retryable: true };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('servers');
    });

    it('returns default message for unknown error', () => {
      const error: APIError = { code: 'UNKNOWN_ERROR', message: 'Unknown', retryable: false };
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('wrong');
    });
  });

  // ==========================================
  // Response Quality Scoring Tests (9.1.10)
  // ==========================================

  describe('scoreResponseQuality', () => {
    it('gives high score for complete response', () => {
      const response = {
        suggestions: [
          { type: 'safe' as const, text: 'Hey there!', reason: 'Safe opener' },
          { type: 'balanced' as const, text: 'Hi! How are you?', reason: 'Balanced approach' },
          { type: 'bold' as const, text: 'Well hello there...', reason: 'Bold move' },
        ],
        proTip: 'Keep the conversation light and fun!',
        interestLevel: 75,
        mood: 'playful',
      };
      const score = scoreResponseQuality(response);
      expect(score).toBeGreaterThan(80);
    });

    it('gives lower score for minimal response', () => {
      const response = {
        suggestions: [{ type: 'safe' as const, text: 'Hey', reason: '' }],
        proTip: '',
      };
      const score = scoreResponseQuality(response);
      expect(score).toBeLessThan(50);
    });

    it('penalizes missing suggestion types', () => {
      const twoTypes = {
        suggestions: [
          { type: 'safe' as const, text: 'Hey there!', reason: 'Safe opener' },
          { type: 'balanced' as const, text: 'Hi!', reason: 'Balanced' },
        ],
        proTip: 'Tip here',
      };
      const threeTypes = {
        suggestions: [
          { type: 'safe' as const, text: 'Hey there!', reason: 'Safe opener' },
          { type: 'balanced' as const, text: 'Hi!', reason: 'Balanced' },
          { type: 'bold' as const, text: 'Hello...', reason: 'Bold' },
        ],
        proTip: 'Tip here',
      };
      const scoreTwoTypes = scoreResponseQuality(twoTypes);
      const scoreThreeTypes = scoreResponseQuality(threeTypes);
      expect(scoreThreeTypes).toBeGreaterThan(scoreTwoTypes);
    });

    it('rewards suggestions with reasons', () => {
      const withReasons = {
        suggestions: [{ type: 'safe' as const, text: 'Hey there!', reason: 'Safe opener' }],
        proTip: '',
      };
      const withoutReasons = {
        suggestions: [{ type: 'safe' as const, text: 'Hey there!', reason: '' }],
        proTip: '',
      };
      expect(scoreResponseQuality(withReasons)).toBeGreaterThan(
        scoreResponseQuality(withoutReasons)
      );
    });

    it('caps score at 100', () => {
      const maxResponse = {
        suggestions: [
          {
            type: 'safe' as const,
            text: 'Hey there! This is a longer message.',
            reason: 'Safe opener with detail',
          },
          {
            type: 'balanced' as const,
            text: 'Hi! How are you doing today?',
            reason: 'Balanced with follow-up',
          },
          {
            type: 'bold' as const,
            text: 'Well hello there gorgeous...',
            reason: 'Bold and confident',
          },
        ],
        proTip: 'Keep the conversation light and fun! Ask open-ended questions.',
        interestLevel: 75,
        mood: 'playful',
      };
      const score = scoreResponseQuality(maxResponse);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // Model Configuration Tests
  // ==========================================

  describe('MODELS', () => {
    it('has gpt-4o-mini configuration', () => {
      expect(MODELS['gpt-4o-mini']).toBeDefined();
      expect(MODELS['gpt-4o-mini'].name).toBe('gpt-4o-mini');
      expect(MODELS['gpt-4o-mini'].maxTokens).toBeGreaterThan(0);
      expect(MODELS['gpt-4o-mini'].costPer1kTokens).toBeGreaterThan(0);
    });

    it('has gpt-4o configuration', () => {
      expect(MODELS['gpt-4o']).toBeDefined();
      expect(MODELS['gpt-4o'].name).toBe('gpt-4o');
      expect(MODELS['gpt-4o'].bestFor).toContain('image analysis');
    });

    it('has gpt-4-turbo configuration', () => {
      expect(MODELS['gpt-4-turbo']).toBeDefined();
      expect(MODELS['gpt-4-turbo'].costPer1kTokens).toBeGreaterThan(
        MODELS['gpt-4o-mini'].costPer1kTokens
      );
    });
  });

  // ==========================================
  // AI Service Module Tests
  // ==========================================

  describe('AIService module', () => {
    it('exports all required functions', () => {
      expect(AIService.generateFlirtResponse).toBeDefined();
      expect(AIService.analyzeScreenshot).toBeDefined();
      expect(AIService.cancelRequest).toBeDefined();
      expect(AIService.cancelAllRequests).toBeDefined();
      expect(AIService.clearCache).toBeDefined();
      expect(AIService.getCacheStats).toBeDefined();
      expect(AIService.getUsage).toBeDefined();
      expect(AIService.getDailyUsage).toBeDefined();
      expect(AIService.classifyError).toBeDefined();
      expect(AIService.getUserFriendlyMessage).toBeDefined();
      expect(AIService.scoreResponseQuality).toBeDefined();
    });

    it('can clear cache', () => {
      AIService.clearCache();
      const stats = AIService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('can get usage stats', () => {
      const usage = AIService.getUsage();
      expect(usage).toHaveProperty('tokens');
      expect(usage).toHaveProperty('cost');
      expect(usage).toHaveProperty('requests');
    });

    it('can get daily usage', () => {
      const dailyUsage = AIService.getDailyUsage();
      expect(dailyUsage).toHaveProperty('tokens');
      expect(dailyUsage).toHaveProperty('cost');
      expect(dailyUsage).toHaveProperty('requests');
    });

    it('can check online status', () => {
      expect(typeof AIService.isOnline()).toBe('boolean');
    });

    it('can set online status', () => {
      AIService.setOnlineStatus(false);
      expect(AIService.isOnline()).toBe(false);
      AIService.setOnlineStatus(true);
      expect(AIService.isOnline()).toBe(true);
    });
  });

  // ==========================================
  // Token Estimation Tests
  // ==========================================

  describe('estimateTokens', () => {
    it('estimates tokens for short text', () => {
      const tokens = AIService.estimateTokens('Hello, world!');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('estimates tokens for longer text', () => {
      const longText = 'This is a much longer text that should have more tokens. '.repeat(10);
      const tokens = AIService.estimateTokens(longText);
      expect(tokens).toBeGreaterThan(50);
    });

    it('handles empty string', () => {
      const tokens = AIService.estimateTokens('');
      expect(tokens).toBe(0);
    });
  });
});
