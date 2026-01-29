/**
 * History Service — Conversation History & Favorites
 *
 * Persists every AI-generated reply (screen type, input, output, timestamp)
 * using AsyncStorage. Max 200 entries with rolling eviction.
 * Supports starring/favoriting individual entries.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type HistoryScreenType = 'chat_reply' | 'bio' | 'opener' | 'quick_reply' | 'screenshot';

export interface HistoryEntry {
  id: string;
  screenType: HistoryScreenType;
  input: string;
  output: string;
  timestamp: number;
  isFavorite: boolean;
  /** Optional extra context (contact name, platform, tone, etc.) */
  meta?: Record<string, string>;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'flirtkey_history';
const MAX_ENTRIES = 200;

// ==========================================
// In-memory cache (hydrated from AsyncStorage on first access)
// ==========================================

let _cache: HistoryEntry[] | null = null;
let _listeners: Array<() => void> = [];

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

// ==========================================
// Public API
// ==========================================

/**
 * Load history from AsyncStorage (or return cached)
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  if (_cache !== null) return _cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    _cache = raw ? JSON.parse(raw) : [];
  } catch {
    _cache = [];
  }
  return _cache!;
}

/**
 * Add a new history entry. Enforces MAX_ENTRIES rolling limit.
 */
export async function addHistoryEntry(
  entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'isFavorite'>
): Promise<HistoryEntry> {
  const history = await getHistory();

  const newEntry: HistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    isFavorite: false,
  };

  history.unshift(newEntry);

  // Evict oldest non-favorite entries if over limit
  while (history.length > MAX_ENTRIES) {
    // Find the oldest non-favorite to remove
    const oldestNonFavIdx = findOldestNonFavoriteIndex(history);
    if (oldestNonFavIdx !== -1) {
      history.splice(oldestNonFavIdx, 1);
    } else {
      // All are favorites — remove the oldest anyway
      history.pop();
    }
  }

  _cache = history;
  await persist();
  notifyListeners();
  return newEntry;
}

/**
 * Toggle favorite status of a history entry.
 */
export async function toggleFavorite(id: string): Promise<boolean> {
  const history = await getHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return false;

  entry.isFavorite = !entry.isFavorite;
  _cache = history;
  await persist();
  notifyListeners();
  return entry.isFavorite;
}

/**
 * Get only favorited entries.
 */
export async function getFavorites(): Promise<HistoryEntry[]> {
  const history = await getHistory();
  return history.filter((e) => e.isFavorite);
}

/**
 * Get entries filtered by screen type.
 */
export async function getHistoryByType(screenType: HistoryScreenType): Promise<HistoryEntry[]> {
  const history = await getHistory();
  return history.filter((e) => e.screenType === screenType);
}

/**
 * Delete a single history entry.
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const history = await getHistory();
  _cache = history.filter((e) => e.id !== id);
  await persist();
  notifyListeners();
}

/**
 * Clear all history (keeps favorites if preserveFavorites=true).
 */
export async function clearHistory(preserveFavorites = false): Promise<void> {
  if (preserveFavorites) {
    const history = await getHistory();
    _cache = history.filter((e) => e.isFavorite);
  } else {
    _cache = [];
  }
  await persist();
  notifyListeners();
}

/**
 * Get usage counts by screen type.
 */
export async function getUsageCounts(): Promise<Record<HistoryScreenType, number>> {
  const history = await getHistory();
  const counts: Record<HistoryScreenType, number> = {
    chat_reply: 0,
    bio: 0,
    opener: 0,
    quick_reply: 0,
    screenshot: 0,
  };
  for (const entry of history) {
    counts[entry.screenType] = (counts[entry.screenType] || 0) + 1;
  }
  return counts;
}

/**
 * Get total number of AI replies generated.
 */
export async function getTotalCount(): Promise<number> {
  const history = await getHistory();
  return history.length;
}

/**
 * Subscribe to history changes. Returns unsubscribe function.
 */
export function subscribeHistory(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((fn) => fn !== listener);
  };
}

// ==========================================
// Internal Helpers
// ==========================================

function findOldestNonFavoriteIndex(history: HistoryEntry[]): number {
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i]!.isFavorite) return i;
  }
  return -1;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));
  } catch {
    // Silent fail — not critical
  }
}
