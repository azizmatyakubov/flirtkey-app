import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Share,
  Switch,
  Platform,
} from 'react-native';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import { useStore } from '../stores/useStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../contexts/ThemeContext';
import { Culture } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

// ==========================================
// Constants
// ==========================================

const CULTURES: { key: Culture; label: string; emoji: string }[] = [
  { key: 'uzbek', label: 'Uzbek', emoji: '🇺🇿' },
  { key: 'russian', label: 'Russian/CIS', emoji: '🇷🇺' },
  { key: 'western', label: 'Western', emoji: '🇺🇸' },
  { key: 'asian', label: 'Asian', emoji: '🇯🇵' },
  { key: 'universal', label: 'Universal', emoji: '🌐' },
];

const LANGUAGES = [
  { key: 'en', label: 'English', emoji: '🇬🇧' },
  { key: 'ru', label: 'Русский', emoji: '🇷🇺' },
  { key: 'uz', label: "O'zbek", emoji: '🇺🇿' },
  { key: 'es', label: 'Español', emoji: '🇪🇸' },
  { key: 'fr', label: 'Français', emoji: '🇫🇷' },
  { key: 'de', label: 'Deutsch', emoji: '🇩🇪' },
] as const;

const THEME_OPTIONS = [
  { key: 'dark', label: 'Dark', emoji: '🌙' },
  { key: 'light', label: 'Light', emoji: '☀️' },
  { key: 'system', label: 'System', emoji: '📱' },
] as const;

const AUTO_LOCK_OPTIONS = [
  { key: 'immediate', label: 'Immediately' },
  { key: '1min', label: '1 minute' },
  { key: '5min', label: '5 minutes' },
  { key: '15min', label: '15 minutes' },
  { key: '30min', label: '30 minutes' },
  { key: 'never', label: 'Never' },
] as const;

// ==========================================
// Component
// ==========================================

export function SettingsScreen({ navigation }: any) {
  const { apiKey, userCulture, setUserCulture, clearAllData, clearSuggestionsCache } = useStore();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    notifications,
    setNotifications,
    privacy,
    setPrivacy,
    accessibility,
    setAccessibility,
    stats,
    hasRatedApp,
    setHasRatedApp,
    resetSettings,
  } = useSettingsStore();
  const { theme } = useTheme();

  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('account');

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const triggerHaptic = useCallback(() => {
    if (accessibility.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [accessibility.hapticFeedback]);

  const toggleSection = (section: string) => {
    triggerHaptic();
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleApiKeyPress = () => {
    triggerHaptic();
    navigation.navigate('ApiKeySetup', { fromSettings: true });
  };

  const handleExportData = async () => {
    triggerHaptic();
    try {
      const data = {
        exportDate: new Date().toISOString(),
        appVersion,
        // In a real app, we'd export actual user data
        message: 'Data export feature - implement with actual data',
      };
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'FlirtKey Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearCache = () => {
    triggerHaptic();
    setShowClearCacheDialog(true);
  };

  const confirmClearCache = () => {
    clearSuggestionsCache();
    setShowClearCacheDialog(false);
    Alert.alert('Success', 'Cache cleared successfully');
  };

  const handleClearAllData = () => {
    triggerHaptic();
    setShowClearDataDialog(true);
  };

  const confirmClearAllData = () => {
    clearAllData();
    resetSettings();
    setShowClearDataDialog(false);
    Alert.alert('Success', 'All data has been cleared');
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleDeleteAccount = () => {
    triggerHaptic();
    setShowDeleteAccountDialog(true);
  };

  const confirmDeleteAccount = () => {
    clearAllData();
    resetSettings();
    setShowDeleteAccountDialog(false);
    Alert.alert('Account Deleted', 'Your account and all data have been deleted');
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleRateApp = async () => {
    triggerHaptic();
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/flirtkey/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.flirtkey',
    });
    if (storeUrl) {
      await Linking.openURL(storeUrl);
      setHasRatedApp(true);
    }
  };

  const handleShareApp = async () => {
    triggerHaptic();
    try {
      await Share.share({
        message:
          'Check out FlirtKey - AI-powered dating message assistant! 💘\nhttps://flirtkey.app',
        title: 'Share FlirtKey',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleContactSupport = async () => {
    triggerHaptic();
    await Linking.openURL('mailto:support@flirtkey.app?subject=FlirtKey Support');
  };

  const handlePrivacyPolicy = async () => {
    triggerHaptic();
    await Linking.openURL('https://flirtkey.app/privacy');
  };

  const handleTermsOfService = async () => {
    triggerHaptic();
    await Linking.openURL('https://flirtkey.app/terms');
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    triggerHaptic();
    if (enabled) {
      // In production, use expo-local-authentication for biometric auth
      Alert.alert(
        'Biometric Lock',
        'Biometric authentication will be enabled. This feature requires expo-local-authentication.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => setPrivacy({ biometricEnabled: true }) },
        ]
      );
    } else {
      setPrivacy({ biometricEnabled: false });
    }
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderSectionHeader = (title: string, emoji: string, section: string) => (
    <TouchableOpacity
      style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}
      onPress={() => toggleSection(section)}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {emoji} {title}
      </Text>
      <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
        {expandedSection === section ? '▼' : '▶'}
      </Text>
    </TouchableOpacity>
  );

  const renderSettingRow = (
    label: string,
    value?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
      {rightElement || (
        <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
          {value} {onPress && '›'}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderToggle = (label: string, value: boolean, onToggle: (val: boolean) => void) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(val) => {
          triggerHaptic();
          onToggle(val);
        }}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderOptionPicker = <T extends string>(
    options: readonly { key: T; label: string; emoji?: string }[],
    selected: T,
    onSelect: (key: T) => void
  ) => (
    <View style={styles.optionsRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.option,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            selected === opt.key && {
              backgroundColor: theme.colors.primary + '20',
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => {
            triggerHaptic();
            onSelect(opt.key);
          }}
        >
          {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
          <Text
            style={[
              styles.optionText,
              { color: selected === opt.key ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==========================================
  // Render
  // ==========================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        {renderSectionHeader('Account', '👤', 'account')}
        {expandedSection === 'account' && (
          <View style={styles.sectionContent}>
            {renderSettingRow(
              'API Key',
              apiKey ? '••••••' + apiKey.slice(-4) : 'Not set',
              handleApiKeyPress
            )}

            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              Dating Culture
            </Text>
            {renderOptionPicker(CULTURES, userCulture, setUserCulture)}
          </View>
        )}

        {/* Preferences Section */}
        {renderSectionHeader('Preferences', '⚙️', 'preferences')}
        {expandedSection === 'preferences' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Response Preferences', 'Tone, length, emoji...', () => {
              triggerHaptic();
              navigation.navigate('Preferences');
            })}

            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              Theme
            </Text>
            {renderOptionPicker(THEME_OPTIONS, themeMode, setThemeMode)}

            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              Language
            </Text>
            {renderOptionPicker(LANGUAGES.slice(0, 3), language, setLanguage)}
            {renderOptionPicker(LANGUAGES.slice(3), language, setLanguage)}
          </View>
        )}

        {/* Notifications Section */}
        {renderSectionHeader('Notifications', '🔔', 'notifications')}
        {expandedSection === 'notifications' && (
          <View style={styles.sectionContent}>
            {renderToggle('Enable Notifications', notifications.enabled, (val) =>
              setNotifications({ enabled: val })
            )}
            {notifications.enabled && (
              <>
                {renderToggle('Daily Tips', notifications.dailyTips, (val) =>
                  setNotifications({ dailyTips: val })
                )}
                {renderToggle('Suggestion Updates', notifications.suggestions, (val) =>
                  setNotifications({ suggestions: val })
                )}
                {renderToggle('App Updates', notifications.updates, (val) =>
                  setNotifications({ updates: val })
                )}
                {renderToggle('Sounds', notifications.sounds, (val) =>
                  setNotifications({ sounds: val })
                )}
              </>
            )}
          </View>
        )}

        {/* Privacy & Security Section */}
        {renderSectionHeader('Privacy & Security', '🔒', 'privacy')}
        {expandedSection === 'privacy' && (
          <View style={styles.sectionContent}>
            {renderToggle(
              'Biometric Lock (Face ID/Touch ID)',
              privacy.biometricEnabled,
              handleBiometricToggle
            )}
            {renderToggle('PIN Lock', privacy.pinEnabled, (val) => {
              if (val) {
                // Navigate to PIN setup
                Alert.alert('Set PIN', 'PIN setup feature coming soon');
              } else {
                setPrivacy({ pinEnabled: false, pinCode: null });
              }
            })}

            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              Auto-Lock Timeout
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderOptionPicker(AUTO_LOCK_OPTIONS, privacy.autoLockTimeout, (val) =>
                setPrivacy({ autoLockTimeout: val })
              )}
            </ScrollView>

            <View style={{ height: 16 }} />
            {renderSettingRow('Privacy Policy', undefined, handlePrivacyPolicy)}
            {renderSettingRow('Terms of Service', undefined, handleTermsOfService)}
          </View>
        )}

        {/* Data Management Section */}
        {renderSectionHeader('Data Management', '💾', 'data')}
        {expandedSection === 'data' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Export Data', undefined, handleExportData)}
            {renderSettingRow('Clear Cache', undefined, handleClearCache)}
            {renderSettingRow('Clear All Data', undefined, handleClearAllData)}
            <TouchableOpacity
              style={[styles.dangerButton, { borderColor: theme.colors.error }]}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accessibility Section */}
        {renderSectionHeader('Accessibility', '♿', 'accessibility')}
        {expandedSection === 'accessibility' && (
          <View style={styles.sectionContent}>
            {renderToggle('Reduce Motion', accessibility.reduceMotion, (val) =>
              setAccessibility({ reduceMotion: val })
            )}
            {renderToggle('High Contrast', accessibility.highContrast, (val) =>
              setAccessibility({ highContrast: val })
            )}
            {renderToggle('Larger Text', accessibility.largeText, (val) =>
              setAccessibility({ largeText: val })
            )}
            {renderToggle('Haptic Feedback', accessibility.hapticFeedback, (val) =>
              setAccessibility({ hapticFeedback: val })
            )}
            {renderToggle('Sound Effects', accessibility.soundEffects, (val) =>
              setAccessibility({ soundEffects: val })
            )}
          </View>
        )}

        {/* About Section */}
        {renderSectionHeader('About', 'ℹ️', 'about')}
        {expandedSection === 'about' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Version', `${appVersion} (${buildNumber})`)}
            {renderSettingRow('More Info & FAQ', undefined, () => {
              triggerHaptic();
              navigation.navigate('About');
            })}
            {renderSettingRow('Rate FlirtKey', hasRatedApp ? '⭐ Rated' : undefined, handleRateApp)}
            {renderSettingRow('Share with Friends', undefined, handleShareApp)}
            {renderSettingRow('Contact Support', undefined, handleContactSupport)}
            {renderSettingRow('FAQ & Help', undefined, () =>
              Linking.openURL('https://flirtkey.app/faq')
            )}

            <View style={styles.statsContainer}>
              <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Your Stats</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {stats.totalSuggestions}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Suggestions
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {stats.totalCopied}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Copied
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {stats.totalAnalyses}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Analyses
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => Linking.openURL('https://twitter.com/flirtkey')}
              >
                <Text style={styles.socialEmoji}>🐦</Text>
                <Text style={[styles.socialText, { color: theme.colors.text }]}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => Linking.openURL('https://instagram.com/flirtkey')}
              >
                <Text style={styles.socialEmoji}>📸</Text>
                <Text style={[styles.socialText, { color: theme.colors.text }]}>Instagram</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.credits, { color: theme.colors.textSecondary }]}>
              Made with 💘 by FlirtKey Team{'\n'}© 2024 FlirtKey. All rights reserved.
            </Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Dialogs */}
      <ConfirmDialog
        visible={showClearCacheDialog}
        title="Clear Cache"
        message="This will clear all cached suggestions. Your profiles and conversation history will be preserved."
        confirmText="Clear Cache"
        onClose={() => setShowClearCacheDialog(false)}
        onConfirm={confirmClearCache}
      />

      <ConfirmDialog
        visible={showClearDataDialog}
        title="Clear All Data"
        message="This will permanently delete all your data including profiles, conversations, and settings. This action cannot be undone."
        confirmText="Clear Everything"
        destructive
        onClose={() => setShowClearDataDialog(false)}
        onConfirm={confirmClearAllData}
      />

      <ConfirmDialog
        visible={showDeleteAccountDialog}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmText="Delete Account"
        destructive
        onClose={() => setShowDeleteAccountDialog(false)}
        onConfirm={confirmDeleteAccount}
      />
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  back: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 15,
  },
  settingValue: {
    fontSize: 15,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
  },
  dangerButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  socialEmoji: {
    fontSize: 16,
  },
  socialText: {
    fontSize: 14,
  },
  credits: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
