/**
 * ToneSelector Component
 * Phase 1.1: Horizontal scrollable row of tone buttons
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { TONES, TONE_KEYS, type ToneKey } from '../constants/tones';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

interface ToneSelectorProps {
  selectedTone?: ToneKey;
  onSelectTone: (tone: ToneKey | undefined) => void;
  compact?: boolean;
}

export const ToneSelector = React.memo(function ToneSelector({ selectedTone, onSelectTone, compact = false }: ToneSelectorProps) {
  const handlePress = (tone: ToneKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Toggle off if already selected
    if (selectedTone === tone) {
      onSelectTone(undefined);
    } else {
      onSelectTone(tone);
    }
  };

  return (
    <View style={styles.container}>
      {!compact && <Text style={styles.label}>Tone</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TONE_KEYS.map((key) => {
          const tone = TONES[key];
          const isSelected = selectedTone === key;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.toneButton,
                compact && styles.toneButtonCompact,
                isSelected && styles.toneButtonSelected,
              ]}
              onPress={() => handlePress(key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Tone: ${tone.name}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.toneEmoji, compact && styles.toneEmojiCompact]}>
                {tone.emoji}
              </Text>
              <Text
                style={[
                  styles.toneName,
                  compact && styles.toneNameCompact,
                  isSelected && styles.toneNameSelected,
                ]}
              >
                {tone.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.xs,
  },
  toneButtonCompact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  toneButtonSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.primary + '20',
  },
  toneEmoji: {
    fontSize: 16,
  },
  toneEmojiCompact: {
    fontSize: 14,
  },
  toneName: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  toneNameCompact: {
    fontSize: fontSizes.xs,
  },
  toneNameSelected: {
    color: darkColors.primary,
    fontWeight: '600',
  },
});

export default ToneSelector;
