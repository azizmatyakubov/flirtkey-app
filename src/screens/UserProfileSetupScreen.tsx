import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Localization from 'expo-localization';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { Culture } from '../types';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  emoji: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', emoji: '🇬🇧' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', emoji: '🇷🇺' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek", emoji: '🇺🇿' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', emoji: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', emoji: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', emoji: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', emoji: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', emoji: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', emoji: '🇨🇳' },
];

const CULTURES: { key: Culture; label: string; emoji: string }[] = [
  { key: 'uzbek', label: 'Uzbek', emoji: '🇺🇿' },
  { key: 'russian', label: 'Russian/CIS', emoji: '🇷🇺' },
  { key: 'western', label: 'Western', emoji: '🇺🇸' },
  { key: 'asian', label: 'Asian', emoji: '🇯🇵' },
  { key: 'universal', label: 'Universal', emoji: '🌐' },
];

interface UserProfileSetupScreenProps {
  navigation: any;
  route?: {
    params?: {
      fromSettings?: boolean;
    };
  };
}

export function UserProfileSetupScreen({ navigation, route }: UserProfileSetupScreenProps) {
  const { user, setUser, userCulture, setUserCulture } = useStore();
  const fromSettings = route?.params?.fromSettings;

  const [userName, setUserName] = useState(user?.name || '');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en');
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);

  // Detect timezone on mount
  useEffect(() => {
    detectTimezone();
    detectLanguage();
  }, []);

  const detectTimezone = () => {
    // expo-localization v15+ uses getCalendars() for timezone
    const calendars = Localization.getCalendars();
    const timezone = calendars?.[0]?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(timezone);
  };

  const detectLanguage = () => {
    // expo-localization v15+ uses getLocales() for locale info
    const locales = Localization.getLocales();
    const deviceLanguage = locales?.[0]?.languageCode || 'en';

    // Check if it's a supported language
    const isSupported = LANGUAGES.some((lang) => lang.code === deviceLanguage);
    if (isSupported && !user?.language) {
      setSelectedLanguage(deviceLanguage);
    }
  };

  const handleSave = () => {
    // Update user in store
    setUser({
      id: user?.id || Date.now(),
      name: userName.trim() || 'User',
      culture: userCulture,
      language: selectedLanguage,
    });

    if (fromSettings) {
      navigation.goBack();
    } else {
      // Continue to next setup screen or home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const handleSkip = () => {
    // Save default settings
    setUser({
      id: user?.id || Date.now(),
      name: 'User',
      culture: userCulture,
      language: selectedLanguage,
    });

    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const getTimezoneDisplay = () => {
    if (!detectedTimezone) return 'Unknown';

    // Get current offset
    const date = new Date();
    const offset = -date.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const offsetString = `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Simplify timezone name
    const simpleName = detectedTimezone.replace(/_/g, ' ');

    return `${simpleName} (${offsetString})`;
  };

  const selectedLanguageData = LANGUAGES.find((lang) => lang.code === selectedLanguage);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {fromSettings && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Help FlirtKey personalize your experience</Text>
      </View>

      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Name (Optional)</Text>
        <Text style={styles.sectionHint}>This helps us personalize suggestions</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name..."
          placeholderTextColor={darkColors.textSecondary}
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Language</Text>
        <Text style={styles.sectionHint}>For responses and UI (auto-detected)</Text>

        <TouchableOpacity style={styles.selector} onPress={() => setShowLanguages(!showLanguages)}>
          <Text style={styles.selectorEmoji}>{selectedLanguageData?.emoji}</Text>
          <Text style={styles.selectorText}>
            {selectedLanguageData?.name} ({selectedLanguageData?.nativeName})
          </Text>
          <Text style={styles.selectorArrow}>{showLanguages ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showLanguages && (
          <View style={styles.languageList}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.languageOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLanguage(language.code);
                  setShowLanguages(false);
                }}
              >
                <Text style={styles.languageEmoji}>{language.emoji}</Text>
                <Text
                  style={[
                    styles.languageText,
                    selectedLanguage === language.code && styles.languageTextSelected,
                  ]}
                >
                  {language.name}
                </Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Culture Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Dating Culture</Text>
        <Text style={styles.sectionHint}>This affects how suggestions are calibrated</Text>
        <View style={styles.cultureGrid}>
          {CULTURES.map((culture) => (
            <TouchableOpacity
              key={culture.key}
              style={[
                styles.cultureOption,
                userCulture === culture.key && styles.cultureOptionSelected,
              ]}
              onPress={() => setUserCulture(culture.key)}
            >
              <Text style={styles.cultureEmoji}>{culture.emoji}</Text>
              <Text
                style={[
                  styles.cultureText,
                  userCulture === culture.key && styles.cultureTextSelected,
                ]}
              >
                {culture.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Timezone (auto-detected) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Timezone</Text>
        <Text style={styles.sectionHint}>Auto-detected from your device</Text>
        <View style={styles.timezoneDisplay}>
          <Text style={styles.timezoneText}>{getTimezoneDisplay()}</Text>
          <Text style={styles.timezoneCheck}>✓ Detected</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{fromSettings ? 'Save Changes' : 'Continue'}</Text>
        </TouchableOpacity>

        {!fromSettings && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    minHeight: 80,
  },
  backText: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: darkColors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: darkColors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  selectorEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  selectorText: {
    flex: 1,
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  selectorArrow: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  languageList: {
    marginTop: spacing.sm,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  languageOptionSelected: {
    backgroundColor: darkColors.primary + '20',
  },
  languageEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  languageText: {
    flex: 1,
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  languageTextSelected: {
    color: darkColors.primary,
    fontWeight: '600',
  },
  languageNative: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  cultureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cultureOption: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cultureOptionSelected: {
    backgroundColor: darkColors.primary + '20',
    borderColor: darkColors.primary,
  },
  cultureEmoji: {
    fontSize: 18,
  },
  cultureText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  cultureTextSelected: {
    color: darkColors.text,
    fontWeight: '600',
  },
  timezoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  timezoneText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    flex: 1,
  },
  timezoneCheck: {
    color: darkColors.success,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  saveButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
});
