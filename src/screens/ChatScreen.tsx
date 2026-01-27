import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Keyboard,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../stores/useStore';
import { generateResponse, analyzeScreenshotLegacy } from '../services/ai';
import { AnalysisResult, Suggestion } from '../types';
import {
  CharacterCount,
  QuickPhrases,
  TypingIndicator,
  LoadingShimmer,
  AnimatedSuggestionCard,
  InterestLevelDisplay,
  ProTipCard,
  ConversationContext,
  LastTopicIndicator,
} from '../components';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

const MAX_INPUT_LENGTH = 500;

interface SuggestionUsage {
  [key: string]: number;
}

interface FavoriteSuggestion {
  text: string;
  type: Suggestion['type'];
  savedAt: number;
}

export function ChatScreen({ navigation }: any) {
  const {
    selectedGirl,
    apiKey,
    updateGirl,
    userCulture,
    addConversation,
    getConversationsForGirl,
  } = useStore();

  // State
  const [herMessage, setHerMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [previousInterestLevel, setPreviousInterestLevel] = useState<number | undefined>();
  const [, setSuggestionUsage] = useState<SuggestionUsage>({});
  const [favorites, setFavorites] = useState<FavoriteSuggestion[]>([]);
  const [savedTips, setSavedTips] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Button animation style (must be before early return - hooks rules)
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Keyboard handling (6.1.14)
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Load previous interest level
  useEffect(() => {
    if (selectedGirl) {
      const history = getConversationsForGirl(selectedGirl.id);
      if (history.length > 0) {
        const firstEntry = history[0];
        if (firstEntry?.interestLevel) {
          setPreviousInterestLevel(firstEntry.interestLevel);
        }
      }
    }
  }, [selectedGirl, getConversationsForGirl]);

  if (!selectedGirl) {
    return (
      <View style={styles.container}>
        <Text style={styles.noGirl}>Select someone first</Text>
      </View>
    );
  }

  // Handle generate (with haptics - 6.1.13)
  const handleGenerate = async () => {
    if (!herMessage.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Enter her message first!');
      return;
    }
    if (!apiKey) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Set up API key in Settings first');
      return;
    }

    // Haptic feedback on button press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await generateResponse(apiKey, selectedGirl, herMessage, userCulture);
      setResult(response);

      // Store previous interest level for trend
      if (result?.interestLevel) {
        setPreviousInterestLevel(result.interestLevel);
      }

      // Update girl data
      updateGirl(selectedGirl.id, {
        messageCount: selectedGirl.messageCount + 1,
        lastTopic: herMessage.substring(0, 100),
        lastMessageDate: new Date().toISOString(),
      });

      // Add to conversation history
      addConversation({
        girlId: selectedGirl.id,
        herMessage: herMessage,
        suggestions: response.suggestions,
        proTip: response.proTip,
        interestLevel: response.interestLevel,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Scroll to results
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Error', errorMessage);
    }
    setLoading(false);
  };

  // Handle screenshot
  const handleScreenshot = async () => {
    if (!apiKey) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Set up API key in Settings first');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset?.base64) {
        setLoading(true);
        try {
          const response = await analyzeScreenshotLegacy(
            apiKey,
            asset.base64,
            selectedGirl,
            userCulture
          );
          setResult(response);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: unknown) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to analyze screenshot';
          Alert.alert('Error', errorMessage);
        }
        setLoading(false);
      }
    }
  };

  // Handle pull to refresh (6.1.15)
  const handleRefresh = async () => {
    if (!herMessage.trim() || !apiKey) return;
    setRefreshing(true);
    await handleGenerate();
    setRefreshing(false);
  };

  // Handle quick phrase selection (6.1.9)
  const handleQuickPhrase = (phrase: string) => {
    setHerMessage(prev => prev ? `${prev} ${phrase}` : phrase);
    inputRef.current?.focus();
  };

  // Track suggestion usage (6.2.9)
  const handleSuggestionUse = (suggestion: Suggestion) => {
    setSuggestionUsage(prev => ({
      ...prev,
      [suggestion.type]: (prev[suggestion.type] || 0) + 1,
    }));
  };

  // Handle favorite (6.2.11)
  const handleFavorite = (suggestion: Suggestion) => {
    const exists = favorites.some(f => f.text === suggestion.text);
    if (exists) {
      setFavorites(prev => prev.filter(f => f.text !== suggestion.text));
    } else {
      setFavorites(prev => [
        ...prev,
        { text: suggestion.text, type: suggestion.type, savedAt: Date.now() },
      ]);
    }
  };

  // Handle feedback (6.2.16)
  const handleFeedback = (_suggestion: Suggestion, positive: boolean) => {
    // In a full implementation, this would send to analytics/backend
    // Could track: _suggestion.type, _suggestion.text for analytics
    const message = positive
      ? 'Thanks for the feedback! 👍'
      : "We'll try to do better next time!";
    Alert.alert('Feedback recorded', message);
  };

  // Save pro tip (6.4.5)
  const handleSaveTip = (tip: string) => {
    if (!savedTips.includes(tip)) {
      setSavedTips(prev => [...prev, tip]);
    }
  };

  // Check if suggestion is favorite
  const isFavorite = (suggestion: Suggestion) =>
    favorites.some(f => f.text === suggestion.text);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{selectedGirl.name}</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('GirlProfile');
            }}
          >
            <Text style={styles.editProfile}>Edit Profile →</Text>
          </TouchableOpacity>
          {/* Last Topic Indicator (6.1.17) */}
          <LastTopicIndicator topic={selectedGirl.lastTopic} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkColors.primary}
            colors={[darkColors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Conversation Context Toggle (6.1.16) */}
        <TouchableOpacity
          style={styles.contextToggle}
          onPress={() => setShowContext(!showContext)}
        >
          <Text style={styles.contextToggleText}>
            {showContext ? '▼ Hide context' : '▶ Show conversation context'}
          </Text>
        </TouchableOpacity>

        {showContext && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <ConversationContext girl={selectedGirl} />
          </Animated.View>
        )}

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>What did she say?</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Paste her message here..."
            placeholderTextColor="#666"
            value={herMessage}
            onChangeText={setHerMessage}
            multiline
            maxLength={MAX_INPUT_LENGTH}
          />

          {/* Character Count (6.1.8) */}
          <CharacterCount current={herMessage.length} max={MAX_INPUT_LENGTH} />

          {/* Quick Phrases (6.1.9) */}
          {!keyboardVisible && (
            <QuickPhrases
              onSelect={handleQuickPhrase}
              relationshipStage={selectedGirl.relationshipStage}
            />
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <Animated.View style={[styles.generateButtonWrapper, buttonAnimatedStyle]}>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerate}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <TypingIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>✨ Generate Replies</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.screenshotButton}
              onPress={handleScreenshot}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.screenshotButtonText}>📸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State with Shimmer (6.5.3) */}
        {loading && !result && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <LoadingShimmer />
          </Animated.View>
        )}

        {/* Results */}
        {result && !loading && (
          <Animated.View
            entering={SlideInDown.springify()}
            style={styles.results}
          >
            {/* Interest Level (6.3.4-6.3.10) */}
            {result.interestLevel && (
              <InterestLevelDisplay
                level={result.interestLevel}
                previousLevel={previousInterestLevel}
                mood={result.mood}
                showTrend={true}
                showVibeCheck={true}
              />
            )}

            {/* Animated Suggestions (6.5.2) */}
            {result.suggestions.map((suggestion, index) => (
              <AnimatedSuggestionCard
                key={`${suggestion.type}-${index}`}
                suggestion={suggestion}
                index={index}
                onUse={handleSuggestionUse}
                onFavorite={handleFavorite}
                onFeedback={handleFeedback}
                isFavorite={isFavorite(suggestion)}
              />
            ))}

            {/* Pro Tip (6.4.1-6.4.7) */}
            {result.proTip && (
              <ProTipCard
                tip={result.proTip}
                onSave={handleSaveTip}
                isSaved={savedTips.includes(result.proTip)}
                showActions={true}
              />
            )}
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  noGirl: {
    color: darkColors.text,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: darkColors.surface,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
  },
  headerInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  headerName: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  editProfile: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contextToggle: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  contextToggleText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
  },
  inputSection: {
    padding: spacing.lg,
  },
  label: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  generateButtonWrapper: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: darkColors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  screenshotButton: {
    backgroundColor: darkColors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  screenshotButtonText: {
    fontSize: 20,
  },
  results: {
    padding: spacing.lg,
    paddingTop: 0,
  },
});
