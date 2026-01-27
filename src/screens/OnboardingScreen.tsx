import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ONBOARDING_COMPLETE_KEY = 'flirtkey_onboarding_complete';

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'how-it-works',
    icon: '🎯',
    title: 'How It Works',
    description:
      'FlirtKey helps you craft the perfect response. Paste her message, and get three suggestion styles: Safe, Balanced, and Bold.',
    highlight: 'Your personal AI wingman',
  },
  {
    id: 'profiles',
    icon: '👩',
    title: 'Create Profiles',
    description:
      'Add details about each girl - her interests, personality, your inside jokes. The more context, the better the suggestions!',
    highlight: 'Personalized for each match',
  },
  {
    id: 'screenshots',
    icon: '📸',
    title: 'Screenshot Analysis',
    description:
      "Upload screenshots of your conversations. Our AI reads between the lines and helps you understand what she's really saying.",
    highlight: 'Decode hidden signals',
  },
  {
    id: 'culture',
    icon: '🌍',
    title: 'Culture Aware',
    description:
      'Dating styles differ across cultures. FlirtKey adapts its suggestions to match - from Uzbek to Western to Asian dating norms.',
    highlight: 'Globally intelligent',
  },
  {
    id: 'privacy',
    icon: '🔒',
    title: 'Your Privacy Matters',
    description:
      'Your conversations and data stay on YOUR device. We only send messages to OpenAI for processing - nothing is stored on our servers.',
    highlight: '100% Private',
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const markOnboardingComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
    }
  }, []);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: 'ApiKeySetup' }],
    });
  };

  const handleComplete = async () => {
    await markOnboardingComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: 'ApiKeySetup' }],
    });
  };

  const openTermsOfService = () => {
    Linking.openURL('https://flirtkey.app/terms');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://flirtkey.app/privacy');
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    // Calculate animation values for this slide
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.slide,
          {
            width,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        {item.highlight && (
          <View style={styles.highlightBadge}>
            <Text style={styles.highlightText}>{item.highlight}</Text>
          </View>
        )}
        <Text style={styles.slideDescription}>{item.description}</Text>
      </Animated.View>
    );
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {SLIDES.map((_, index) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Header with Skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
      />

      {/* Progress Dots */}
      {renderProgressDots()}

      {/* Privacy Notice & Terms (shown on last slide) */}
      {isLastSlide && (
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={openTermsOfService}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, isLastSlide && styles.completeButton]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>{isLastSlide ? "Let's Go! 🚀" : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper function to check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper function to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: darkColors.border,
  },
  icon: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  highlightBadge: {
    backgroundColor: darkColors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  highlightText: {
    color: darkColors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  slideDescription: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.primary,
    marginHorizontal: 4,
  },
  legalContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  legalText: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: darkColors.primary,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  completeButton: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  nextButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
});
