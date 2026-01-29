/**
 * useHistory Hook
 *
 * Reactive hook for history service — re-renders on history changes.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getHistory,
  getFavorites,
  getUsageCounts,
  getTotalCount,
  addHistoryEntry,
  toggleFavorite,
  deleteHistoryEntry,
  clearHistory,
  subscribeHistory,
  type HistoryEntry,
  type HistoryScreenType,
} from '../services/historyService';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<HistoryEntry[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<HistoryScreenType, number>>({
    chat_reply: 0,
    bio: 0,
    opener: 0,
    quick_reply: 0,
    screenshot: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [h, f, c, t] = await Promise.all([
      getHistory(),
      getFavorites(),
      getUsageCounts(),
      getTotalCount(),
    ]);
    setHistory(h);
    setFavorites(f);
    setUsageCounts(c);
    setTotalCount(t);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeHistory(refresh);
    return unsub;
  }, [refresh]);

  const add = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'isFavorite'>) => {
    return addHistoryEntry(entry);
  }, []);

  const toggle = useCallback(async (id: string) => {
    return toggleFavorite(id);
  }, []);

  const remove = useCallback(async (id: string) => {
    return deleteHistoryEntry(id);
  }, []);

  const clear = useCallback(async (preserveFavorites = false) => {
    return clearHistory(preserveFavorites);
  }, []);

  return {
    history,
    favorites,
    usageCounts,
    totalCount,
    isLoading,
    add,
    toggleFavorite: toggle,
    remove,
    clear,
    refresh,
  };
}
