import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Contact, User, Culture, Suggestion } from '../types';

// Get API key from env config (falls back to empty string)
const ENV_API_KEY = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.['openaiApiKey'] || '';

// ==========================================
// State Types
// ==========================================

// Conversation history entry
export interface ConversationEntry {
  id: string;
  contactId: number;
  timestamp: number;
  theirMessage: string;
  suggestions: Suggestion[];
  selectedSuggestion?: Suggestion;
  proTip?: string;
  interestLevel?: number;
}

// Cached suggestion
export interface CachedSuggestion {
  key: string; // Hash of input (contactId + message)
  contactId: number;
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

  // Contacts
  contacts: Contact[];
  selectedContact: Contact | null;
  addContact: (
    contact: Omit<Contact, 'id' | 'messageCount'> & { relationshipStage?: Contact['relationshipStage'] }
  ) => void;
  updateContact: (id: number, data: Partial<Contact>) => void;
  deleteContact: (id: number) => void;
  selectContact: (contact: Contact | null) => void;

  // Conversation History (2.1.11)
  conversationHistory: ConversationEntry[];
  addConversation: (entry: Omit<ConversationEntry, 'id' | 'timestamp'>) => void;
  getConversationsForContact: (contactId: number) => ConversationEntry[];
  clearConversationHistory: (contactId?: number) => void;
  selectSuggestion: (conversationId: string, suggestion: Suggestion) => void;
  getLastConversationForContact: (contactId: number) => ConversationEntry | null;

  // Suggestions Cache (2.1.12)
  suggestionsCache: CachedSuggestion[];
  cacheSuggestions: (
    contactId: number,
    inputMessage: string,
    suggestions: Suggestion[],
    proTip?: string
  ) => void;
  getCachedSuggestions: (contactId: number, inputMessage: string) => CachedSuggestion | null;
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
  contacts?: Contact[];
  selectedContact?: Contact | null;
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

const generateCacheKey = (contactId: number, message: string): string => {
  // Simple hash for cache key
  const str = `${contactId}:${message.toLowerCase().trim()}`;
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
const MAX_HISTORY_PER_CONTACT = 50;

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

  // Contacts
  contacts: [],
  selectedContact: null,

  addContact: (contactData) => {
    const contacts = get().contacts;
    const newGirl: Contact = {
      ...contactData,
      id: Date.now(),
      messageCount: 0,
      relationshipStage: contactData.relationshipStage || 'just_met',
    };
    set({ contacts: [...contacts, newGirl], selectedContact: newGirl });
  },

  updateContact: (id, data) => {
    const contacts = get().contacts.map((g) => (g.id === id ? { ...g, ...data } : g));
    const selectedContact = get().selectedContact;
    set({
      contacts,
      selectedContact: selectedContact?.id === id ? { ...selectedContact, ...data } : selectedContact,
    });
  },

  deleteContact: (id) => {
    // Also clear related conversation history
    const conversationHistory = get().conversationHistory.filter((c) => c.contactId !== id);
    set({
      contacts: get().contacts.filter((g) => g.id !== id),
      selectedContact: get().selectedContact?.id === id ? null : get().selectedContact,
      conversationHistory,
    });
  },

  selectContact: (contact) => set({ selectedContact: contact }),

  // Conversation History (2.1.11)
  conversationHistory: [],

  addConversation: (entry) => {
    const newEntry: ConversationEntry = {
      ...entry,
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const history = get().conversationHistory;
    const contactHistory = history.filter((c) => c.contactId === entry.contactId);

    // Limit history per contact
    let updatedHistory = [...history, newEntry];
    if (contactHistory.length >= MAX_HISTORY_PER_CONTACT) {
      // Remove oldest entries for this contact
      const toRemove = contactHistory.slice(0, contactHistory.length - MAX_HISTORY_PER_CONTACT + 1);
      const toRemoveIds = new Set(toRemove.map((c) => c.id));
      updatedHistory = updatedHistory.filter((c) => !toRemoveIds.has(c.id));
    }

    // Update contact's message count
    const contacts = get().contacts.map((g) =>
      g.id === entry.contactId ? { ...g, messageCount: g.messageCount + 1 } : g
    );

    set({ conversationHistory: updatedHistory, contacts });
  },

  getConversationsForContact: (contactId) => {
    return get()
      .conversationHistory.filter((c) => c.contactId === contactId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  clearConversationHistory: (contactId) => {
    if (contactId !== undefined) {
      set({
        conversationHistory: get().conversationHistory.filter((c) => c.contactId !== contactId),
      });
    } else {
      set({ conversationHistory: [] });
    }
  },

  selectSuggestion: (conversationId, suggestion) => {
    const updatedHistory = get().conversationHistory.map((c) =>
      c.id === conversationId ? { ...c, selectedSuggestion: suggestion } : c
    );
    set({ conversationHistory: updatedHistory });
  },

  getLastConversationForContact: (contactId) => {
    const convos = get()
      .conversationHistory.filter((c) => c.contactId === contactId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return convos.length > 0 ? (convos[0] ?? null) : null;
  },

  // Suggestions Cache (2.1.12)
  suggestionsCache: [],

  cacheSuggestions: (contactId, inputMessage, suggestions, proTip) => {
    const key = generateCacheKey(contactId, inputMessage);
    const now = Date.now();

    const newCacheEntry: CachedSuggestion = {
      key,
      contactId,
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

  getCachedSuggestions: (contactId, inputMessage) => {
    const key = generateCacheKey(contactId, inputMessage);
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
      contacts: [],
      selectedContact: null,
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
    contacts: state.contacts,
    selectedContact: state.selectedContact,
    conversationHistory: state.conversationHistory,
    // suggestionsCache excluded — ephemeral, rebuilt on use
    userCulture: state.userCulture,
    apiKey: state.apiKey,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return;
    // If persisted apiKey is empty but env has one, use env key
    if (!state.apiKey && ENV_API_KEY) {
      state.apiKey = ENV_API_KEY;
    }
    // Clean expired cache entries on startup
    const now = Date.now();
    if (state.suggestionsCache?.length) {
      state.suggestionsCache = state.suggestionsCache.filter((c) => c.expiresAt > now);
    }
  },
};

export const useStore = create<AppState>()(persist(storeCreator, persistConfig));

// ==========================================
// Selectors (2.1.15)
// ==========================================

// Get contact by ID
export const selectContactById = (id: number) => (state: AppState) =>
  state.contacts.find((g) => g.id === id);

// Get contacts sorted by recent activity
export const selectContactsSortedByRecent = (state: AppState) =>
  [...state.contacts].sort((a, b) => {
    const aTime = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
    const bTime = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
    return bTime - aTime;
  });

// Get contacts by relationship stage
export const selectContactsByStage = (stage: Contact['relationshipStage']) => (state: AppState) =>
  state.contacts.filter((g) => g.relationshipStage === stage);

// Get total message count
export const selectTotalMessageCount = (state: AppState) =>
  state.contacts.reduce((sum, g) => sum + g.messageCount, 0);

// Get contacts count
export const selectContactsCount = (state: AppState) => state.contacts.length;

// Check if user has any data
export const selectHasData = (state: AppState) =>
  state.contacts.length > 0 || state.conversationHistory.length > 0;

// Check if API key is set
export const selectHasApiKey = (state: AppState) => state.apiKey.length > 0;

// Get recent conversations
export const selectRecentConversations =
  (limit: number = 10) =>
  (state: AppState) =>
    [...state.conversationHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

// Get conversation count for a contact
export const selectConversationCountForContact = (contactId: number) => (state: AppState) =>
  state.conversationHistory.filter((c) => c.contactId === contactId).length;

// Search contacts by name
export const selectContactsBySearch = (query: string) => (state: AppState) => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return state.contacts;
  return state.contacts.filter(
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
