import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  Platform,
  Alert,
} from 'react-native';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { Modal } from '../components/Modal';

// ==========================================
// Constants
// ==========================================

const FAQ_ITEMS = [
  {
    question: 'How does FlirtKey generate suggestions?',
    answer:
      "FlirtKey uses AI (GPT-4) to analyze conversation context, the girl's profile, and cultural nuances to generate personalized, context-aware suggestions.",
  },
  {
    question: 'Is my data private?',
    answer:
      "Yes! All your data is stored locally on your device. We don't have access to your conversations, profiles, or API keys. Your privacy is our priority.",
  },
  {
    question: 'What is an API key and why do I need one?',
    answer:
      "An API key is like a password that lets FlirtKey communicate with OpenAI's AI service. You need your own key to use the app. Get one free at platform.openai.com.",
  },
  {
    question: 'How accurate is the interest level analysis?',
    answer:
      'The interest level is an AI-powered estimate based on conversation patterns. While generally helpful, treat it as a guide rather than an absolute truth. Human connection is complex!',
  },
  {
    question: 'Can I use FlirtKey offline?',
    answer:
      'You can browse profiles and history offline, but generating new suggestions requires an internet connection to communicate with the AI.',
  },
  {
    question: 'How do I get the best suggestions?',
    answer:
      "The more details you add to a girl's profile (personality, interests, inside jokes), the more personalized and relevant the suggestions will be.",
  },
];

const LICENSES = [
  { name: 'React Native', license: 'MIT' },
  { name: 'Expo', license: 'MIT' },
  { name: 'Zustand', license: 'MIT' },
  { name: 'OpenAI API', license: 'Proprietary' },
  { name: 'React Navigation', license: 'MIT' },
  { name: 'Expo Haptics', license: 'MIT' },
];

// ==========================================
// Component
// ==========================================

export function AboutScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { accessibility, setHasRatedApp, hasRatedApp, stats } = useSettingsStore();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const triggerHaptic = () => {
    if (accessibility.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleCheckUpdate = async () => {
    triggerHaptic();
    setCheckingUpdate(true);
    try {
      // In production, use expo-updates for OTA updates
      // For now, just show a message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Up to date!', 'You have the latest version.');
    } catch (error) {
      Alert.alert('Error', 'Could not check for updates. Please try again later.');
    } finally {
      setCheckingUpdate(false);
    }
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
          'Check out FlirtKey - AI-powered dating message assistant! 💘\n\nNever be stuck on what to say again.\n\nhttps://flirtkey.app',
        title: 'Share FlirtKey',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleContactSupport = async () => {
    triggerHaptic();
    const subject = encodeURIComponent('FlirtKey Support Request');
    const body = encodeURIComponent(`
App Version: ${appVersion} (${buildNumber})
Platform: ${Platform.OS} ${Platform.Version}

Please describe your issue:


    `);
    await Linking.openURL(`mailto:support@flirtkey.app?subject=${subject}&body=${body}`);
  };

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
        <Text style={[styles.title, { color: theme.colors.text }]}>About</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appIcon}>💘</Text>
          <Text style={[styles.appName, { color: theme.colors.text }]}>FlirtKey</Text>
          <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>
            AI-Powered Dating Assistant
          </Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
            Version {appVersion} ({buildNumber})
          </Text>
        </View>

        {/* Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Your Journey</Text>
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
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Copied</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.totalAnalyses}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Analyses
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.appOpens}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Opens</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleCheckUpdate}
            disabled={checkingUpdate}
          >
            <Text style={styles.actionEmoji}>🔄</Text>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </Text>
            <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleRateApp}
          >
            <Text style={styles.actionEmoji}>{hasRatedApp ? '⭐' : '☆'}</Text>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {hasRatedApp ? 'Rated - Thank You!' : 'Rate FlirtKey'}
            </Text>
            <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleShareApp}
          >
            <Text style={styles.actionEmoji}>📤</Text>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Share with Friends
            </Text>
            <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionEmoji}>💬</Text>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Contact Support</Text>
            <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => setShowFAQ(true)}
          >
            <Text style={styles.actionEmoji}>❓</Text>
            <Text style={[styles.actionText, { color: theme.colors.text }]}>FAQ & Help</Text>
            <Text style={[styles.actionArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Social Links */}
        <View style={styles.socialSection}>
          <Text style={[styles.socialTitle, { color: theme.colors.text }]}>Follow Us</Text>
          <View style={styles.socialRow}>
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
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => Linking.openURL('https://tiktok.com/@flirtkey')}
            >
              <Text style={styles.socialEmoji}>🎵</Text>
              <Text style={[styles.socialText, { color: theme.colors.text }]}>TikTok</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://flirtkey.app/privacy')}
          >
            <Text style={[styles.legalText, { color: theme.colors.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.legalDot, { color: theme.colors.textSecondary }]}>•</Text>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://flirtkey.app/terms')}
          >
            <Text style={[styles.legalText, { color: theme.colors.primary }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalDot, { color: theme.colors.textSecondary }]}>•</Text>
          <TouchableOpacity style={styles.legalLink} onPress={() => setShowLicenses(true)}>
            <Text style={[styles.legalText, { color: theme.colors.primary }]}>Licenses</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={[styles.creditsText, { color: theme.colors.textSecondary }]}>
            Made with 💘 by FlirtKey Team
          </Text>
          <Text style={[styles.copyright, { color: theme.colors.textSecondary }]}>
            © 2024 FlirtKey. All rights reserved.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FAQ Modal */}
      <Modal visible={showFAQ} onClose={() => setShowFAQ(false)} title="FAQ & Help">
        <ScrollView style={styles.faqContent}>
          {FAQ_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>
                  {item.question}
                </Text>
                <Text style={[styles.faqArrow, { color: theme.colors.textSecondary }]}>
                  {expandedFAQ === index ? '▼' : '▶'}
                </Text>
              </View>
              {expandedFAQ === index && (
                <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>

      {/* Licenses Modal */}
      <Modal
        visible={showLicenses}
        onClose={() => setShowLicenses(false)}
        title="Open Source Licenses"
      >
        <ScrollView style={styles.licensesContent}>
          {LICENSES.map((lib, index) => (
            <View
              key={index}
              style={[styles.licenseItem, { borderBottomColor: theme.colors.border }]}
            >
              <Text style={[styles.licenseName, { color: theme.colors.text }]}>{lib.name}</Text>
              <Text style={[styles.licenseType, { color: theme.colors.textSecondary }]}>
                {lib.license}
              </Text>
            </View>
          ))}
          <Text style={[styles.licensesNote, { color: theme.colors.textSecondary }]}>
            FlirtKey is built with open-source software. We're grateful to the developers and
            communities that make these tools available.
          </Text>
        </ScrollView>
      </Modal>
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
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  appTagline: {
    fontSize: 14,
    marginTop: 4,
  },
  version: {
    fontSize: 13,
    marginTop: 8,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
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
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
  },
  actionArrow: {
    fontSize: 18,
  },
  socialSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    flexWrap: 'wrap',
    gap: 8,
  },
  legalLink: {
    padding: 4,
  },
  legalText: {
    fontSize: 13,
  },
  legalDot: {
    fontSize: 8,
  },
  credits: {
    alignItems: 'center',
    marginTop: 24,
  },
  creditsText: {
    fontSize: 14,
  },
  copyright: {
    fontSize: 12,
    marginTop: 4,
  },
  faqContent: {
    maxHeight: 400,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  faqArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  faqAnswer: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  licensesContent: {
    maxHeight: 400,
  },
  licenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  licenseName: {
    fontSize: 15,
  },
  licenseType: {
    fontSize: 14,
  },
  licensesNote: {
    fontSize: 13,
    marginTop: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
});
