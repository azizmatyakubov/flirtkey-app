/**
 * StyleSetupScreen
 * Phase 1.1: "Sound Like Me" - Style onboarding
 * 
 * User pastes their own messages, AI analyzes their texting style.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../stores/useStore';
import { analyzeMessages, toUserStyle } from '../services/styleAnalyzer';
import type { StyleAnalysisResult } from '../types';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

interface StyleSetupScreenProps {
  navigation: any;
  route?: {
    params?: {
      fromSettings?: boolean;
    };
  };
}

export function StyleSetupScreen({ navigation, route }: StyleSetupScreenProps) {
  const fromSettings = route?.params?.fromSettings ?? false;
  const { apiKey, userStyle, setUserStyle } = useStore();

  const [messagesText, setMessagesText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StyleAnalysisResult | null>(null);

  // Manual adjustment state
  const [showAdjust, setShowAdjust] = useState(false);
  const [formality, setFormality] = useState(userStyle?.formality ?? 0.5);
  const [emojiUsage, setEmojiUsage] = useState(0.5); // 0-1
  const [humorStyle, setHumorStyle] = useState<'dry' | 'silly' | 'sarcastic' | 'none'>(
    userStyle?.humorStyle ?? 'none'
  );

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setMessagesText(text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Clipboard empty', 'Copy some of your messages first!');
      }
    } catch {
      Alert.alert('Error', 'Could not read clipboard');
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    const lines = messagesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 5) {
      Alert.alert('Need more messages', 'Please paste at least 5 of your messages (one per line)');
      return;
    }

    if (!apiKey) {
      Alert.alert('API Key needed', 'Set up your OpenAI API key first in Settings');
      return;
    }

    setAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await analyzeMessages(lines, apiKey);
      setAnalysisResult(result);
      setFormality(result.formality);
      setHumorStyle(result.humorStyle);

      // Calculate emoji usage from pattern
      const emojiCount = Object.values(result.emojiPattern).reduce((a, b) => a + b, 0);
      setEmojiUsage(Math.min(1, emojiCount / (lines.length * 2)));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error instanceof Error ? error.message : 'Analysis failed';
      Alert.alert('Error', msg);
    }

    setAnalyzing(false);
  }, [messagesText, apiKey]);

  const handleSave = useCallback(() => {
    if (!analysisResult) return;

    const lines = messagesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const style = toUserStyle(
      {
        ...analysisResult,
        formality,
        humorStyle,
      },
      lines.slice(0, 20) // Store up to 20 sample messages
    );

    setUserStyle(style);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (fromSettings) {
      navigation.goBack();
    } else {
      // Continue onboarding flow
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, [analysisResult, messagesText, formality, humorStyle, fromSettings, navigation, setUserStyle]);

  const handleSkip = () => {
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🎭</Text>
          <Text style={styles.title}>Help me learn your texting style</Text>
          <Text style={styles.subtitle}>
            Paste 10+ of your own messages below (one per line).{'\n'}
            I'll analyze your vibe so suggestions sound like YOU.
          </Text>
        </View>

        {/* Input Area */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Your messages:</Text>
            <TouchableOpacity onPress={handlePasteFromClipboard} style={styles.pasteButton}>
              <Text style={styles.pasteButtonText}>📋 Paste from clipboard</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={`hey what's up\nhaha that's so funny\nngl I was thinking about that too\nwanna grab food later?\nlol bet 😂\n...`}
            placeholderTextColor="#444"
            value={messagesText}
            onChangeText={setMessagesText}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <Text style={styles.messageCount}>
            {messagesText.split('\n').filter((l) => l.trim().length > 0).length} messages
            {messagesText.split('\n').filter((l) => l.trim().length > 0).length < 5 && ' (need at least 5)'}
          </Text>
        </View>

        {/* Analyze Button */}
        {!analysisResult && (
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
            activeOpacity={0.8}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.analyzeButtonText}>Analyzing your vibe...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>🔍 Analyze My Style</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <Animated.View entering={SlideInDown.springify()} style={styles.resultSection}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Your Texting Style:</Text>
              <Text style={styles.resultSummary}>{analysisResult.summary}</Text>

              <View style={styles.resultDetails}>
                <ResultRow
                  label="Formality"
                  value={formality < 0.3 ? '😎 Very casual' : formality < 0.6 ? '👍 Casual' : '📝 Formal'}
                />
                <ResultRow
                  label="Humor"
                  value={humorStyle === 'none' ? 'Not much' : humorStyle.charAt(0).toUpperCase() + humorStyle.slice(1)}
                />
                <ResultRow
                  label="Avg length"
                  value={`~${analysisResult.avgLength} chars`}
                />
                <ResultRow
                  label="Abbreviations"
                  value={analysisResult.useAbbreviations ? 'Yes (u, ur, lol...)' : 'No'}
                />
                {Object.keys(analysisResult.emojiPattern).length > 0 && (
                  <ResultRow
                    label="Top emojis"
                    value={Object.entries(analysisResult.emojiPattern)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([e]) => e)
                      .join(' ')}
                  />
                )}
              </View>
            </View>

            {/* Action Buttons */}
            {!showAdjust ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>✅ Looks right!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setShowAdjust(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adjustButtonText}>🔧 Let me adjust</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View entering={FadeIn}>
                {/* Manual Adjustments */}
                <View style={styles.adjustSection}>
                  <Text style={styles.adjustTitle}>Fine-tune your style:</Text>

                  {/* Formality Slider */}
                  <SliderRow
                    label="Formality"
                    value={formality}
                    onValueChange={setFormality}
                    leftLabel="🤙 Casual"
                    rightLabel="📝 Formal"
                  />

                  {/* Emoji Usage Slider */}
                  <SliderRow
                    label="Emoji usage"
                    value={emojiUsage}
                    onValueChange={setEmojiUsage}
                    leftLabel="None"
                    rightLabel="Lots 🔥😂🥰"
                  />

                  {/* Humor Style */}
                  <Text style={styles.sliderLabel}>Humor style:</Text>
                  <View style={styles.humorButtons}>
                    {(['none', 'dry', 'silly', 'sarcastic'] as const).map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.humorButton,
                          humorStyle === style && styles.humorButtonSelected,
                        ]}
                        onPress={() => setHumorStyle(style)}
                      >
                        <Text
                          style={[
                            styles.humorButtonText,
                            humorStyle === style && styles.humorButtonTextSelected,
                          ]}
                        >
                          {style === 'none' ? '😐 None' : style === 'dry' ? '😏 Dry' : style === 'silly' ? '🤪 Silly' : '😈 Sarcastic'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>💾 Save Style</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>
            {fromSettings ? 'Cancel' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Helper components
function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function SliderRow({
  label,
  value,
  onValueChange,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  // Simple discrete slider using buttons (0, 0.25, 0.5, 0.75, 1.0)
  const steps = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}:</Text>
      <View style={styles.sliderRow}>
        <Text style={styles.sliderEdgeLabel}>{leftLabel}</Text>
        <View style={styles.sliderDots}>
          {steps.map((step) => (
            <TouchableOpacity
              key={step}
              onPress={() => onValueChange(step)}
              style={[
                styles.sliderDot,
                Math.abs(value - step) < 0.13 && styles.sliderDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.sliderEdgeLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  pasteButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  pasteButtonText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
  },
  textInput: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
    minHeight: 180,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: darkColors.border,
    lineHeight: 22,
  },
  messageCount: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  analyzeButton: {
    backgroundColor: darkColors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultSection: {
    marginBottom: spacing.lg,
  },
  resultCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.primary + '40',
    marginBottom: spacing.md,
  },
  resultTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  resultSummary: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  resultDetails: {
    gap: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  resultLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  resultValue: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: darkColors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  adjustButton: {
    flex: 1,
    backgroundColor: darkColors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  adjustButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  adjustSection: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  adjustTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sliderEdgeLabel: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  sliderDots: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 2,
    justifyContent: 'center',
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkColors.border,
    borderWidth: 2,
    borderColor: darkColors.border,
  },
  sliderDotActive: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  humorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  humorButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.background,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  humorButtonSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.primary + '20',
  },
  humorButtonText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  humorButtonTextSelected: {
    color: darkColors.primary,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  skipText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
});
