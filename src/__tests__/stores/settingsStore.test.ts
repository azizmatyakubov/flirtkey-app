/**
 * Settings Store Tests
 * Phase 9: Test settingsStore (preferences persistence)
 */

import {
  useSettingsStore,
  selectShouldShowRatePrompt,
  selectShouldReduceMotion,
  selectHapticEnabled,
} from '../../stores/settingsStore';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('Settings Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  // ==========================================
  // Theme Tests
  // ==========================================

  describe('Theme Settings', () => {
    it('initializes with dark theme', () => {
      const { themeMode } = useSettingsStore.getState();
      expect(themeMode).toBe('dark');
    });

    it('sets theme mode', () => {
      useSettingsStore.getState().setThemeMode('light');
      expect(useSettingsStore.getState().themeMode).toBe('light');

      useSettingsStore.getState().setThemeMode('system');
      expect(useSettingsStore.getState().themeMode).toBe('system');
    });
  });

  // ==========================================
  // Language Tests
  // ==========================================

  describe('Language Settings', () => {
    it('initializes with English', () => {
      const { language } = useSettingsStore.getState();
      expect(language).toBe('en');
    });

    it('sets language', () => {
      useSettingsStore.getState().setLanguage('ru');
      expect(useSettingsStore.getState().language).toBe('ru');

      useSettingsStore.getState().setLanguage('uz');
      expect(useSettingsStore.getState().language).toBe('uz');
    });
  });

  // ==========================================
  // Notifications Tests
  // ==========================================

  describe('Notification Settings', () => {
    it('initializes with default notifications', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(true);
      expect(notifications.dailyTips).toBe(true);
      expect(notifications.suggestions).toBe(true);
      expect(notifications.updates).toBe(true);
      expect(notifications.sounds).toBe(true);
    });

    it('updates partial notification settings', () => {
      useSettingsStore.getState().setNotifications({ enabled: false });

      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(false);
      expect(notifications.dailyTips).toBe(true); // unchanged
    });

    it('updates multiple notification settings', () => {
      useSettingsStore.getState().setNotifications({
        enabled: false,
        sounds: false,
        dailyTips: false,
      });

      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(false);
      expect(notifications.sounds).toBe(false);
      expect(notifications.dailyTips).toBe(false);
    });
  });

  // ==========================================
  // Privacy Tests
  // ==========================================

  describe('Privacy Settings', () => {
    it('initializes with default privacy settings', () => {
      const { privacy } = useSettingsStore.getState();
      expect(privacy.biometricEnabled).toBe(false);
      expect(privacy.pinEnabled).toBe(false);
      expect(privacy.pinCode).toBeNull();
      expect(privacy.autoLockTimeout).toBe('5min');
      expect(privacy.dataRetention).toBe('forever');
    });

    it('sets and verifies PIN', () => {
      useSettingsStore.getState().setPin('1234');

      const { privacy } = useSettingsStore.getState();
      expect(privacy.pinEnabled).toBe(true);
      expect(privacy.pinCode).toBe('1234');

      expect(useSettingsStore.getState().verifyPin('1234')).toBe(true);
      expect(useSettingsStore.getState().verifyPin('0000')).toBe(false);
    });

    it('clears PIN', () => {
      useSettingsStore.getState().setPin('1234');
      useSettingsStore.getState().clearPin();

      const { privacy } = useSettingsStore.getState();
      expect(privacy.pinEnabled).toBe(false);
      expect(privacy.pinCode).toBeNull();
    });

    it('updates privacy settings', () => {
      useSettingsStore.getState().setPrivacy({
        biometricEnabled: true,
        autoLockTimeout: '1min',
      });

      const { privacy } = useSettingsStore.getState();
      expect(privacy.biometricEnabled).toBe(true);
      expect(privacy.autoLockTimeout).toBe('1min');
    });
  });

  // ==========================================
  // User Preferences Tests
  // ==========================================

  describe('User Preferences', () => {
    it('initializes with default preferences', () => {
      const { preferences } = useSettingsStore.getState();
      expect(preferences.defaultTone).toBe('flirty');
      expect(preferences.responseLength).toBe('medium');
      expect(preferences.emojiUsage).toBe(true);
      expect(preferences.gifSuggestions).toBe(true);
      expect(preferences.boldnessDefault).toBe('balanced');
      expect(preferences.blockedPhrases).toEqual([]);
      expect(preferences.favoritePhrases).toEqual([]);
      expect(preferences.quickReplyTemplates).toHaveLength(4);
    });

    it('updates preferences', () => {
      useSettingsStore.getState().setPreferences({
        defaultTone: 'romantic',
        responseLength: 'short',
        emojiUsage: false,
      });

      const { preferences } = useSettingsStore.getState();
      expect(preferences.defaultTone).toBe('romantic');
      expect(preferences.responseLength).toBe('short');
      expect(preferences.emojiUsage).toBe(false);
    });

    it('adds and removes blocked phrases', () => {
      useSettingsStore.getState().addBlockedPhrase('test phrase');
      expect(useSettingsStore.getState().preferences.blockedPhrases).toContain('test phrase');

      useSettingsStore.getState().removeBlockedPhrase('test phrase');
      expect(useSettingsStore.getState().preferences.blockedPhrases).not.toContain('test phrase');
    });

    it('adds and removes favorite phrases', () => {
      useSettingsStore.getState().addFavoritePhrase('favorite one');
      expect(useSettingsStore.getState().preferences.favoritePhrases).toContain('favorite one');

      useSettingsStore.getState().removeFavoritePhrase('favorite one');
      expect(useSettingsStore.getState().preferences.favoritePhrases).not.toContain('favorite one');
    });

    it('adds and removes quick replies', () => {
      const initialCount = useSettingsStore.getState().preferences.quickReplyTemplates.length;

      useSettingsStore.getState().addQuickReply('New quick reply');
      expect(useSettingsStore.getState().preferences.quickReplyTemplates.length).toBe(
        initialCount + 1
      );

      useSettingsStore.getState().removeQuickReply('New quick reply');
      expect(useSettingsStore.getState().preferences.quickReplyTemplates.length).toBe(initialCount);
    });
  });

  // ==========================================
  // Accessibility Tests
  // ==========================================

  describe('Accessibility Settings', () => {
    it('initializes with default accessibility settings', () => {
      const { accessibility } = useSettingsStore.getState();
      expect(accessibility.reduceMotion).toBe(false);
      expect(accessibility.highContrast).toBe(false);
      expect(accessibility.largeText).toBe(false);
      expect(accessibility.hapticFeedback).toBe(true);
      expect(accessibility.soundEffects).toBe(false);
    });

    it('updates accessibility settings', () => {
      useSettingsStore.getState().setAccessibility({
        reduceMotion: true,
        largeText: true,
      });

      const { accessibility } = useSettingsStore.getState();
      expect(accessibility.reduceMotion).toBe(true);
      expect(accessibility.largeText).toBe(true);
    });
  });

  // ==========================================
  // App Stats Tests
  // ==========================================

  describe('App Stats', () => {
    it('initializes with zeroed stats', () => {
      const { stats } = useSettingsStore.getState();
      expect(stats.totalSuggestions).toBe(0);
      expect(stats.totalCopied).toBe(0);
      expect(stats.totalAnalyses).toBe(0);
      expect(stats.appOpens).toBe(0);
      expect(stats.lastOpenDate).toBeNull();
      expect(stats.firstOpenDate).toBeNull();
    });

    it('increments stats', () => {
      useSettingsStore.getState().incrementStat('totalSuggestions');
      useSettingsStore.getState().incrementStat('totalSuggestions');
      useSettingsStore.getState().incrementStat('totalCopied');

      const { stats } = useSettingsStore.getState();
      expect(stats.totalSuggestions).toBe(2);
      expect(stats.totalCopied).toBe(1);
    });

    it('records app open', () => {
      useSettingsStore.getState().recordAppOpen();

      const { stats } = useSettingsStore.getState();
      expect(stats.appOpens).toBe(1);
      expect(stats.lastOpenDate).not.toBeNull();
      expect(stats.firstOpenDate).not.toBeNull();
    });

    it('preserves first open date on subsequent opens', () => {
      useSettingsStore.getState().recordAppOpen();
      const firstOpen = useSettingsStore.getState().stats.firstOpenDate;

      // Simulate time passing
      useSettingsStore.getState().recordAppOpen();

      expect(useSettingsStore.getState().stats.firstOpenDate).toBe(firstOpen);
      expect(useSettingsStore.getState().stats.appOpens).toBe(2);
    });
  });

  // ==========================================
  // Onboarding Tests
  // ==========================================

  describe('Onboarding', () => {
    it('initializes with onboarding not completed', () => {
      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false);
    });

    it('sets onboarding complete', () => {
      useSettingsStore.getState().setOnboardingComplete(true);
      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
    });
  });

  // ==========================================
  // Rate App Tests
  // ==========================================

  describe('Rate App', () => {
    it('initializes with rate app not shown', () => {
      expect(useSettingsStore.getState().hasRatedApp).toBe(false);
      expect(useSettingsStore.getState().ratePromptDismissed).toBe(false);
    });

    it('sets has rated app', () => {
      useSettingsStore.getState().setHasRatedApp(true);
      expect(useSettingsStore.getState().hasRatedApp).toBe(true);
    });

    it('sets rate prompt dismissed', () => {
      useSettingsStore.getState().setRatePromptDismissed(true);
      expect(useSettingsStore.getState().ratePromptDismissed).toBe(true);
    });
  });

  // ==========================================
  // Reset Tests
  // ==========================================

  describe('Reset Settings', () => {
    it('resets all settings to defaults', () => {
      // Change various settings
      useSettingsStore.getState().setThemeMode('light');
      useSettingsStore.getState().setLanguage('ru');
      useSettingsStore.getState().setPin('1234');
      useSettingsStore.getState().setPreferences({ defaultTone: 'romantic' });
      useSettingsStore.getState().incrementStat('totalSuggestions');
      useSettingsStore.getState().setOnboardingComplete(true);

      // Reset
      useSettingsStore.getState().resetSettings();

      // Verify defaults
      const state = useSettingsStore.getState();
      expect(state.themeMode).toBe('dark');
      expect(state.language).toBe('en');
      expect(state.privacy.pinEnabled).toBe(false);
      expect(state.preferences.defaultTone).toBe('flirty');
      expect(state.stats.totalSuggestions).toBe(0);
      expect(state.hasCompletedOnboarding).toBe(false);
    });
  });

  // ==========================================
  // Selector Tests
  // ==========================================

  describe('Selectors', () => {
    describe('selectShouldShowRatePrompt', () => {
      it('returns false when already rated', () => {
        useSettingsStore.getState().setHasRatedApp(true);
        expect(selectShouldShowRatePrompt(useSettingsStore.getState())).toBe(false);
      });

      it('returns false when prompt dismissed', () => {
        useSettingsStore.getState().setRatePromptDismissed(true);
        expect(selectShouldShowRatePrompt(useSettingsStore.getState())).toBe(false);
      });

      it('returns false when not enough usage', () => {
        // Less than 10 suggestions and 5 app opens
        for (let i = 0; i < 5; i++) {
          useSettingsStore.getState().incrementStat('totalSuggestions');
        }
        for (let i = 0; i < 3; i++) {
          useSettingsStore.getState().recordAppOpen();
        }
        expect(selectShouldShowRatePrompt(useSettingsStore.getState())).toBe(false);
      });

      it('returns true when usage threshold met', () => {
        for (let i = 0; i < 10; i++) {
          useSettingsStore.getState().incrementStat('totalSuggestions');
        }
        for (let i = 0; i < 5; i++) {
          useSettingsStore.getState().recordAppOpen();
        }
        expect(selectShouldShowRatePrompt(useSettingsStore.getState())).toBe(true);
      });
    });

    describe('selectShouldReduceMotion', () => {
      it('returns reduceMotion setting', () => {
        expect(selectShouldReduceMotion(useSettingsStore.getState())).toBe(false);

        useSettingsStore.getState().setAccessibility({ reduceMotion: true });
        expect(selectShouldReduceMotion(useSettingsStore.getState())).toBe(true);
      });
    });

    describe('selectHapticEnabled', () => {
      it('returns hapticFeedback setting', () => {
        expect(selectHapticEnabled(useSettingsStore.getState())).toBe(true);

        useSettingsStore.getState().setAccessibility({ hapticFeedback: false });
        expect(selectHapticEnabled(useSettingsStore.getState())).toBe(false);
      });
    });
  });
});
