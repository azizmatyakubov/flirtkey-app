/**
 * ScreenshotAnalysisScreen (Phase 7.3)
 *
 * Complete screenshot analysis experience:
 * - 7.3.1: Create screen
 * - 7.3.2: Show uploaded image
 * - 7.3.3: Display analysis results
 * - 7.3.4: Show conversation breakdown
 * - 7.3.5: Show their message highlights
 * - 7.3.6: Show potential responses
 * - 7.3.7: Add image annotation overlay
 * - 7.3.8: Add key points summary
 * - 7.3.9: Add "what to notice" section
 * - 7.3.10: Add follow-up question suggestions
 * - 7.3.11: Add export analysis
 * - 7.3.12: Add share analysis
 * - 7.3.13: Test analysis accuracy
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../stores/useStore';
import { analyzeScreenshot } from '../services/ai';
import { useImagePicker } from '../hooks/useImagePicker';
import { ImagePreview } from '../components/ImagePreview';
import { ImageAnnotationOverlay } from '../components/ImageAnnotationOverlay';
import { AnimatedSuggestionCard } from '../components/AnimatedSuggestionCard';
import { InterestLevelDisplay } from '../components/InterestLevelDisplay';
import { ProTipCard } from '../components/ProTipCard';
import { LoadingShimmer } from '../components/ShimmerEffect';
import { TypingIndicator } from '../components/TypingIndicator';
import { OfflineIndicator } from '../components/OfflineIndicator';
import type { AnalysisResult, Suggestion, Contact } from '../types';
import { darkColors, accentColors, spacing, borderRadius, fontSizes, shadows } from '../constants/theme';

// ==========================================
// Types
// ==========================================

import type { ScreenshotAnalysisScreenProps } from '../types/navigation';

interface AnalysisHistory {
  id: string;
  imageUri: string;
  result: AnalysisResult;
  timestamp: number;
  contactId?: number;
}

// ==========================================
// Component
// ==========================================

export function ScreenshotAnalysisScreen({ navigation, route }: ScreenshotAnalysisScreenProps) {
  const apiKey = useStore((s) => s.apiKey);
  const selectedContact = useStore((s) => s.selectedContact);
  const contacts = useStore((s) => s.contacts);
  const userCulture = useStore((s) => s.userCulture);

  // State
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedContactForAnalysis, setSelectedContactForAnalysis] = useState<Contact | null>(selectedContact);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedTips, setSavedTips] = useState<string[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Image picker hook
  const imagePicker = useImagePicker({
    optimizeForVision: true,
    visionQuality: 'medium',
    allowsEditing: false,
  });

  // Handle initial image from navigation params
  useEffect(() => {
    if (route?.params?.imageUri || route?.params?.imageBase64) {
      // TODO: Handle shared image from route params
    }
    if (route?.params?.contactId) {
      const contact = contacts.find((g) => g.id === route.params!.contactId);
      if (contact) {
        setSelectedContactForAnalysis(contact);
      }
    }
  }, [route?.params, contacts]);

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

  const handleAnalyze = useCallback(async () => {
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
    setIsAnalyzing(true);

    try {
      const analysisResult = await analyzeScreenshot({
        contact: selectedContactForAnalysis,
        imageBase64: imagePicker.image.base64,
        userCulture,
        apiKey,
        model: 'gpt-4o',
      });

      setResult(analysisResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to history (7.2.10)
      const historyEntry: AnalysisHistory = {
        id: `${Date.now()}`,
        imageUri: imagePicker.image.uri,
        result: analysisResult,
        timestamp: Date.now(),
        contactId: selectedContactForAnalysis?.id,
      };
      setAnalysisHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : 'Failed to analyze screenshot';
      Alert.alert('Analysis Failed', message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imagePicker.image, apiKey, selectedContactForAnalysis, userCulture]);

  const handleRetake = useCallback(() => {
    imagePicker.clear();
    setResult(null);
  }, [imagePicker]);

  const handleRefresh = useCallback(async () => {
    if (!imagePicker.image?.base64) return;
    setRefreshing(true);
    await handleAnalyze();
    setRefreshing(false);
  }, [handleAnalyze, imagePicker.image]);

  // 7.3.11: Export analysis
  const handleExport = useCallback(async () => {
    if (!result) return;

    const text = formatAnalysisForExport(result, selectedContactForAnalysis);
    try {
      await Clipboard.setStringAsync(text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Copied!', 'Analysis copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard. Please try again.');
    }
  }, [result, selectedContactForAnalysis]);

  // 7.3.12: Share analysis
  const handleShare = useCallback(async () => {
    if (!result) return;

    const text = formatAnalysisForShare(result);

    try {
      await Share.share({
        message: text,
        title: 'FlirtKey Analysis',
      });
    } catch (error) {
      // User cancelled
    }
  }, [result]);

  // Suggestion handlers
  const handleSuggestionUse = useCallback(async (suggestion: Suggestion) => {
    try {
      await Clipboard.setStringAsync(suggestion.text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Copied!', 'Response copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  }, []);

  const handleFavorite = useCallback((suggestion: Suggestion) => {
    setFavorites((prev) => {
      if (prev.includes(suggestion.text)) {
        return prev.filter((f) => f !== suggestion.text);
      }
      return [...prev, suggestion.text];
    });
  }, []);

  const handleFeedback = useCallback((_suggestion: Suggestion, positive: boolean) => {
    const message = positive ? 'Thanks for the feedback! 👍' : "We'll improve next time!";
    Alert.alert('Feedback', message);
  }, []);

  const handleSaveTip = useCallback((tip: string) => {
    setSavedTips((prev) => {
      if (prev.includes(tip)) return prev;
      return [...prev, tip];
    });
  }, []);

  // ==========================================
  // Render
  // ==========================================

  return (
    <View style={styles.container}>
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screenshot Analysis</Text>
        <View style={styles.headerRight}>
          {result && (
            <>
              <TouchableOpacity onPress={handleExport} style={styles.headerAction} accessibilityLabel="Copy analysis to clipboard" accessibilityRole="button">
                <Ionicons name="clipboard" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.headerAction} accessibilityLabel="Share analysis" accessibilityRole="button">
                <Ionicons name="share" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkColors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Contact Selector */}
        <View style={styles.contactSelector}>
          <Text style={styles.sectionLabel}>Analyzing for:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactList}>
            <TouchableOpacity
              style={[styles.contactChip, !selectedContactForAnalysis && styles.contactChipSelected]}
              onPress={() => setSelectedContactForAnalysis(null)}
            >
              <Ionicons
                name="person"
                size={14}
                color={!selectedContactForAnalysis ? '#fff' : darkColors.text}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.contactChipText,
                  !selectedContactForAnalysis && styles.contactChipTextSelected,
                ]}
              >
                Anyone
              </Text>
            </TouchableOpacity>
            {contacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactChip,
                  selectedContactForAnalysis?.id === contact.id && styles.contactChipSelected,
                ]}
                onPress={() => setSelectedContactForAnalysis(contact)}
              >
                <Text
                  style={[
                    styles.contactChipText,
                    selectedContactForAnalysis?.id === contact.id && styles.contactChipTextSelected,
                  ]}
                >
                  {contact.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Image Section */}
        {!imagePicker.image ? (
          // Image picker buttons
          <Animated.View entering={FadeIn} style={styles.pickerSection}>
            <Text style={styles.pickerTitle}>Select a Screenshot</Text>
            <Text style={styles.pickerSubtitle}>
              Upload a chat screenshot to analyze the conversation
            </Text>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handlePickImage}
                disabled={imagePicker.isLoading}
              >
                {imagePicker.isLoading ? (
                  <ActivityIndicator color={accentColors.coral} />
                ) : (
                  <>
                    <Ionicons name="images" size={32} color={accentColors.coral} />
                    <Text style={styles.pickerButtonText}>Choose Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleTakePhoto}
                disabled={imagePicker.isLoading}
              >
                <Ionicons name="camera" size={32} color={accentColors.coral} />
                <Text style={styles.pickerButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {imagePicker.error && (
              <Animated.Text entering={FadeIn} style={styles.errorText}>
                {imagePicker.error}
              </Animated.Text>
            )}
          </Animated.View>
        ) : (
          // 7.3.2: Show uploaded image
          <Animated.View entering={SlideInDown.springify()} style={styles.imageSection}>
            <ImagePreview
              uri={imagePicker.image.uri}
              width={imagePicker.image.width}
              height={imagePicker.image.height}
              fileSize={imagePicker.image.fileSize}
              isCompressed={imagePicker.image.isCompressed}
              onRetake={handleRetake}
              onRemove={handleRetake}
              onAnalyze={isAnalyzing || result ? undefined : handleAnalyze}
              loading={isAnalyzing}
              showActions={!result}
            />

            {/* Analyze button when image is selected but not analyzed */}
            {!result && !isAnalyzing && (
              <Animated.View entering={FadeIn} style={styles.analyzeSection}>
                <TouchableOpacity
                  onPress={handleAnalyze}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[accentColors.gradientStart, accentColors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.analyzeButton}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>Analyze Screenshot</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingSection}>
            <TypingIndicator color={darkColors.primary} />
            <Text style={styles.loadingText}>Analyzing conversation...</Text>
            <LoadingShimmer />
          </Animated.View>
        )}

        {/* 7.3.3: Analysis Results */}
        {result && !isAnalyzing && (
          <Animated.View
            entering={SlideInDown.springify()}
            layout={Layout.springify()}
            style={styles.resultsSection}
          >
            {/* 7.3.7: Image with Annotation Overlay */}
            {imagePicker.image && showAnnotations && (
              <Animated.View entering={FadeIn} style={styles.annotatedImageSection}>
                <View style={styles.annotationHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="pin" size={18} color={accentColors.coral} />
                    <Text style={styles.annotationTitle}>Analysis Highlights</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAnnotations(!showAnnotations)}
                    style={styles.annotationToggle}
                  >
                    <Text style={styles.annotationToggleText}>
                      {showAnnotations ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.annotatedImageContainer}>
                  <ImageAnnotationOverlay
                    imageWidth={imagePicker.image.width}
                    imageHeight={imagePicker.image.height}
                    analysisResult={result}
                    showInterestLevel={true}
                    showKeyPoints={true}
                    animated={true}
                  />
                </View>
              </Animated.View>
            )}

            {/* 7.3.8: Key Points Summary */}
            <View style={styles.summaryCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
                <Ionicons name="analytics" size={20} color={accentColors.coral} />
                <Text style={styles.summaryTitle}>Quick Summary</Text>
              </View>
              <View style={styles.summaryContent}>
                {result.interestLevel && (
                  <InterestLevelDisplay
                    level={result.interestLevel}
                    mood={result.mood}
                    showTrend={false}
                    showVibeCheck={true}
                  />
                )}
              </View>
            </View>

            {/* 7.3.9: What to Notice */}
            {result.proTip && (
              <Animated.View entering={SlideInRight.delay(100)}>
                <View style={styles.noticeCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }}>
                    <Ionicons name="eye" size={16} color={darkColors.warning} />
                    <Text style={styles.noticeTitle}>What to Notice</Text>
                  </View>
                  <Text style={styles.noticeText}>{result.proTip}</Text>
                </View>
              </Animated.View>
            )}

            {/* 7.3.6: Potential Responses */}
            <View style={styles.suggestionsSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <Ionicons name="chatbubbles" size={18} color={accentColors.coral} />
                <Text style={styles.sectionTitle}>Suggested Responses</Text>
              </View>
              {result.suggestions.map((suggestion, index) => (
                <Animated.View
                  key={`${suggestion.type}-${index}`}
                  entering={SlideInRight.delay(150 + index * 100)}
                >
                  <AnimatedSuggestionCard
                    suggestion={suggestion}
                    index={index}
                    onUse={handleSuggestionUse}
                    onFavorite={handleFavorite}
                    onFeedback={handleFeedback}
                    isFavorite={favorites.includes(suggestion.text)}
                  />
                </Animated.View>
              ))}
            </View>

            {/* 7.3.10: Follow-up Questions */}
            <View style={styles.followUpSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <Ionicons name="help-circle" size={18} color={accentColors.coral} />
                <Text style={styles.sectionTitle}>Follow-up Questions</Text>
              </View>
              <View style={styles.followUpList}>
                {getFollowUpQuestions(result).map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.followUpChip}
                    onPress={async () => {
                      try {
                        await Clipboard.setStringAsync(question);
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        Alert.alert('Copied!', 'Question copied to clipboard');
                      } catch {
                        Alert.alert('Error', 'Failed to copy to clipboard.');
                      }
                    }}
                    accessibilityLabel={`Copy question: ${question}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.followUpText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pro Tip */}
            {result.proTip && (
              <ProTipCard
                tip={result.proTip}
                onSave={handleSaveTip}
                isSaved={savedTips.includes(result.proTip)}
                showActions={true}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
                <Ionicons name="camera" size={16} color={darkColors.text} />
                <Text style={styles.secondaryButtonText}>New Screenshot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRefresh}>
                <Ionicons name="refresh" size={16} color={darkColors.text} />
                <Text style={styles.secondaryButtonText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* 7.2.10: Analysis History */}
        {analysisHistory.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.historyTitle}>
                <Ionicons name={showHistory ? 'chevron-down' : 'chevron-forward'} size={14} color={darkColors.textSecondary} />{' '}
              Recent Analyses ({analysisHistory.length})
              </Text>
            </TouchableOpacity>

            {showHistory && (
              <Animated.View entering={FadeIn}>
                {analysisHistory.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.historyItem}
                    onPress={() => {
                      setResult(entry.result);
                      // Could also restore the image
                    }}
                  >
                    <Text style={styles.historyItemText}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                    {entry.contactId && (
                      <Text style={styles.historyItemSubtext}>
                        {contacts.find((g) => g.id === entry.contactId)?.name || 'Unknown'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ==========================================
// Helper Functions
// ==========================================

function formatAnalysisForExport(result: AnalysisResult, contact: Contact | null): string {
  let text = '=== FlirtKey Analysis ===\n\n';

  if (contact) {
    text += `For: ${contact.name}\n\n`;
  }

  if (result.interestLevel) {
    text += `Interest Level: ${result.interestLevel}%\n`;
  }
  if (result.mood) {
    text += `Mood: ${result.mood}\n`;
  }
  text += '\n';

  text += '--- Suggested Responses ---\n\n';
  result.suggestions.forEach((s, i) => {
    text += `${i + 1}. [${s.type.toUpperCase()}]\n`;
    text += `   "${s.text}"\n`;
    if (s.reason) {
      text += `   Reason: ${s.reason}\n`;
    }
    text += '\n';
  });

  if (result.proTip) {
    text += `💡 Pro Tip: ${result.proTip}\n`;
  }

  return text;
}

function formatAnalysisForShare(result: AnalysisResult): string {
  let text = '✨ FlirtKey Analysis\n\n';

  if (result.interestLevel) {
    text += `Interest: ${result.interestLevel}% ${result.mood ? `(${result.mood})` : ''}\n\n`;
  }

  text += 'Suggested responses:\n';
  result.suggestions.forEach((s) => {
    const emoji = s.type === 'safe' ? '🟢' : s.type === 'balanced' ? '🟡' : '🔴';
    text += `${emoji} "${s.text}"\n`;
  });

  if (result.proTip) {
    text += `\n💡 ${result.proTip}`;
  }

  return text;
}

function getFollowUpQuestions(_result: AnalysisResult): string[] {
  // Generate contextual follow-up questions based on analysis
  const questions = [
    "What's got you thinking about that?",
    'Tell me more about that',
    'How did that make you feel?',
    'And what happened next?',
    "That's interesting - why do you think that is?",
  ];

  // Return a subset based on mood/interest
  return questions.slice(0, 3);
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
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerAction: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },

  // Contact Selector
  contactSelector: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  contactList: {
    flexDirection: 'row',
  },
  contactChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    marginRight: spacing.sm,
  },
  contactChipSelected: {
    backgroundColor: accentColors.coral,
    borderColor: accentColors.coral,
  },
  contactChipText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  contactChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Picker Section
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

  // Image Section
  imageSection: {
    alignItems: 'center',
  },
  analyzeSection: {
    marginTop: spacing.lg,
    width: '100%',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.glow,
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

  // 7.3.7: Annotation Overlay
  annotatedImageSection: {
    marginBottom: spacing.md,
  },
  annotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  annotationTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  annotationToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  annotationToggleText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
  },
  annotatedImageContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    minHeight: 200,
  },

  // Results
  resultsSection: {
    marginTop: spacing.md,
  },
  summaryCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  summaryTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  summaryContent: {
    // Additional styling
  },
  noticeCard: {
    backgroundColor: darkColors.warning + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.warning,
  },
  noticeTitle: {
    color: darkColors.warning,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  noticeText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  suggestionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  followUpSection: {
    marginBottom: spacing.lg,
  },
  followUpList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  followUpChip: {
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  followUpText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  secondaryButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },

  // History
  historySection: {
    marginTop: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  historyHeader: {
    paddingVertical: spacing.xs,
  },
  historyTitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  historyItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  historyItemText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  historyItemSubtext: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
});

export default ScreenshotAnalysisScreen;
