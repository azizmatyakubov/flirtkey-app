import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { darkColors, accentColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface QuickPhrasesProps {
  onSelect: (phrase: string) => void;
  relationshipStage?: string;
}

const QUICK_PHRASES: Record<string, string[]> = {
  just_met: [
    "Hey! I saw your message...",
    "That's interesting! Tell me more",
    "Haha no way! 😄",
    "I'm curious about...",
  ],
  talking: [
    "That reminds me of...",
    "What are you up to?",
    "I was just thinking about...",
    "Wanna hear something funny?",
  ],
  flirting: [
    "You're making me smile 😊",
    "I can't stop thinking about...",
    "When are we gonna...",
    "I have an idea...",
  ],
  dating: [
    "Miss you already",
    "Can't wait to see you",
    "Remember when we...",
    "I have a surprise...",
  ],
  serious: [
    "I love how you...",
    "You make me so happy",
    "Let's talk about...",
    "I was thinking we could...",
  ],
};

const UNIVERSAL_PHRASES = [
  "Hey! 👋",
  "That's cool!",
  "Tell me more",
  "😂",
  "Really?",
  "Sounds fun!",
];

export function QuickPhrases({ onSelect, relationshipStage = 'just_met' }: QuickPhrasesProps) {
  const stagePhrases = QUICK_PHRASES[relationshipStage] ?? QUICK_PHRASES['just_met'] ?? [];
  const allPhrases = [...stagePhrases, ...UNIVERSAL_PHRASES];

  const handleSelect = async (phrase: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(phrase);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick phrases:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allPhrases.map((phrase, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => handleSelect(phrase)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{phrase}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    marginBottom: spacing.xs,
  },
  scrollContent: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: `${accentColors.coral}12`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: `${accentColors.coral}30`,
  },
  chipText: {
    color: accentColors.coral,
    fontSize: fontSizes.sm,
  },
});
