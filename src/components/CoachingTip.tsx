/**
 * CoachingTip Component
 * Phase 2, Task 4: "Teach Me" Coaching Mode
 * 
 * Expandable section below each suggestion showing
 * psychology/reasoning behind the suggestion.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CoachingTipProps {
  explanation: string;
  visible?: boolean;
}

export const CoachingTip = React.memo(function CoachingTip({ explanation, visible = true }: CoachingTipProps) {
  const [expanded, setExpanded] = useState(false);

  if (!visible || !explanation) return null;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={styles.headerText}>
          💡 Why this works {expanded ? '▾' : '▸'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <View style={styles.content}>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  header: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  content: {
    backgroundColor: darkColors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: darkColors.primary + '50',
  },
  explanationText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
});

export default CoachingTip;
