/**
 * ProBadge - PRO pill badge overlay for locked features
 * Phase 3, Task 1
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import type { RootNavigationProp } from '../types/navigation';

interface ProBadgeProps {
  /** Show inline or overlay on top of children */
  overlay?: boolean;
  /** Children to render with overlay */
  children?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Feature name for tooltip */
  feature?: string;
}

export const ProBadge = React.memo(function ProBadge({ overlay = false, children, size = 'sm', feature }: ProBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigation = useNavigation<RootNavigationProp>();

  const handlePress = () => {
    setShowTooltip(true);
  };

  const handleUpgrade = () => {
    setShowTooltip(false);
    navigation.navigate('Paywall');
  };

  const badge = (
    <TouchableOpacity
      style={[styles.badge, size === 'md' && styles.badgeMd]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.badgeText, size === 'md' && styles.badgeTextMd]}>PRO</Text>
    </TouchableOpacity>
  );

  if (overlay && children) {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.childWrapper}>{children}</View>
        <View style={styles.overlayBadge}>{badge}</View>

        {/* Tooltip Modal */}
        <Modal visible={showTooltip} transparent animationType="fade" onRequestClose={() => setShowTooltip(false)}>
          <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={() => setShowTooltip(false)}>
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {feature
                  ? `Upgrade to Pro to unlock ${feature}`
                  : 'Upgrade to Pro to unlock this feature'}
              </Text>
              <TouchableOpacity style={styles.tooltipButton} onPress={handleUpgrade}>
                <Text style={styles.tooltipButtonText}>Upgrade →</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return badge;
});

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextMd: {
    fontSize: 11,
  },
  overlayContainer: {
    position: 'relative',
  },
  childWrapper: {
    opacity: 0.5,
  },
  overlayBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  tooltipOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tooltip: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: darkColors.border,
    alignItems: 'center',
  },
  tooltipText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tooltipButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tooltipButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
});

export default ProBadge;
