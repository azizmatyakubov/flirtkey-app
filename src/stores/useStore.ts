import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Girl, User, Culture, Suggestion } from '../types';

// Get API key from env config (falls back to empty string)
const ENV_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';

// ==========================================
// State Types
// ==========================================

// Conversation history entry
export interface ConversationEntry {
  id: string;
  girlId: number;
  timestamp: number;
  herMessage: string;
  suggestions: Suggestion[];
  selectedSuggestion?: Suggestion;
  proTip?: string;
  interestLevel?: number;
}

// Cached suggestion
export interface CachedSuggestion {
  key: string; // Hash of input (girlId + message)
  girlId: number;
  inputMessage: string;
  suggestions: Suggestion[];
  proTip?: string;
  timestamp: number;
  expiresAt: number;
}

// Full app state
interface AppState {
  // Version for migrations
  _version: number;

  // User
  user: User | null;
  setUser: (user: User) => void;

  // Girls
  girls: Girl[];
  selectedGirl: Girl | null;
  addGirl: (
    girl: Omit<Girl, 'id' | 'messageCount'> & { relationshipStage?: Girl['relationshipStage'] }
  ) => void;
  updateGirl: (id: number, data: Partial<Girl>) => void;
  deleteGirl: (id: number) => void;
  selectGirl: (girl: Girl | null) => void;

  // Conversation History (2.1.11)
  conversationHistory: ConversationEntry[];
  addConversation: (entry: Omit<ConversationEntry, 'id' | 'timestamp'>) => void;
  getConversationsForGirl: (girlId: number) => ConversationEntry[];
  clearConversationHistory: (girlId?: number) => void;

  // Suggestions Cache (2.1.12)
  suggestionsCache: CachedSuggestion[];
  cacheSuggestions: (
    girlId: number,
    inputMessage: string,
    suggestions: Suggestion[],
    proTip?: string
  ) => void;
  getCachedSuggestions: (girlId: number, inputMessage: string) => CachedSuggestion | null;
  clearSuggestionsCache: () => void;

  // Settings
  userCulture: Culture;
  setUserCulture: (culture: Culture) => void;

  // API
  apiKey: string;
  setApiKey: (key: string) => void;

  // Clear all data (2.1.13)
  clearAllData: () => void;
}

// ==========================================
// Migration System (2.1.14)
// ==========================================

const CURRENT_VERSION = 1;

interface PersistedState {
  _version?: number;
  user?: User | null;
  girls?: Girl[];
  selectedGirl?: Girl | null;
  conversationHistory?: ConversationEntry[];
  suggestionsCache?: CachedSuggestion[];
  userCulture?: Culture;
  apiKey?: string;
}

const migrate = (persistedState: unknown, version: number): PersistedState => {
  let state = persistedState as PersistedState;

  // Migration from version 0 (or no version) to 1
  if (version === 0 || !state._version) {
    state = {
      ...state,
      _version: 1,
      conversationHistory: state.conversationHistory || [],
      suggestionsCache: state.suggestionsCache || [],
    };
  }

  // Add future migrations here:
  // if (version < 2) {
  //   state = migrateV1toV2(state);
  // }

  return state;
};

// ==========================================
// Helper Functions
// ==========================================

const generateCacheKey = (girlId: number, message: string): string => {
  // Simple hash for cache key
  const str = `${girlId}:${message.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 100;
const MAX_HISTORY_PER_GIRL = 50;

// ==========================================
// Store Creation
// ==========================================

type AppStateCreator = StateCreator<AppState, [['zustand/persist', unknown]]>;

const storeCreator: AppStateCreator = (set, get) => ({
  // Version
  _version: CURRENT_VERSION,

  // User
  user: null,
  setUser: (user) => set({ user }),

  // Girls
  girls: [],
  selectedGirl: null,

  addGirl: (girlData) => {
    const girls = get().girls;
    const newGirl: Girl = {
      ...girlData,
      id: Date.now(),
      messageCount: 0,
      relationshipStage: girlData.relationshipStage || 'just_met',
    };
    set({ girls: [...girls, newGirl], selectedGirl: newGirl });
  },

  updateGirl: (id, data) => {
    const girls = get().girls.map((g) => (g.id === id ? { ...g, ...data } : g));
    const selectedGirl = get().selectedGirl;
    set({
      girls,
      selectedGirl: selectedGirl?.id === id ? { ...selectedGirl, ...data } : selectedGirl,
    });
  },

  deleteGirl: (id) => {
    // Also clear related conversation history
    const conversationHistory = get().conversationHistory.filter((c) => c.girlId !== id);
    set({
      girls: get().girls.filter((g) => g.id !== id),
      selectedGirl: get().selectedGirl?.id === id ? null : get().selectedGirl,
      conversationHistory,
    });
  },

  selectGirl: (girl) => set({ selectedGirl: girl }),

  // Conversation History (2.1.11)
  conversationHistory: [],

  addConversation: (entry) => {
    const newEntry: ConversationEntry = {
      ...entry,
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const history = get().conversationHistory;
    const girlHistory = history.filter((c) => c.girlId === entry.girlId);

    // Limit history per girl
    let updatedHistory = [...history, newEntry];
    if (girlHistory.length >= MAX_HISTORY_PER_GIRL) {
      // Remove oldest entries for this girl
      const toRemove = girlHistory.slice(0, girlHistory.length - MAX_HISTORY_PER_GIRL + 1);
      const toRemoveIds = new Set(toRemove.map((c) => c.id));
      updatedHistory = updatedHistory.filter((c) => !toRemoveIds.has(c.id));
    }

    // Update girl's message count
    const girls = get().girls.map((g) =>
      g.id === entry.girlId ? { ...g, messageCount: g.messageCount + 1 } : g
    );

    set({ conversationHistory: updatedHistory, girls });
  },

  getConversationsForGirl: (girlId) => {
    return get()
      .conversationHistory.filter((c) => c.girlId === girlId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  clearConversationHistory: (girlId) => {
    if (girlId !== undefined) {
      set({
        conversationHistory: get().conversationHistory.filter((c) => c.girlId !== girlId),
      });
    } else {
      set({ conversationHistory: [] });
    }
  },

  // Suggestions Cache (2.1.12)
  suggestionsCache: [],

  cacheSuggestions: (girlId, inputMessage, suggestions, proTip) => {
    const key = generateCacheKey(girlId, inputMessage);
    const now = Date.now();

    const newCacheEntry: CachedSuggestion = {
      key,
      girlId,
      inputMessage,
      suggestions,
      proTip,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    };

    let cache = get().suggestionsCache;

    // Remove expired entries
    cache = cache.filter((c) => c.expiresAt > now);

    // Remove existing entry with same key
    cache = cache.filter((c) => c.key !== key);

    // Add new entry
    cache.push(newCacheEntry);

    // Limit cache size
    if (cache.length > MAX_CACHE_SIZE) {
      // Remove oldest entries
      cache = cache.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_CACHE_SIZE);
    }

    set({ suggestionsCache: cache });
  },

  getCachedSuggestions: (girlId, inputMessage) => {
    const key = generateCacheKey(girlId, inputMessage);
    const now = Date.now();
    const cached = get().suggestionsCache.find((c) => c.key === key && c.expiresAt > now);
    return cached || null;
  },

  clearSuggestionsCache: () => {
    set({ suggestionsCache: [] });
  },

  // Settings
  userCulture: 'universal',
  setUserCulture: (culture) => set({ userCulture: culture }),

  // API — auto-load from env if no key is persisted
  apiKey: ENV_API_KEY,
  setApiKey: (key) => set({ apiKey: key }),

  // Clear all data (2.1.13)
  clearAllData: () => {
    set({
      user: null,
      girls: [],
      selectedGirl: null,
      conversationHistory: [],
      suggestionsCache: [],
      userCulture: 'universal',
      apiKey: '',
    });
  },
});

// Persist configuration
const persistConfig: PersistOptions<AppState, PersistedState> = {
  name: 'flirtkey-storage',
  storage: createJSONStorage(() => AsyncStorage),
  version: CURRENT_VERSION,
  migrate,
  partialize: (state) => ({
    _version: state._version,
    user: state.user,
    girls: state.girls,
    selectedGirl: state.selectedGirl,
    conversationHistory: state.conversationHistory,
    suggestionsCache: state.suggestionsCache,
    userCulture: state.userCulture,
    apiKey: state.apiKey,
  }),
};

export const useStore = create<AppState>()(persist(storeCreator, persistConfig));

// ==========================================
// Selectors (2.1.15)
// ==========================================

// Get girl by ID
export const selectGirlById = (id: number) => (state: AppState) =>
  state.girls.find((g) => g.id === id);

// Get girls sorted by recent activity
export const selectGirlsSortedByRecent = (state: AppState) =>
  [...state.girls].sort((a, b) => {
    const aTime = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
    const bTime = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
    return bTime - aTime;
  });

// Get girls by relationship stage
export const selectGirlsByStage = (stage: Girl['relationshipStage']) => (state: AppState) =>
  state.girls.filter((g) => g.relationshipStage === stage);

// Get total message count
export const selectTotalMessageCount = (state: AppState) =>
  state.girls.reduce((sum, g) => sum + g.messageCount, 0);

// Get girls count
export const selectGirlsCount = (state: AppState) => state.girls.length;

// Check if user has any data
export const selectHasData = (state: AppState) =>
  state.girls.length > 0 || state.conversationHistory.length > 0;

// Check if API key is set
export const selectHasApiKey = (state: AppState) => state.apiKey.length > 0;

// Get recent conversations
export const selectRecentConversations =
  (limit: number = 10) =>
  (state: AppState) =>
    [...state.conversationHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

// Get conversation count for a girl
export const selectConversationCountForGirl = (girlId: number) => (state: AppState) =>
  state.conversationHistory.filter((c) => c.girlId === girlId).length;

// Search girls by name
export const selectGirlsBySearch = (query: string) => (state: AppState) => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return state.girls;
  return state.girls.filter(
    (g) =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.nickname?.toLowerCase().includes(lowerQuery) ||
      g.interests?.toLowerCase().includes(lowerQuery)
  );
};

// Get cache stats
export const selectCacheStats = (state: AppState) => ({
  totalCached: state.suggestionsCache.length,
  expiredCount: state.suggestionsCache.filter((c) => c.expiresAt <= Date.now()).length,
});
