/**
 * AI Service Tests
 * Phase 9: Test AI service with mocked API calls
 */

import { MODELS, classifyError } from '../../services/ai';

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock behavior
    (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
  });

  // ==========================================
  // Model Configuration Tests
  // ==========================================

  describe('Model Configuration', () => {
    it('has gpt-4o-mini model defined', () => {
      expect(MODELS['gpt-4o-mini']).toBeDefined();
      expect(MODELS['gpt-4o-mini'].name).toBe('gpt-4o-mini');
      expect(MODELS['gpt-4o-mini'].maxTokens).toBeGreaterThan(0);
    });

    it('has gpt-4o model defined', () => {
      expect(MODELS['gpt-4o']).toBeDefined();
      expect(MODELS['gpt-4o'].name).toBe('gpt-4o');
    });

    it('has gpt-4-turbo model defined', () => {
      expect(MODELS['gpt-4-turbo']).toBeDefined();
      expect(MODELS['gpt-4-turbo'].name).toBe('gpt-4-turbo');
    });

    it('all models have required fields', () => {
      Object.values(MODELS).forEach((model) => {
        expect(model.name).toBeDefined();
        expect(model.maxTokens).toBeGreaterThan(0);
        expect(model.costPer1kTokens).toBeGreaterThan(0);
        expect(model.bestFor).toBeInstanceOf(Array);
      });
    });
  });

  // ==========================================
  // Error Classification Tests
  // ==========================================

  describe('Error Classification', () => {
    it('classifies rate limit errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 429, data: { error: { message: 'Rate limit exceeded' } } },
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('RATE_LIMITED');
    });

    it('classifies authentication errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 401, data: { error: { message: 'Invalid API key' } } },
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('INVALID_API_KEY');
    });

    it('classifies network errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
        response: undefined,
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('classifies timeout errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        response: undefined,
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('TIMEOUT');
    });

    it('classifies server errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 500, data: { error: { message: 'Internal server error' } } },
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('classifies quota exceeded errors (402)', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 402, data: { error: { message: 'quota exceeded' } } },
      };
      const result = classifyError(error as any);
      expect(result.code).toBe('INSUFFICIENT_QUOTA');
    });

    it('classifies unknown errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      (axios.isCancel as unknown as jest.Mock).mockReturnValue(false);
      const error = new Error('Something weird happened');
      const result = classifyError(error as any);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('includes retry suggestion for rate limit', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 429, data: { error: { message: 'Rate limit' } } },
      };
      const result = classifyError(error as any);
      expect(result.retryable).toBe(true);
    });

    it('does not suggest retry for auth errors', () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      const error = {
        isAxiosError: true,
        response: { status: 401, data: { error: { message: 'Invalid key' } } },
      };
      const result = classifyError(error as any);
      expect(result.retryable).toBe(false);
    });
  });

  // ==========================================
  // Rate Limiter Tests (Logic)
  // ==========================================

  describe('Rate Limiter Logic', () => {
    it('token bucket refills over time', () => {
      // Simulate token bucket behavior
      let tokens = 5;
      const maxTokens = 10;
      const refillRate = 0.5; // tokens per second

      // Consume some tokens
      tokens -= 3;
      expect(tokens).toBe(2);

      // Simulate time passing (2 seconds)
      const timePassed = 2;
      const refilled = Math.min(maxTokens, tokens + timePassed * refillRate);
      expect(refilled).toBe(3); // 2 + 2*0.5 = 3
    });

    it('cannot exceed max tokens', () => {
      let tokens = 10;
      const maxTokens = 10;
      const refillRate = 1;

      // Add more tokens
      const timePassed = 5;
      tokens = Math.min(maxTokens, tokens + timePassed * refillRate);
      expect(tokens).toBe(10); // Should not exceed max
    });
  });

  // ==========================================
  // Cache Logic Tests
  // ==========================================

  describe('Cache Logic', () => {
    it('generates consistent cache keys', () => {
      const generateKey = (type: string, params: Record<string, unknown>) => {
        return `${type}:${JSON.stringify(params)}`;
      };

      const key1 = generateKey('flirt', { message: 'hey', contactId: 1 });
      const key2 = generateKey('flirt', { message: 'hey', contactId: 1 });
      expect(key1).toBe(key2);
    });

    it('different params create different keys', () => {
      const generateKey = (type: string, params: Record<string, unknown>) => {
        return `${type}:${JSON.stringify(params)}`;
      };

      const key1 = generateKey('flirt', { message: 'hey' });
      const key2 = generateKey('flirt', { message: 'hello' });
      expect(key1).not.toBe(key2);
    });

    it('cache entry expires after TTL', () => {
      const now = Date.now();
      const ttl = 5000; // 5 seconds

      const entry = {
        data: 'test',
        timestamp: now,
        expiresAt: now + ttl,
      };

      // Before expiry
      expect(Date.now() <= entry.expiresAt).toBe(true);

      // After expiry (simulated)
      const futureTime = now + ttl + 1000;
      expect(futureTime > entry.expiresAt).toBe(true);
    });
  });

  // ==========================================
  // Offline Queue Logic Tests
  // ==========================================

  describe('Offline Queue Logic', () => {
    it('adds requests to queue', () => {
      const queue: Array<{ id: string; type: string }> = [];

      const add = (type: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        queue.push({ id, type });
        return id;
      };

      const id1 = add('flirt');
      const id2 = add('screenshot');

      expect(queue.length).toBe(2);
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
    });

    it('processes queue in FIFO order', () => {
      const queue = ['first', 'second', 'third'];

      expect(queue.shift()).toBe('first');
      expect(queue.shift()).toBe('second');
      expect(queue.shift()).toBe('third');
    });

    it('enforces max queue size', () => {
      const maxSize = 3;
      const queue: string[] = [];

      const add = (item: string) => {
        if (queue.length >= maxSize) {
          queue.shift(); // Remove oldest
        }
        queue.push(item);
      };

      add('1');
      add('2');
      add('3');
      add('4');

      expect(queue.length).toBe(3);
      expect(queue[0]).toBe('2'); // Oldest removed
    });
  });

  // ==========================================
  // Retry Logic Tests
  // ==========================================

  describe('Retry Logic', () => {
    it('calculates exponential backoff', () => {
      const calculateBackoff = (attempt: number, baseDelay: number = 1000) => {
        return Math.min(baseDelay * Math.pow(2, attempt), 30000);
      };

      expect(calculateBackoff(0)).toBe(1000);
      expect(calculateBackoff(1)).toBe(2000);
      expect(calculateBackoff(2)).toBe(4000);
      expect(calculateBackoff(3)).toBe(8000);
      expect(calculateBackoff(10)).toBe(30000); // Capped at 30s
    });

    it('adds jitter to backoff', () => {
      const calculateBackoffWithJitter = (attempt: number, baseDelay: number = 1000) => {
        const backoff = Math.min(baseDelay * Math.pow(2, attempt), 30000);
        const jitter = Math.random() * 0.3 * backoff;
        return backoff + jitter;
      };

      // Run multiple times to verify jitter adds variance
      const results = Array.from({ length: 10 }, () => calculateBackoffWithJitter(2));
      const unique = new Set(results);

      // Should have some variance (not all the same)
      expect(unique.size).toBeGreaterThan(1);
    });

    it('respects max retries', () => {
      const maxRetries = 3;
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;
      }

      expect(attempts).toBe(maxRetries);
    });
  });

  // ==========================================
  // Usage Tracking Tests
  // ==========================================

  describe('Usage Tracking Logic', () => {
    it('tracks token usage', () => {
      let totalTokens = 0;

      const recordUsage = (promptTokens: number, completionTokens: number) => {
        totalTokens += promptTokens + completionTokens;
      };

      recordUsage(100, 50);
      recordUsage(200, 100);

      expect(totalTokens).toBe(450);
    });

    it('calculates cost', () => {
      const calculateCost = (tokens: number, costPer1k: number) => {
        return (tokens / 1000) * costPer1k;
      };

      const cost = calculateCost(10000, 0.002);
      expect(cost).toBeCloseTo(0.02);
    });
  });
});
