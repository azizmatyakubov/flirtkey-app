/**
 * useSettings Hook (2.4.3)
 * Manage app settings
 */

import { useCallback } from 'react';
import { useStore } from '../stores/useStore';
import { Culture, User } from '../types';
import { saveApiKeySecure, deleteApiKeySecure } from '../services/storage';

interface UseSettingsResult {
  // Culture
  userCulture: Culture;
  setUserCulture: (culture: Culture) => void;

  // API Key
  apiKey: string;
  hasApiKey: boolean;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;

  // User
  user: User | null;
  setUser: (user: User) => void;

  // Data management
  clearAllData: () => void;
}

export const useSettings = (): UseSettingsResult => {
  const userCulture = useStore((state) => state.userCulture);
  const setUserCultureStore = useStore((state) => state.setUserCulture);
  const apiKey = useStore((state) => state.apiKey);
  const setApiKeyStore = useStore((state) => state.setApiKey);
  const user = useStore((state) => state.user);
  const setUserStore = useStore((state) => state.setUser);
  const clearAllDataStore = useStore((state) => state.clearAllData);

  const setUserCulture = useCallback(
    (culture: Culture) => {
      setUserCultureStore(culture);
    },
    [setUserCultureStore]
  );

  const setApiKey = useCallback(
    async (key: string) => {
      // Store in both secure storage and regular store
      await saveApiKeySecure(key);
      setApiKeyStore(key);
    },
    [setApiKeyStore]
  );

  const clearApiKey = useCallback(async () => {
    await deleteApiKeySecure();
    setApiKeyStore('');
  }, [setApiKeyStore]);

  const setUser = useCallback(
    (newUser: User) => {
      setUserStore(newUser);
    },
    [setUserStore]
  );

  const clearAllData = useCallback(() => {
    clearAllDataStore();
  }, [clearAllDataStore]);

  return {
    userCulture,
    setUserCulture,
    apiKey,
    hasApiKey: apiKey.length > 0,
    setApiKey,
    clearApiKey,
    user,
    setUser,
    clearAllData,
  };
};

export default useSettings;
