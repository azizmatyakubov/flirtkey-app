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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import { useStore } from '../stores/useStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../contexts/ThemeContext';
import { Culture } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { RootNavigationProp } from '../types/navigation';

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

export function SettingsScreen({ navigation }: { navigation: RootNavigationProp }) {
  const apiKey = useStore((s) => s.apiKey);
  const apiMode = useStore((s) => s.apiMode);
  const setApiMode = useStore((s) => s.setApiMode);
  const userCulture = useStore((s) => s.userCulture);
  const setUserCulture = useStore((s) => s.setUserCulture);
  const clearAllData = useStore((s) => s.clearAllData);
  const clearSuggestionsCache = useStore((s) => s.clearSuggestionsCache);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  const privacy = useSettingsStore((s) => s.privacy);
  const setPrivacy = useSettingsStore((s) => s.setPrivacy);
  const accessibility = useSettingsStore((s) => s.accessibility);
  const setAccessibility = useSettingsStore((s) => s.setAccessibility);
  const stats = useSettingsStore((s) => s.stats);
  const hasRatedApp = useSettingsStore((s) => s.hasRatedApp);
  const setHasRatedApp = useSettingsStore((s) => s.setHasRatedApp);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
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
    // Note: ConfirmDialog handles closing itself via onClose after onConfirm
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleDeleteAccount = () => {
    triggerHaptic();
    setShowDeleteAccountDialog(true);
  };

  const confirmDeleteAccount = () => {
    clearAllData();
    resetSettings();
    // Note: ConfirmDialog handles closing itself via onClose after onConfirm
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleRateApp = async () => {
    triggerHaptic();
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/flirtkey/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.flirtkey',
    });
    if (storeUrl) {
      try {
        await Linking.openURL(storeUrl);
        setHasRatedApp(true);
      } catch {
        Alert.alert('Error', 'Could not open app store. Please try again.');
      }
    }
  };

  const handleShareApp = async () => {
    triggerHaptic();
    try {
      await Share.share({
        message:
          'Check out FlirtKey - AI-powered dating message assistant!\nhttps://flirtkey.app',
        title: 'Share FlirtKey',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleContactSupport = async () => {
    triggerHaptic();
    try {
      await Linking.openURL('mailto:support@flirtkey.app?subject=FlirtKey Support');
    } catch {
      Alert.alert('Error', 'Could not open email client.');
    }
  };

  const handlePrivacyPolicy = async () => {
    triggerHaptic();
    try {
      await Linking.openURL('https://flirtkey.app/privacy');
    } catch {
      Alert.alert('Error', 'Could not open browser.');
    }
  };

  const handleTermsOfService = async () => {
    triggerHaptic();
    try {
      await Linking.openURL('https://flirtkey.app/terms');
    } catch {
      Alert.alert('Error', 'Could not open browser.');
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    triggerHaptic();
    if (enabled) {
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

  const renderSectionHeader = (title: string, iconName: keyof typeof Ionicons.glyphMap, section: string) => (
    <TouchableOpacity
      style={[styles.sectionHeader, { backgroundColor: expandedSection === section ? accentColors.surfaceHighlight : theme.colors.surface }]}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={iconName as any} size={20} color={accentColors.coral} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Ionicons
        name={expandedSection === section ? 'chevron-down' : 'chevron-forward'}
        size={18}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderSettingRow = (
    label: string,
    value?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    iconName?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingRowLeft}>
        {iconName && (
          <Ionicons name={iconName as any} size={18} color={theme.colors.textSecondary} style={{ marginRight: spacing.sm }} />
        )}
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      {rightElement || (
        <View style={styles.settingRowRight}>
          {value && <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>{value}</Text>}
          {onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />}
        </View>
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
        trackColor={{ false: theme.colors.border, true: accentColors.coral }}
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
              backgroundColor: `${accentColors.coral}15`,
              borderColor: accentColors.coral,
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
              { color: selected === opt.key ? accentColors.coral : theme.colors.textSecondary },
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
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Settings</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        {renderSectionHeader('Account', 'person-circle' as any, 'account')}
        {expandedSection === 'account' && (
          <View style={styles.sectionContent}>
            {/* API Mode Toggle */}
            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              AI Connection
            </Text>
            <View style={[styles.apiModeContainer, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.apiModeOption,
                  apiMode === 'proxy' && { backgroundColor: accentColors.rose },
                ]}
                onPress={() => { setApiMode('proxy'); }}
                accessibilityLabel="Server Mode"
              >
                <Ionicons
                  name="cloud"
                  size={18}
                  color={apiMode === 'proxy' ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.apiModeText,
                    { color: apiMode === 'proxy' ? '#fff' : theme.colors.text },
                  ]}
                >
                  Server Mode
                </Text>
                <Text
                  style={[
                    styles.apiModeSubtext,
                    { color: apiMode === 'proxy' ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
                  ]}
                >
                  No API key needed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.apiModeOption,
                  apiMode === 'byok' && { backgroundColor: accentColors.rose },
                ]}
                onPress={() => { setApiMode('byok'); }}
                accessibilityLabel="Own Key Mode"
              >
                <Ionicons
                  name="key"
                  size={18}
                  color={apiMode === 'byok' ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.apiModeText,
                    { color: apiMode === 'byok' ? '#fff' : theme.colors.text },
                  ]}
                >
                  Own Key
                </Text>
                <Text
                  style={[
                    styles.apiModeSubtext,
                    { color: apiMode === 'byok' ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
                  ]}
                >
                  Use your OpenAI key
                </Text>
              </TouchableOpacity>
            </View>

            {/* Show API key setting only in BYOK mode */}
            {apiMode === 'byok' && renderSettingRow(
              'API Key',
              apiKey ? '••••••' + apiKey.slice(-4) : 'Not set',
              handleApiKeyPress,
              undefined,
              'key' as any
            )}

            <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
              Dating Culture
            </Text>
            {renderOptionPicker(CULTURES, userCulture, setUserCulture)}
          </View>
        )}

        {/* Preferences Section */}
        {renderSectionHeader('Preferences', 'settings' as any, 'preferences')}
        {expandedSection === 'preferences' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Response Preferences', 'Tone, length, emoji...', () => {
              triggerHaptic();
              navigation.navigate('Preferences');
            }, undefined, 'options' as any)}

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
        {renderSectionHeader('Notifications', 'notifications' as any, 'notifications')}
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
        {renderSectionHeader('Privacy & Security', 'lock-closed' as any, 'privacy')}
        {expandedSection === 'privacy' && (
          <View style={styles.sectionContent}>
            {renderToggle(
              'Biometric Lock (Face ID/Touch ID)',
              privacy.biometricEnabled,
              handleBiometricToggle
            )}
            {renderToggle('PIN Lock', privacy.pinEnabled, (val) => {
              if (val) {
                Alert.alert(
                  'Enable PIN Lock',
                  'PIN lock will be enabled. Full PIN entry setup requires a native build.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Enable', onPress: () => setPrivacy({ pinEnabled: true }) },
                  ]
                );
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
            {renderSettingRow('Privacy Policy', undefined, handlePrivacyPolicy, undefined, 'shield-checkmark' as any)}
            {renderSettingRow('Terms of Service', undefined, handleTermsOfService, undefined, 'document-text' as any)}
          </View>
        )}

        {/* Data Management Section */}
        {renderSectionHeader('Data Management', 'server' as any, 'data')}
        {expandedSection === 'data' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Export Data', undefined, handleExportData, undefined, 'download' as any)}
            {renderSettingRow('Clear Cache', undefined, handleClearCache, undefined, 'trash-bin' as any)}
            {renderSettingRow('Clear All Data', undefined, handleClearAllData, undefined, 'warning' as any)}
            <TouchableOpacity
              style={[styles.dangerButton, { borderColor: theme.colors.error }]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="skull" size={18} color={theme.colors.error} />
              <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accessibility Section */}
        {renderSectionHeader('Accessibility', 'accessibility' as any, 'accessibility')}
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
        {renderSectionHeader('About', 'information-circle' as any, 'about')}
        {expandedSection === 'about' && (
          <View style={styles.sectionContent}>
            {renderSettingRow('Version', `${appVersion} (${buildNumber})`, undefined, undefined, 'code-slash' as any)}
            {renderSettingRow('More Info & FAQ', undefined, () => {
              triggerHaptic();
              navigation.navigate('About');
            }, undefined, 'help-circle' as any)}
            {renderSettingRow('Rate FlirtKey', hasRatedApp ? 'Rated' : undefined, handleRateApp, undefined, 'star' as any)}
            {renderSettingRow('Share with Friends', undefined, handleShareApp, undefined, 'share-social' as any)}
            {renderSettingRow('Contact Support', undefined, handleContactSupport, undefined, 'chatbubble-ellipses' as any)}
            {renderSettingRow('FAQ & Help', undefined, () =>
              Linking.openURL('https://flirtkey.app/faq'), undefined, 'book' as any
            )}

            <View style={styles.statsContainer}>
              <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Your Stats</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: accentColors.coral }]}>
                    {stats.totalSuggestions}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Suggestions
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: accentColors.coral }]}>
                    {stats.totalCopied}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Copied
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: accentColors.coral }]}>
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
                <Ionicons name="logo-twitter" size={18} color={accentColors.coral} />
                <Text style={[styles.socialText, { color: theme.colors.text }]}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => Linking.openURL('https://instagram.com/flirtkey')}
              >
                <Ionicons name="logo-instagram" size={18} color={accentColors.coral} />
                <Text style={[styles.socialText, { color: theme.colors.text }]}>Instagram</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.credits, { color: theme.colors.textSecondary }]}>
              Made with ❤️ by FlirtKey Team{'\n'}© 2024 FlirtKey. All rights reserved.
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
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: `${accentColors.coral}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  subsectionTitle: {
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
  },
  dangerButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: accentColors.surfaceHighlight,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.md,
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
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  socialText: {
    fontSize: 14,
  },
  credits: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.xl,
    lineHeight: 18,
  },
  apiModeContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    gap: spacing.xs,
    padding: spacing.xs,
  },
  apiModeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  apiModeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  apiModeSubtext: {
    fontSize: 10,
  },
});
