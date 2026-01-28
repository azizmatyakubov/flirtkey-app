/**
 * Haptics Utils Tests
 * Phase 9: Test haptic feedback utilities
 */

// Mock expo-haptics - must be defined before imports
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSelection,
  triggerHaptic,
  hapticCopy,
  hapticDelete,
  hapticNavigate,
  hapticToggle,
} from '../../utils/haptics';

describe('Haptics Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset settings store first, then enable haptics
    useSettingsStore.getState().resetSettings();
    // Default settings have hapticFeedback: true, no need to call setAccessibility
  });

  // ==========================================
  // Basic Haptic Functions
  // ==========================================

  describe('Basic Haptic Functions', () => {
    describe('hapticLight', () => {
      it('triggers light impact when enabled', async () => {
        await hapticLight();
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
      });

      it('does not trigger when disabled', async () => {
        useSettingsStore.getState().setAccessibility({ hapticFeedback: false });
        await hapticLight();
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
      });
    });

    describe('hapticMedium', () => {
      it('triggers medium impact when enabled', async () => {
        await hapticMedium();
        expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      });

      it('does not trigger when disabled', async () => {
        useSettingsStore.getState().setAccessibility({ hapticFeedback: false });
        await hapticMedium();
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
      });
    });

    describe('hapticHeavy', () => {
      it('triggers heavy impact when enabled', async () => {
        await hapticHeavy();
        expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
      });

      it('does not trigger when disabled', async () => {
        useSettingsStore.getState().setAccessibility({ hapticFeedback: false });
        await hapticHeavy();
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
      });
    });
  });

  // ==========================================
  // Notification Haptics
  // ==========================================

  describe('Notification Haptics', () => {
    describe('hapticSuccess', () => {
      it('triggers success notification when enabled', async () => {
        await hapticSuccess();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
      });
    });

    describe('hapticWarning', () => {
      it('triggers warning notification when enabled', async () => {
        await hapticWarning();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
      });
    });

    describe('hapticError', () => {
      it('triggers error notification when enabled', async () => {
        await hapticError();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
      });
    });
  });

  // ==========================================
  // Selection Haptic
  // ==========================================

  describe('Selection Haptic', () => {
    describe('hapticSelection', () => {
      it('triggers selection feedback when enabled', async () => {
        await hapticSelection();
        expect(Haptics.selectionAsync).toHaveBeenCalled();
      });

      it('does not trigger when disabled', async () => {
        useSettingsStore.getState().setAccessibility({ hapticFeedback: false });
        await hapticSelection();
        expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      });
    });
  });

  // ==========================================
  // Generic Haptic Trigger
  // ==========================================

  describe('triggerHaptic', () => {
    it('triggers correct haptic for each type', async () => {
      await triggerHaptic('light');
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');

      jest.clearAllMocks();

      await triggerHaptic('success');
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');

      jest.clearAllMocks();

      await triggerHaptic('selection');
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Contextual Haptics
  // ==========================================

  describe('Contextual Haptics', () => {
    describe('hapticCopy', () => {
      it('triggers success haptic for copy', async () => {
        await hapticCopy();
        // hapticCopy = hapticSuccess = notificationAsync
        expect(Haptics.notificationAsync).toHaveBeenCalled();
      });
    });

    describe('hapticDelete', () => {
      it('triggers warning haptic for delete', async () => {
        await hapticDelete();
        expect(Haptics.notificationAsync).toHaveBeenCalled();
      });
    });

    describe('hapticNavigate', () => {
      it('triggers light haptic for navigation', async () => {
        await hapticNavigate();
        expect(Haptics.impactAsync).toHaveBeenCalled();
      });
    });

    describe('hapticToggle', () => {
      it('triggers light haptic for toggle', async () => {
        await hapticToggle();
        // hapticToggle = hapticLight = impactAsync
        expect(Haptics.impactAsync).toHaveBeenCalled();
      });
    });
  });

  // ==========================================
  // Error Handling
  // ==========================================

  describe('Error Handling', () => {
    it('silently fails when haptics throw', async () => {
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('No haptic support'));

      // Should not throw
      await expect(hapticLight()).resolves.toBeUndefined();
    });

    it('silently fails when notifications throw', async () => {
      (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('No support'));

      await expect(hapticSuccess()).resolves.toBeUndefined();
    });
  });
});
