/**
 * PrivacyPolicyScreen - Phase 4: App Store Preparation
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: theme.colors.textTertiary }]}>
          Last updated: January 2025
        </Text>

        <Section title="1. Introduction" theme={theme}>
          FlirtKey ("we", "us", "our") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, and protect your information when you use our
          mobile application ("App").
        </Section>

        <Section title="2. Local-First Data Storage" theme={theme}>
          FlirtKey follows a local-first approach. Your data — including conversation profiles,
          message history, preferences, and settings — is stored locally on your device using
          encrypted local storage. We do not maintain user accounts on remote servers, and your
          personal data never leaves your device except as described below.
        </Section>

        <Section title="3. Screenshot Processing" theme={theme}>
          When you use the screenshot analysis feature, images are processed locally on your
          device to extract text. The extracted text may be sent to OpenAI's API for analysis.
          Screenshots are never stored on our servers, uploaded to any cloud service, or shared
          with third parties. Processing happens in real-time and images are discarded from
          memory immediately after analysis.
        </Section>

        <Section title="4. AI API Usage (OpenAI)" theme={theme}>
          FlirtKey uses OpenAI's API to generate conversation suggestions. When you request
          suggestions, the following data may be sent to OpenAI:{'\n\n'}
          • The message you want to reply to{'\n'}
          • Basic context about the conversation (tone preference, relationship stage){'\n'}
          • Your texting style profile (if "Sound Like Me" is enabled){'\n\n'}
          We do not send personal identifiers, real names, or contact information to OpenAI.
          OpenAI's data usage is governed by their own privacy policy and API terms.
          Your API key is stored locally and encrypted on your device.
        </Section>

        <Section title="5. Data We Do NOT Collect" theme={theme}>
          • We do not collect your real name or contact information{'\n'}
          • We do not track your location{'\n'}
          • We do not access your contacts or phone calls{'\n'}
          • We do not sell, rent, or share personal data with third parties{'\n'}
          • We do not use advertising SDKs or trackers{'\n'}
          • We do not create user profiles on remote servers
        </Section>

        <Section title="6. Push Notifications" theme={theme}>
          If you enable push notifications, we use expo-notifications to schedule local
          notifications on your device. These notifications are generated and scheduled entirely
          on-device. No notification data is sent to or processed by external servers.
        </Section>

        <Section title="7. Clipboard Access" theme={theme}>
          The Quick Reply feature may access your clipboard to auto-detect messages for faster
          workflow. Clipboard data is only read when you open the Quick Reply screen and is
          never transmitted or stored beyond your current session.
        </Section>

        <Section title="8. Data Retention & Deletion" theme={theme}>
          All your data is stored locally on your device. You can delete all data at any time
          through Settings → Data Management → Clear All Data. Uninstalling the app also
          removes all local data. We have no server-side data to delete because we don't
          collect it.
        </Section>

        <Section title="9. Children's Privacy" theme={theme}>
          FlirtKey is intended for users aged 17 and older. We do not knowingly collect
          information from children under 17.
        </Section>

        <Section title="10. Changes to This Policy" theme={theme}>
          We may update this Privacy Policy from time to time. Any changes will be reflected
          in the app with an updated "Last updated" date.
        </Section>

        <Section title="11. Contact Us" theme={theme}>
          If you have questions about this Privacy Policy, please contact us at:{'\n\n'}
          📧 support@flirtkey.app{'\n'}
          🌐 https://flirtkey.app/privacy
        </Section>

        <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
          © 2025 KivoSoft. All rights reserved.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: theme.colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  back: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  lastUpdated: { fontSize: 12, marginTop: 16, marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 30 },
});

export default PrivacyPolicyScreen;
