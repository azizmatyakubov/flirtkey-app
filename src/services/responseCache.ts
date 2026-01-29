/**
 * Response Cache Service
 * Caches AI responses in AsyncStorage for offline access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult } from '../types';

// ==========================================
// Types
// ==========================================

export interface CachedResponse {
  id: string;
  girlId: string;
  messageHash: string;
  response: AnalysisResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheIndex {
  entries: Array<{
    id: string;
    girlId: string;
    messageHash: string;
    timestamp: number;
  }>;
  version: number;
}

// ==========================================
// Constants
// ==========================================

const CACHE_INDEX_KEY = 'flirtkey_response_cache_index';
const CACHE_ENTRY_PREFIX = 'flirtkey_response_cache_';
const MAX_CACHE_SIZE = 50;
const CACHE_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ==========================================
// Utilities
// ==========================================

/**
 * Simple hash function for message content
 */
function hashMessage(message: string): string {
  let hash = 0;
  const str = message.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function generateCacheId(girlId: string, messageHash: string): string {
  return `${girlId}_${messageHash}`;
}

// ==========================================
// Index Operations
// ==========================================

async function loadIndex(): Promise<CacheIndex> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CacheIndex;
      if (parsed.version === CACHE_VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to load index:', error);
  }
  return { entries: [], version: CACHE_VERSION };
}

async function saveIndex(index: CacheIndex): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to save index:', error);
  }
}

// ==========================================
// Cache Operations
// ==========================================

/**
 * Get a cached response by girl ID and message
 */
export async function getCachedResponse(
  girlId: string,
  message: string
): Promise<AnalysisResult | null> {
  const messageHash = hashMessage(message);
  const cacheId = generateCacheId(girlId, messageHash);
  const key = `${CACHE_ENTRY_PREFIX}${cacheId}`;

  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;

    const entry = JSON.parse(stored) as CachedResponse;

    // Check if expired
    if (Date.now() - entry.timestamp > MAX_AGE_MS) {
      // Remove expired entry
      await removeCacheEntry(cacheId);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    await AsyncStorage.setItem(key, JSON.stringify(entry));

    if (__DEV__) console.log(`[ResponseCache] Cache hit for ${girlId}/${messageHash}`);
    return entry.response;
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to get cached response:', error);
    return null;
  }
}

/**
 * Cache an AI response
 */
export async function cacheResponse(
  girlId: string,
  message: string,
  response: AnalysisResult
): Promise<void> {
  const messageHash = hashMessage(message);
  const cacheId = generateCacheId(girlId, messageHash);
  const key = `${CACHE_ENTRY_PREFIX}${cacheId}`;

  try {
    const index = await loadIndex();

    // Check if already cached
    const existingIndex = index.entries.findIndex((e) => e.id === cacheId);

    const entry: CachedResponse = {
      id: cacheId,
      girlId,
      messageHash,
      response,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    // Save entry
    await AsyncStorage.setItem(key, JSON.stringify(entry));

    // Update index
    if (existingIndex !== -1) {
      // Update existing entry
      index.entries[existingIndex] = {
        id: cacheId,
        girlId,
        messageHash,
        timestamp: Date.now(),
      };
    } else {
      // Add new entry
      index.entries.push({
        id: cacheId,
        girlId,
        messageHash,
        timestamp: Date.now(),
      });
    }

    // Enforce max size (LRU eviction)
    if (index.entries.length > MAX_CACHE_SIZE) {
      await enforceMaxSize(index);
    }

    await saveIndex(index);
    if (__DEV__) console.log(`[ResponseCache] Cached response for ${girlId}/${messageHash}`);
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to cache response:', error);
  }
}

/**
 * Remove a cache entry
 */
async function removeCacheEntry(cacheId: string): Promise<void> {
  const key = `${CACHE_ENTRY_PREFIX}${cacheId}`;
  try {
    await AsyncStorage.removeItem(key);

    const index = await loadIndex();
    index.entries = index.entries.filter((e) => e.id !== cacheId);
    await saveIndex(index);
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to remove entry:', error);
  }
}

/**
 * Enforce max cache size using LRU eviction
 */
async function enforceMaxSize(index: CacheIndex): Promise<void> {
  if (index.entries.length <= MAX_CACHE_SIZE) return;

  // Load all entries to check access times
  const entriesWithAccess: Array<{ id: string; lastAccessed: number }> = [];

  for (const entry of index.entries) {
    const key = `${CACHE_ENTRY_PREFIX}${entry.id}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as CachedResponse;
        entriesWithAccess.push({ id: entry.id, lastAccessed: parsed.lastAccessed });
      }
    } catch {
      // If we can't read it, mark for removal
      entriesWithAccess.push({ id: entry.id, lastAccessed: 0 });
    }
  }

  // Sort by last accessed (oldest first)
  entriesWithAccess.sort((a, b) => a.lastAccessed - b.lastAccessed);

  // Remove oldest entries until we're under the limit
  const toRemove = entriesWithAccess.slice(0, entriesWithAccess.length - MAX_CACHE_SIZE);

  for (const entry of toRemove) {
    const key = `${CACHE_ENTRY_PREFIX}${entry.id}`;
    await AsyncStorage.removeItem(key);
    index.entries = index.entries.filter((e) => e.id !== entry.id);
  }

  if (__DEV__) console.log(`[ResponseCache] Evicted ${toRemove.length} entries (LRU)`);
}

/**
 * Get all cached responses for a girl
 */
export async function getCachedResponsesForGirl(girlId: string): Promise<CachedResponse[]> {
  const index = await loadIndex();
  const girlEntries = index.entries.filter((e) => e.girlId === girlId);

  const responses: CachedResponse[] = [];

  for (const entry of girlEntries) {
    const key = `${CACHE_ENTRY_PREFIX}${entry.id}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        responses.push(JSON.parse(stored) as CachedResponse);
      }
    } catch {
      // Skip invalid entries
    }
  }

  return responses.sort((a, b) => b.lastAccessed - a.lastAccessed);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  entriesByGirl: Record<string, number>;
  oldestEntry: number | null;
  newestEntry: number | null;
  totalSizeEstimate: number;
}> {
  const index = await loadIndex();

  const entriesByGirl: Record<string, number> = {};
  let totalSize = 0;
  let oldest: number | null = null;
  let newest: number | null = null;

  for (const entry of index.entries) {
    entriesByGirl[entry.girlId] = (entriesByGirl[entry.girlId] || 0) + 1;

    if (oldest === null || entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
    if (newest === null || entry.timestamp > newest) {
      newest = entry.timestamp;
    }

    // Estimate size
    const key = `${CACHE_ENTRY_PREFIX}${entry.id}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        totalSize += stored.length;
      }
    } catch {
      // Skip
    }
  }

  return {
    totalEntries: index.entries.length,
    entriesByGirl,
    oldestEntry: oldest,
    newestEntry: newest,
    totalSizeEstimate: totalSize,
  };
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  const index = await loadIndex();

  const keysToRemove = index.entries.map((e) => `${CACHE_ENTRY_PREFIX}${e.id}`);
  keysToRemove.push(CACHE_INDEX_KEY);

  try {
    await AsyncStorage.multiRemove(keysToRemove);
    if (__DEV__) console.log(`[ResponseCache] Cleared ${index.entries.length} cached responses`);
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to clear cache:', error);
  }
}

/**
 * Clear cached responses for a specific girl
 */
export async function clearCacheForGirl(girlId: string): Promise<number> {
  const index = await loadIndex();
  const girlEntries = index.entries.filter((e) => e.girlId === girlId);

  const keysToRemove = girlEntries.map((e) => `${CACHE_ENTRY_PREFIX}${e.id}`);

  try {
    await AsyncStorage.multiRemove(keysToRemove);
    index.entries = index.entries.filter((e) => e.girlId !== girlId);
    await saveIndex(index);
    if (__DEV__) console.log(`[ResponseCache] Cleared ${girlEntries.length} cached responses for ${girlId}`);
    return girlEntries.length;
  } catch (error) {
    if (__DEV__) console.warn('[ResponseCache] Failed to clear cache for girl:', error);
    return 0;
  }
}

/**
 * Cleanup expired entries
 */
export async function cleanupExpired(): Promise<number> {
  const index = await loadIndex();
  const now = Date.now();
  let removed = 0;

  const keysToRemove: string[] = [];
  const validEntries = index.entries.filter((e) => {
    if (now - e.timestamp > MAX_AGE_MS) {
      keysToRemove.push(`${CACHE_ENTRY_PREFIX}${e.id}`);
      removed++;
      return false;
    }
    return true;
  });

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
    index.entries = validEntries;
    await saveIndex(index);
    if (__DEV__) console.log(`[ResponseCache] Cleaned up ${removed} expired entries`);
  }

  return removed;
}

// ==========================================
// Export Service
// ==========================================

export const ResponseCacheService = {
  // Core operations
  getCachedResponse,
  cacheResponse,
  getCachedResponsesForGirl,

  // Stats
  getCacheStats,

  // Cleanup
  clearCache,
  clearCacheForGirl,
  cleanupExpired,
};

export default ResponseCacheService;
