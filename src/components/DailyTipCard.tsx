/**
 * DailyTipCard — Shows a daily dating tip/advice on the home screen
 * Engagement feature: rotates through tips daily
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';
import { FLIRT_TIPS } from '../services/notificationScheduler';

const STORAGE_KEY_DAILY_TIP = 'flirtkey_daily_tip';
const STORAGE_KEY_TIP_DISMISSED = 'flirtkey_tip_dismissed_date';

interface DailyTipState {
  tip: string;
  tipIndex: number;
  date: string;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function DailyTipCardBase() {
  const [tip, setTip] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadDailyTip();
  }, []);

  const loadDailyTip = async () => {
    try {
      const today = getTodayKey();

      // Check if dismissed today
      const dismissedDate = await AsyncStorage.getItem(STORAGE_KEY_TIP_DISMISSED);
      if (dismissedDate === today) {
        setDismissed(true);
        return;
      }

      // Check if we already picked a tip for today
      const raw = await AsyncStorage.getItem(STORAGE_KEY_DAILY_TIP);
      if (raw) {
        const state: DailyTipState = JSON.parse(raw);
        if (state.date === today) {
          setTip(state.tip);
          return;
        }
      }

      // Pick a new tip for today
      const lastIndex = raw ? (JSON.parse(raw) as DailyTipState).tipIndex : -1;
      const nextIndex = (lastIndex + 1) % FLIRT_TIPS.length;
      const newTip = FLIRT_TIPS[nextIndex] ?? FLIRT_TIPS[0] ?? '';

      const newState: DailyTipState = {
        tip: newTip,
        tipIndex: nextIndex,
        date: today,
      };
      await AsyncStorage.setItem(STORAGE_KEY_DAILY_TIP, JSON.stringify(newState));
      setTip(newTip);
    } catch {
      // Fallback to first tip
      setTip(FLIRT_TIPS[0] ?? '');
    }
  };

  const handleDismiss = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDismissed(true);
    await AsyncStorage.setItem(STORAGE_KEY_TIP_DISMISSED, getTodayKey()).catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const randomIndex = Math.floor(Math.random() * FLIRT_TIPS.length);
    const newTip = FLIRT_TIPS[randomIndex] ?? FLIRT_TIPS[0] ?? '';
    setTip(newTip);
    const newState: DailyTipState = {
      tip: newTip,
      tipIndex: randomIndex,
      date: getTodayKey(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_DAILY_TIP, JSON.stringify(newState)).catch(() => {});
  }, []);

  if (dismissed || !tip) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#A855F720', '#6366F110']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="bulb" size={18} color="#A855F7" />
            <Text style={styles.title}>Daily Flirt Tip</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleRefresh} style={styles.actionBtn}>
              <Ionicons name="refresh" size={16} color={darkColors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDismiss} style={styles.actionBtn}>
              <Ionicons name="close" size={16} color={darkColors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.tipText}>{tip}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A855F730',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#A855F7',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
  tipText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
});

export const DailyTipCard = memo(DailyTipCardBase);
DailyTipCard.displayName = 'DailyTipCard';

export default DailyTipCard;
