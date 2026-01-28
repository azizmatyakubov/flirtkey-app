/**
 * Offline Queue Service
 * Queues AI requests when offline and processes them when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ==========================================
// Types
// ==========================================

export interface QueuedRequest {
  id: string;
  type: 'flirt' | 'screenshot' | 'starter' | 'date_idea' | 'interest' | 'red_flag' | 'timing';
  params: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  girlId?: string;
  girlName?: string;
  preview?: string; // Short preview of what was requested
}

export interface OfflineQueueState {
  queue: QueuedRequest[];
  isProcessing: boolean;
  lastProcessed: number | null;
}

export interface QueueStats {
  pending: number;
  oldest: number | null;
  types: Record<string, number>;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'flirtkey_offline_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ==========================================
// State
// ==========================================

const state: OfflineQueueState = {
  queue: [],
  isProcessing: false,
  lastProcessed: null,
};

const listeners: Set<(state: OfflineQueueState) => void> = new Set();
let processCallback: ((request: QueuedRequest) => Promise<boolean>) | null = null;

// ==========================================
// Persistence
// ==========================================

async function loadQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QueuedRequest[];
      state.queue = parsed.filter(isValidRequest);
      notifyListeners();
    }
  } catch (error) {
    console.warn('[OfflineQueue] Failed to load queue:', error);
  }
}

async function saveQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.queue));
  } catch (error) {
    console.warn('[OfflineQueue] Failed to save queue:', error);
  }
}

function isValidRequest(req: unknown): req is QueuedRequest {
  if (!req || typeof req !== 'object') return false;
  const r = req as Record<string, unknown>;
  return (
    typeof r['id'] === 'string' &&
    typeof r['type'] === 'string' &&
    typeof r['timestamp'] === 'number' &&
    typeof r['params'] === 'object'
  );
}

// ==========================================
// Listeners
// ==========================================

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener({ ...state });
    } catch (error) {
      console.warn('[OfflineQueue] Listener error:', error);
    }
  });
}

// ==========================================
// Queue Operations
// ==========================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createPreview(type: string, params: Record<string, unknown>): string {
  switch (type) {
    case 'flirt':
      return params['herMessage']
        ? `Reply to: "${String(params['herMessage']).slice(0, 30)}..."`
        : 'Generate reply';
    case 'screenshot':
      return 'Analyze screenshot';
    case 'starter':
      return 'Conversation starter';
    case 'date_idea':
      return 'Date ideas';
    case 'interest':
      return 'Interest analysis';
    case 'red_flag':
      return 'Red flag check';
    case 'timing':
      return 'Response timing';
    default:
      return type;
  }
}

export async function addToQueue(
  type: QueuedRequest['type'],
  params: Record<string, unknown>,
  girlId?: string,
  girlName?: string
): Promise<string> {
  // Enforce max queue size
  if (state.queue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest request
    state.queue.shift();
  }

  const request: QueuedRequest = {
    id: generateId(),
    type,
    params,
    timestamp: Date.now(),
    retryCount: 0,
    girlId,
    girlName,
    preview: createPreview(type, params),
  };

  state.queue.push(request);
  await saveQueue();
  notifyListeners();

  console.log(
    `[OfflineQueue] Added request ${request.id} (${type}). Queue size: ${state.queue.length}`
  );
  return request.id;
}

export async function removeFromQueue(id: string): Promise<boolean> {
  const index = state.queue.findIndex((r) => r.id === id);
  if (index === -1) return false;

  state.queue.splice(index, 1);
  await saveQueue();
  notifyListeners();
  return true;
}

export async function clearQueue(): Promise<void> {
  state.queue = [];
  await saveQueue();
  notifyListeners();
}

export function getQueuedRequests(): QueuedRequest[] {
  return [...state.queue];
}

export function getPendingCount(): number {
  return state.queue.length;
}

export function getQueueStats(): QueueStats {
  const types: Record<string, number> = {};
  state.queue.forEach((r) => {
    types[r.type] = (types[r.type] || 0) + 1;
  });

  return {
    pending: state.queue.length,
    oldest: state.queue.length > 0 ? state.queue[0]!.timestamp : null,
    types,
  };
}

// ==========================================
// Queue Processing
// ==========================================

export function setProcessCallback(callback: (request: QueuedRequest) => Promise<boolean>): void {
  processCallback = callback;
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (state.isProcessing || state.queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  // Check if online
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('[OfflineQueue] Still offline, skipping processing');
    return { processed: 0, failed: 0 };
  }

  if (!processCallback) {
    console.warn('[OfflineQueue] No process callback set');
    return { processed: 0, failed: 0 };
  }

  state.isProcessing = true;
  notifyListeners();

  let processed = 0;
  let failed = 0;

  // Process queue in order (FIFO)
  while (state.queue.length > 0) {
    const request = state.queue[0];
    if (!request) break;

    try {
      console.log(`[OfflineQueue] Processing request ${request.id} (${request.type})`);
      const success = await processCallback(request);

      if (success) {
        // Remove from queue
        state.queue.shift();
        processed++;
        console.log(`[OfflineQueue] Request ${request.id} processed successfully`);
      } else {
        // Increment retry count
        request.retryCount++;
        if (request.retryCount >= MAX_RETRIES) {
          // Remove failed request after max retries
          state.queue.shift();
          failed++;
          console.warn(`[OfflineQueue] Request ${request.id} failed after ${MAX_RETRIES} retries`);
        } else {
          // Move to end of queue for retry
          state.queue.shift();
          state.queue.push(request);
          console.log(
            `[OfflineQueue] Request ${request.id} failed, will retry (${request.retryCount}/${MAX_RETRIES})`
          );
        }
      }

      await saveQueue();
      notifyListeners();

      // Small delay between requests
      if (state.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    } catch (error) {
      console.error(`[OfflineQueue] Error processing request ${request.id}:`, error);
      request.retryCount++;
      if (request.retryCount >= MAX_RETRIES) {
        state.queue.shift();
        failed++;
      }
      await saveQueue();
      break; // Stop processing on error
    }

    // Check if still online
    const currentNetInfo = await NetInfo.fetch();
    if (!currentNetInfo.isConnected) {
      console.log('[OfflineQueue] Went offline during processing, pausing');
      break;
    }
  }

  state.isProcessing = false;
  state.lastProcessed = Date.now();
  notifyListeners();

  console.log(
    `[OfflineQueue] Processing complete. Processed: ${processed}, Failed: ${failed}, Remaining: ${state.queue.length}`
  );
  return { processed, failed };
}

// ==========================================
// Network Monitoring
// ==========================================

let unsubscribeNetInfo: (() => void) | null = null;

export function startNetworkMonitoring(): void {
  if (unsubscribeNetInfo) return;

  unsubscribeNetInfo = NetInfo.addEventListener((netState) => {
    if (netState.isConnected && netState.isInternetReachable !== false) {
      // Back online - process queue
      console.log('[OfflineQueue] Network restored, processing queue...');
      processQueue();
    }
  });

  console.log('[OfflineQueue] Network monitoring started');
}

export function stopNetworkMonitoring(): void {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
    console.log('[OfflineQueue] Network monitoring stopped');
  }
}

// ==========================================
// Subscription
// ==========================================

export function subscribe(listener: (state: OfflineQueueState) => void): () => void {
  listeners.add(listener);
  // Immediately notify with current state
  listener({ ...state });

  return () => {
    listeners.delete(listener);
  };
}

// ==========================================
// Initialization
// ==========================================

export async function initialize(): Promise<void> {
  await loadQueue();
  startNetworkMonitoring();

  // Try to process any pending requests
  const netInfo = await NetInfo.fetch();
  if (netInfo.isConnected) {
    processQueue();
  }
}

export function cleanup(): void {
  stopNetworkMonitoring();
  listeners.clear();
}

// ==========================================
// Export Service
// ==========================================

export const OfflineQueueService = {
  // Queue operations
  addToQueue,
  removeFromQueue,
  clearQueue,
  getQueuedRequests,
  getPendingCount,
  getQueueStats,

  // Processing
  setProcessCallback,
  processQueue,

  // Network monitoring
  startNetworkMonitoring,
  stopNetworkMonitoring,

  // Subscription
  subscribe,

  // Lifecycle
  initialize,
  cleanup,
};

export default OfflineQueueService;
