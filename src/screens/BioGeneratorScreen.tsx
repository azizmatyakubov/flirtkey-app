/**
 * BioGeneratorScreen - Profile Bio Generator
 * Phase 2, Task 1
 *
 * Generates dating app bios based on user details, platform, and tone.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { apiClient } from '../services/apiClient';
import { useStore } from '../stores/useStore';
import { humanize } from '../services/humanizer';
import { TONES, type ToneKey } from '../constants/tones';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';

// ==========================================
// Types
// ==========================================

type DatingPlatform = 'tinder' | 'bumble' | 'hinge' | 'okcupid';

interface PlatformConfig {
  name: string;
  emoji: string;
  maxChars: number;
}

interface GeneratedBio {
  text: string;
  editedText?: string;
  isEditing: boolean;
}

// ==========================================
// Constants
// ==========================================

const PLATFORMS: Record<DatingPlatform, PlatformConfig> = {
  tinder: { name: 'Tinder', emoji: '🔥', maxChars: 500 },
  bumble: { name: 'Bumble', emoji: '🐝', maxChars: 300 },
  hinge: { name: 'Hinge', emoji: '💜', maxChars: 150 },
  okcupid: { name: 'OkCupid', emoji: '💘', maxChars: 500 },
};

const PLATFORM_KEYS = Object.keys(PLATFORMS) as DatingPlatform[];

const BIO_TONES: ToneKey[] = ['funny', 'deep', 'bold', 'sweet', 'witty'];

// ==========================================
// Component
// ==========================================

export function BioGeneratorScreen({ navigation }: any) {
  const { apiKey, apiMode, userStyle } = useStore();

  // Form state
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [occupation, setOccupation] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [traits, setTraits] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<DatingPlatform>('tinder');
  const [selectedTone, setSelectedTone] = useState<ToneKey>('funny');

  // Result state
  const [bios, setBios] = useState<GeneratedBio[]>([]);
  const [loading, setLoading] = useState(false);

  const platform = PLATFORMS[selectedPlatform];

  // ==========================================
  // Handlers
  // ==========================================

  const handleGenerate = useCallback(async () => {
    if (apiMode === 'byok' && !apiKey) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('API Key Required', 'Please set up your API key in Settings or switch to Server Mode');
      return;
    }

    if (!interests.trim() && !occupation.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Add some details', 'Please add at least your interests or occupation');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setBios([]);

    try {
      const toneConfig = TONES[selectedTone];
      const userDetails = [
        age ? `Age: ${age}` : '',
        interests ? `Interests: ${interests}` : '',
        occupation ? `Job/Study: ${occupation}` : '',
        lookingFor ? `Looking for: ${lookingFor}` : '',
        traits ? `Personality: ${traits}` : '',
      ].filter(Boolean).join('\n');

      const response = await apiClient.chatCompletion(
        apiMode,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a dating profile bio writer. Create authentic, genuine bios that DON'T sound AI-generated or cringe. Rules:
- MUST stay under ${platform.maxChars} characters per bio
- Match the tone: ${toneConfig.name} — ${toneConfig.prompt}
- Use the person's REAL details, don't make stuff up
- No clichés like "looking for my partner in crime" or "love to laugh"
- Sound like a real person, not a marketing copywriter
- Platform: ${platform.name} (${platform.maxChars} char limit)
- Be specific and personal, reference their actual interests
- Keep it concise and punchy

Return ONLY a JSON response with this structure:
{
  "bios": [
    { "text": "bio text here" },
    { "text": "bio text here" },
    { "text": "bio text here" }
  ]
}`,
            },
            {
              role: 'user',
              content: `Create 3 ${toneConfig.name.toLowerCase()} dating bios for ${platform.name} (max ${platform.maxChars} chars each).

My details:
${userDetails}

Remember: authentic, not cringe, match the ${toneConfig.name.toLowerCase()} tone.`,
            },
          ],
          max_tokens: 800,
          temperature: 0.9,
        },
        apiKey
      );

      const content = response.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.bios)) {
          const generatedBios: GeneratedBio[] = parsed.bios.slice(0, 3).map((b: any) => {
            let text = b.text || '';
            // Apply humanizer
            text = humanize(text, {
              casualLevel: 0.3,
              addTypos: false,
              useAbbreviations: false,
              matchEnergyLevel: false,
            });
            return { text, isEditing: false };
          });
          setBios(generatedBios);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : 'Failed to generate bios';
      Alert.alert('Generation Failed', message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiMode, age, interests, occupation, lookingFor, traits, selectedPlatform, selectedTone, platform, userStyle]);

  const handleCopy = useCallback(async (bio: GeneratedBio) => {
    const text = bio.editedText || bio.text;
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Bio copied to clipboard');
  }, []);

  const handleToggleEdit = useCallback((index: number) => {
    setBios(prev => prev.map((bio, i) => {
      if (i === index) {
        return {
          ...bio,
          isEditing: !bio.isEditing,
          editedText: bio.editedText ?? bio.text,
        };
      }
      return bio;
    }));
  }, []);

  const handleEditText = useCallback((index: number, text: string) => {
    setBios(prev => prev.map((bio, i) => {
      if (i === index) {
        return { ...bio, editedText: text };
      }
      return bio;
    }));
  }, []);

  // ==========================================
  // Render
  // ==========================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bio Generator</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* About You Section */}
        <Animated.View entering={FadeIn}>
          <Text style={styles.sectionTitle}>📝 About You</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="25"
              placeholderTextColor={darkColors.textTertiary}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Interests & Hobbies</Text>
            <TextInput
              style={styles.input}
              placeholder="hiking, cooking, photography, travel..."
              placeholderTextColor={darkColors.textTertiary}
              value={interests}
              onChangeText={setInterests}
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Job / Study</Text>
            <TextInput
              style={styles.input}
              placeholder="Software engineer, Med student..."
              placeholderTextColor={darkColors.textTertiary}
              value={occupation}
              onChangeText={setOccupation}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Looking for</Text>
            <TextInput
              style={styles.input}
              placeholder="Something serious, casual, adventure partner..."
              placeholderTextColor={darkColors.textTertiary}
              value={lookingFor}
              onChangeText={setLookingFor}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Personality Traits</Text>
            <TextInput
              style={styles.input}
              placeholder="Adventurous, sarcastic, nerdy, outgoing..."
              placeholderTextColor={darkColors.textTertiary}
              value={traits}
              onChangeText={setTraits}
            />
          </View>
        </Animated.View>

        {/* Platform Selector */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text style={styles.sectionTitle}>📱 Platform</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PLATFORM_KEYS.map((key) => {
              const p = PLATFORMS[key];
              const isSelected = selectedPlatform === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlatform(key);
                  }}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {p.emoji} {p.name}
                  </Text>
                  <Text style={[styles.chipSubtext, isSelected && styles.chipSubtextSelected]}>
                    {p.maxChars} chars
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Tone Selector */}
        <Animated.View entering={FadeIn.delay(200)}>
          <Text style={styles.sectionTitle}>🎭 Vibe / Tone</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {BIO_TONES.map((key) => {
              const tone = TONES[key];
              const isSelected = selectedTone === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.toneChip, isSelected && styles.toneChipSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTone(key);
                  }}
                >
                  <Text style={styles.toneEmoji}>{tone.emoji}</Text>
                  <Text style={[styles.toneText, isSelected && styles.toneTextSelected]}>
                    {tone.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate Bios</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {bios.length > 0 && (
          <Animated.View entering={SlideInDown.springify()} style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>📄 Your Bios</Text>
              <TouchableOpacity onPress={handleGenerate} disabled={loading}>
                <Text style={styles.regenerateText}>🔄 Regenerate</Text>
              </TouchableOpacity>
            </View>

            {bios.map((bio, index) => {
              const displayText = bio.editedText ?? bio.text;
              const charCount = displayText.length;
              const isOverLimit = charCount > platform.maxChars;

              return (
                <Animated.View
                  key={index}
                  entering={SlideInRight.delay(index * 100)}
                  style={styles.bioCard}
                >
                  <View style={styles.bioHeader}>
                    <Text style={styles.bioLabel}>Option {index + 1}</Text>
                    <Text style={[
                      styles.charCount,
                      isOverLimit && styles.charCountOver,
                    ]}>
                      {charCount}/{platform.maxChars}
                    </Text>
                  </View>

                  {bio.isEditing ? (
                    <TextInput
                      style={styles.bioEditInput}
                      value={bio.editedText ?? bio.text}
                      onChangeText={(text) => handleEditText(index, text)}
                      multiline
                      autoFocus
                    />
                  ) : (
                    <Text style={styles.bioText}>{displayText}</Text>
                  )}

                  <View style={styles.bioActions}>
                    <TouchableOpacity
                      style={styles.bioAction}
                      onPress={() => handleCopy(bio)}
                    >
                      <Text style={styles.bioActionText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bioAction}
                      onPress={() => handleToggleEdit(index)}
                    >
                      <Text style={styles.bioActionText}>
                        {bio.isEditing ? '✅ Done' : '✏️ Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: darkColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  backButton: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
  },
  headerTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  fieldLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
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
  inputSmall: {
    width: 80,
    textAlign: 'center',
  },
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  chipText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  chipSubtext: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  chipSubtextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  toneChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toneChipSelected: {
    backgroundColor: darkColors.primary + '20',
    borderColor: darkColors.primary,
  },
  toneEmoji: {
    fontSize: 16,
  },
  toneText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  toneTextSelected: {
    color: darkColors.primary,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: spacing.lg,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  regenerateText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
  },
  bioCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bioLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  charCount: {
    color: darkColors.success,
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  charCountOver: {
    color: darkColors.error,
  },
  bioText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  bioEditInput: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: darkColors.primary + '50',
  },
  bioActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    paddingTop: spacing.sm,
  },
  bioAction: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: darkColors.background,
  },
  bioActionText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});

export default BioGeneratorScreen;
