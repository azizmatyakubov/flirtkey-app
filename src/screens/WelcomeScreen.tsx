import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSizes, borderRadius, accentColors, shadows } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  // Floating orbs animation
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

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

    // Floating orbs — subtle looping animation
    const floatOrb = (anim: Animated.Value, duration: number, distance: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -distance,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: distance,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    floatOrb(orb1Y, 3000, 12);
    floatOrb(orb2Y, 4000, 18);
    floatOrb(orb3Y, 3500, 10);
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <LinearGradient
      colors={['#0F0F1A', '#1A1B2E', '#0F0F1A']}
      style={styles.container}
    >
      {/* Floating background orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2Y }] }]} />
      <Animated.View style={[styles.orb, styles.orb3, { transform: [{ translateY: orb3Y }] }]} />

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
        <LinearGradient
          colors={[accentColors.gradientStart, accentColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Ionicons name="heart" size={48} color="#fff" />
        </LinearGradient>
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

      {/* Feature pills */}
      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        {[
          { icon: 'chatbubble-ellipses' as const, text: 'Smart reply suggestions', color: accentColors.rose },
          { icon: 'camera' as const, text: 'Screenshot analysis', color: accentColors.coral },
          { icon: 'globe' as const, text: 'Culture-aware responses', color: accentColors.pink },
        ].map((feature, index) => (
          <View key={index} style={styles.featurePill}>
            <View style={[styles.featureIconBg, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon} size={18} color={feature.color} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
        <TouchableOpacity
          onPress={handleGetStarted}
          activeOpacity={0.85}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Floating orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  orb1: {
    width: 200,
    height: 200,
    backgroundColor: accentColors.rose,
    top: '10%',
    left: -40,
  },
  orb2: {
    width: 160,
    height: 160,
    backgroundColor: accentColors.coral,
    top: '35%',
    right: -50,
  },
  orb3: {
    width: 120,
    height: 120,
    backgroundColor: accentColors.pink,
    bottom: '15%',
    left: '20%',
  },
  logoContainer: {
    marginBottom: spacing.xl,
    ...shadows.glow,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: fontSizes.lg,
    color: '#9BA1B7',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  features: {
    marginVertical: spacing.xl,
    width: '100%',
    gap: 12,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: fontSizes.md,
    color: '#CCCED8',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
  ctaWrapper: {
    ...shadows.glow,
    borderRadius: borderRadius.lg,
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
});
