/**
 * PaywallScreen - Premium subscription paywall
 * Phase 3, Task 1 — REDESIGNED for premium feel
 *
 * The MONEY screen. Dark gradient bg, gold accents, glow CTA.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { PRICING, type SubscriptionPeriod } from '../services/subscription';
import {
  darkColors,
  spacing,
  borderRadius,
  shadows,
  PREMIUM_COLORS,
  TYPOGRAPHY,
} from '../constants/theme';
import { GradientButton } from '../components/ui/GradientButton';

const { width } = Dimensions.get('window');

// ==========================================
// Feature comparison data
// ==========================================

interface FeatureRow {
  name: string;
  icon: string;
  free: boolean | string;
  pro: boolean | string;
}

const FEATURES: FeatureRow[] = [
  { name: 'Daily Suggestions', icon: '💬', free: '5/day', pro: '∞' },
  { name: 'Contact Profiles', icon: '👩', free: '1', pro: '∞' },
  { name: 'Bio Generator', icon: '✍️', free: true, pro: true },
  { name: 'Sound Like Me™', icon: '🎤', free: false, pro: true },
  { name: 'Rescue Alerts', icon: '🚨', free: false, pro: true },
  { name: 'GIF Suggestions', icon: '🎬', free: false, pro: true },
  { name: 'Analytics Dashboard', icon: '📊', free: false, pro: true },
  { name: 'Opener Generator', icon: '🎯', free: true, pro: true },
];

// ==========================================
// Component
// ==========================================

export function PaywallScreen({ navigation }: any) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPeriod>('monthly');
  const [loading, setLoading] = useState(false);
  const { startTrial, upgradeToPro, subscription } = useSubscriptionStore();
  const subscribeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount to prevent state updates after navigation
  useEffect(() => {
    return () => {
      if (subscribeTimeoutRef.current) clearTimeout(subscribeTimeoutRef.current);
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
    };
  }, []);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 }),
      ]),
      Animated.timing(ctaAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Subtle shimmer loop on the header
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    subscribeTimeoutRef.current = setTimeout(() => {
      upgradeToPro(selectedPlan);
      setLoading(false);
      Alert.alert('🎉 Welcome to Pro!', 'You now have unlimited access to all features.', [
        { text: "Let's Go!", onPress: () => navigation.goBack() },
      ]);
    }, 800);
  }, [selectedPlan, upgradeToPro, navigation]);

  const handleStartTrial = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    trialTimeoutRef.current = setTimeout(() => {
      startTrial();
      setLoading(false);
      Alert.alert('🎉 Trial Activated!', 'Enjoy 3 days of unlimited Pro features.', [
        { text: 'Awesome!', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  }, [startTrial, navigation]);

  const handleRestore = async () => {
    const { restorePurchase } = useSubscriptionStore.getState();
    const restored = await restorePurchase();
    if (restored) {
      Alert.alert('Purchase Restored!', 'Welcome back to Pro.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('No Purchase Found', "We couldn't find a previous purchase.");
    }
  };

  const renderFeatureRow = (feature: FeatureRow, index: number) => {
    const renderCell = (val: boolean | string) => {
      if (typeof val === 'string') {
        return <Text style={styles.featureCellText}>{val}</Text>;
      }
      return (
        <Text style={[styles.featureCellIcon, val ? styles.featureCellYes : styles.featureCellNo]}>
          {val ? '✓' : '—'}
        </Text>
      );
    };

    return (
      <View key={index} style={[styles.featureRow, index % 2 === 0 && styles.featureRowAlt]}>
        <View style={styles.featureNameWrap}>
          <Text style={styles.featureIcon}>{feature.icon}</Text>
          <Text style={styles.featureName}>{feature.name}</Text>
        </View>
        <View style={styles.featureCell}>{renderCell(feature.free)}</View>
        <View style={styles.featureCell}>{renderCell(feature.pro)}</View>
      </View>
    );
  };

  const renderPricingCard = (period: SubscriptionPeriod) => {
    const plan = PRICING[period];
    const isSelected = selectedPlan === period;
    const isBest = period === 'annual';
    const isLifetime = period === 'lifetime';

    return (
      <TouchableOpacity
        key={period}
        onPress={() => {
          setSelectedPlan(period);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        {isSelected ? (
          <LinearGradient
            colors={
              isBest
                ? [PREMIUM_COLORS.gold, PREMIUM_COLORS.goldDark]
                : [PREMIUM_COLORS.gradientStart, PREMIUM_COLORS.gradientEnd]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pricingCardGradientBorder}
          >
            <View style={[styles.pricingCard, styles.pricingCardSelectedInner]}>
              {plan.badge && (
                <View
                  style={[
                    styles.pricingBadge,
                    isBest && styles.pricingBadgeBest,
                    isLifetime && styles.pricingBadgeLifetime,
                  ]}
                >
                  <Text style={styles.pricingBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <Text style={[styles.pricingLabel, styles.pricingLabelSelected]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
              <Text style={[styles.pricingPrice, styles.pricingPriceSelected]}>{plan.label}</Text>
              {'savings' in plan && plan.savings && (
                <Text style={styles.pricingSavings}>Save {plan.savings}</Text>
              )}
              <View style={styles.pricingCheckmark}>
                <Text style={styles.pricingCheckmarkText}>✓</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.pricingCard}>
            {plan.badge && (
              <View
                style={[
                  styles.pricingBadge,
                  isBest && styles.pricingBadgeBest,
                  isLifetime && styles.pricingBadgeLifetime,
                ]}
              >
                <Text style={styles.pricingBadgeText}>{plan.badge}</Text>
              </View>
            )}
            <Text style={styles.pricingLabel}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
            <Text style={styles.pricingPrice}>{plan.label}</Text>
            {'savings' in plan && plan.savings && (
              <Text style={styles.pricingSavings}>Save {plan.savings}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient background overlay */}
      <LinearGradient colors={['#1A0A2E', '#0F0F1A', '#0F0F1A']} style={StyleSheet.absoluteFill} />

      {/* Decorative gradient orbs for depth */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.headerEmoji,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
                transform: [
                  {
                    scale: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            ✨
          </Animated.Text>
          <Text style={styles.headerTitle}>
            Unlock Your{'\n'}
            <Text style={styles.headerTitleAccent}>Full Rizz</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            Get unlimited suggestions, analytics, and pro features
          </Text>
        </Animated.View>

        {/* Social Proof */}
        <Animated.View style={[styles.socialProof, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[darkColors.primary + '15', darkColors.primary + '05']}
            style={styles.socialProofGradient}
          >
            <Text style={styles.socialProofText}>
              🔥 Join 10,000+ users improving their dating game
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Feature Comparison */}
        <Animated.View style={[styles.featureTable, { opacity: fadeAnim }]}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureHeaderLabel}>Feature</Text>
            <Text style={styles.featureHeaderCell}>Free</Text>
            <Text style={[styles.featureHeaderCell, styles.featureHeaderPro]}>Pro ✨</Text>
          </View>
          {FEATURES.map(renderFeatureRow)}
        </Animated.View>

        {/* Pricing Cards */}
        <Animated.View style={[styles.pricingSection, { opacity: fadeAnim }]}>
          <Text style={styles.pricingSectionTitle}>Choose Your Plan</Text>
          <View style={styles.pricingGrid}>
            {(['weekly', 'monthly', 'annual', 'lifetime'] as SubscriptionPeriod[]).map(
              renderPricingCard
            )}
          </View>
        </Animated.View>

        {/* CTA Buttons — Single primary CTA to avoid confusion */}
        <Animated.View style={[styles.ctaSection, { opacity: ctaAnim }]}>
          {/* Show trial CTA if eligible, otherwise subscribe CTA */}
          {!subscription.trialActive &&
          subscription.tier === 'free' &&
          !subscription.trialEndsAt ? (
            <GradientButton
              title="Start 3-Day Free Trial"
              subtitle="No payment required • Then subscribe"
              onPress={handleStartTrial}
              gradient={[PREMIUM_COLORS.gradientPurple, PREMIUM_COLORS.gradientEnd]}
              glow
              glowColor={PREMIUM_COLORS.gold}
              loading={loading}
              size="lg"
            />
          ) : (
            <GradientButton
              title={`Subscribe — ${PRICING[selectedPlan].label}`}
              onPress={handleSubscribe}
              gradient={[PREMIUM_COLORS.gradientStart, PREMIUM_COLORS.gradientEnd]}
              glow
              loading={loading}
              size="lg"
            />
          )}

          {/* Restore */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreButtonText}>Restore Purchase</Text>
          </TouchableOpacity>

          {/* Legal */}
          <Text style={styles.legalText}>
            Payment will be charged to your account. Subscription auto-renews unless cancelled 24h
            before the end of the current period.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // Decorative background orbs
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: darkColors.primary,
    opacity: 0.06,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: PREMIUM_COLORS.gold,
    opacity: 0.04,
  },

  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PREMIUM_COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: darkColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.hero,
    fontSize: 36,
    lineHeight: 44,
    color: darkColors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerTitleAccent: {
    color: darkColors.primary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Social Proof
  socialProof: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  socialProofGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  socialProofText: {
    ...TYPOGRAPHY.caption,
    color: darkColors.primary,
    fontWeight: '600',
  },

  // Feature Table
  featureTable: {
    marginHorizontal: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  featureHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: PREMIUM_COLORS.surfaceElevated,
  },
  featureHeaderLabel: {
    flex: 1,
    ...TYPOGRAPHY.small,
    color: darkColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featureHeaderCell: {
    width: 56,
    textAlign: 'center',
    ...TYPOGRAPHY.small,
    color: darkColors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featureHeaderPro: {
    color: PREMIUM_COLORS.gold,
  },
  featureRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  featureRowAlt: {
    backgroundColor: darkColors.background + '60',
  },
  featureNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureName: {
    ...TYPOGRAPHY.caption,
    color: darkColors.text,
  },
  featureCell: {
    width: 56,
    alignItems: 'center',
  },
  featureCellText: {
    ...TYPOGRAPHY.small,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  featureCellIcon: {
    fontSize: 16,
    textAlign: 'center',
  },
  featureCellYes: {
    color: PREMIUM_COLORS.gold,
    fontWeight: '700',
  },
  featureCellNo: {
    color: darkColors.textTertiary,
  },

  // Pricing
  pricingSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pricingSectionTitle: {
    ...TYPOGRAPHY.h2,
    color: darkColors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pricingCard: {
    minWidth: (width - spacing.lg * 2 - spacing.sm) / 2 - 1,
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: darkColors.border,
    alignItems: 'center',
    position: 'relative',
  },
  pricingCardGradientBorder: {
    flex: 1,
    minWidth: (width - spacing.lg * 2 - spacing.sm) / 2 - 1,
    borderRadius: borderRadius.lg + 1.5,
    padding: 1.5,
  },
  pricingCardSelectedInner: {
    borderWidth: 0,
    backgroundColor: PREMIUM_COLORS.surfaceElevated,
  },
  pricingBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: darkColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  pricingBadgeBest: {
    backgroundColor: PREMIUM_COLORS.gold,
  },
  pricingBadgeLifetime: {
    backgroundColor: PREMIUM_COLORS.primary,
  },
  pricingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pricingLabel: {
    ...TYPOGRAPHY.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  pricingLabelSelected: {
    color: darkColors.text,
  },
  pricingPrice: {
    ...TYPOGRAPHY.bodyBold,
    color: darkColors.text,
    marginTop: spacing.xs,
  },
  pricingPriceSelected: {
    color: PREMIUM_COLORS.gold,
  },
  pricingSavings: {
    ...TYPOGRAPHY.small,
    color: PREMIUM_COLORS.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  pricingCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: darkColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingCheckmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // CTA
  ctaSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  restoreButtonText: {
    ...TYPOGRAPHY.caption,
    color: darkColors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalText: {
    ...TYPOGRAPHY.small,
    color: darkColors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
});

export default PaywallScreen;
