/**
 * QuickReplyScreen - Phase 4: Clipboard/Share Workflow MVP
 *
 * Fastest path: her message → suggestion → clipboard → paste back.
 * Designed for under 10 seconds: paste → pick tone → get reply → copy → done.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../stores/useStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { ToneSelector } from '../components/ToneSelector';
import { Girl } from '../types';
import { generateFlirtResponse } from '../services/ai';
import type { ToneKey } from '../constants/tones';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickReply'>;

export function QuickReplyScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { girls, selectedGirl, selectGirl, userCulture, apiKey } = useStore();
  const { preferences, accessibility } = useSettingsStore();

  const [herMessage, setHerMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneKey | undefined>(
    preferences.defaultTone as ToneKey
  );
  const [pickedGirl, setPickedGirl] = useState<Girl | null>(selectedGirl);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Only auto-detect clipboard if the user has the preference enabled
  useEffect(() => {
    if (preferences.autoClipboard) {
      checkClipboard();
    }
  }, []);

  const checkClipboard = async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (hasString) {
        const text = await Clipboard.getStringAsync();
        // Only pre-fill if it looks like a message (3-500 chars, no URLs)
        if (
          text &&
          text.length >= 3 &&
          text.length <= 500 &&
          !text.startsWith('http') &&
          !text.includes('flirtkey://')
        ) {
          setHerMessage(text);
        }
      }
    } catch {
      // Clipboard access denied — no big deal
    }
  };

  const handleGetReply = useCallback(async () => {
    if (!herMessage.trim()) return;
    if (!apiKey) {
      setError('Set up your API key in Settings first');
      return;
    }

    // Check subscription limit (same as ChatScreen)
    const { canUseSuggestion } = useSubscriptionStore.getState();
    if (!canUseSuggestion()) {
      navigation.navigate('Paywall');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    // Build a placeholder girl if none picked — include all fields downstream code may access
    const girl: Girl = pickedGirl ?? {
      id: 0,
      name: 'Someone new',
      relationshipStage: 'just_met',
      messageCount: 0,
      avatar: undefined,
      nickname: undefined,
      interests: undefined,
      personality: undefined,
      howMet: undefined,
      lastTopic: undefined,
      lastMessageDate: undefined,
    };

    try {
      const result = await generateFlirtResponse({
        herMessage: herMessage.trim(),
        girl,
        userCulture: userCulture,
        apiKey,
        tone: selectedTone,
      });

      if (result && result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions.map((s) => s.text));
        // Record subscription usage (same as ChatScreen)
        const subStore = useSubscriptionStore.getState();
        subStore.recordSuggestionUse();
      } else {
        setError('No suggestions generated. Try a different message.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [herMessage, pickedGirl, selectedTone, userCulture, apiKey]);

  const handleCopySuggestion = async (text: string, index: number) => {
    try {
      await Clipboard.setStringAsync(text);
      if (accessibility.hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard error
    }
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>⚡ Quick Reply</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Her message input */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Her message</Text>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Paste her message here..."
          placeholderTextColor={theme.colors.textTertiary}
          value={herMessage}
          onChangeText={setHerMessage}
          multiline
          maxLength={500}
          autoFocus={!herMessage}
          returnKeyType="done"
          blurOnSubmit
        />

        {/* Girl picker */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Who is she?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.girlPicker}
          contentContainerStyle={styles.girlPickerContent}
        >
          <TouchableOpacity
            style={[
              styles.girlChip,
              {
                backgroundColor: !pickedGirl ? theme.colors.primary + '20' : theme.colors.surface,
                borderColor: !pickedGirl ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setPickedGirl(null)}
          >
            <Text
              style={[
                styles.girlChipText,
                { color: !pickedGirl ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              🆕 New person
            </Text>
          </TouchableOpacity>
          {girls.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.girlChip,
                {
                  backgroundColor:
                    pickedGirl?.id === g.id ? theme.colors.primary + '20' : theme.colors.surface,
                  borderColor: pickedGirl?.id === g.id ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => {
                setPickedGirl(g);
                selectGirl(g);
              }}
            >
              <Text
                style={[
                  styles.girlChipText,
                  {
                    color:
                      pickedGirl?.id === g.id ? theme.colors.primary : theme.colors.textSecondary,
                  },
                ]}
              >
                {g.avatar || '👩'} {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tone selector */}
        <ToneSelector selectedTone={selectedTone} onSelectTone={setSelectedTone} compact />

        {/* Get Reply button */}
        <TouchableOpacity
          style={[
            styles.getReplyBtn,
            {
              backgroundColor: herMessage.trim() ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={handleGetReply}
          disabled={!herMessage.trim() || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.getReplyText}>🚀 Get Reply</Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Tap to copy 👇
            </Text>
            {suggestions.map((text, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.suggestionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: copiedIndex === i ? theme.colors.success : theme.colors.border,
                  },
                ]}
                onPress={() => handleCopySuggestion(text, i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{text}</Text>
                <Text
                  style={[
                    styles.copyHint,
                    {
                      color: copiedIndex === i ? theme.colors.success : theme.colors.textTertiary,
                    },
                  ]}
                >
                  {copiedIndex === i ? '✅ Copied! Go paste it 📋' : 'Tap to copy'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  closeBtn: {
    fontSize: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  girlPicker: {
    marginBottom: 4,
  },
  girlPickerContent: {
    gap: 8,
    paddingVertical: 4,
  },
  girlChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  girlChipText: {
    fontSize: 14,
  },
  getReplyBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  getReplyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  copyHint: {
    fontSize: 12,
    textAlign: 'right',
  },
});

export default QuickReplyScreen;
