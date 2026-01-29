/**
 * OnboardingFlowScreen - Optimized first-time user flow
 * Phase 3, Task 3
 *
 * < 2 min to WOW moment:
 * 1. Welcome (5s) — "I'm your AI wingman 🤝"
 * 2. Quick Style Quiz (30s) — 3 quick questions
 * 3. Add First Contact (30s) — Name + context
 * 4. First Suggestion (15s) — Auto-generated WOW moment
 * 5. Done → HomeScreen
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useStore } from '../stores/useStore';
import { generateResponse } from '../services/ai';
import { darkColors, spacing, borderRadius, shadows, TYPOGRAPHY } from '../constants/theme';
import type { UserStyle, RelationshipStage } from '../types';

const ONBOARDING_COMPLETE_KEY = 'flirtkey_onboarding_complete';

// ==========================================
// Types
// ==========================================

type Step = 'welcome' | 'quiz' | 'addContact' | 'firstSuggestion' | 'done';

interface QuizAnswers {
  formality: 'casual' | 'balanced' | 'formal';
  humor: 'dry' | 'silly' | 'sarcastic' | 'none';
  emoji: 'lots' | 'some' | 'rarely';
}

interface ContactInput {
  name: string;
  howMet: string;
  context: string;
}

// ==========================================
// Step Components
// ==========================================

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]),
      Animated.timing(buttonAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.welcomeContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.welcomeEmoji}>🤝</Text>
        <Text style={styles.welcomeTitle}>I'm your AI wingman</Text>
        <Text style={styles.welcomeSubtitle}>
          I'll help you craft the perfect response{'\n'}every time they text
        </Text>
        <View style={styles.welcomeFeatures}>
          <Text style={styles.welcomeFeature}>✨ Smart reply suggestions</Text>
          <Text style={styles.welcomeFeature}>🎯 Personalized to your style</Text>
          <Text style={styles.welcomeFeature}>📊 Track your progress</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.bottomAction, { opacity: buttonAnim }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Let's Set You Up →</Text>
        </TouchableOpacity>
        <Text style={styles.timeEstimate}>Takes less than 2 minutes</Text>
      </Animated.View>
    </View>
  );
}

function QuizStep({
  onNext,
  answers,
  setAnswers,
}: {
  onNext: () => void;
  answers: QuizAnswers;
  setAnswers: (a: QuizAnswers) => void;
}) {
  const [question, setQuestion] = useState(0);

  const questions = [
    {
      text: 'How do you usually text?',
      emoji: '💬',
      options: [
        { label: 'Casual', value: 'casual', emoji: '😎' },
        { label: 'Balanced', value: 'balanced', emoji: '⚖️' },
        { label: 'Formal', value: 'formal', emoji: '👔' },
      ],
      key: 'formality' as const,
    },
    {
      text: "What's your humor like?",
      emoji: '😂',
      options: [
        { label: 'Dry', value: 'dry', emoji: '🍷' },
        { label: 'Silly', value: 'silly', emoji: '🤪' },
        { label: 'Sarcastic', value: 'sarcastic', emoji: '😏' },
        { label: 'None', value: 'none', emoji: '🙂' },
      ],
      key: 'humor' as const,
    },
    {
      text: 'Emoji usage?',
      emoji: '😊',
      options: [
        { label: 'Lots! 🎉', value: 'lots', emoji: '🎉' },
        { label: 'Some', value: 'some', emoji: '👍' },
        { label: 'Rarely', value: 'rarely', emoji: '📝' },
      ],
      key: 'emoji' as const,
    },
  ];

  const current = questions[question]!;

  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...answers, [current.key]: value } as QuizAnswers;
    setAnswers(updated);

    if (question < questions.length - 1) {
      setQuestion(question + 1);
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.quizContent}>
        <View style={styles.progressDots}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= question && styles.progressDotActive]}
            />
          ))}
        </View>
        <Text style={styles.quizEmoji}>{current.emoji}</Text>
        <Text style={styles.quizQuestion}>{current.text}</Text>
        <View style={styles.quizOptions}>
          {current.options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.quizOption,
                answers[current.key as keyof QuizAnswers] === opt.value && styles.quizOptionSelected,
              ]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.quizOptionEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.quizOptionText,
                  answers[current.key as keyof QuizAnswers] === opt.value && styles.quizOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function AddContactStep({
  onNext,
  contactInput,
  setContactInput,
}: {
  onNext: () => void;
  contactInput: ContactInput;
  setContactInput: (g: ContactInput) => void;
}) {
  const isValid = contactInput.name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.stepContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.addContactContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepEmoji}>👩</Text>
        <Text style={styles.stepTitle}>Who are you talking to?</Text>
        <Text style={styles.stepSubtitle}>Add someone you're texting right now</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Her name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Sarah"
            placeholderTextColor="#666"
            value={contactInput.name}
            onChangeText={(t) => setContactInput({ ...contactInput, name: t })}
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>How did you meet?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Tinder, college, gym"
            placeholderTextColor="#666"
            value={contactInput.howMet}
            onChangeText={(t) => setContactInput({ ...contactInput, howMet: t })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quick context (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMulti]}
            placeholder="e.g. She likes hiking, we've been talking for a week"
            placeholderTextColor="#666"
            value={contactInput.context}
            onChangeText={(t) => setContactInput({ ...contactInput, context: t })}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
          onPress={onNext}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function FirstSuggestionStep({
  suggestion,
  loading,
  contactName,
  onDone,
}: {
  suggestion: string | null;
  loading: boolean;
  contactName: string;
  onDone: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (suggestion) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [suggestion]);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.suggestionContent}>
        {loading ? (
          <>
            <Text style={styles.loadingEmoji}>✨</Text>
            <Text style={styles.loadingText}>Generating your first suggestion...</Text>
            <Text style={styles.loadingSubtext}>For {contactName}</Text>
          </>
        ) : suggestion ? (
          <>
            <Text style={styles.wowEmoji}>🎉</Text>
            <Text style={styles.wowTitle}>Here's what you could say 👇</Text>
            <Animated.View style={[styles.suggestionCard, { opacity: fadeAnim }]}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Animated.View>
            <Text style={styles.wowHint}>
              This is personalized to your style and context about {contactName}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.wowEmoji}>👍</Text>
            <Text style={styles.wowTitle}>You're all set!</Text>
            <Text style={styles.loadingSubtext}>
              Start chatting to get personalized suggestions
            </Text>
          </>
        )}
      </View>

      {!loading && (
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onDone} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>
              {suggestion ? "Let's Go! 🚀" : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ==========================================
// Main Screen
// ==========================================

export function OnboardingFlowScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('welcome');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    formality: 'balanced',
    humor: 'none',
    emoji: 'some',
  });
  const [contactInput, setContactInput] = useState<ContactInput>({
    name: '',
    howMet: '',
    context: '',
  });
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { addContact, setUserStyle, apiKey } = useStore();

  const handleQuizDone = () => {
    // Convert quiz to UserStyle
    const formalityMap = { casual: 0.2, balanced: 0.5, formal: 0.8 };
    const style: UserStyle = {
      sampleMessages: [],
      formality: formalityMap[quizAnswers.formality],
      humorStyle: quizAnswers.humor,
      useAbbreviations: quizAnswers.formality === 'casual',
      emojiPattern:
        quizAnswers.emoji === 'lots'
          ? { '😊': 3, '😂': 2, '❤️': 2 }
          : quizAnswers.emoji === 'some'
            ? { '😊': 1 }
            : {},
      avgLength: quizAnswers.formality === 'formal' ? 80 : quizAnswers.formality === 'casual' ? 30 : 50,
    };
    setUserStyle(style);
    setStep('addContact');
  };

  const handleAddContact = async () => {
    // Add the contact to the store (this sets selectedContact and adds to contacts[])
    addContact({
      name: contactInput.name.trim(),
      howMet: contactInput.howMet.trim() || undefined,
      interests: contactInput.context.trim() || undefined,
      relationshipStage: 'just_met' as RelationshipStage,
    });

    setStep('firstSuggestion');
    setLoading(true);

    // Try to generate a first suggestion using the contact from the store
    // (avoids race condition where local object has a different ID)
    if (apiKey) {
      try {
        // Get the freshly added contact from the store (last one added)
        const storeContacts = useStore.getState().contacts;
        const addedContact = storeContacts[storeContacts.length - 1];
        if (addedContact) {
          const result = await generateResponse(apiKey, addedContact, 'Hey!', 'universal');
          if (result.suggestions.length > 0 && result.suggestions[0]) {
            setSuggestion(result.suggestions[0].text);
          }
        }
      } catch {
        // If AI fails, still move forward
        setSuggestion(null);
      }
    }

    setLoading(false);
  };

  const handleDone = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch {
      // no-op
    }

    // If user has no API key, send them to setup; otherwise go Home
    const currentApiKey = useStore.getState().apiKey;
    if (!currentApiKey) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ApiKeySetup' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, [navigation]);

  // Step indicator
  const stepMap: Record<Step, number> = { welcome: 0, quiz: 1, addContact: 2, firstSuggestion: 3, done: 4 };
  const stepIndex = stepMap[step];

  return (
    <View style={styles.container}>
      {/* Step Progress */}
      {step !== 'welcome' && (
        <View style={styles.stepProgress}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                s <= stepIndex && styles.stepDotActive,
                s === stepIndex && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>
      )}

      {/* Skip (except welcome & firstSuggestion) */}
      {(step === 'quiz' || step === 'addContact') && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            if (step === 'quiz') handleQuizDone();
            else handleDone();
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Steps */}
      {step === 'welcome' && <WelcomeStep onNext={() => setStep('quiz')} />}
      {step === 'quiz' && (
        <QuizStep answers={quizAnswers} setAnswers={setQuizAnswers} onNext={handleQuizDone} />
      )}
      {step === 'addContact' && (
        <AddContactStep contactInput={contactInput} setContactInput={setContactInput} onNext={handleAddContact} />
      )}
      {step === 'firstSuggestion' && (
        <FirstSuggestionStep
          suggestion={suggestion}
          loading={loading}
          contactName={contactInput.name || 'them'}
          onDone={handleDone}
        />
      )}
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  stepProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.border,
  },
  stepDotActive: {
    backgroundColor: darkColors.primary,
  },
  stepDotCurrent: {
    width: 28,
    borderRadius: 4,
    backgroundColor: darkColors.primary,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.body,
  },

  // Step Container
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Welcome
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    ...TYPOGRAPHY.hero,
    color: darkColors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  welcomeFeatures: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  welcomeFeature: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.body,
  },

  // Bottom Action
  bottomAction: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  primaryBtn: {
    backgroundColor: darkColors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...shadows.glow(darkColors.primary),
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#fff',
    ...TYPOGRAPHY.h2,
  },
  timeEstimate: {
    color: darkColors.textTertiary,
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Quiz
  quizContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkColors.border,
  },
  progressDotActive: {
    backgroundColor: darkColors.primary,
  },
  quizEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  quizQuestion: {
    ...TYPOGRAPHY.h1,
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  quizOptions: {
    width: '100%',
    gap: spacing.sm,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingVertical: spacing.md + 2,
    borderWidth: 2,
    borderColor: darkColors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  quizOptionSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.primary + '15',
    ...shadows.glow(darkColors.primary),
  },
  quizOptionEmoji: {
    fontSize: 28,
  },
  quizOptionText: {
    color: darkColors.text,
    ...TYPOGRAPHY.bodyBold,
  },
  quizOptionTextSelected: {
    color: darkColors.primary,
  },

  // Add Contact
  addContactContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  stepEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...TYPOGRAPHY.h1,
    color: darkColors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...TYPOGRAPHY.caption,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: darkColors.text,
    ...TYPOGRAPHY.body,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  textInputMulti: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // First Suggestion
  suggestionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  loadingText: {
    color: darkColors.text,
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.body,
    marginTop: spacing.xs,
  },
  wowEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  wowTitle: {
    ...TYPOGRAPHY.h1,
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  suggestionCard: {
    backgroundColor: darkColors.primary + '12',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: darkColors.primary + '30',
    width: '100%',
    ...shadows.md,
  },
  suggestionText: {
    color: darkColors.text,
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  wowHint: {
    color: darkColors.textSecondary,
    ...TYPOGRAPHY.small,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default OnboardingFlowScreen;
