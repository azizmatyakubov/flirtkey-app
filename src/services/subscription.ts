/**
 * Subscription Service - Monetization & Paywall
 * Phase 3, Task 1
 *
 * Abstraction layer ready for RevenueCat integration.
 * Currently uses local state (Zustand + AsyncStorage).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

// ==========================================
// Types
// ==========================================

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export type SubscriptionPeriod = 'weekly' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null; // ISO string, null = lifetime or free
  trialActive: boolean;
  trialEndsAt: string | null; // ISO string
  dailySuggestionsUsed: number;
  dailySuggestionsLimit: number; // 5 for free, Infinity for pro
  lastResetDate: string; // YYYY-MM-DD
}

export interface PlanLimits {
  dailySuggestions: number;
  maxGirls: number;
  hasSoundLikeMe: boolean;
  hasRescueAlerts: boolean;
  hasAnalytics: boolean;
  hasBioGen: boolean;
  hasGifs: boolean;
}

// ==========================================
// Constants
// ==========================================

// Use a large finite number instead of Infinity to survive JSON serialization
export const UNLIMITED = 999999;

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    dailySuggestions: 5,
    maxGirls: 1,
    hasSoundLikeMe: false,
    hasRescueAlerts: false,
    hasAnalytics: false,
    hasBioGen: true,
    hasGifs: false,
  },
  pro: {
    dailySuggestions: UNLIMITED,
    maxGirls: UNLIMITED,
    hasSoundLikeMe: true,
    hasRescueAlerts: true,
    hasAnalytics: true,
    hasBioGen: true,
    hasGifs: true,
  },
  lifetime: {
    dailySuggestions: UNLIMITED,
    maxGirls: UNLIMITED,
    hasSoundLikeMe: true,
    hasRescueAlerts: true,
    hasAnalytics: true,
    hasBioGen: true,
    hasGifs: true,
  },
};

export const PRICING: Record<
  SubscriptionPeriod,
  { price: number; label: string; badge?: string; savings?: string }
> = {
  weekly: { price: 3.99, label: '$3.99/week' },
  monthly: { price: 9.99, label: '$9.99/month', badge: 'Popular' },
  annual: { price: 49.99, label: '$49.99/year', badge: 'Best Value', savings: '58%' },
  lifetime: { price: 99.99, label: '$99.99 once', badge: 'Forever' },
};

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ==========================================
// Security — Tamper Protection
// ==========================================

const SIGN_SECRET = 'fk_v1_s8k3m2';

async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'ios') {
      return (
        (Application.getIosIdForVendorAsync?.() as unknown as Promise<string>) ?? 'ios-unknown'
      );
    }
    return Application.getAndroidId?.() ?? 'android-unknown';
  } catch {
    return 'device-unknown';
  }
}

async function signState(state: SubscriptionState): Promise<string> {
  const deviceId = await getDeviceId();
  const payload = JSON.stringify(state);
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + SIGN_SECRET + deviceId
  );
  return JSON.stringify({ p: payload, s: signature });
}

async function verifyState(stored: string): Promise<SubscriptionState | null> {
  try {
    const { p: payload, s: signature } = JSON.parse(stored);
    const deviceId = await getDeviceId();
    const expected = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      payload + SIGN_SECRET + deviceId
    );
    if (signature !== expected) return null; // tampered
    return JSON.parse(payload) as SubscriptionState;
  } catch {
    return null;
  }
}

// Track exact timestamps to detect counter resets
const TIMESTAMPS_KEY = 'fk_sg_ts';

export async function recordSuggestionTimestamp(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TIMESTAMPS_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps.push(Date.now());
    // Keep last 100
    const trimmed = timestamps.slice(-100);
    await AsyncStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(trimmed));
  } catch {
    // no-op
  }
}

async function getSuggestionTimestampsToday(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(TIMESTAMPS_KEY);
    if (!raw) return 0;
    const timestamps: number[] = JSON.parse(raw);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return timestamps.filter((t) => t >= todayStart.getTime()).length;
  } catch {
    return 0;
  }
}

const PRO_FEATURES = [
  'soundLikeMe',
  'rescueAlerts',
  'analytics',
  'gifs',
  'unlimitedGirls',
  'unlimitedSuggestions',
];

// ==========================================
// Helper
// ==========================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export function getDefaultSubscriptionState(): SubscriptionState {
  return {
    tier: 'free',
    expiresAt: null,
    trialActive: false,
    trialEndsAt: null,
    dailySuggestionsUsed: 0,
    dailySuggestionsLimit: PLAN_LIMITS.free.dailySuggestions,
    lastResetDate: getTodayString(),
  };
}

// ==========================================
// Core Functions
// ==========================================

/**
 * Check if user can generate a suggestion (daily limit)
 */
export function canUseSuggestion(state: SubscriptionState): boolean {
  const effectiveTier = getEffectiveTier(state);
  const limits = PLAN_LIMITS[effectiveTier];

  if (limits.dailySuggestions >= UNLIMITED) return true;

  const today = getTodayString();
  const used = state.lastResetDate === today ? state.dailySuggestionsUsed : 0;
  return used < limits.dailySuggestions;
}

/**
 * Record a suggestion use; returns updated state.
 * Resets counter if day has changed.
 */
export function recordSuggestionUse(state: SubscriptionState): SubscriptionState {
  const today = getTodayString();
  const shouldReset = state.lastResetDate !== today;

  return {
    ...state,
    dailySuggestionsUsed: shouldReset ? 1 : state.dailySuggestionsUsed + 1,
    lastResetDate: today,
  };
}

/**
 * Check if user can access a specific feature.
 */
export function canAccessFeature(state: SubscriptionState, feature: keyof PlanLimits): boolean {
  const effectiveTier = getEffectiveTier(state);
  const limits = PLAN_LIMITS[effectiveTier];
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

/**
 * Returns true if the feature requires pro tier.
 */
export function isProFeature(feature: string): boolean {
  return PRO_FEATURES.includes(feature);
}

/**
 * Get remaining suggestions for today.
 */
export function getRemainingToday(state: SubscriptionState): number {
  const effectiveTier = getEffectiveTier(state);
  const limits = PLAN_LIMITS[effectiveTier];

  if (limits.dailySuggestions >= UNLIMITED) return UNLIMITED;

  const today = getTodayString();
  const used = state.lastResetDate === today ? state.dailySuggestionsUsed : 0;
  return Math.max(0, limits.dailySuggestions - used);
}

/**
 * Get effective tier (accounts for trial / expiry).
 */
export function getEffectiveTier(state: SubscriptionState): SubscriptionTier {
  // Trial check
  if (state.trialActive && state.trialEndsAt) {
    const trialEnd = new Date(state.trialEndsAt).getTime();
    if (Date.now() < trialEnd) return 'pro';
  }

  // Lifetime never expires
  if (state.tier === 'lifetime') return 'lifetime';

  // Pro expiry check
  if (state.tier === 'pro' && state.expiresAt) {
    const expiry = new Date(state.expiresAt).getTime();
    if (Date.now() > expiry) return 'free';
  }

  return state.tier;
}

/**
 * Start a 3-day free trial.
 */
export function startTrial(state: SubscriptionState): SubscriptionState {
  const trialEnd = new Date(Date.now() + TRIAL_DURATION_MS).toISOString();
  return {
    ...state,
    trialActive: true,
    trialEndsAt: trialEnd,
  };
}

/**
 * Upgrade to pro (local mock — RevenueCat later).
 */
export function upgradeToPro(
  state: SubscriptionState,
  period: SubscriptionPeriod
): SubscriptionState {
  if (period === 'lifetime') {
    return {
      ...state,
      tier: 'lifetime',
      expiresAt: null,
      trialActive: false,
      trialEndsAt: null,
      dailySuggestionsLimit: UNLIMITED,
    };
  }

  const durationMs = {
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    annual: 365 * 24 * 60 * 60 * 1000,
  }[period];

  return {
    ...state,
    tier: 'pro',
    expiresAt: new Date(Date.now() + durationMs).toISOString(),
    trialActive: false,
    trialEndsAt: null,
    dailySuggestionsLimit: UNLIMITED,
  };
}

/**
 * Restore purchase (mock — checks signed AsyncStorage).
 */
export async function restorePurchase(): Promise<SubscriptionState | null> {
  try {
    const raw = await AsyncStorage.getItem('fk_sb');
    if (raw) {
      const verified = await verifyState(raw);
      if (verified) return verified;
      // Tampered — reset to free
      return null;
    }
  } catch {
    // no-op
  }
  return null;
}

/**
 * Backup subscription state (signed + device bound).
 */
export async function backupSubscription(state: SubscriptionState): Promise<void> {
  try {
    const signed = await signState(state);
    await AsyncStorage.setItem('fk_sb', signed);
  } catch {
    // no-op
  }
}

/**
 * Validate subscription on app open. Checks expiry + tamper.
 */
export async function validateOnOpen(state: SubscriptionState): Promise<SubscriptionState> {
  // Check expiry
  const effectiveTier = getEffectiveTier(state);
  if (effectiveTier === 'free' && state.tier !== 'free') {
    // Expired, reset
    return {
      ...getDefaultSubscriptionState(),
      dailySuggestionsUsed: state.dailySuggestionsUsed,
      lastResetDate: state.lastResetDate,
    };
  }

  // Cross check daily usage with timestamps
  if (effectiveTier === 'free') {
    const actualUsage = await getSuggestionTimestampsToday();
    if (state.dailySuggestionsUsed < actualUsage) {
      // Counter was reset, use timestamp count
      return { ...state, dailySuggestionsUsed: actualUsage };
    }
  }

  return state;
}

/**
 * Record suggestion with timestamp tracking.
 */
export async function recordSuggestionWithTimestamp(
  state: SubscriptionState
): Promise<SubscriptionState> {
  await recordSuggestionTimestamp();
  return recordSuggestionUse(state);
}

// ==========================================
// Default export
// ==========================================

export const SubscriptionService = {
  canUseSuggestion,
  recordSuggestionUse,
  recordSuggestionWithTimestamp,
  canAccessFeature,
  isProFeature,
  getRemainingToday,
  getEffectiveTier,
  startTrial,
  upgradeToPro,
  restorePurchase,
  backupSubscription,
  validateOnOpen,
  getDefaultSubscriptionState,
  PLAN_LIMITS,
  PRICING,
};

export default SubscriptionService;
