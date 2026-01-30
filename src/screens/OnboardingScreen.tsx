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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  darkColors,
  accentColors,
  spacing,
  fontSizes,
  borderRadius,
  shadows,
} from '../constants/theme';
import { fonts } from '../constants/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_COMPLETE_KEY = 'flirtkey_onboarding_complete';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  title: string;
  description: string;
  highlight: string;
  gradientColors: readonly [string, string];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'screenshot',
    icon: 'camera',
    emoji: '📸',
    title: 'Take a Screenshot',
    description:
      'Simply screenshot your chat conversation — any dating app, any messenger. FlirtKey reads and understands the full context.',
    highlight: 'Works with any chat app',
    gradientColors: ['#FF6B6B', '#FF8E53'] as const,
  },
  {
    id: 'analyze',
    icon: 'sparkles',
    emoji: '🧠',
    title: 'AI Analyzes the Vibe',
    description:
      'Our AI reads between the lines — their personality, mood, interest level, and communication style. It sees what you might miss.',
    highlight: 'Powered by advanced AI',
    gradientColors: ['#A855F7', '#6366F1'] as const,
  },
  {
    id: 'respond',
    icon: 'chatbubble-ellipses',
    emoji: '💬',
    title: 'Get the Perfect Response',
    description:
      'Choose from Safe, Balanced, or Bold suggestions — each personalized to the conversation. One tap to copy and send.',
    highlight: '3 response styles',
    gradientColors: ['#ec4899', '#f43f5e'] as const,
  },
  {
    id: 'ghosted',
    icon: 'heart',
    emoji: '🔥',
    title: 'Never Get Ghosted Again',
    description:
      'Track conversation health, get daily flirt tips, and build your confidence. Your AI wingman is always ready to help.',
    highlight: 'Your secret weapon',
    gradientColors: ['#FF6B6B', '#FF8E53'] as const,
  },
];

import type { RootNavigationProp } from '../types/navigation';

interface OnboardingScreenProps {
  navigation: RootNavigationProp;
}

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animation refs for each slide's elements
  const slideAnimations = useRef(
    SLIDES.map(() => ({
      iconScale: new Animated.Value(0.3),
      iconOpacity: new Animated.Value(0),
      titleY: new Animated.Value(30),
      titleOpacity: new Animated.Value(0),
      descY: new Animated.Value(20),
      descOpacity: new Animated.Value(0),
    }))
  ).current;

  const markOnboardingComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      if (__DEV__) console.error('Failed to mark onboarding complete:', error);
    }
  }, []);

  const animateSlide = useCallback(
    (index: number) => {
      const anim = slideAnimations[index];
      if (!anim) return;

      // Reset
      anim.iconScale.setValue(0.3);
      anim.iconOpacity.setValue(0);
      anim.titleY.setValue(30);
      anim.titleOpacity.setValue(0);
      anim.descY.setValue(20);
      anim.descOpacity.setValue(0);

      Animated.sequence([
        // Icon bounces in
        Animated.parallel([
          Animated.spring(anim.iconScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim.iconOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Title slides up
        Animated.parallel([
          Animated.timing(anim.titleY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(anim.titleOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        // Description slides up
        Animated.parallel([
          Animated.timing(anim.descY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.descOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [slideAnimations]
  );

  // Animate first slide on mount
  React.useEffect(() => {
    animateSlide(0);
  }, [animateSlide]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      animateSlide(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await markOnboardingComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: 'ApiKeySetup' }],
    });
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      animateSlide(newIndex);
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const anim = slideAnimations[index];
    if (!anim) return null;

    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const parallaxX = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.3, 0, -width * 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View style={[styles.slideContent, { transform: [{ translateX: parallaxX }] }]}>
          {/* Animated Icon */}
          <Animated.View
            style={{
              opacity: anim.iconOpacity,
              transform: [{ scale: anim.iconScale }],
            }}
          >
            <LinearGradient colors={[...item.gradientColors]} style={styles.iconContainer}>
              <Text style={styles.slideEmoji}>{item.emoji}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Step indicator */}
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Step {index + 1} of {SLIDES.length}
            </Text>
          </View>

          {/* Animated Title */}
          <Animated.View
            style={{
              opacity: anim.titleOpacity,
              transform: [{ translateY: anim.titleY }],
            }}
          >
            <Text style={styles.slideTitle}>{item.title}</Text>
          </Animated.View>

          {/* Highlight Badge */}
          <Animated.View
            style={{
              opacity: anim.descOpacity,
            }}
          >
            <LinearGradient
              colors={[`${item.gradientColors[0]}20`, `${item.gradientColors[1]}20`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.highlightBadge}
            >
              <Ionicons name={item.icon} size={14} color={item.gradientColors[0]} />
              <Text style={[styles.highlightText, { color: item.gradientColors[0] }]}>
                {item.highlight}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Animated Description */}
          <Animated.View
            style={{
              opacity: anim.descOpacity,
              transform: [{ translateY: anim.descY }],
            }}
          >
            <Text style={styles.slideDescription}>{item.description}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {SLIDES.map((_, index) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [8, 32, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const slideData = SLIDES[index];
          const dotColor = slideData?.gradientColors[0] ?? accentColors.coral;

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: dotColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header with Skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={16} color={darkColors.textSecondary} />
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
        {isLastSlide ? (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={[
                currentSlide?.gradientColors[0] ?? accentColors.gradientStart,
                currentSlide?.gradientColors[1] ?? accentColors.gradientEnd,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.nextButtonText}>Get Started</Text>
              <Ionicons name="rocket" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={[
                currentSlide?.gradientColors[0] ?? accentColors.gradientStart,
                currentSlide?.gradientColors[1] ?? accentColors.gradientEnd,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    if (__DEV__) console.error('Failed to reset onboarding:', error);
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: 2,
  },
  skipText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  slideEmoji: {
    fontSize: 52,
  },
  stepBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    marginBottom: spacing.md,
  },
  stepBadgeText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: height < 700 ? fontSizes.xl : fontSizes.xxl,
    fontWeight: 'bold',
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fonts.bold,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  highlightText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  slideDescription: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
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
    color: accentColors.coral,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  gradientButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.glow,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
});
