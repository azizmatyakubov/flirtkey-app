/**
 * Subscription Store - Zustand store for subscription state
 * Phase 3, Task 1
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SubscriptionState,
  SubscriptionPeriod,
  getDefaultSubscriptionState,
  canUseSuggestion as checkCanUseSuggestion,
  recordSuggestionUse,
  recordSuggestionTimestamp,
  canAccessFeature as checkCanAccessFeature,
  getRemainingToday as doGetRemainingToday,
  startTrial as doStartTrial,
  upgradeToPro as doUpgradeToPro,
  getEffectiveTier,
  backupSubscription,
  restorePurchase,
  validateOnOpen,
  type PlanLimits,
} from '../services/subscription';

interface SubscriptionStore {
  subscription: SubscriptionState;

  // Computed helpers
  canUseSuggestion: () => boolean;
  recordSuggestionUse: () => void;
  canAccessFeature: (feature: keyof PlanLimits) => boolean;
  getRemainingToday: () => number;
  getEffectiveTier: () => string;
  isPro: () => boolean;

  // Actions
  startTrial: () => void;
  upgradeToPro: (period: SubscriptionPeriod) => void;
  restorePurchase: () => Promise<boolean>;
  resetSubscription: () => void;
  validateSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscription: getDefaultSubscriptionState(),

      canUseSuggestion: () => {
        return checkCanUseSuggestion(get().subscription);
      },

      recordSuggestionUse: () => {
        // Update state synchronously first to prevent race conditions
        // when multiple suggestions are generated rapidly
        const syncUpdated = recordSuggestionUse(get().subscription);
        set({ subscription: syncUpdated });
        // Fire async timestamp recording separately (non-blocking)
        recordSuggestionTimestamp().catch(() => {});
      },

      canAccessFeature: (feature: keyof PlanLimits) => {
        return checkCanAccessFeature(get().subscription, feature);
      },

      getRemainingToday: () => {
        return doGetRemainingToday(get().subscription);
      },

      getEffectiveTier: () => {
        return getEffectiveTier(get().subscription);
      },

      isPro: () => {
        const tier = getEffectiveTier(get().subscription);
        return tier === 'pro' || tier === 'lifetime';
      },

      startTrial: () => {
        const updated = doStartTrial(get().subscription);
        set({ subscription: updated });
        backupSubscription(updated);
      },

      upgradeToPro: (period: SubscriptionPeriod) => {
        const updated = doUpgradeToPro(get().subscription, period);
        set({ subscription: updated });
        backupSubscription(updated);
      },

      restorePurchase: async () => {
        const restored = await restorePurchase();
        if (restored) {
          set({ subscription: restored });
          return true;
        }
        return false;
      },

      resetSubscription: () => {
        set({ subscription: getDefaultSubscriptionState() });
      },

      validateSubscription: async () => {
        const validated = await validateOnOpen(get().subscription);
        if (validated !== get().subscription) {
          set({ subscription: validated });
        }
      },
    }),
    {
      name: 'fk_st_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);
