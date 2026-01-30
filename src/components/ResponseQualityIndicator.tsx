/**
 * ResponseQualityIndicator — Shows confidence level & tone for AI suggestions
 * Task 3: Response Quality UI
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { Suggestion } from '../types';

// ==========================================
// Types
// ==========================================

export type ToneType = 'flirty' | 'casual' | 'serious' | 'funny' | 'romantic' | 'confident';

interface ResponseQualityIndicatorProps {
  suggestion: Suggestion;
  /** Optional explicit confidence (0-100). Auto-derived if not provided. */
  confidence?: number;
  /** Optional explicit tone. Auto-derived if not provided. */
  tone?: ToneType;
  compact?: boolean;
}

// ==========================================
// Tone Detection (heuristic)
// ==========================================

const TONE_CONFIG: Record<ToneType, { emoji: string; color: string; label: string }> = {
  flirty: { emoji: '😏', color: '#ec4899', label: 'Flirty' },
  casual: { emoji: '😎', color: '#60A5FA', label: 'Casual' },
  serious: { emoji: '🤔', color: '#9CA3AF', label: 'Serious' },
  funny: { emoji: '😂', color: '#34D399', label: 'Funny' },
  romantic: { emoji: '❤️', color: '#F472B6', label: 'Romantic' },
  confident: { emoji: '💪', color: '#F59E0B', label: 'Confident' },
};

function detectTone(suggestion: Suggestion): ToneType {
  const text = suggestion.text.toLowerCase();
  const reason = suggestion.reason.toLowerCase();
  const combined = `${text} ${reason}`;

  // Check for humor indicators
  if (
    combined.includes('haha') ||
    combined.includes('lol') ||
    combined.includes('funny') ||
    combined.includes('joke') ||
    combined.includes('😂') ||
    combined.includes('🤣')
  ) {
    return 'funny';
  }

  // Check for romantic indicators
  if (
    combined.includes('miss') ||
    combined.includes('beautiful') ||
    combined.includes('gorgeous') ||
    combined.includes('love') ||
    combined.includes('heart') ||
    combined.includes('❤️') ||
    combined.includes('💕')
  ) {
    return 'romantic';
  }

  // Check for flirty indicators
  if (
    combined.includes('flirt') ||
    combined.includes('tease') ||
    combined.includes('playful') ||
    combined.includes('😏') ||
    combined.includes('😘') ||
    combined.includes('wink') ||
    suggestion.type === 'bold'
  ) {
    return 'flirty';
  }

  // Check for confident indicators
  if (
    combined.includes('confident') ||
    combined.includes('bold') ||
    combined.includes('direct') ||
    combined.includes('assertive')
  ) {
    return 'confident';
  }

  // Check for serious indicators
  if (
    combined.includes('serious') ||
    combined.includes('genuine') ||
    combined.includes('sincere') ||
    combined.includes('honest') ||
    combined.includes('deep')
  ) {
    return 'serious';
  }

  // Default based on suggestion type
  if (suggestion.type === 'safe') return 'casual';
  if (suggestion.type === 'balanced') return 'flirty';
  return 'confident';
}

function deriveConfidence(suggestion: Suggestion): number {
  let score = 70; // base confidence

  // Longer responses with reasons score higher
  if (suggestion.text.length > 40) score += 5;
  if (suggestion.text.length > 80) score += 5;
  if (suggestion.reason.length > 20) score += 5;

  // Type-based adjustments
  if (suggestion.type === 'balanced') score += 8;
  if (suggestion.type === 'safe') score += 5;

  // Cap at 98 (never 100% — keeps it realistic)
  return Math.min(score, 98);
}

// ==========================================
// Component
// ==========================================

function ResponseQualityIndicatorBase({
  suggestion,
  confidence: explicitConfidence,
  tone: explicitTone,
  compact = false,
}: ResponseQualityIndicatorProps) {
  const tone = useMemo(() => explicitTone ?? detectTone(suggestion), [suggestion, explicitTone]);
  const confidence = useMemo(
    () => explicitConfidence ?? deriveConfidence(suggestion),
    [suggestion, explicitConfidence]
  );

  const toneConfig = TONE_CONFIG[tone];

  const confidenceLabel = confidence >= 90 ? 'High' : confidence >= 70 ? 'Good' : 'Moderate';
  const confidenceColor = confidence >= 90 ? '#34D399' : confidence >= 70 ? '#60A5FA' : '#F59E0B';

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactToneEmoji}>{toneConfig.emoji}</Text>
        <Text style={[styles.compactToneLabel, { color: toneConfig.color }]}>
          {toneConfig.label}
        </Text>
        <View style={[styles.compactDot, { backgroundColor: confidenceColor }]} />
        <Text style={[styles.compactConfidence, { color: confidenceColor }]}>{confidence}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tone */}
      <View style={[styles.badge, { backgroundColor: `${toneConfig.color}15` }]}>
        <Text style={styles.badgeEmoji}>{toneConfig.emoji}</Text>
        <Text style={[styles.badgeLabel, { color: toneConfig.color }]}>{toneConfig.label}</Text>
      </View>

      {/* Confidence */}
      <View style={[styles.badge, { backgroundColor: `${confidenceColor}15` }]}>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${confidence}%`,
                backgroundColor: confidenceColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.badgeLabel, { color: confidenceColor }]}>
          {confidenceLabel} {confidence}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  confidenceBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.border,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactToneEmoji: {
    fontSize: 11,
  },
  compactToneLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  compactDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  compactConfidence: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});

export const ResponseQualityIndicator = memo(ResponseQualityIndicatorBase);
ResponseQualityIndicator.displayName = 'ResponseQualityIndicator';

export default ResponseQualityIndicator;
