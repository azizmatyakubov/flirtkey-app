/**
 * Notification Service - Phase 1.4: Conversation Rescue System
 * 
 * Local push notifications for conversation health alerts.
 * Uses expo-notifications for scheduling.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Contact } from '../types';
import { ConvoHealth, getNotificationContent } from './conversationHealth';

// ==========================================
// Configuration
// ==========================================

const HEALTH_CHECK_INTERVAL_HOURS = 6;
const HEALTH_CHECK_IDENTIFIER = 'convo-health-check';

/**
 * Configure notification handler (call once at app startup).
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('convo-health', {
      name: 'Conversation Health',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Alerts about your conversation health',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a conversation health notification.
 */
export async function scheduleHealthNotification(
  contact: Contact,
  health: ConvoHealth
): Promise<string | null> {
  const content = getNotificationContent(contact, health);
  if (!content) return null;

  // Don't notify for thriving convos or if score is above 70
  if (health.status === 'thriving' || health.score > 70) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data || {},
        sound: 'default',
      },
      trigger: null, // Immediate
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule recurring health check (every 6 hours).
 */
export async function scheduleRecurringHealthCheck(): Promise<void> {
  // Cancel existing
  await cancelRecurringHealthCheck();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💬 Time for a check-in',
        body: 'Tap to see how your conversations are doing',
        data: { type: 'health_check' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: HEALTH_CHECK_INTERVAL_HOURS * 60 * 60,
        repeats: true,
      },
      identifier: HEALTH_CHECK_IDENTIFIER,
    });
  } catch {
    // Scheduling failed — non-critical
  }
}

/**
 * Cancel the recurring health check.
 */
export async function cancelRecurringHealthCheck(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(HEALTH_CHECK_IDENTIFIER);
  } catch {
    // Already cancelled or doesn't exist
  }
}

/**
 * Cancel all health-related notifications.
 */
export async function cancelAllHealthNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ==========================================
// Notification Response Handler
// ==========================================

/**
 * Set up listener for notification taps.
 * Returns cleanup function.
 */
export function addNotificationResponseListener(
  callback: (contactId: number, status: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (data && typeof data === 'object') {
      const contactId = data['contactId'];
      const status = data['status'];
      if (typeof contactId === 'number' && typeof status === 'string') {
        callback(contactId, status);
      }
    }
  });

  return () => subscription.remove();
}

// ==========================================
// Export
// ==========================================

export const NotificationService = {
  configureNotifications,
  requestNotificationPermissions,
  scheduleHealthNotification,
  scheduleRecurringHealthCheck,
  cancelRecurringHealthCheck,
  cancelAllHealthNotifications,
  addNotificationResponseListener,
};

export default NotificationService;
