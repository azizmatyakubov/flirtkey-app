/**
 * Storage Service - Handles persistence, encryption, export/import
 * Phase 2.2: Persistence Layer
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Girl, User, Culture } from '../types';
import { ConversationEntry, CachedSuggestion } from '../stores/useStore';

// ==========================================
// Types
// ==========================================

export interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    user: User | null;
    girls: Girl[];
    conversationHistory: ConversationEntry[];
    userCulture: Culture;
    // Note: apiKey is NOT exported for security
  };
  checksum: string;
}

export interface StorageStats {
  totalSize: number;
  girlsCount: number;
  conversationsCount: number;
  cacheSize: number;
  oldConversationsCount: number;
}

export interface CleanupResult {
  removedConversations: number;
  removedCache: number;
  freedBytes: number;
}

// ==========================================
// Constants
// ==========================================

const SECURE_KEYS = {
  API_KEY: 'flirtkey_api_key',
  ENCRYPTION_KEY: 'flirtkey_enc_key',
};

const STORAGE_KEYS = {
  MAIN: 'flirtkey-storage',
  BACKUP: 'flirtkey-backup',
  LAST_BACKUP: 'flirtkey-last-backup',
};

const EXPORT_VERSION = 1;
const MAX_AGE_DAYS = 90; // Cleanup conversations older than this

// ==========================================
// Encryption (2.2.3)
// Simple XOR encryption for sensitive data at rest
// For production, consider using expo-crypto for proper AES
// ==========================================

const getOrCreateEncryptionKey = async (): Promise<string> => {
  let key = await SecureStore.getItemAsync(SECURE_KEYS.ENCRYPTION_KEY);
  if (!key) {
    // Generate a random key
    key = Array.from({ length: 32 }, () => Math.random().toString(36).charAt(2)).join('');
    await SecureStore.setItemAsync(SECURE_KEYS.ENCRYPTION_KEY, key);
  }
  return key;
};

export const encryptData = async (data: string): Promise<string> => {
  const key = await getOrCreateEncryptionKey();
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  // Use btoa for base64 encoding in React Native
  return btoa(unescape(encodeURIComponent(result)));
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  const key = await getOrCreateEncryptionKey();
  // Use atob for base64 decoding in React Native
  const data = decodeURIComponent(escape(atob(encryptedData)));
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

// ==========================================
// Secure API Key Storage (2.2.4)
// ==========================================

export const saveApiKeySecure = async (apiKey: string): Promise<void> => {
  await SecureStore.setItemAsync(SECURE_KEYS.API_KEY, apiKey);
};

export const getApiKeySecure = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SECURE_KEYS.API_KEY);
};

export const deleteApiKeySecure = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SECURE_KEYS.API_KEY);
};

export const isApiKeyStored = async (): Promise<boolean> => {
  const key = await getApiKeySecure();
  return key !== null && key.length > 0;
};

// ==========================================
// Data Export (2.2.5)
// ==========================================

const generateChecksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const exportData = async (): Promise<ExportData> => {
  const storedData = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);

  if (!storedData) {
    throw new Error('No data to export');
  }

  const parsed = JSON.parse(storedData);
  const state = parsed.state || {};

  const exportPayload: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      user: state.user || null,
      girls: state.girls || [],
      conversationHistory: state.conversationHistory || [],
      userCulture: state.userCulture || 'universal',
    },
    checksum: '',
  };

  // Generate checksum for data integrity
  const dataString = JSON.stringify(exportPayload.data);
  exportPayload.checksum = generateChecksum(dataString);

  return exportPayload;
};

export const exportDataAsJson = async (): Promise<string> => {
  const data = await exportData();
  return JSON.stringify(data, null, 2);
};

// ==========================================
// Data Import (2.2.6)
// ==========================================

export interface ImportResult {
  success: boolean;
  imported: {
    girls: number;
    conversations: number;
  };
  errors: string[];
}

export const validateImportData = (data: unknown): data is ExportData => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (typeof d['version'] !== 'number') return false;
  if (typeof d['exportedAt'] !== 'string') return false;
  if (!d['data'] || typeof d['data'] !== 'object') return false;
  if (typeof d['checksum'] !== 'string') return false;

  const inner = d['data'] as Record<string, unknown>;
  if (!Array.isArray(inner['girls'])) return false;
  if (!Array.isArray(inner['conversationHistory'])) return false;

  // Verify checksum
  const expectedChecksum = generateChecksum(JSON.stringify(inner));
  if (d['checksum'] !== expectedChecksum) return false;

  return true;
};

export const importData = async (
  jsonString: string,
  mergeMode: 'replace' | 'merge' = 'merge'
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    imported: { girls: 0, conversations: 0 },
    errors: [],
  };

  try {
    const importPayload = JSON.parse(jsonString);

    if (!validateImportData(importPayload)) {
      result.errors.push('Invalid import data format or checksum mismatch');
      return result;
    }

    // Get existing data
    const existingDataStr = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : { state: {} };

    if (mergeMode === 'replace') {
      // Full replacement
      existingData.state = {
        ...existingData.state,
        user: importPayload.data.user,
        girls: importPayload.data.girls,
        conversationHistory: importPayload.data.conversationHistory,
        userCulture: importPayload.data.userCulture,
      };

      result.imported.girls = importPayload.data.girls.length;
      result.imported.conversations = importPayload.data.conversationHistory.length;
    } else {
      // Merge mode - add new data without duplicates
      const existingGirlIds = new Set((existingData.state.girls || []).map((g: Girl) => g.id));
      const existingConvIds = new Set(
        (existingData.state.conversationHistory || []).map((c: ConversationEntry) => c.id)
      );

      const newGirls = importPayload.data.girls.filter((g: Girl) => !existingGirlIds.has(g.id));
      const newConversations = importPayload.data.conversationHistory.filter(
        (c: ConversationEntry) => !existingConvIds.has(c.id)
      );

      existingData.state.girls = [...(existingData.state.girls || []), ...newGirls];
      existingData.state.conversationHistory = [
        ...(existingData.state.conversationHistory || []),
        ...newConversations,
      ];

      if (!existingData.state.user && importPayload.data.user) {
        existingData.state.user = importPayload.data.user;
      }

      result.imported.girls = newGirls.length;
      result.imported.conversations = newConversations.length;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MAIN, JSON.stringify(existingData));
    result.success = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown import error');
  }

  return result;
};

// ==========================================
// Backup (2.2.7)
// ==========================================

export const createLocalBackup = async (): Promise<void> => {
  const mainData = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
  if (mainData) {
    await AsyncStorage.setItem(STORAGE_KEYS.BACKUP, mainData);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
  }
};

export const restoreFromBackup = async (): Promise<boolean> => {
  const backupData = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP);
  if (backupData) {
    await AsyncStorage.setItem(STORAGE_KEYS.MAIN, backupData);
    return true;
  }
  return false;
};

export const getLastBackupTime = async (): Promise<Date | null> => {
  const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  return timestamp ? new Date(timestamp) : null;
};

export const hasBackup = async (): Promise<boolean> => {
  const backup = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP);
  return backup !== null;
};

// ==========================================
// Storage Monitoring (2.2.8)
// ==========================================

export const getStorageStats = async (): Promise<StorageStats> => {
  const mainData = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
  const mainSize = mainData ? mainData.length : 0;

  const stats: StorageStats = {
    totalSize: mainSize,
    girlsCount: 0,
    conversationsCount: 0,
    cacheSize: 0,
    oldConversationsCount: 0,
  };

  if (mainData) {
    try {
      const parsed = JSON.parse(mainData);
      const state = parsed.state || {};

      stats.girlsCount = (state.girls || []).length;
      stats.conversationsCount = (state.conversationHistory || []).length;
      stats.cacheSize = (state.suggestionsCache || []).length;

      // Count old conversations
      const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      stats.oldConversationsCount = (state.conversationHistory || []).filter(
        (c: ConversationEntry) => c.timestamp < cutoff
      ).length;
    } catch {
      // Parse error, return defaults
    }
  }

  return stats;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==========================================
// Data Cleanup (2.2.9)
// ==========================================

export const cleanupOldData = async (maxAgeDays: number = MAX_AGE_DAYS): Promise<CleanupResult> => {
  const result: CleanupResult = {
    removedConversations: 0,
    removedCache: 0,
    freedBytes: 0,
  };

  const mainDataStr = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
  if (!mainDataStr) return result;

  const beforeSize = mainDataStr.length;
  const data = JSON.parse(mainDataStr);
  const state = data.state || {};

  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  // Clean old conversations
  const originalConversations = state.conversationHistory || [];
  state.conversationHistory = originalConversations.filter(
    (c: ConversationEntry) => c.timestamp >= cutoffTime
  );
  result.removedConversations = originalConversations.length - state.conversationHistory.length;

  // Clean expired cache
  const originalCache = state.suggestionsCache || [];
  state.suggestionsCache = originalCache.filter((c: CachedSuggestion) => c.expiresAt > Date.now());
  result.removedCache = originalCache.length - state.suggestionsCache.length;

  // Save cleaned data
  data.state = state;
  const newDataStr = JSON.stringify(data);
  await AsyncStorage.setItem(STORAGE_KEYS.MAIN, newDataStr);

  const afterSize = newDataStr.length;
  result.freedBytes = Math.max(0, beforeSize - afterSize);

  return result;
};

// ==========================================
// Migration System (2.2.10) - Already in store
// This is for manual migration triggers if needed
// ==========================================

export const getCurrentStorageVersion = async (): Promise<number> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
  if (!data) return 0;

  try {
    const parsed = JSON.parse(data);
    return parsed.version || parsed.state?._version || 0;
  } catch {
    return 0;
  }
};

// ==========================================
// Persistence Tests (2.2.11, 2.2.12)
// ==========================================

export const testPersistence = async (): Promise<{
  success: boolean;
  tests: { name: string; passed: boolean; error?: string }[];
}> => {
  const tests: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: AsyncStorage write/read
  try {
    const testKey = 'flirtkey-test';
    const testValue = { test: true, timestamp: Date.now() };
    await AsyncStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);

    const parsed = JSON.parse(retrieved || '{}');
    tests.push({
      name: 'AsyncStorage Write/Read',
      passed: parsed.test === true,
    });
  } catch (error) {
    tests.push({
      name: 'AsyncStorage Write/Read',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 2: SecureStore write/read
  try {
    const testKey = 'flirtkey-secure-test';
    const testValue = 'secure-test-value';
    await SecureStore.setItemAsync(testKey, testValue);
    const retrieved = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);

    tests.push({
      name: 'SecureStore Write/Read',
      passed: retrieved === testValue,
    });
  } catch (error) {
    tests.push({
      name: 'SecureStore Write/Read',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 3: Main storage exists
  try {
    const mainData = await AsyncStorage.getItem(STORAGE_KEYS.MAIN);
    tests.push({
      name: 'Main Storage Exists',
      passed: mainData !== null,
    });
  } catch (error) {
    tests.push({
      name: 'Main Storage Exists',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 4: Storage version check
  try {
    const version = await getCurrentStorageVersion();
    tests.push({
      name: 'Storage Version Valid',
      passed: version >= 0,
    });
  } catch (error) {
    tests.push({
      name: 'Storage Version Valid',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return {
    success: tests.every((t) => t.passed),
    tests,
  };
};

// ==========================================
// Clear All Storage
// ==========================================

export const clearAllStorage = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.MAIN,
    STORAGE_KEYS.BACKUP,
    STORAGE_KEYS.LAST_BACKUP,
  ]);
  await SecureStore.deleteItemAsync(SECURE_KEYS.API_KEY);
  await SecureStore.deleteItemAsync(SECURE_KEYS.ENCRYPTION_KEY);
};

export default {
  // Encryption
  encryptData,
  decryptData,
  // Secure Storage
  saveApiKeySecure,
  getApiKeySecure,
  deleteApiKeySecure,
  isApiKeyStored,
  // Export/Import
  exportData,
  exportDataAsJson,
  importData,
  validateImportData,
  // Backup
  createLocalBackup,
  restoreFromBackup,
  getLastBackupTime,
  hasBackup,
  // Monitoring
  getStorageStats,
  formatBytes,
  // Cleanup
  cleanupOldData,
  // Tests
  testPersistence,
  // Clear
  clearAllStorage,
};
