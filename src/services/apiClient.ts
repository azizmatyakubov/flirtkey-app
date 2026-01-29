/**
 * API Client — Unified interface for AI requests.
 *
 * Supports two modes:
 *  1. **Server proxy** (default) — requests go through the FlirtKey backend
 *     which holds the OpenAI key. Users don't need their own key.
 *  2. **BYOK** (bring-your-own-key) — requests go directly to OpenAI using
 *     the user's personal API key. Available as a fallback in Settings.
 *
 * The rest of the app calls `apiClient.chatCompletion(...)` and doesn't
 * care which mode is active.
 */

import axios, { CancelTokenSource } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ==========================================
// Types
// ==========================================

export type ApiMode = 'proxy' | 'byok';

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Server proxy metadata (only present in proxy mode) */
  _flirtkey?: {
    tier: string;
    usedToday: number;
    dailyLimit: number | null;
    remainingToday: number | null;
  };
}

export interface ProxyAuthResult {
  token: string;
  userId: string;
  tier: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
}

export interface UsageInfo {
  tier: string;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  resetsAt: string;
}

// ==========================================
// Constants
// ==========================================

// Default proxy URL — can be overridden in settings
const DEFAULT_PROXY_URL = 'https://api.flirtkey.app';
// Dev fallback
const DEV_PROXY_URL = 'http://localhost:4060';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Storage keys
const PROXY_TOKEN_KEY = 'flirtkey_proxy_token';
const PROXY_USER_ID_KEY = 'flirtkey_proxy_user_id';

// ==========================================
// State (module-level singleton)
// ==========================================

let _proxyToken: string | null = null;
let _proxyUserId: string | null = null;
let _initialized = false;

// ==========================================
// Helpers
// ==========================================

function getProxyBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.['proxyUrl'] || (__DEV__ ? DEV_PROXY_URL : DEFAULT_PROXY_URL);
}

/**
 * Generate a stable device ID. Uses a UUID stored in AsyncStorage so it
 * persists across app restarts but is unique per installation.
 */
async function getDeviceId(): Promise<string> {
  const key = 'flirtkey_device_id';
  let deviceId = await AsyncStorage.getItem(key);
  if (!deviceId) {
    // Generate a pseudo-UUID
    deviceId =
      'dev_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);
    await AsyncStorage.setItem(key, deviceId);
  }
  return deviceId;
}

// ==========================================
// Init & Auth
// ==========================================

/**
 * Load persisted proxy token from storage.
 * Called once on app start.
 */
async function init(): Promise<void> {
  if (_initialized) return;
  try {
    _proxyToken = await AsyncStorage.getItem(PROXY_TOKEN_KEY);
    _proxyUserId = await AsyncStorage.getItem(PROXY_USER_ID_KEY);
  } catch {
    // Ignore storage errors
  }
  _initialized = true;
}

/**
 * Register with the proxy server and obtain an auth token.
 * Automatically called before the first proxy request if no token exists.
 */
async function registerWithProxy(): Promise<ProxyAuthResult> {
  const deviceId = await getDeviceId();
  const baseUrl = getProxyBaseUrl();

  const res = await axios.post(`${baseUrl}/auth/register`, { deviceId }, { timeout: 10_000 });
  const data = res.data as ProxyAuthResult;

  // Persist token
  _proxyToken = data.token;
  _proxyUserId = data.userId;
  await AsyncStorage.setItem(PROXY_TOKEN_KEY, data.token);
  await AsyncStorage.setItem(PROXY_USER_ID_KEY, data.userId);

  return data;
}

/**
 * Ensure we have a valid proxy token (register if needed).
 */
async function ensureProxyToken(): Promise<string> {
  await init();
  if (_proxyToken) return _proxyToken;
  const result = await registerWithProxy();
  return result.token;
}

// ==========================================
// Public API
// ==========================================

/**
 * Make a chat completion request.
 *
 * @param mode - 'proxy' (server handles the key) or 'byok' (user's key)
 * @param request - OpenAI-compatible chat completion params
 * @param apiKey - Required only when mode === 'byok'
 * @param cancelToken - Optional axios cancel token
 */
async function chatCompletion(
  mode: ApiMode,
  request: ChatCompletionRequest,
  apiKey?: string,
  cancelToken?: CancelTokenSource
): Promise<ChatCompletionResponse> {
  if (mode === 'byok') {
    return chatCompletionDirect(request, apiKey!, cancelToken);
  }
  return chatCompletionProxy(request, cancelToken);
}

/**
 * Direct OpenAI request (BYOK mode).
 */
async function chatCompletionDirect(
  request: ChatCompletionRequest,
  apiKey: string,
  cancelToken?: CancelTokenSource
): Promise<ChatCompletionResponse> {
  const response = await axios.post(
    `${OPENAI_BASE_URL}/chat/completions`,
    {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.8,
      max_tokens: request.max_tokens ?? 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: request.model === 'gpt-4o' ? 60_000 : 30_000,
      cancelToken: cancelToken?.token,
    }
  );
  return response.data;
}

/**
 * Proxy request (server mode).
 */
async function chatCompletionProxy(
  request: ChatCompletionRequest,
  cancelToken?: CancelTokenSource
): Promise<ChatCompletionResponse> {
  const token = await ensureProxyToken();
  const baseUrl = getProxyBaseUrl();

  const response = await axios.post(
    `${baseUrl}/proxy/chat/completions`,
    {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.8,
      max_tokens: request.max_tokens ?? 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: request.model === 'gpt-4o' ? 60_000 : 30_000,
      cancelToken: cancelToken?.token,
    }
  );
  return response.data;
}

/**
 * Get proxy usage info.
 */
async function getProxyUsage(): Promise<UsageInfo | null> {
  try {
    const token = await ensureProxyToken();
    const baseUrl = getProxyBaseUrl();
    const res = await axios.get(`${baseUrl}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5_000,
    });
    return res.data as UsageInfo;
  } catch {
    return null;
  }
}

/**
 * Check if proxy server is available.
 */
async function checkProxyHealth(): Promise<boolean> {
  try {
    const baseUrl = getProxyBaseUrl();
    const res = await axios.get(`${baseUrl}/health`, { timeout: 5_000 });
    return res.data?.status === 'ok' && res.data?.hasApiKey === true;
  } catch {
    return false;
  }
}

/**
 * Clear stored proxy credentials (for logout/reset).
 */
async function clearProxyAuth(): Promise<void> {
  _proxyToken = null;
  _proxyUserId = null;
  _initialized = false;
  await AsyncStorage.multiRemove([PROXY_TOKEN_KEY, PROXY_USER_ID_KEY]);
}

/**
 * Get the current proxy user ID.
 */
function getProxyUserId(): string | null {
  return _proxyUserId;
}

// ==========================================
// Export
// ==========================================

export const apiClient = {
  chatCompletion,
  getProxyUsage,
  checkProxyHealth,
  clearProxyAuth,
  getProxyUserId,
  registerWithProxy,
  init,
};

export default apiClient;
