/**
 * ProfileOptimizerScreen - Dating Profile Review & Analysis
 * Hour 2: Profile Optimizer
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  analyzeProfile,
  ProfileReview,
  ProfileSuggestion,
  PhotoSuggestion,
  saveReview,
  loadReviews,
  getScoreColor,
  getScoreLabel,
} from '../services/profileOptimizerService';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// Sub-components
// ==========================================

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <View style={[styles.scoreRing, { width: size, height: size, borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color, fontSize: size * 0.3 }]}>{score}</Text>
      <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const color = getScoreColor(score);

  return (
    <Animated.View entering={FadeInRight.delay(delay)} style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color }]}>{score}/100</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: ProfileSuggestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor =
    suggestion.priority === 'high'
      ? '#FF4757'
      : suggestion.priority === 'medium'
        ? '#FFBE76'
        : '#2ED573';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)}>
      <TouchableOpacity
        style={styles.suggestionCard}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
          <View style={styles.suggestionTitleRow}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={darkColors.textTertiary}
          />
        </View>
        <Text style={styles.suggestionDesc} numberOfLines={expanded ? undefined : 2}>
          {suggestion.description}
        </Text>
        {expanded && suggestion.example && (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example:</Text>
            <Text style={styles.exampleText}>{suggestion.example}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function PhotoChecklist({ suggestions }: { suggestions: PhotoSuggestion[] }) {
  return (
    <View style={styles.photoGrid}>
      {suggestions.map((ps, i) => (
        <Animated.View
          key={ps.type}
          entering={FadeInDown.delay(i * 60)}
          style={[styles.photoItem, ps.hasIt && styles.photoItemComplete]}
        >
          <Text style={styles.photoIcon}>{ps.icon}</Text>
          <Text style={styles.photoLabel}>{ps.label}</Text>
          {ps.hasIt ? (
            <Ionicons name="checkmark-circle" size={18} color="#2ED573" />
          ) : (
            <Ionicons name="add-circle-outline" size={18} color={darkColors.textTertiary} />
          )}
        </Animated.View>
      ))}
    </View>
  );
}

function PastReviewCard({ review, onPress }: { review: ProfileReview; onPress: () => void }) {
  const date = new Date(review.timestamp);
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const color = getScoreColor(review.score.overall);

  return (
    <TouchableOpacity style={styles.pastReviewCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.pastReviewScore, { borderColor: color }]}>
        <Text style={[styles.pastReviewScoreText, { color }]}>{review.score.overall}</Text>
      </View>
      <View style={styles.pastReviewInfo}>
        <Text style={styles.pastReviewDate}>{dateStr}</Text>
        <Text style={styles.pastReviewFeedback} numberOfLines={1}>
          {review.overallFeedback}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
    </TouchableOpacity>
  );
}

// ==========================================
// Main Screen
// ==========================================

type ViewMode = 'start' | 'analyzing' | 'results' | 'history';

interface Props {
  navigation?: { goBack: () => void };
}

export function ProfileOptimizerScreen({ navigation }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('start');
  const [review, setReview] = useState<ProfileReview | null>(null);
  const [pastReviews, setPastReviews] = useState<ProfileReview[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadReviews().then(setPastReviews);
  }, []);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setViewMode('analyzing');

    // Simulate analysis time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = analyzeProfile({
      hasBio: true,
      bioLength: Math.floor(Math.random() * 150) + 30,
      photoCount: Math.floor(Math.random() * 5) + 1,
      hasPrompts: Math.random() > 0.3,
    });

    if (selectedImage) {
      result.imageUri = selectedImage;
    }

    await saveReview(result);
    setReview(result);
    setPastReviews((prev) => [result, ...prev]);
    setViewMode('results');
  }, [selectedImage]);

  // ==========================================
  // Render: Start Screen
  // ==========================================

  if (viewMode === 'start') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📸 Profile Review</Text>
          <TouchableOpacity onPress={() => setViewMode('history')} style={styles.historyButton}>
            <Ionicons name="time-outline" size={22} color={darkColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.startContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100)} style={styles.uploadArea}>
            {selectedImage ? (
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                <View style={styles.changePhotoOverlay}>
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.changePhotoText}>Change</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.uploadPlaceholder}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={accentColors.coral} />
                <Text style={styles.uploadTitle}>Upload Profile Screenshot</Text>
                <Text style={styles.uploadDesc}>
                  Take a screenshot of your dating profile and upload it here
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              style={[styles.analyzeButton, !selectedImage && styles.analyzeButtonAlt]}
              onPress={handleAnalyze}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.analyzeButtonText}>
                {selectedImage ? 'Analyze My Profile' : 'Quick Analysis (No Photo)'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.featureGrid}>
            {[
              { icon: '📊', label: 'Score 1-100' },
              { icon: '📝', label: 'Bio Tips' },
              { icon: '📸', label: 'Photo Guide' },
              { icon: '💡', label: 'Improvements' },
            ].map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // Render: Analyzing
  // ==========================================

  if (viewMode === 'analyzing') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Animated.View entering={FadeIn} style={styles.analyzingContainer}>
          <Text style={styles.analyzingEmoji}>🔍</Text>
          <Text style={styles.analyzingTitle}>Analyzing your profile...</Text>
          <Text style={styles.analyzingDesc}>Checking bio, photos, and conversation starters</Text>
          <View style={styles.analyzingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} entering={FadeIn.delay(i * 300)} style={styles.analyzingDot} />
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  // ==========================================
  // Render: History
  // ==========================================

  if (viewMode === 'history') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('start')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Past Reviews</Text>
          <View style={{ width: 40 }} />
        </View>

        {pastReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyDesc}>Analyze your profile to see results here</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.historyList}>
            {pastReviews.map((r) => (
              <PastReviewCard
                key={r.id}
                review={r}
                onPress={() => {
                  setReview(r);
                  setViewMode('results');
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ==========================================
  // Render: Results
  // ==========================================

  if (!review) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setViewMode('start')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Results</Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedImage(null);
            setReview(null);
            setViewMode('start');
          }}
          style={styles.newReviewButton}
        >
          <Ionicons name="refresh" size={20} color={accentColors.coral} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Score */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.overallSection}>
          <ScoreRing score={review.score.overall} />
          <Text style={styles.overallFeedback}>{review.overallFeedback}</Text>
        </Animated.View>

        {/* Score Breakdown */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Score Breakdown</Text>
          <ScoreBar label="Bio Quality" score={review.score.bioQuality} delay={300} />
          <ScoreBar label="Photo Variety" score={review.score.photoVariety} delay={400} />
          <ScoreBar
            label="Conversation Starters"
            score={review.score.conversationStarters}
            delay={500}
          />
          <ScoreBar label="Overall Appeal" score={review.score.overallAppeal} delay={600} />
        </Animated.View>

        {/* Bio Feedback */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Bio Feedback</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{review.bioFeedback}</Text>
          </View>
        </Animated.View>

        {/* Photo Checklist */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photo Checklist</Text>
          <PhotoChecklist suggestions={review.photoSuggestions} />
        </Animated.View>

        {/* Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Improvement Tips</Text>
          {review.suggestions.map((s, i) => (
            <SuggestionCard key={s.id} suggestion={s} index={i} />
          ))}
        </View>
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: fonts.bold,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newReviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Start
  startContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  uploadArea: {
    marginBottom: spacing.lg,
  },
  uploadPlaceholder: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: darkColors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginTop: spacing.md,
    fontFamily: fonts.semiBold,
  },
  uploadDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  uploadedImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: accentColors.coral,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  analyzeButtonAlt: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: accentColors.coral,
  },
  analyzeButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2 - 1,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.medium,
  },
  // Analyzing
  analyzingContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  analyzingEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  analyzingTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.semiBold,
  },
  analyzingDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  analyzingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  analyzingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: accentColors.coral,
  },
  // Results
  resultsContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  overallSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  overallFeedback: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontFamily: fonts.regular,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: spacing.sm,
    fontFamily: fonts.semiBold,
  },
  // Score
  scoreRing: {
    borderRadius: 999,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surface,
  },
  scoreNumber: {
    fontWeight: '800',
    fontFamily: fonts.extraBold,
  },
  scoreLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },
  // Score Bars
  scoreBarContainer: {
    marginBottom: spacing.sm,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreBarLabel: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  scoreBarValue: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: darkColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Feedback
  feedbackCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  feedbackText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  // Photo Grid
  photoGrid: {
    gap: spacing.sm,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.sm,
  },
  photoItemComplete: {
    borderColor: '#2ED573' + '44',
    backgroundColor: '#2ED573' + '08',
  },
  photoIcon: {
    fontSize: 22,
  },
  photoLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#FFF',
    fontFamily: fonts.medium,
  },
  // Suggestions
  suggestionCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  exampleBox: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  exampleLabel: {
    fontSize: fontSizes.xs,
    color: accentColors.coral,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  exampleText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },
  // Past Reviews
  historyList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  pastReviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.sm,
  },
  pastReviewScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.background,
  },
  pastReviewScoreText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  pastReviewInfo: {
    flex: 1,
  },
  pastReviewDate: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    marginBottom: 2,
    fontFamily: fonts.regular,
  },
  pastReviewFeedback: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.semiBold,
  },
  emptyDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
