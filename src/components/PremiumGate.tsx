/**
 * PremiumGate - Premium feature overlay for free users
 * Hour 5: Premium gate with blur overlay and CTA
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumGateProps {
  feature: string;
  description: string;
  emoji?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export function PremiumGate({
  feature,
  description,
  emoji = '👑',
  onUpgrade,
  children,
}: PremiumGateProps) {
  const isPro = useSubscriptionStore((s) => s.isPro);

  if (isPro()) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Blurred preview */}
      <View style={styles.previewContainer}>
        <View style={styles.blurOverlay}>{children}</View>
      </View>

      {/* Premium overlay */}
      <Animated.View entering={FadeIn} style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{feature}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.features}>
            {[
              'Unlimited access to all features',
              'AI-powered conversation coaching',
              'Profile optimization tools',
              'Priority support',
            ].map((feat) => (
              <View key={feat} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#2ED573" />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onUpgrade?.();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="diamond" size={20} color="#FFF" />
            <Text style={styles.upgradeText}>Upgrade to Pro</Text>
          </TouchableOpacity>

          <Text style={styles.priceText}>Starting at $4.99/month</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  previewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  blurOverlay: {
    flex: 1,
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlayContent: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: SCREEN_WIDTH - spacing.lg * 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: accentColors.gold + '44',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  features: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: accentColors.coral,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
  },
  upgradeText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: fonts.bold,
  },
  priceText: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
});
