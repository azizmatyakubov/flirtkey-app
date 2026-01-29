/**
 * OpenerGeneratorScreen - Personalized Opener Generator
 * Phase 2, Task 2
 *
 * Upload a screenshot of a match's dating profile,
 * OCR extracts text, AI generates personalized openers.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import { useStore } from '../stores/useStore';
import { useImagePicker } from '../hooks/useImagePicker';
import { ImagePreview } from '../components/ImagePreview';
import { performOCR } from '../services/ocr';
import { humanize, type HumanizeOptions } from '../services/humanizer';
import { TONES, type ToneKey } from '../constants/tones';
import { LoadingShimmer } from '../components/ShimmerEffect';
import { TypingIndicator } from '../components/TypingIndicator';
import { CoachingTip } from '../components/CoachingTip';
import { useSettingsStore } from '../stores/settingsStore';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';

// ==========================================
// Types
// ==========================================

interface GeneratedOpener {
  text: string;
  tone: ToneKey;
  explanation?: string;
}

// ==========================================
// Component
// ==========================================

export function OpenerGeneratorScreen({ navigation }: any) {
  const { apiKey, userStyle } = useStore();
  const { preferences } = useSettingsStore();
  const coachingEnabled = preferences.coachingMode !== false; // default ON

  // State
  const [extractedText, setExtractedText] = useState('');
  const [openers, setOpeners] = useState<GeneratedOpener[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastToneFilter, setLastToneFilter] = useState<ToneKey | null>(null);

  // Image picker
  const imagePicker = useImagePicker({
    optimizeForVision: true,
    visionQuality: 'medium',
    allowsEditing: false,
  });

  // ==========================================
  // Handlers
  // ==========================================

  const handlePickImage = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await imagePicker.pickFromLibrary();
  }, [imagePicker]);

  const handleTakePhoto = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await imagePicker.takePhoto();
  }, [imagePicker]);

  const handleExtractAndGenerate = useCallback(async () => {
    if (!imagePicker.image?.base64) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }
    if (!apiKey) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('API Key Required', 'Please set up your API key in Settings first');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Step 1: Extract text with OCR
    setIsExtracting(true);
    try {
      const ocrResult = await performOCR(imagePicker.image.base64, apiKey);
      if (!ocrResult.success || !ocrResult.text.trim()) {
        Alert.alert('OCR Failed', 'Could not extract text from the image. Try a clearer screenshot.');
        setIsExtracting(false);
        return;
      }
      setExtractedText(ocrResult.text);
      setIsExtracting(false);

      // Step 2: Generate openers
      await generateOpeners(ocrResult.text);
    } catch (error) {
      setIsExtracting(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : 'Failed to extract text';
      Alert.alert('Error', message);
    }
  }, [imagePicker.image, apiKey]);

  const generateOpeners = useCallback(async (profileText: string, toneFilter?: ToneKey) => {
    if (!apiKey) return;
    setIsGenerating(true);

    try {
      const toneInstruction = toneFilter
        ? `Focus on the "${TONES[toneFilter].name}" tone: ${TONES[toneFilter].prompt}.`
        : 'Vary the tones across: witty, bold, sweet, funny, and flirty.';

      const coachingInstruction = coachingEnabled
        ? '\nFor EACH opener, also include an "explanation" field with a brief "Why this works" explanation (1-2 sentences about the psychology/strategy behind it).'
        : '';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You generate personalized conversation openers for dating apps. Rules:
- Each opener MUST reference something SPECIFIC from their profile
- Be creative, natural, not generic or cringe
- Show you actually read their profile
- Keep each opener under 200 characters
- ${toneInstruction}${coachingInstruction}

Return ONLY JSON:
{
  "openers": [
    { "text": "opener text", "tone": "witty|bold|sweet|funny|flirty"${coachingEnabled ? ', "explanation": "why this works"' : ''} }
  ]
}`,
            },
            {
              role: 'user',
              content: `Generate 5 unique conversation openers for a dating app. The match's profile says:\n\n"${profileText}"\n\nEach opener should reference something specific from their profile.`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.9,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.openers)) {
          const hOpts: Partial<HumanizeOptions> = {
            casualLevel: userStyle ? (1 - userStyle.formality) : 0.5,
            useAbbreviations: userStyle?.useAbbreviations ?? true,
            addTypos: false,
            matchEnergyLevel: false,
          };

          const generated: GeneratedOpener[] = parsed.openers.slice(0, 5).map((o: any) => ({
            text: humanize(o.text || '', hOpts),
            tone: mapTone(o.tone || 'witty'),
            explanation: o.explanation || undefined,
          }));

          setOpeners(generated);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : 'Failed to generate openers';
      Alert.alert('Generation Failed', message);
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, userStyle, coachingEnabled]);

  const handleMoreLikeThis = useCallback(async (tone: ToneKey) => {
    if (!extractedText) return;
    setLastToneFilter(tone);
    await generateOpeners(extractedText, tone);
  }, [extractedText, generateOpeners]);

  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Opener copied to clipboard');
  }, []);

  const handleRetake = useCallback(() => {
    imagePicker.clear();
    setExtractedText('');
    setOpeners([]);
    setLastToneFilter(null);
  }, [imagePicker]);

  const isLoading = isExtracting || isGenerating;

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
        <Text style={styles.headerTitle}>Opener Generator</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Upload Section */}
        {!imagePicker.image ? (
          <Animated.View entering={FadeIn} style={styles.pickerSection}>
            <Text style={styles.pickerTitle}>Upload Their Profile</Text>
            <Text style={styles.pickerSubtitle}>
              Screenshot their dating profile — we'll craft personalized openers
            </Text>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handlePickImage}
                disabled={imagePicker.isLoading}
              >
                {imagePicker.isLoading ? (
                  <ActivityIndicator color={darkColors.primary} />
                ) : (
                  <>
                    <Text style={styles.pickerButtonIcon}>🖼️</Text>
                    <Text style={styles.pickerButtonText}>Choose Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleTakePhoto}
                disabled={imagePicker.isLoading}
              >
                <Text style={styles.pickerButtonIcon}>📸</Text>
                <Text style={styles.pickerButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {imagePicker.error && (
              <Text style={styles.errorText}>{imagePicker.error}</Text>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInDown.springify()} style={styles.imageSection}>
            <ImagePreview
              uri={imagePicker.image.uri}
              width={imagePicker.image.width}
              height={imagePicker.image.height}
              fileSize={imagePicker.image.fileSize}
              isCompressed={imagePicker.image.isCompressed}
              onRetake={handleRetake}
              onRemove={handleRetake}
              onAnalyze={isLoading || openers.length > 0 ? undefined : handleExtractAndGenerate}
              loading={isLoading}
              showActions={openers.length === 0}
            />

            {openers.length === 0 && !isLoading && (
              <Animated.View entering={FadeIn} style={styles.analyzeSection}>
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={handleExtractAndGenerate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.analyzeButtonText}>✨ Generate Openers</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Loading States */}
        {isExtracting && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingSection}>
            <TypingIndicator color={darkColors.primary} />
            <Text style={styles.loadingText}>Reading their profile...</Text>
            <LoadingShimmer />
          </Animated.View>
        )}

        {isGenerating && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingSection}>
            <TypingIndicator color={darkColors.primary} />
            <Text style={styles.loadingText}>
              {lastToneFilter
                ? `Generating more ${TONES[lastToneFilter].name.toLowerCase()} openers...`
                : 'Crafting personalized openers...'}
            </Text>
            <LoadingShimmer />
          </Animated.View>
        )}

        {/* Extracted Text Preview */}
        {extractedText && !isLoading && (
          <Animated.View entering={FadeIn} style={styles.extractedSection}>
            <Text style={styles.extractedLabel}>📄 Profile Text Detected</Text>
            <Text style={styles.extractedText} numberOfLines={4}>
              {extractedText}
            </Text>
          </Animated.View>
        )}

        {/* Results */}
        {openers.length > 0 && !isLoading && (
          <Animated.View entering={SlideInDown.springify()} style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>💬 Personalized Openers</Text>

            {openers.map((opener, index) => {
              const toneConfig = TONES[opener.tone] || TONES.witty;
              return (
                <Animated.View
                  key={index}
                  entering={SlideInRight.delay(index * 100)}
                  style={styles.openerCard}
                >
                  <View style={styles.openerHeader}>
                    <View style={styles.toneBadge}>
                      <Text style={styles.toneBadgeText}>
                        {toneConfig.emoji} {toneConfig.name}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.openerText}>{opener.text}</Text>

                  {/* Coaching Tip */}
                  {coachingEnabled && opener.explanation && (
                    <CoachingTip explanation={opener.explanation} />
                  )}

                  <View style={styles.openerActions}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopy(opener.text)}
                    >
                      <Text style={styles.copyButtonText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.moreLikeButton}
                      onPress={() => handleMoreLikeThis(opener.tone)}
                    >
                      <Text style={styles.moreLikeText}>More like this →</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
                <Text style={styles.secondaryButtonText}>📷 New Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => generateOpeners(extractedText)}
              >
                <Text style={styles.secondaryButtonText}>🔄 Regenerate All</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ==========================================
// Helpers
// ==========================================

function mapTone(tone: string): ToneKey {
  const mapping: Record<string, ToneKey> = {
    witty: 'witty',
    bold: 'bold',
    sweet: 'sweet',
    funny: 'funny',
    flirty: 'flirty',
    chill: 'chill',
    deep: 'deep',
  };
  return mapping[tone.toLowerCase()] || 'witty';
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

  // Picker
  pickerSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  pickerTitle: {
    color: darkColors.text,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  pickerSubtitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerButton: {
    width: 140,
    height: 120,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: darkColors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  pickerButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  errorText: {
    color: darkColors.error,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // Image
  imageSection: {
    alignItems: 'center',
  },
  analyzeSection: {
    marginTop: spacing.lg,
    width: '100%',
  },
  analyzeButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },

  // Loading
  loadingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Extracted text
  extractedSection: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  extractedLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  extractedText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },

  // Results
  resultsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  openerCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  openerHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  toneBadge: {
    backgroundColor: darkColors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  toneBadgeText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  openerText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  openerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    paddingTop: spacing.sm,
  },
  copyButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.md,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  moreLikeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  moreLikeText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  secondaryButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});

export default OpenerGeneratorScreen;
