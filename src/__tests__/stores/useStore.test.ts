/**
 * Zustand Store Tests
 * Phase 9.1.3, 9.1.4: Test store actions and selectors
 */

import {
  useStore,
  selectGirlById,
  selectGirlsSortedByRecent,
  selectGirlsByStage,
  selectTotalMessageCount,
  selectGirlsCount,
  selectHasData,
  selectHasApiKey,
  selectGirlsBySearch,
  selectCacheStats,
} from '../../stores/useStore';
import { Suggestion } from '../../types';

describe('Zustand Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  // ==========================================
  // User State Tests
  // ==========================================

  describe('User State', () => {
    it('initializes with null user', () => {
      const { user } = useStore.getState();
      expect(user).toBeNull();
    });

    it('sets user', () => {
      const testUser = {
        id: 1,
        name: 'Test User',
        culture: 'western',
        language: 'en',
      };

      useStore.getState().setUser(testUser);

      expect(useStore.getState().user).toEqual(testUser);
    });
  });

  // ==========================================
  // Girls State Tests (9.1.3)
  // ==========================================

  describe('Girls State', () => {
    const mockGirl = {
      name: 'Anna',
      age: 25,
      culture: 'western',
      personality: 'Fun and outgoing',
      interests: 'Music, travel',
      relationshipStage: 'talking' as const,
    };

    it('initializes with empty girls array', () => {
      const { girls } = useStore.getState();
      expect(girls).toEqual([]);
    });

    it('adds a girl', () => {
      useStore.getState().addGirl(mockGirl);

      const { girls, selectedGirl } = useStore.getState();
      expect(girls).toHaveLength(1);
      expect(girls[0].name).toBe('Anna');
      expect(girls[0].messageCount).toBe(0);
      expect(girls[0].id).toBeDefined();
      expect(selectedGirl).toEqual(girls[0]);
    });

    it('adds multiple girls', () => {
      useStore.getState().addGirl({ ...mockGirl, name: 'Anna' });
      useStore.getState().addGirl({ ...mockGirl, name: 'Maria' });
      useStore.getState().addGirl({ ...mockGirl, name: 'Sofia' });

      const { girls } = useStore.getState();
      expect(girls).toHaveLength(3);
    });

    it('updates a girl', () => {
      useStore.getState().addGirl(mockGirl);

      const { girls } = useStore.getState();
      const girlId = girls[0].id;

      useStore.getState().updateGirl(girlId, { name: 'Anna Updated', age: 26 });

      const updatedGirl = useStore.getState().girls[0];
      expect(updatedGirl.name).toBe('Anna Updated');
      expect(updatedGirl.age).toBe(26);
    });

    it('updates selected girl when updating current selection', () => {
      useStore.getState().addGirl(mockGirl);

      const { girls } = useStore.getState();
      const girlId = girls[0].id;

      useStore.getState().updateGirl(girlId, { name: 'Updated' });

      expect(useStore.getState().selectedGirl?.name).toBe('Updated');
    });

    it('deletes a girl', () => {
      useStore.getState().addGirl(mockGirl);

      const { girls } = useStore.getState();
      const girlId = girls[0].id;

      useStore.getState().deleteGirl(girlId);

      expect(useStore.getState().girls).toHaveLength(0);
      expect(useStore.getState().selectedGirl).toBeNull();
    });

    it('clears selected girl when deleting her', () => {
      useStore.getState().addGirl(mockGirl);

      const girlId = useStore.getState().girls[0].id;

      useStore.getState().deleteGirl(girlId);

      expect(useStore.getState().selectedGirl).toBeNull();
    });

    it('selects a girl', () => {
      useStore.getState().addGirl(mockGirl);

      const girl = useStore.getState().girls[0];

      useStore.getState().selectGirl(null);

      expect(useStore.getState().selectedGirl).toBeNull();

      useStore.getState().selectGirl(girl);

      expect(useStore.getState().selectedGirl).toEqual(girl);
    });
  });

  // ==========================================
  // Conversation History Tests
  // ==========================================

  describe('Conversation History', () => {
    const mockSuggestions: Suggestion[] = [
      { type: 'safe', text: 'Hey!', reason: 'Safe' },
      { type: 'balanced', text: 'Hi there!', reason: 'Balanced' },
      { type: 'bold', text: 'Well hello...', reason: 'Bold' },
    ];

    beforeEach(() => {
      useStore.getState().addGirl({
        name: 'Anna',
        relationshipStage: 'talking',
      });
    });

    it('adds conversation entry', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().addConversation({
        girlId,
        herMessage: 'Hey there!',
        suggestions: mockSuggestions,
        proTip: 'Be confident!',
      });

      const { conversationHistory } = useStore.getState();
      expect(conversationHistory).toHaveLength(1);
      expect(conversationHistory[0].herMessage).toBe('Hey there!');
      expect(conversationHistory[0].id).toBeDefined();
      expect(conversationHistory[0].timestamp).toBeDefined();
    });

    it('increments girl message count', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().addConversation({
        girlId,
        herMessage: 'Message 1',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        girlId,
        herMessage: 'Message 2',
        suggestions: mockSuggestions,
      });

      const girl = useStore.getState().girls[0];
      expect(girl.messageCount).toBe(2);
    });

    it('gets conversations for girl', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().addConversation({
        girlId,
        herMessage: 'Message 1',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        girlId,
        herMessage: 'Message 2',
        suggestions: mockSuggestions,
      });

      const conversations = useStore.getState().getConversationsForGirl(girlId);
      expect(conversations).toHaveLength(2);
      // Verify both messages are present
      const messages = conversations.map((c) => c.herMessage);
      expect(messages).toContain('Message 1');
      expect(messages).toContain('Message 2');
    });

    it('clears conversation history for specific girl', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().addConversation({
        girlId,
        herMessage: 'Test message',
        suggestions: mockSuggestions,
      });
      useStore.getState().clearConversationHistory(girlId);

      const conversations = useStore.getState().getConversationsForGirl(girlId);
      expect(conversations).toHaveLength(0);
    });

    it('clears all conversation history', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().addConversation({
        girlId,
        herMessage: 'Test message',
        suggestions: mockSuggestions,
      });
      useStore.getState().clearConversationHistory();

      expect(useStore.getState().conversationHistory).toHaveLength(0);
    });
  });

  // ==========================================
  // Suggestions Cache Tests
  // ==========================================

  describe('Suggestions Cache', () => {
    const mockSuggestions: Suggestion[] = [{ type: 'safe', text: 'Hey!', reason: 'Safe' }];

    beforeEach(() => {
      useStore.getState().addGirl({
        name: 'Anna',
        relationshipStage: 'talking',
      });
    });

    it('caches suggestions', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().cacheSuggestions(girlId, 'Hello there', mockSuggestions, 'Pro tip');

      const cached = useStore.getState().getCachedSuggestions(girlId, 'Hello there');
      expect(cached).not.toBeNull();
      expect(cached?.suggestions).toEqual(mockSuggestions);
      expect(cached?.proTip).toBe('Pro tip');
    });

    it('returns null for non-existent cache', () => {
      const girlId = useStore.getState().girls[0].id;
      const cached = useStore.getState().getCachedSuggestions(girlId, 'Non-existent message');
      expect(cached).toBeNull();
    });

    it('clears suggestions cache', () => {
      const girlId = useStore.getState().girls[0].id;

      useStore.getState().cacheSuggestions(girlId, 'Hello', mockSuggestions);
      useStore.getState().clearSuggestionsCache();

      const cached = useStore.getState().getCachedSuggestions(girlId, 'Hello');
      expect(cached).toBeNull();
    });
  });

  // ==========================================
  // Settings Tests
  // ==========================================

  describe('Settings', () => {
    it('initializes with default culture', () => {
      const { userCulture } = useStore.getState();
      expect(userCulture).toBe('universal');
    });

    it('sets user culture', () => {
      useStore.getState().setUserCulture('western');

      expect(useStore.getState().userCulture).toBe('western');
    });

    it('initializes with empty API key', () => {
      const { apiKey } = useStore.getState();
      expect(apiKey).toBe('');
    });

    it('sets API key', () => {
      useStore.getState().setApiKey('sk-test123');

      expect(useStore.getState().apiKey).toBe('sk-test123');
    });
  });

  // ==========================================
  // Clear All Data Test
  // ==========================================

  describe('clearAllData', () => {
    it('clears all data', () => {
      useStore.getState().setUser({ id: 1, name: 'Test', culture: 'western', language: 'en' });
      useStore.getState().addGirl({ name: 'Anna', relationshipStage: 'talking' });
      useStore.getState().setApiKey('sk-test');
      useStore.getState().setUserCulture('russian');
      useStore.getState().clearAllData();

      const state = useStore.getState();
      expect(state.user).toBeNull();
      expect(state.girls).toHaveLength(0);
      expect(state.selectedGirl).toBeNull();
      expect(state.conversationHistory).toHaveLength(0);
      expect(state.suggestionsCache).toHaveLength(0);
      expect(state.userCulture).toBe('universal');
      expect(state.apiKey).toBe('');
    });
  });

  // ==========================================
  // Selectors Tests (9.1.4)
  // ==========================================

  describe('Selectors', () => {
    beforeEach(() => {
      useStore.getState().addGirl({ name: 'Anna', relationshipStage: 'talking' });
      useStore.getState().addGirl({ name: 'Maria', relationshipStage: 'flirting' });
      useStore.getState().addGirl({ name: 'Sofia', relationshipStage: 'talking' });
    });

    describe('selectGirlById', () => {
      it('finds girl by ID', () => {
        const state = useStore.getState();
        const girlId = state.girls[0].id;
        const girl = selectGirlById(girlId)(state);
        expect(girl?.name).toBe('Anna');
      });

      it('returns undefined for non-existent ID', () => {
        const state = useStore.getState();
        const girl = selectGirlById(99999)(state);
        expect(girl).toBeUndefined();
      });
    });

    describe('selectGirlsSortedByRecent', () => {
      it('sorts girls by recent activity', () => {
        // Update one girl with recent date
        const state = useStore.getState();
        const mariaId = state.girls.find((g) => g.name === 'Maria')?.id;
        if (mariaId) {
          useStore.getState().updateGirl(mariaId, {
            lastMessageDate: new Date().toISOString(),
          });
        }

        const sorted = selectGirlsSortedByRecent(useStore.getState());
        // The one with lastMessageDate should be first
        expect(sorted[0].lastMessageDate).toBeDefined();
      });
    });

    describe('selectGirlsByStage', () => {
      it('filters girls by stage', () => {
        const state = useStore.getState();
        const talkingGirls = selectGirlsByStage('talking')(state);
        expect(talkingGirls).toHaveLength(2);
        expect(talkingGirls.every((g) => g.relationshipStage === 'talking')).toBe(true);
      });
    });

    describe('selectTotalMessageCount', () => {
      it('sums all message counts', () => {
        // Clear and add fresh girl for this test
        useStore.getState().clearAllData();
        useStore.getState().addGirl({ name: 'Test', relationshipStage: 'talking' });

        const initialCount = selectTotalMessageCount(useStore.getState());
        expect(initialCount).toBe(0);

        const girlId = useStore.getState().girls[0].id;
        useStore.getState().addConversation({
          girlId,
          herMessage: 'Test',
          suggestions: [{ type: 'safe', text: 'Hi', reason: '' }],
        });

        const total = selectTotalMessageCount(useStore.getState());
        expect(total).toBe(1);
      });
    });

    describe('selectGirlsCount', () => {
      it('returns girls count', () => {
        const count = selectGirlsCount(useStore.getState());
        expect(count).toBe(3);
      });
    });

    describe('selectHasData', () => {
      it('returns true when has girls', () => {
        expect(selectHasData(useStore.getState())).toBe(true);
      });

      it('returns false when empty', () => {
        useStore.getState().clearAllData();
        expect(selectHasData(useStore.getState())).toBe(false);
      });
    });

    describe('selectHasApiKey', () => {
      it('returns false when no API key', () => {
        expect(selectHasApiKey(useStore.getState())).toBe(false);
      });

      it('returns true when API key set', () => {
        useStore.getState().setApiKey('sk-test');
        expect(selectHasApiKey(useStore.getState())).toBe(true);
      });
    });

    describe('selectGirlsBySearch', () => {
      it('searches by name', () => {
        const results = selectGirlsBySearch('anna')(useStore.getState());
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Anna');
      });

      it('searches case-insensitively', () => {
        const results = selectGirlsBySearch('MARIA')(useStore.getState());
        expect(results).toHaveLength(1);
      });

      it('returns all for empty query', () => {
        const results = selectGirlsBySearch('')(useStore.getState());
        expect(results).toHaveLength(3);
      });
    });

    describe('selectCacheStats', () => {
      it('returns cache statistics', () => {
        const stats = selectCacheStats(useStore.getState());
        expect(stats).toHaveProperty('totalCached');
        expect(stats).toHaveProperty('expiredCount');
      });
    });
  });
});
