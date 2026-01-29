/**
 * Offline Queue Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  addEventListener: jest.fn(() => jest.fn()),
  refresh: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

import {
  OfflineQueueService,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getQueuedRequests,
  getPendingCount,
  getQueueStats,
} from '../../services/offlineQueue';

import NetInfo from '@react-native-community/netinfo';

describe('OfflineQueueService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    // Reset NetInfo mock
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
    // Clear the in-memory queue state
    await clearQueue();
  });

  describe('addToQueue', () => {
    it('should add a request to the queue', async () => {
      const id = await addToQueue('flirt', { message: 'hello' }, 'girl-1', 'Test Girl');

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should generate preview for different request types', async () => {
      await addToQueue('flirt', { herMessage: 'hi there!' }, 'girl-1', 'Test');
      await addToQueue('screenshot', {}, 'girl-1', 'Test');
      await addToQueue('starter', {}, 'girl-1', 'Test');

      const requests = getQueuedRequests();
      expect(requests.length).toBe(3);
      expect(requests[0]?.preview).toContain('Reply to:');
      expect(requests[1]?.preview).toBe('Analyze screenshot');
      expect(requests[2]?.preview).toBe('Conversation starter');
    });

    it('should enforce max queue size', async () => {
      // Add 51 requests (max is 50)
      for (let i = 0; i < 51; i++) {
        await addToQueue('flirt', { index: i }, `girl-${i}`, `Girl ${i}`);
      }

      expect(getPendingCount()).toBeLessThanOrEqual(50);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove a request by id', async () => {
      const id = await addToQueue('flirt', { message: 'test' }, 'girl-1');
      expect(getPendingCount()).toBe(1);

      const removed = await removeFromQueue(id);
      expect(removed).toBe(true);
      expect(getPendingCount()).toBe(0);
    });

    it('should return false for non-existent id', async () => {
      const removed = await removeFromQueue('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('clearQueue', () => {
    it('should clear all requests', async () => {
      await addToQueue('flirt', { message: '1' }, 'girl-1');
      await addToQueue('flirt', { message: '2' }, 'girl-2');
      await addToQueue('flirt', { message: '3' }, 'girl-3');

      expect(getPendingCount()).toBe(3);

      await clearQueue();
      expect(getPendingCount()).toBe(0);
    });
  });

  describe('getQueueStats', () => {
    it('should return correct statistics', async () => {
      await addToQueue('flirt', {}, 'girl-1');
      await addToQueue('flirt', {}, 'girl-1');
      await addToQueue('screenshot', {}, 'girl-2');

      const stats = getQueueStats();

      expect(stats.pending).toBe(3);
      expect(stats.types['flirt']).toBe(2);
      expect(stats.types['screenshot']).toBe(1);
      expect(stats.oldest).toBeTruthy();
    });
  });

  describe('processQueue', () => {
    it('should process queue when callback is set', async () => {
      const processCallback = jest.fn().mockResolvedValue(true);
      OfflineQueueService.setProcessCallback(processCallback);

      await addToQueue('flirt', { message: 'test' }, 'girl-1');

      const result = await OfflineQueueService.processQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(processCallback).toHaveBeenCalled();
    });

    it('should retry failed requests', async () => {
      let callCount = 0;
      const processCallback = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount >= 2); // Succeed on second try
      });
      OfflineQueueService.setProcessCallback(processCallback);

      await addToQueue('flirt', { message: 'test' }, 'girl-1');

      await OfflineQueueService.processQueue();

      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state changes', async () => {
      const listener = jest.fn();
      const unsubscribe = OfflineQueueService.subscribe(listener);

      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledTimes(1);

      await addToQueue('flirt', { message: 'test' }, 'girl-1');

      // Should be called again after adding
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();

      await addToQueue('flirt', { message: 'test2' }, 'girl-2');

      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
});
