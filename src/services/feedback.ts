/**
 * Feedback Service - User feedback on AI responses
 * Phase 5.3.10-5.3.12: Response logging, user feedback, and prompt improvement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult } from '../types';

// ==========================================
// 5.3.10: Response Logging
// ==========================================

export interface ResponseLog {
  id: string;
  timestamp: number;
  requestType: 'flirt_response' | 'screenshot_analysis' | 'conversation_starter' | 'other';
  contactId?: number;
  theirMessage?: string;
  response: AnalysisResult;
  qualityScore: number;
  usedSuggestionIndex?: number;
  feedback?: FeedbackData;
}

interface FeedbackData {
  rating: 'positive' | 'negative' | null;
  usedSuggestionType?: 'safe' | 'balanced' | 'bold';
  wasCopied: boolean;
  wasEdited: boolean;
  timestamp: number;
}

const STORAGE_KEY = '@flirtkey/response_logs';
const MAX_LOGS = 500;

class ResponseLogger {
  private logs: ResponseLog[] = [];
  private loaded: boolean = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        this.logs = JSON.parse(data);
      }
      this.loaded = true;
    } catch (error) {
      if (__DEV__) console.error('Failed to load response logs:', error);
      this.logs = [];
      this.loaded = true;
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      if (__DEV__) console.error('Failed to save response logs:', error);
    }
  }

  async log(
    requestType: ResponseLog['requestType'],
    response: AnalysisResult,
    qualityScore: number,
    context?: { contactId?: number; theirMessage?: string }
  ): Promise<string> {
    await this.load();
    
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const logEntry: ResponseLog = {
      id,
      timestamp: Date.now(),
      requestType,
      response,
      qualityScore,
      contactId: context?.contactId,
      theirMessage: context?.theirMessage,
    };
    
    this.logs.push(logEntry);
    
    // Enforce max size
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
    
    await this.save();
    return id;
  }

  async getLogs(since?: number, limit?: number): Promise<ResponseLog[]> {
    await this.load();
    
    let filtered = this.logs;
    
    if (since) {
      filtered = filtered.filter(l => l.timestamp >= since);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  async getLogById(id: string): Promise<ResponseLog | null> {
    await this.load();
    return this.logs.find(l => l.id === id) || null;
  }

  async clear(): Promise<void> {
    this.logs = [];
    await this.save();
  }
}

const responseLogger = new ResponseLogger();

// ==========================================
// 5.3.11: User Feedback Collection
// ==========================================

export interface FeedbackEntry {
  logId: string;
  suggestionIndex: number;
  rating: 'positive' | 'negative';
  reason?: string;
  timestamp: number;
}

const FEEDBACK_STORAGE_KEY = '@flirtkey/feedback';

class FeedbackCollector {
  private feedback: FeedbackEntry[] = [];
  private loaded: boolean = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    
    try {
      const data = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (data) {
        this.feedback = JSON.parse(data);
      }
      this.loaded = true;
    } catch (error) {
      if (__DEV__) console.error('Failed to load feedback:', error);
      this.feedback = [];
      this.loaded = true;
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedback));
    } catch (error) {
      if (__DEV__) console.error('Failed to save feedback:', error);
    }
  }

  async submitFeedback(
    logId: string,
    suggestionIndex: number,
    rating: 'positive' | 'negative',
    reason?: string
  ): Promise<void> {
    await this.load();
    
    // Update existing feedback or add new
    const existingIndex = this.feedback.findIndex(
      f => f.logId === logId && f.suggestionIndex === suggestionIndex
    );
    
    const entry: FeedbackEntry = {
      logId,
      suggestionIndex,
      rating,
      reason,
      timestamp: Date.now(),
    };
    
    if (existingIndex >= 0) {
      this.feedback[existingIndex] = entry;
    } else {
      this.feedback.push(entry);
    }
    
    await this.save();
    
    // Also update the response log
    const log = await responseLogger.getLogById(logId);
    if (log) {
      log.feedback = {
        rating,
        usedSuggestionType: log.response.suggestions[suggestionIndex]?.type,
        wasCopied: true,
        wasEdited: false,
        timestamp: Date.now(),
      };
    }
  }

  async getFeedback(): Promise<FeedbackEntry[]> {
    await this.load();
    return [...this.feedback];
  }

  async getFeedbackStats(): Promise<{
    total: number;
    positive: number;
    negative: number;
    byType: Record<string, { positive: number; negative: number }>;
  }> {
    await this.load();
    
    const stats = {
      total: this.feedback.length,
      positive: 0,
      negative: 0,
      byType: {
        safe: { positive: 0, negative: 0 },
        balanced: { positive: 0, negative: 0 },
        bold: { positive: 0, negative: 0 },
      } as Record<string, { positive: number; negative: number }>,
    };
    
    for (const fb of this.feedback) {
      if (fb.rating === 'positive') {
        stats.positive++;
      } else {
        stats.negative++;
      }
      
      // Get suggestion type from log
      const log = await responseLogger.getLogById(fb.logId);
      if (log) {
        const type = log.response.suggestions[fb.suggestionIndex]?.type || 'balanced';
        if (!stats.byType[type]) {
          stats.byType[type] = { positive: 0, negative: 0 };
        }
        if (fb.rating === 'positive') {
          stats.byType[type].positive++;
        } else {
          stats.byType[type].negative++;
        }
      }
    }
    
    return stats;
  }

  async clear(): Promise<void> {
    this.feedback = [];
    await this.save();
  }
}

const feedbackCollector = new FeedbackCollector();

// ==========================================
// 5.3.12: Use Feedback to Improve Prompts
// ==========================================

export interface PromptInsight {
  type: 'positive_pattern' | 'negative_pattern' | 'suggestion';
  description: string;
  confidence: number;
  data: unknown;
}

async function analyzePatterns(): Promise<PromptInsight[]> {
  const logs = await responseLogger.getLogs(
    Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
  );
  const feedback = await feedbackCollector.getFeedback();
  
  const insights: PromptInsight[] = [];
  
  // Analyze which suggestion types are preferred
  const feedbackByType: Record<string, { positive: number; negative: number }> = {
    safe: { positive: 0, negative: 0 },
    balanced: { positive: 0, negative: 0 },
    bold: { positive: 0, negative: 0 },
  };
  
  for (const fb of feedback) {
    const log = logs.find(l => l.id === fb.logId);
    if (!log) continue;
    
    const type = log.response.suggestions[fb.suggestionIndex]?.type || 'balanced';
    if (feedbackByType[type]) {
      if (fb.rating === 'positive') {
        feedbackByType[type].positive++;
      } else {
        feedbackByType[type].negative++;
      }
    }
  }
  
  // Generate insights
  const total = feedback.length;
  if (total >= 10) {
    // Enough data for insights
    for (const [type, counts] of Object.entries(feedbackByType)) {
      const typeTotal = counts.positive + counts.negative;
      if (typeTotal >= 3) {
        const positiveRate = counts.positive / typeTotal;
        
        if (positiveRate >= 0.7) {
          insights.push({
            type: 'positive_pattern',
            description: `${type} suggestions have high approval (${Math.round(positiveRate * 100)}%)`,
            confidence: positiveRate,
            data: { type, counts },
          });
        } else if (positiveRate <= 0.3) {
          insights.push({
            type: 'negative_pattern',
            description: `${type} suggestions have low approval (${Math.round(positiveRate * 100)}%)`,
            confidence: 1 - positiveRate,
            data: { type, counts },
          });
        }
      }
    }
  }
  
  // Analyze quality scores
  const avgQuality = logs.reduce((sum, l) => sum + l.qualityScore, 0) / logs.length;
  if (avgQuality < 60) {
    insights.push({
      type: 'suggestion',
      description: 'Average response quality is below target. Consider refining prompts.',
      confidence: 0.8,
      data: { avgQuality },
    });
  }
  
  return insights;
}

// ==========================================
// Export
// ==========================================

export const FeedbackService = {
  // Logging
  logResponse: responseLogger.log.bind(responseLogger),
  getLogs: responseLogger.getLogs.bind(responseLogger),
  getLogById: responseLogger.getLogById.bind(responseLogger),
  clearLogs: responseLogger.clear.bind(responseLogger),
  
  // Feedback
  submitFeedback: feedbackCollector.submitFeedback.bind(feedbackCollector),
  getFeedback: feedbackCollector.getFeedback.bind(feedbackCollector),
  getFeedbackStats: feedbackCollector.getFeedbackStats.bind(feedbackCollector),
  clearFeedback: feedbackCollector.clear.bind(feedbackCollector),
  
  // Analysis
  analyzePatterns,
};

export default FeedbackService;
