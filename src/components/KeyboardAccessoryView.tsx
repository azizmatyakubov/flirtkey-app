// 6.1.12 Keyboard accessory view
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  InputAccessoryView,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface KeyboardAccessoryProps {
  inputAccessoryViewID: string;
  onInsertEmoji: (emoji: string) => void;
  onInsertPhrase: (phrase: string) => void;
  onDismissKeyboard: () => void;
  relationshipStage?: string;
}

const COMMON_EMOJIS = ['😊', '😏', '😘', '🔥', '💕', '😂', '🙈', '💪', '🎉', '✨'];

const QUICK_PHRASES: Record<string, string[]> = {
  just_met: ['Nice to meet you!', 'Looking forward to chatting', "That's interesting!"],
  talking: ["haha you're funny", 'tell me more', 'what about you?'],
  flirting: ["you're cute", 'smooth talker', 'I like that'],
  dating: ['miss you', "can't wait to see you", 'thinking of you'],
  serious: ['love you', 'always here for you', 'you mean everything'],
};

export function KeyboardAccessoryView({
  inputAccessoryViewID,
  onInsertEmoji,
  onInsertPhrase,
  onDismissKeyboard,
  relationshipStage = 'talking',
}: KeyboardAccessoryProps) {
  const phrases =
    QUICK_PHRASES[relationshipStage as keyof typeof QUICK_PHRASES] ??
    QUICK_PHRASES['talking'] ??
    [];

  const handleEmojiPress = async (emoji: string) => {
    await Haptics.selectionAsync();
    onInsertEmoji(emoji);
  };

  const handlePhrasePress = async (phrase: string) => {
    await Haptics.selectionAsync();
    onInsertPhrase(phrase);
  };

  const content = (
    <View style={styles.container}>
      {/* Emoji row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.emojiRow}
        contentContainerStyle={styles.emojiContent}
      >
        {COMMON_EMOJIS.map((emoji, index) => (
          <TouchableOpacity
            key={`emoji-${index}`}
            onPress={() => handleEmojiPress(emoji)}
            style={styles.emojiButton}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick phrases row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.phraseRow}
        contentContainerStyle={styles.phraseContent}
      >
        {phrases.map((phrase, index) => (
          <TouchableOpacity
            key={`phrase-${index}`}
            onPress={() => handlePhrasePress(phrase)}
            style={styles.phraseButton}
          >
            <Text style={styles.phraseText}>{phrase}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Done button */}
      <TouchableOpacity onPress={onDismissKeyboard} style={styles.doneButton}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  // iOS uses InputAccessoryView
  if (Platform.OS === 'ios') {
    return <InputAccessoryView nativeID={inputAccessoryViewID}>{content}</InputAccessoryView>;
  }

  // Android: Return regular view (will be positioned above keyboard manually)
  return content;
}

// Wrapper component for Android that positions above keyboard
interface KeyboardAccessoryWrapperProps extends KeyboardAccessoryProps {
  visible: boolean;
}

export function KeyboardAccessoryWrapper({ visible, ...props }: KeyboardAccessoryWrapperProps) {
  if (Platform.OS === 'ios') {
    return <KeyboardAccessoryView {...props} />;
  }

  // Android: Only show when keyboard is visible
  if (!visible) return null;

  return (
    <View style={styles.androidWrapper}>
      <KeyboardAccessoryView {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.surface,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiRow: {
    maxWidth: '35%',
  },
  emojiContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  emojiButton: {
    padding: spacing.xs,
  },
  emoji: {
    fontSize: 22,
  },
  phraseRow: {
    flex: 1,
  },
  phraseContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  phraseButton: {
    backgroundColor: darkColors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  phraseText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
  },
  doneButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  doneText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  androidWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
