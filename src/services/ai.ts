/**
 * AI Service - OpenAI API integration (Enhanced)
 * Phase 5: AI Integration
 * 
 * Features:
 * - 5.1.5: Retry logic with exponential backoff
 * - 5.1.6: Request timeout handling
 * - 5.1.7: Client-side rate limiting
 * - 5.1.8: Request cancellation
 * - 5.1.9: Response caching
 * - 5.1.10: Offline queue
 * - 5.1.11: Error type classification
 * - 5.1.12: Usage tracking
 * - 5.1.13: Model selection
 * - 5.1.14: Token estimation
 * - 5.3: Response handling
 * - 5.4: Error handling
 */

import axios, { AxiosError, CancelTokenSource } from 'axios';
import { Contact, Culture, AnalysisResult, Suggestion, APIError, APIErrorCode } from '../types';
import {
  CULTURE_STYLES,
  STAGES,
  buildFlirtPrompt,
  buildScreenshotPrompt,
  buildConversationStarterPrompt,
  buildDateIdeaPrompt,
  buildWhatToAvoidPrompt,
  buildInterestLevelPrompt,
  buildRedFlagPrompt,
  buildTimingPrompt,
  estimateTokens,
  type ConversationStarterParams,
  type DateIdeaParams,
  type WhatToAvoidParams,
  type InterestLevelParams,
  type RedFlagParams,
  type TimingParams,
} from '../constants/prompts';
import { apiClient, ApiMode } from './apiClient';

// Re-export for backward compatibility
export { CULTURE_STYLES, STAGES };

// ==========================================
// 5.1.13: Model Selection
// ==========================================

export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';

export interface ModelConfig {
  name: AIModel;
  maxTokens: number;
  costPer1kTokens: number;
  bestFor: string[];
}

export const MODELS: Record<AIModel, ModelConfig> = {
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    maxTokens: 128000,
    costPer1kTokens: 0.00015,
    bestFor: ['quick responses', 'simple queries', 'cost-effective'],
  },
  'gpt-4o': {
    name: 'gpt-4o',
    maxTokens: 128000,
    costPer1kTokens: 0.005,
    bestFor: ['image analysis', 'complex reasoning', 'nuanced responses'],
  },
  'gpt-4-turbo': {
    name: 'gpt-4-turbo',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    bestFor: ['highest quality', 'complex analysis'],
  },
};

// ==========================================
// 5.1.7: Rate Limiting (Client-side)
// ==========================================

interface RateLimitState {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

class RateLimiter {
  private state: RateLimitState;

  constructor(maxTokens: number = 10, refillRate: number = 0.5) {
    this.state = {
      tokens: maxTokens,
      lastRefill: Date.now(),
      maxTokens,
      refillRate,
    };
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.state.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.state.refillRate;
    
    this.state.tokens = Math.min(this.state.maxTokens, this.state.tokens + tokensToAdd);
    this.state.lastRefill = now;
  }

  canProceed(): boolean {
    this.refill();
    return this.state.tokens >= 1;
  }

  consume(): boolean {
    if (!this.canProceed()) {
      return false;
    }
    this.state.tokens -= 1;
    return true;
  }

  getWaitTime(): number {
    if (this.canProceed()) return 0;
    return Math.ceil((1 - this.state.tokens) / this.state.refillRate * 1000);
  }

  async waitForToken(): Promise<void> {
    const waitTime = this.getWaitTime();
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

const rateLimiter = new RateLimiter(10, 0.5); // 10 requests, refill 0.5/sec

// ==========================================
// 5.1.9: Response Caching
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number = 100;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  private generateKey(type: string, params: Record<string, unknown>): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  get<T>(type: string, params: Record<string, unknown>): T | null {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(type: string, params: Record<string, unknown>, data: T, ttl?: number): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    const key = this.generateKey(type, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

const responseCache = new ResponseCache();

// ==========================================
// 5.1.10: Offline Queue
// ==========================================

interface QueuedRequest {
  id: string;
  type: string;
  params: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private maxSize: number = 50;
  private isOnline: boolean = true;

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  isAvailable(): boolean {
    return this.isOnline;
  }

  add(type: string, params: Record<string, unknown>): string {
    if (this.queue.length >= this.maxSize) {
      // Remove oldest
      this.queue.shift();
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      type,
      params,
      timestamp: Date.now(),
      retryCount: 0,
    });
    
    return id;
  }

  getNext(): QueuedRequest | null {
    return this.queue.shift() || null;
  }

  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(r => r.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}

const offlineQueue = new OfflineQueue();

// ==========================================
// 5.1.12: Usage Tracking
// ==========================================

interface UsageRecord {
  timestamp: number;
  model: AIModel;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestType: string;
}

class UsageTracker {
  private records: UsageRecord[] = [];
  private maxRecords: number = 1000;

  track(record: Omit<UsageRecord, 'timestamp'>): void {
    if (this.records.length >= this.maxRecords) {
      this.records.shift();
    }
    this.records.push({ ...record, timestamp: Date.now() });
  }

  getRecords(since?: number): UsageRecord[] {
    if (since) {
      return this.records.filter(r => r.timestamp >= since);
    }
    return [...this.records];
  }

  getTotalUsage(since?: number): { tokens: number; cost: number; requests: number } {
    const records = this.getRecords(since);
    return records.reduce(
      (acc, r) => ({
        tokens: acc.tokens + r.totalTokens,
        cost: acc.cost + r.estimatedCost,
        requests: acc.requests + 1,
      }),
      { tokens: 0, cost: 0, requests: 0 }
    );
  }

  getDailyUsage(): { tokens: number; cost: number; requests: number } {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    return this.getTotalUsage(dayStart.getTime());
  }

  clear(): void {
    this.records = [];
  }
}

const usageTracker = new UsageTracker();

// ==========================================
// 5.1.8: Request Cancellation
// ==========================================

const activeCancelTokens: Map<string, CancelTokenSource> = new Map();

function createCancelToken(requestId: string): CancelTokenSource {
  const source = axios.CancelToken.source();
  activeCancelTokens.set(requestId, source);
  return source;
}

function cancelRequest(requestId: string): boolean {
  const source = activeCancelTokens.get(requestId);
  if (source) {
    source.cancel('Request cancelled by user');
    activeCancelTokens.delete(requestId);
    return true;
  }
  return false;
}

function cleanupCancelToken(requestId: string): void {
  activeCancelTokens.delete(requestId);
}

export function cancelAllRequests(): void {
  activeCancelTokens.forEach((source) => {
    source.cancel('All requests cancelled');
  });
  activeCancelTokens.clear();
}

// ==========================================
// 5.1.11 & 5.4: Error Classification
// ==========================================

export function classifyError(error: unknown): APIError {
  if (axios.isCancel(error)) {
    return {
      code: 'CANCELLED',
      message: 'Request was cancelled',
      retryable: false,
    };
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string; type?: string } }>;
    
    // Network errors
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return {
          code: 'TIMEOUT',
          message: 'Request timed out. Please try again.',
          retryable: true,
        };
      }
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        retryable: true,
      };
    }
    
    const status = axiosError.response.status;
    const errorMessage = axiosError.response.data?.error?.message || axiosError.message;
    
    // API errors by status code
    switch (status) {
      case 401:
        return {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key. Please check your settings.',
          status,
          retryable: false,
        };
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Rate limited. Please wait a moment and try again.',
          status,
          retryable: true,
        };
      case 402:
      case 403:
        return {
          code: 'INSUFFICIENT_QUOTA',
          message: 'API quota exceeded. Please check your OpenAI billing.',
          status,
          retryable: false,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: 'OpenAI server error. Please try again later.',
          status,
          retryable: true,
        };
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMessage || 'An unexpected error occurred.',
          status,
          retryable: false,
        };
    }
  }
  
  // Non-Axios errors
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      retryable: false,
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    retryable: false,
  };
}

// 5.4.5: User-friendly error messages
export function getUserFriendlyMessage(error: APIError): string {
  const messages: Record<APIErrorCode | 'CANCELLED', string> = {
    NETWORK_ERROR: '📡 No internet connection. Check your network and try again.',
    TIMEOUT: '⏰ Request took too long. Try again or simplify your message.',
    RATE_LIMITED: '🐌 Too many requests. Take a breath and try again in a moment.',
    INVALID_API_KEY: '🔑 API key is invalid. Go to Settings to update it.',
    INSUFFICIENT_QUOTA: '💸 OpenAI quota exceeded. Check your billing at platform.openai.com.',
    SERVER_ERROR: '🔧 OpenAI servers are having issues. Try again in a few minutes.',
    PARSE_ERROR: '🤔 AI gave an unexpected response. Try rephrasing your message.',
    UNKNOWN_ERROR: '❌ Something went wrong. Please try again.',
    CANCELLED: '✋ Request was cancelled.',
  };
  
  return messages[error.code as keyof typeof messages] || messages.UNKNOWN_ERROR;
}

// ==========================================
// 5.1.5: Retry Logic with Exponential Backoff
// ==========================================

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: APIErrorCode[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR'],
};

async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, retryableErrors } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
  
  let lastError: APIError | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const classifiedError = classifyError(error);
      lastError = classifiedError;
      
      const isRetryable = retryableErrors.includes(classifiedError.code as APIErrorCode);
      const hasRetriesLeft = attempt < maxRetries;
      
      if (!isRetryable || !hasRetriesLeft) {
        throw classifiedError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);
      
      if (__DEV__) console.log(`Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || { code: 'UNKNOWN_ERROR', message: 'Max retries exceeded' };
}

// ==========================================
// Request Types
// ==========================================

export interface GenerateFlirtRequest {
  contact: Contact;
  theirMessage: string;
  userCulture: Culture;
  context?: string;
  apiKey: string;
  model?: AIModel;
  useCache?: boolean;
  tone?: string;
  /** API mode: 'proxy' (server key) or 'byok' (user's key). Defaults to 'byok' for backward compat. */
  apiMode?: ApiMode;
}

export interface AnalyzeScreenshotRequest {
  contact: Contact | null;
  imageBase64: string;
  userCulture: Culture;
  apiKey: string;
  model?: AIModel;
  /** API mode: 'proxy' (server key) or 'byok' (user's key). Defaults to 'byok' for backward compat. */
  apiMode?: ApiMode;
}

// ==========================================
// 5.3: Response Parsing & Handling
// ==========================================

// 5.3.5: Response validation schema
interface ExpectedResponse {
  suggestions: Array<{
    type: string;
    text: string;
    reason?: string;
  }>;
  proTip?: string;
  interestLevel?: number;
  mood?: string;
}

// 5.3.3 & 5.3.5: Parse and validate AI response
function parseAIResponse(content: string): AnalysisResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      if (__DEV__) console.warn('No JSON found in response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as ExpectedResponse;
    
    // Validate required structure
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      if (__DEV__) console.warn('Invalid suggestions structure');
      return null;
    }
    
    // 5.3.6: Sanitize and validate suggestions
    const suggestions: Suggestion[] = parsed.suggestions
      .map((s) => ({
        type: validateSuggestionType(s.type),
        text: sanitizeResponse(s.text || ''),
        reason: sanitizeResponse(s.reason || ''),
      }))
      .filter((s): s is Suggestion => s.text.length > 0);
    
    if (suggestions.length === 0) {
      if (__DEV__) console.warn('No valid suggestions after filtering');
      return null;
    }
    
    // Ensure we have all three types
    const types = new Set(suggestions.map(s => s.type));
    if (!types.has('safe') || !types.has('balanced') || !types.has('bold')) {
      // Fill missing types with the first available (we know suggestions has at least 1 item here)
      const base = suggestions[0]!;
      const createSuggestion = (type: 'safe' | 'balanced' | 'bold'): Suggestion => ({
        type,
        text: base.text,
        reason: base.reason,
      });
      
      if (!types.has('safe')) {
        suggestions.unshift(createSuggestion('safe'));
      }
      if (!types.has('balanced') && suggestions.length < 3) {
        suggestions.push(createSuggestion('balanced'));
      }
      if (!types.has('bold') && suggestions.length < 3) {
        suggestions.push(createSuggestion('bold'));
      }
    }
    
    return {
      suggestions: suggestions.slice(0, 3), // Max 3 suggestions
      proTip: sanitizeResponse(parsed.proTip || ''),
      interestLevel: normalizeInterestLevel(parsed.interestLevel),
      mood: parsed.mood ? sanitizeResponse(parsed.mood) : undefined,
    };
  } catch (e) {
    if (__DEV__) console.error('Failed to parse AI response:', e);
    return null;
  }
}

// 5.3.6: Validate suggestion type
function validateSuggestionType(type: string): 'safe' | 'balanced' | 'bold' {
  const validTypes = ['safe', 'balanced', 'bold'];
  const normalized = type?.toLowerCase?.() || 'balanced';
  return validTypes.includes(normalized) ? normalized as 'safe' | 'balanced' | 'bold' : 'balanced';
}

// 5.3.6: Sanitize response text
function sanitizeResponse(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .slice(0, 1000) // Max length
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

// Normalize interest level to 0-100
function normalizeInterestLevel(level: unknown): number | undefined {
  if (typeof level !== 'number') return undefined;
  // Convert 1-10 scale to 0-100
  if (level <= 10) {
    return Math.min(100, Math.max(0, level * 10));
  }
  return Math.min(100, Math.max(0, level));
}

// 5.3.4: Fallback responses
const FALLBACK_RESPONSES: Record<string, AnalysisResult> = {
  default: {
    suggestions: [
      {
        type: 'safe',
        text: "That's interesting! Tell me more about it 😊",
        reason: 'Safe opener to keep conversation going',
      },
      {
        type: 'balanced',
        text: 'I love that energy! What else is on your mind?',
        reason: 'Shows enthusiasm while staying engaged',
      },
      {
        type: 'bold',
        text: "You've got my attention now... what are you up to later?",
        reason: 'Direct but playful escalation',
      },
    ],
    proTip: 'Try being more specific with context for better suggestions',
  },
  screenshot_failed: {
    suggestions: [
      {
        type: 'safe',
        text: 'Could not analyze the image clearly',
        reason: 'Try a clearer screenshot',
      },
      {
        type: 'balanced',
        text: 'Try uploading a clearer image',
        reason: 'Better image quality helps analysis',
      },
      {
        type: 'bold',
        text: 'Screenshot the conversation and try again',
        reason: 'Full conversation context helps',
      },
    ],
    proTip: 'Make sure the chat messages are clearly visible in the screenshot',
  },
  network_error: {
    suggestions: [
      {
        type: 'safe',
        text: 'Connection issue - please try again',
        reason: 'Check your internet connection',
      },
    ],
    proTip: 'Make sure you have a stable internet connection',
  },
};

function getFallbackResponse(type: keyof typeof FALLBACK_RESPONSES = 'default'): AnalysisResult {
  const response = FALLBACK_RESPONSES[type];
  if (response) return response;
  // Default fallback is always defined
  return FALLBACK_RESPONSES['default'] as AnalysisResult;
}

// 5.3.9: Response quality scoring
export function scoreResponseQuality(response: AnalysisResult): number {
  let score = 0;
  
  // Has all three suggestion types
  const types = new Set(response.suggestions.map(s => s.type));
  if (types.size === 3) score += 30;
  else score += types.size * 10;
  
  // Suggestions have reasonable length
  response.suggestions.forEach(s => {
    if (s.text.length >= 10 && s.text.length <= 200) score += 10;
    if (s.reason && s.reason.length >= 5) score += 5;
  });
  
  // Has pro tip
  if (response.proTip && response.proTip.length >= 10) score += 15;
  
  // Has interest level
  if (typeof response.interestLevel === 'number') score += 10;
  
  // Has mood
  if (response.mood) score += 5;
  
  return Math.min(100, score);
}

// ==========================================
// API Functions
// ==========================================

async function makeAPICall(
  apiKey: string,
  messages: Array<{ role: string; content: unknown }>,
  model: AIModel = 'gpt-4o-mini',
  maxTokens: number = 1000,
  temperature: number = 0.8,
  requestId?: string,
  apiMode: ApiMode = 'byok'
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }; _flirtkey?: unknown }> {
  // Rate limiting
  await rateLimiter.waitForToken();
  
  const cancelSource = requestId ? createCancelToken(requestId) : undefined;
  
  try {
    // Use the unified API client which handles both proxy and BYOK modes
    const response = await apiClient.chatCompletion(
      apiMode,
      { model, messages, temperature, max_tokens: maxTokens },
      apiKey,
      cancelSource
    );
    
    const content = response.choices?.[0]?.message?.content;
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    if (!content) {
      throw new Error('Empty response from AI');
    }
    
    return { content, usage, _flirtkey: response._flirtkey };
  } finally {
    if (requestId) {
      cleanupCancelToken(requestId);
    }
  }
}

// 5.1.3: Generate flirt response (enhanced)
export async function generateFlirtResponse(
  request: GenerateFlirtRequest
): Promise<AnalysisResult> {
  const { contact, theirMessage, userCulture, context, apiKey, model = 'gpt-4o-mini', useCache = true, apiMode = 'byok' } = request;
  
  // Check cache first
  if (useCache) {
    const cacheKey = { contact: contact.id, message: theirMessage, culture: userCulture };
    const cached = responseCache.get<AnalysisResult>('flirt', cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  const { prompt } = buildFlirtPrompt({ contact, theirMessage, userCulture, context });
  const requestId = `flirt-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        {
          role: 'system',
          content: 'You are FlirtKey. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
        },
        { role: 'user', content: prompt },
      ],
      model,
      1000,
      0.8,
      requestId,
      apiMode
    );
    
    // Track usage
    usageTracker.track({
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS[model].costPer1kTokens,
      requestType: 'flirt_response',
    });
    
    const parsed = parseAIResponse(content);
    if (!parsed) {
      if (__DEV__) console.warn('Failed to parse response, using fallback');
      return getFallbackResponse('default');
    }
    
    // Cache successful response
    if (useCache) {
      const cacheKey = { contact: contact.id, message: theirMessage, culture: userCulture };
      responseCache.set('flirt', cacheKey, parsed);
    }
    
    return parsed;
  });
}

// 5.1.4: Analyze screenshot (enhanced)
export async function analyzeScreenshot(
  request: AnalyzeScreenshotRequest
): Promise<AnalysisResult> {
  const { contact, imageBase64, userCulture, apiKey, model = 'gpt-4o', apiMode = 'byok' } = request;
  
  const { prompt } = buildScreenshotPrompt({ contact, userCulture });
  const requestId = `screenshot-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this chat screenshot and suggest responses:' },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      model,
      1500,
      0.7,
      requestId,
      apiMode
    );
    
    // Track usage
    usageTracker.track({
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS[model].costPer1kTokens,
      requestType: 'screenshot_analysis',
    });
    
    const parsed = parseAIResponse(content);
    if (!parsed) {
      return getFallbackResponse('screenshot_failed');
    }
    
    return parsed;
  }, { maxRetries: 2 }); // Less retries for expensive vision calls
}

// ==========================================
// New Prompt-based Functions (5.2.6-5.2.14)
// ==========================================

export async function generateConversationStarter(
  params: ConversationStarterParams & { apiKey: string; apiMode?: ApiMode }
): Promise<AnalysisResult> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildConversationStarterPrompt(promptParams);
  const requestId = `starter-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      800,
      0.9,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'conversation_starter',
    });
    
    return parseAIResponse(content) || getFallbackResponse('default');
  });
}

export async function generateDateIdeas(
  params: DateIdeaParams & { apiKey: string; apiMode?: ApiMode }
): Promise<unknown> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildDateIdeaPrompt(promptParams);
  const requestId = `date-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      1000,
      0.8,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'date_idea',
    });
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  });
}

export async function analyzeWhatToAvoid(
  params: WhatToAvoidParams & { apiKey: string; apiMode?: ApiMode }
): Promise<unknown> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildWhatToAvoidPrompt(promptParams);
  const requestId = `avoid-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      600,
      0.5,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'what_to_avoid',
    });
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  });
}

export async function analyzeInterestLevel(
  params: InterestLevelParams & { apiKey: string; apiMode?: ApiMode }
): Promise<unknown> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildInterestLevelPrompt(promptParams);
  const requestId = `interest-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      500,
      0.3,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'interest_level',
    });
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  });
}

export async function detectRedFlags(
  params: RedFlagParams & { apiKey: string; apiMode?: ApiMode }
): Promise<unknown> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildRedFlagPrompt(promptParams);
  const requestId = `redflags-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      800,
      0.3,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'red_flag_detection',
    });
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  });
}

export async function getTimingSuggestion(
  params: TimingParams & { apiKey: string; apiMode?: ApiMode }
): Promise<unknown> {
  const { apiKey, apiMode = 'byok', ...promptParams } = params;
  const { prompt } = buildTimingPrompt(promptParams);
  const requestId = `timing-${Date.now()}`;
  
  return withRetry(async () => {
    const { content, usage } = await makeAPICall(
      apiKey,
      [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      'gpt-4o-mini',
      400,
      0.3,
      requestId,
      apiMode
    );
    
    usageTracker.track({
      model: 'gpt-4o-mini',
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * MODELS['gpt-4o-mini'].costPer1kTokens,
      requestType: 'timing_suggestion',
    });
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  });
}

// ==========================================
// Utility Exports
// ==========================================

export const AIService = {
  // Main functions
  generateFlirtResponse,
  analyzeScreenshot,
  generateConversationStarter,
  generateDateIdeas,
  analyzeWhatToAvoid,
  analyzeInterestLevel,
  detectRedFlags,
  getTimingSuggestion,
  
  // Cancel management
  cancelRequest,
  cancelAllRequests,
  
  // Cache management
  clearCache: () => responseCache.clear(),
  getCacheStats: () => responseCache.getStats(),
  
  // Usage tracking
  getUsage: () => usageTracker.getTotalUsage(),
  getDailyUsage: () => usageTracker.getDailyUsage(),
  clearUsage: () => usageTracker.clear(),
  
  // Offline queue
  isOnline: () => offlineQueue.isAvailable(),
  setOnlineStatus: (online: boolean) => offlineQueue.setOnlineStatus(online),
  getQueuedRequests: () => offlineQueue.getAll(),
  clearQueue: () => offlineQueue.clear(),
  
  // Error handling
  classifyError,
  getUserFriendlyMessage,
  
  // Response quality
  scoreResponseQuality,
  
  // Token estimation
  estimateTokens,
  
  // Constants
  MODELS,
  CULTURE_STYLES,
  STAGES,
};

// ==========================================
// Legacy exports for backward compatibility
// ==========================================

export async function generateResponse(
  apiKey: string,
  contact: Contact,
  theirMessage: string,
  userCulture: Culture,
  apiMode: ApiMode = 'byok'
): Promise<AnalysisResult> {
  return generateFlirtResponse({ contact, theirMessage, userCulture, apiKey, apiMode });
}

export async function analyzeScreenshotLegacy(
  apiKey: string,
  imageBase64: string,
  contact: Contact | null,
  userCulture: Culture,
  apiMode: ApiMode = 'byok'
): Promise<AnalysisResult> {
  return analyzeScreenshot({ contact, imageBase64, userCulture, apiKey, apiMode });
}

export default AIService;
