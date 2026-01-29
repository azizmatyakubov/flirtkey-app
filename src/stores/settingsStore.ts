import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// ==========================================
// Settings Types
// ==========================================

export type ResponseTone = 'flirty' | 'casual' | 'confident' | 'romantic' | 'playful';
export type ResponseLength = 'short' | 'medium' | 'detailed';
export type ThemeMode = 'dark' | 'light' | 'system';
export type Language = 'en' | 'ru' | 'uz' | 'es' | 'fr' | 'de';
export type AutoLockTimeout = 'immediate' | '1min' | '5min' | '15min' | '30min' | 'never';
export type DataRetention = '1week' | '1month' | '3months' | '6months' | '1year' | 'forever';

export interface NotificationSettings {
  enabled: boolean;
  dailyTips: boolean;
  suggestions: boolean;
  updates: boolean;
  sounds: boolean;
}

export interface PrivacySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinCode: string | null;
  autoLockTimeout: AutoLockTimeout;
  dataRetention: DataRetention;
}

export interface UserPreferences {
  defaultTone: ResponseTone;
  responseLength: ResponseLength;
  emojiUsage: boolean;
  gifSuggestions: boolean;
  boldnessDefault: 'safe' | 'balanced' | 'bold';
  customPromptAdditions: string;
  blockedPhrases: string[];
  favoritePhrases: string[];
  quickReplyTemplates: string[];
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
}

export interface AppStats {
  totalSuggestions: number;
  totalCopied: number;
  totalAnalyses: number;
  appOpens: number;
  lastOpenDate: string | null;
  firstOpenDate: string | null;
}

interface SettingsState {
  // Theme
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Notifications
  notifications: NotificationSettings;
  setNotifications: (settings: Partial<NotificationSettings>) => void;

  // Privacy
  privacy: PrivacySettings;
  setPrivacy: (settings: Partial<PrivacySettings>) => void;
  verifyPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;

  // User Preferences
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addBlockedPhrase: (phrase: string) => void;
  removeBlockedPhrase: (phrase: string) => void;
  addFavoritePhrase: (phrase: string) => void;
  removeFavoritePhrase: (phrase: string) => void;
  addQuickReply: (template: string) => void;
  removeQuickReply: (template: string) => void;

  // Accessibility
  accessibility: AccessibilitySettings;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;

  // App Stats
  stats: AppStats;
  incrementStat: (
    stat: keyof Pick<AppStats, 'totalSuggestions' | 'totalCopied' | 'totalAnalyses' | 'appOpens'>
  ) => void;
  recordAppOpen: () => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Rate App
  hasRatedApp: boolean;
  setHasRatedApp: (rated: boolean) => void;
  ratePromptDismissed: boolean;
  setRatePromptDismissed: (dismissed: boolean) => void;

  // Reset
  resetSettings: () => void;
}

// ==========================================
// Default Values
// ==========================================

const defaultNotifications: NotificationSettings = {
  enabled: true,
  dailyTips: true,
  suggestions: true,
  updates: true,
  sounds: true,
};

const defaultPrivacy: PrivacySettings = {
  biometricEnabled: false,
  pinEnabled: false,
  pinCode: null,
  autoLockTimeout: '5min',
  dataRetention: 'forever',
};

const defaultPreferences: UserPreferences = {
  defaultTone: 'flirty',
  responseLength: 'medium',
  emojiUsage: true,
  gifSuggestions: true,
  boldnessDefault: 'balanced',
  customPromptAdditions: '',
  blockedPhrases: [],
  favoritePhrases: [],
  quickReplyTemplates: [
    'Hey! How are you?',
    'What are you up to?',
    'Miss you 😊',
    'Let me think about it...',
  ],
};

const defaultAccessibility: AccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  hapticFeedback: true,
  soundEffects: false,
};

const defaultStats: AppStats = {
  totalSuggestions: 0,
  totalCopied: 0,
  totalAnalyses: 0,
  appOpens: 0,
  lastOpenDate: null,
  firstOpenDate: null,
};

// ==========================================
// Store
// ==========================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Theme
      themeMode: 'dark',
      setThemeMode: (mode) => set({ themeMode: mode }),

      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Notifications
      notifications: defaultNotifications,
      setNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),

      // Privacy
      privacy: defaultPrivacy,
      setPrivacy: (settings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        })),
      verifyPin: (pin) => {
        const stored = get().privacy.pinCode;
        return stored === pin;
      },
      setPin: (pin) =>
        set((state) => ({
          privacy: { ...state.privacy, pinCode: pin, pinEnabled: true },
        })),
      clearPin: () =>
        set((state) => ({
          privacy: { ...state.privacy, pinCode: null, pinEnabled: false },
        })),

      // User Preferences
      preferences: defaultPreferences,
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      addBlockedPhrase: (phrase) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            blockedPhrases: [...state.preferences.blockedPhrases, phrase],
          },
        })),
      removeBlockedPhrase: (phrase) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            blockedPhrases: state.preferences.blockedPhrases.filter((p) => p !== phrase),
          },
        })),
      addFavoritePhrase: (phrase) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favoritePhrases: [...state.preferences.favoritePhrases, phrase],
          },
        })),
      removeFavoritePhrase: (phrase) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favoritePhrases: state.preferences.favoritePhrases.filter((p) => p !== phrase),
          },
        })),
      addQuickReply: (template) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            quickReplyTemplates: [...state.preferences.quickReplyTemplates, template],
          },
        })),
      removeQuickReply: (template) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            quickReplyTemplates: state.preferences.quickReplyTemplates.filter(
              (t) => t !== template
            ),
          },
        })),

      // Accessibility
      accessibility: defaultAccessibility,
      setAccessibility: (settings) => {
        // Trigger haptic when haptic feedback setting changes
        if (settings.hapticFeedback !== undefined && settings.hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        set((state) => ({
          accessibility: { ...state.accessibility, ...settings },
        }));
      },

      // App Stats
      stats: defaultStats,
      incrementStat: (stat) =>
        set((state) => ({
          stats: { ...state.stats, [stat]: state.stats[stat] + 1 },
        })),
      recordAppOpen: () => {
        const now = new Date().toISOString();
        set((state) => ({
          stats: {
            ...state.stats,
            appOpens: state.stats.appOpens + 1,
            lastOpenDate: now,
            firstOpenDate: state.stats.firstOpenDate || now,
          },
        }));
      },

      // Onboarding
      hasCompletedOnboarding: false,
      setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),

      // Rate App
      hasRatedApp: false,
      setHasRatedApp: (rated) => set({ hasRatedApp: rated }),
      ratePromptDismissed: false,
      setRatePromptDismissed: (dismissed) => set({ ratePromptDismissed: dismissed }),

      // Reset
      resetSettings: () =>
        set({
          themeMode: 'dark',
          language: 'en',
          notifications: defaultNotifications,
          privacy: defaultPrivacy,
          preferences: defaultPreferences,
          accessibility: defaultAccessibility,
          stats: defaultStats,
          hasCompletedOnboarding: false,
          hasRatedApp: false,
          ratePromptDismissed: false,
        }),
    }),
    {
      name: 'flirtkey-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
        notifications: state.notifications,
        privacy: state.privacy,
        preferences: state.preferences,
        accessibility: state.accessibility,
        stats: state.stats,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasRatedApp: state.hasRatedApp,
        ratePromptDismissed: state.ratePromptDismissed,
      }),
    }
  )
);

// ==========================================
// Selectors
// ==========================================

export const selectShouldShowRatePrompt = (state: SettingsState): boolean => {
  if (state.hasRatedApp || state.ratePromptDismissed) return false;
  // Show after 10 suggestions and 5 app opens
  return state.stats.totalSuggestions >= 10 && state.stats.appOpens >= 5;
};

export const selectShouldReduceMotion = (state: SettingsState): boolean => {
  return state.accessibility.reduceMotion;
};

export const selectHapticEnabled = (state: SettingsState): boolean => {
  return state.accessibility.hapticFeedback;
};
