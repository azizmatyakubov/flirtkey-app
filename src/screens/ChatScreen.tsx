import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../stores/useStore';
import { generateResponse } from '../services/ai';
import { AnalysisResult, Suggestion } from '../types';
import { CharacterCount } from '../components/CharacterCount';
import { QuickPhrases } from '../components/QuickPhrases';
import { TypingIndicator } from '../components/TypingIndicator';
// LoadingShimmer replaced with custom loading state
import { AnimatedSuggestionCard } from '../components/AnimatedSuggestionCard';
import { InterestLevelDisplay } from '../components/InterestLevelDisplay';
import { ProTipCard } from '../components/ProTipCard';
import { ConversationContext, LastTopicIndicator } from '../components/ConversationContext';
// New Phase 6 components
import { PasteDetector, useClipboardDetection } from '../components/PasteDetector';
import { KeyboardAccessoryWrapper } from '../components/KeyboardAccessoryView';
// QuickActionShortcuts and SwipeableSuggestions removed from default view
import { SuggestionEditor } from '../components/SuggestionEditor';
import { SuggestionHistory } from '../components/SuggestionHistory';
import { RegenerateButton } from '../components/SuggestionRegenerate';
// shareSuggestion available via suggestion card actions
import { InterestLevelChart } from '../components/InterestLevelChart';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { useOrientation } from '../hooks/useOrientation';
import { darkColors, fontSizes, spacing, borderRadius, accentColors, shadows } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { RootNavigationProp } from '../types/navigation';

const MAX_INPUT_LENGTH = 500;
const INPUT_ACCESSORY_ID = 'chat-input-accessory';
const LOADING_TEXTS = [
  'Reading between the lines...',
  'Crafting the perfect response...',
  'Almost there...',
];

interface SuggestionUsage {
  [key: string]: number;
}

interface FavoriteSuggestion {
  text: string;
  type: Suggestion['type'];
  savedAt: number;
}

export function ChatScreen({ navigation }: { navigation: RootNavigationProp }) {
  const {
    selectedGirl,
    apiKey,
    updateGirl,
    userCulture,
    addConversation,
    getConversationsForGirl,
    selectSuggestion,
    getLastConversationForGirl,
  } = useStore();

  // Orientation support (6.1.19, 6.1.20)
  const { isLandscape, isSplitScreen } = useOrientation();

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

  // New state for Phase 6 features
  const [showHistory, setShowHistory] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Paste detection (6.1.11)
  const {
    clipboardContent,
    showPrompt: showPastePrompt,
    dismissPrompt: dismissPastePrompt,
  } = useClipboardDetection(!keyboardVisible);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);
  const lastGenerateRef = useRef<number>(0);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Button animation style
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Get conversation history
  const conversationHistory = selectedGirl ? getConversationsForGirl(selectedGirl.id) : [];

  // Cleanup mounted ref on unmount (prevents state updates after unmount)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Loading text rotation
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

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
      <View style={[styles.container, styles.noGirlContainer]}>
        <Ionicons name="person-outline" size={48} color={darkColors.textSecondary} />
        <Text style={styles.noGirl}>Select someone first</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.noGirlButton}
          accessibilityLabel="Go to home screen"
          accessibilityRole="button"
        >
          <Text style={styles.noGirlButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle generate (with haptics - 6.1.13)
  const handleGenerate = useCallback(async () => {
    if (!selectedGirl) return;

    // Debounce rapid taps (min 1s between generates)
    const now = Date.now();
    if (now - lastGenerateRef.current < 1000) return;
    lastGenerateRef.current = now;

    if (!herMessage.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Enter her message first!');
      return;
    }
    if (!apiKey) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('No API Key', 'Please set up your OpenAI API key in Settings, or add OPENAI_API_KEY to your .env file.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await generateResponse(apiKey, selectedGirl, herMessage, userCulture);

      // Guard against state updates after unmount (e.g., rotation mid-generation)
      if (!isMountedRef.current) return;

      if (!response || !response.suggestions || response.suggestions.length === 0) {
        Alert.alert('Empty Response', 'AI returned an empty response. Try rephrasing your message.');
        setLoading(false);
        return;
      }

      setResult(response);

      if (response.interestLevel) {
        setPreviousInterestLevel(response.interestLevel);
      }

      updateGirl(selectedGirl.id, {
        lastTopic: herMessage.substring(0, 100),
        lastMessageDate: new Date().toISOString(),
      });

      addConversation({
        girlId: selectedGirl.id,
        herMessage: herMessage,
        suggestions: response.suggestions,
        proTip: response.proTip,
        interestLevel: response.interestLevel,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      setTimeout(() => {
        if (isMountedRef.current) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 300);
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

      // Classify error for user-friendly message
      let errorMessage = 'Something went wrong. Please try again.';
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as { code: string; message: string };
        switch (apiError.code) {
          case 'NETWORK_ERROR':
            errorMessage = '📡 No internet connection. Check your network and try again.';
            break;
          case 'TIMEOUT':
            errorMessage = '⏰ Request took too long. Try again or use a shorter message.';
            break;
          case 'RATE_LIMITED':
            errorMessage = '🐌 Too many requests. Wait a moment and try again.';
            break;
          case 'INVALID_API_KEY':
            errorMessage = '🔑 API key is invalid. Update it in Settings.';
            break;
          case 'INSUFFICIENT_QUOTA':
            errorMessage = '💸 OpenAI quota exceeded. Check your billing at platform.openai.com.';
            break;
          default:
            errorMessage = apiError.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedGirl, herMessage, apiKey, userCulture, buttonScale, updateGirl, addConversation]);

  // Handle regeneration (6.2.13)
  const handleRegenerate = useCallback(async (type?: Suggestion['type']) => {
    if (!selectedGirl || !herMessage.trim() || !apiKey) return;
    setLoading(true);

    try {
      const response = await generateResponse(apiKey, selectedGirl, herMessage, userCulture);

      if (!isMountedRef.current) return;

      if (type && result) {
        // Replace only specific suggestion type
        const newSuggestions = result.suggestions.map((s) =>
          s.type === type ? response.suggestions.find((ns) => ns.type === type) || s : s
        );
        setResult({ ...result, suggestions: newSuggestions });
      } else {
        setResult(response);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      if (!isMountedRef.current) return;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Error', 'Failed to regenerate suggestions. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedGirl, herMessage, apiKey, userCulture, result]);

  // Handle screenshot
  const handleScreenshot = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ScreenshotAnalysis', {
      girlId: selectedGirl?.id,
    });
  }, [navigation, selectedGirl?.id]);

  // Handle pull to refresh (6.1.15)
  const handleRefresh = useCallback(async () => {
    if (!herMessage.trim() || !apiKey) return;
    setRefreshing(true);
    try {
      await handleGenerate();
    } catch {
      // Errors handled inside handleGenerate
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [herMessage, apiKey, handleGenerate]);

  // Handle quick phrase selection (6.1.9)
  const handleQuickPhrase = useCallback((phrase: string) => {
    setHerMessage((prev) => (prev ? `${prev} ${phrase}` : phrase));
    inputRef.current?.focus();
  }, []);

  // Handle paste detection (6.1.11)
  const handlePasteDetected = useCallback((text: string) => {
    setHerMessage(text);
  }, []);

  // Handle keyboard accessory insert (6.1.12)
  const handleInsertEmoji = useCallback((emoji: string) => {
    setHerMessage((prev) => prev + emoji);
  }, []);

  const handleInsertPhrase = useCallback((phrase: string) => {
    setHerMessage((prev) => (prev ? `${prev} ${phrase}` : phrase));
  }, []);

  // Track suggestion usage (6.2.9)
  const handleSuggestionUse = useCallback((suggestion: Suggestion) => {
    setSuggestionUsage((prev) => ({
      ...prev,
      [suggestion.type]: (prev[suggestion.type] || 0) + 1,
    }));
  }, []);

  // Handle favorite (6.2.11)
  const handleFavorite = useCallback((suggestion: Suggestion) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.text === suggestion.text);
      if (exists) {
        return prev.filter((f) => f.text !== suggestion.text);
      }
      return [
        ...prev,
        { text: suggestion.text, type: suggestion.type, savedAt: Date.now() },
      ];
    });
  }, []);

  // Handle edit suggestion (6.2.12)
  const handleEditSuggestion = useCallback((suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
  }, []);

  // Handle reuse from history (6.2.14)
  const handleReuseSuggestion = useCallback((suggestion: Suggestion) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestions: [...prev.suggestions, suggestion],
      };
    });
  }, []);

  // Handle feedback (6.2.16)
  const handleFeedback = useCallback((_suggestion: Suggestion, positive: boolean) => {
    const message = positive ? 'Thanks for the feedback! 👍' : "We'll try to do better next time!";
    Alert.alert('Feedback recorded', message);
  }, []);

  // Handle "Send This" — mark selected suggestion & copy to clipboard
  const handleSendThis = useCallback((suggestion: Suggestion) => {
    if (!selectedGirl) return;
    const lastConvo = getLastConversationForGirl(selectedGirl.id);
    if (lastConvo) {
      selectSuggestion(lastConvo.id, suggestion);
    }
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [selectedGirl, getLastConversationForGirl, selectSuggestion]);

  // Save pro tip (6.4.5)
  const handleSaveTip = useCallback((tip: string) => {
    setSavedTips((prev) => {
      if (prev.includes(tip)) return prev;
      return [...prev, tip];
    });
  }, []);

  // Check if suggestion is favorite
  const isFavorite = useCallback((suggestion: Suggestion) => favorites.some((f) => f.text === suggestion.text), [favorites]);

  // Responsive styles for landscape/split-screen (6.1.19, 6.1.20)
  const containerStyle = [
    styles.container,
    isLandscape && !isSplitScreen && styles.containerLandscape,
    isSplitScreen && styles.containerSplitScreen,
  ];

  const inputSectionStyle = [
    styles.inputSection,
    isLandscape && !isSplitScreen && styles.inputSectionLandscape,
  ];

  return (
    <KeyboardAvoidingView
      style={containerStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Paste Detection Prompt (6.1.11) */}
      <PasteDetector
        currentValue={herMessage}
        onPasteDetected={handlePasteDetected}
        show={showPastePrompt}
        onDismiss={dismissPastePrompt}
        clipboardContent={clipboardContent}
      />

      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, isSplitScreen && styles.headerCompact]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            navigation.goBack();
          }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{selectedGirl.name}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate({ name: 'GirlProfile', params: {} });
              }}
              accessibilityLabel={`Edit ${selectedGirl.name}'s profile`}
              accessibilityRole="button"
            >
              <Text style={styles.editProfile}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <LastTopicIndicator topic={selectedGirl.lastTopic} />
        </View>
        <TouchableOpacity
          onPress={() => setShowContextMenu(!showContextMenu)}
          style={styles.menuButton}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Context Menu */}
      {showContextMenu && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.contextMenu}>
          <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setShowHistory(true); setShowContextMenu(false); }}>
            <Ionicons name="time-outline" size={18} color={darkColors.text} />
            <Text style={styles.contextMenuText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contextMenuItem} onPress={() => { navigation.navigate('ChatHistory', { girlId: selectedGirl.id }); setShowContextMenu(false); }}>
            <Ionicons name="chatbubbles-outline" size={18} color={darkColors.text} />
            <Text style={styles.contextMenuText}>Chat Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setShowContext(!showContext); setShowContextMenu(false); }}>
            <Ionicons name="information-circle-outline" size={18} color={darkColors.text} />
            <Text style={styles.contextMenuText}>{showContext ? 'Hide Context' : 'Show Context'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contextMenuItem} onPress={() => { navigation.navigate({ name: 'GirlProfile', params: {} }); setShowContextMenu(false); }}>
            <Ionicons name="person-outline" size={18} color={darkColors.text} />
            <Text style={styles.contextMenuText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
        {/* Conversation Context (toggled from menu) */}
        {showContext && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <ConversationContext girl={selectedGirl} />
          </Animated.View>
        )}

        {/* Input Section */}
        <View style={inputSectionStyle}>
          <Text style={styles.label}>WHAT DID SHE SAY?</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, inputFocused && styles.inputFocused]}
            placeholder="Paste her message here..."
            placeholderTextColor={darkColors.textTertiary}
            value={herMessage}
            onChangeText={setHerMessage}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            multiline
            maxLength={MAX_INPUT_LENGTH}
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
            accessibilityLabel="Enter her message"
            accessibilityHint="Paste or type the message she sent you"
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
                onPress={handleGenerate}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityLabel={loading ? 'Generating replies...' : 'Get perfect replies'}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading, busy: loading }}
              >
                <LinearGradient
                  colors={[accentColors.gradientStart, accentColors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.generateButton}
                >
                  {loading ? (
                    <TypingIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.generateButtonText}>✨ Get Perfect Replies</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.screenshotButton}
              onPress={handleScreenshot}
              disabled={loading}
              activeOpacity={0.7}
              accessibilityLabel="Analyze screenshot"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              <Ionicons name="camera-outline" size={22} color={accentColors.rose} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State */}
        {loading && !result && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingContainer}>
            <LinearGradient
              colors={[accentColors.gradientStart + '40', accentColors.gradientEnd + '40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loadingCircle}
            >
              <Ionicons name="heart" size={32} color={accentColors.rose} />
            </LinearGradient>
            <Text style={styles.loadingText}>{LOADING_TEXTS[loadingTextIndex]}</Text>
          </Animated.View>
        )}

        {/* Results */}
        {result && !loading && (
          <Animated.View entering={SlideInDown.springify()} style={styles.results}>
            {/* Regenerate */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Suggestions</Text>
              <RegenerateButton onRegenerate={handleRegenerate} disabled={loading} compact />
            </View>

            {/* Interest Level (6.3.4-6.3.10) */}
            {result.interestLevel && (
              <>
                <InterestLevelDisplay
                  level={result.interestLevel}
                  previousLevel={previousInterestLevel}
                  mood={result.mood}
                  showTrend={true}
                  showVibeCheck={true}
                />

                {/* Chart Toggle (6.3.7) */}
                <TouchableOpacity
                  onPress={() => setShowChart(!showChart)}
                  style={styles.chartToggle}
                >
                  <Ionicons name={showChart ? 'chevron-down' : 'bar-chart-outline'} size={14} color={accentColors.rose} />
                  <Text style={styles.chartToggleText}>
                    {showChart ? 'Hide trend chart' : 'Show trend chart'}
                  </Text>
                </TouchableOpacity>

                {showChart && conversationHistory.length >= 2 && (
                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <InterestLevelChart history={conversationHistory} />
                  </Animated.View>
                )}
              </>
            )}

            {/* Suggestions List with staggered entrance */}
            {result.suggestions.map((suggestion, index) => (
              <Animated.View
                key={`${suggestion.type}-${index}`}
                entering={SlideInDown.delay(index * 200).springify()}
              >
                <AnimatedSuggestionCard
                  suggestion={suggestion}
                  index={index}
                  onUse={handleSuggestionUse}
                  onSendThis={handleSendThis}
                  onFavorite={handleFavorite}
                  onEdit={handleEditSuggestion}
                  onFeedback={handleFeedback}
                  isFavorite={isFavorite(suggestion)}
                />
              </Animated.View>
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

      {/* Keyboard Accessory View (6.1.12) */}
      <KeyboardAccessoryWrapper
        inputAccessoryViewID={INPUT_ACCESSORY_ID}
        onInsertEmoji={handleInsertEmoji}
        onInsertPhrase={handleInsertPhrase}
        onDismissKeyboard={() => Keyboard.dismiss()}
        relationshipStage={selectedGirl.relationshipStage}
        visible={keyboardVisible && Platform.OS === 'android'}
      />

      {/* Suggestion Editor Modal (6.2.12) */}
      <SuggestionEditor
        visible={!!editingSuggestion}
        suggestion={editingSuggestion}
        onClose={() => setEditingSuggestion(null)}
        onSave={() => {
          // Track that edited version was used
          if (editingSuggestion) {
            handleSuggestionUse(editingSuggestion);
          }
        }}
      />

      {/* Suggestion History Modal (6.2.14) */}
      <SuggestionHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        history={conversationHistory}
        onReuse={handleReuseSuggestion}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  // Landscape styles (6.1.19)
  containerLandscape: {
    flexDirection: 'row',
  },
  // Split-screen styles (6.1.20)
  containerSplitScreen: {
    paddingHorizontal: spacing.sm,
  },
  noGirlContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  noGirl: {
    color: darkColors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  noGirlButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.lg,
  },
  noGirlButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerCompact: {
    paddingTop: 40,
    paddingBottom: 14,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '800',
    fontFamily: fonts.extraBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  editProfile: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSizes.xs,
    fontWeight: '500',
    fontFamily: fonts.medium,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenu: {
    position: 'absolute',
    top: 110,
    right: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    zIndex: 100,
    ...shadows.lg,
    paddingVertical: spacing.xs,
    minWidth: 180,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  contextMenuText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  loadingText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  inputSection: {
    padding: spacing.lg,
  },
  inputSectionLandscape: {
    paddingHorizontal: spacing.xl,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing.sm,
    letterSpacing: 1.2,
    fontFamily: fonts.semiBold,
  },
  input: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: darkColors.border,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: accentColors.rose + '60',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  generateButtonWrapper: {
    flex: 1,
    ...shadows.glow,
    borderRadius: borderRadius.lg,
  },
  generateButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    flexDirection: 'row',
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  screenshotButton: {
    backgroundColor: darkColors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: accentColors.rose + '30',
  },
  results: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  resultsTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  chartToggle: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartToggleText: {
    color: accentColors.rose,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});
