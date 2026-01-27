import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

interface WelcomeScreenProps {
  navigation: any;
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Title slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Button fade in
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.logoIcon}>🔑</Text>
        <Text style={styles.logoHeart}>💘</Text>
      </Animated.View>

      {/* Title and Tagline */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>FlirtKey</Text>
        <Text style={styles.tagline}>Your AI wingman for{'\n'}memorable conversations</Text>
      </Animated.View>

      {/* Features preview */}
      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        <View style={styles.featureRow}>
          <Text style={styles.featureEmoji}>💬</Text>
          <Text style={styles.featureText}>Smart reply suggestions</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureEmoji}>📸</Text>
          <Text style={styles.featureText}>Screenshot analysis</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureEmoji}>🌍</Text>
          <Text style={styles.featureText}>Culture-aware responses</Text>
        </View>
      </Animated.View>

      {/* CTA Buttons */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: darkColors.primary,
    opacity: 0.05,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 72,
    marginRight: -10,
  },
  logoHeart: {
    fontSize: 40,
    marginTop: -20,
    marginLeft: -10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: darkColors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSizes.lg,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  features: {
    marginVertical: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
  primaryButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: fontSizes.lg,
    marginLeft: spacing.sm,
  },
});
