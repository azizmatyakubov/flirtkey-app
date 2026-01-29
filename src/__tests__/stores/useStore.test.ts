/**
 * Zustand Store Tests
 * Phase 9.1.3, 9.1.4: Test store actions and selectors
 */

import {
  useStore,
  selectContactById,
  selectContactsSortedByRecent,
  selectContactsByStage,
  selectTotalMessageCount,
  selectContactsCount,
  selectHasData,
  selectHasApiKey,
  selectContactsBySearch,
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
  // Contacts State Tests (9.1.3)
  // ==========================================

  describe('Contacts State', () => {
    const mockContact = {
      name: 'Anna',
      age: 25,
      culture: 'western',
      personality: 'Fun and outgoing',
      interests: 'Music, travel',
      relationshipStage: 'talking' as const,
    };

    it('initializes with empty contacts array', () => {
      const { contacts } = useStore.getState();
      expect(contacts).toEqual([]);
    });

    it('adds a contact', () => {
      useStore.getState().addContact(mockContact);

      const { contacts, selectedContact } = useStore.getState();
      expect(contacts).toHaveLength(1);
      expect(contacts[0]!.name).toBe('Anna');
      expect(contacts[0]!.messageCount).toBe(0);
      expect(contacts[0]!.id).toBeDefined();
      expect(selectedContact).toEqual(contacts[0]);
    });

    it('adds multiple contacts', () => {
      useStore.getState().addContact({ ...mockContact, name: 'Anna' });
      useStore.getState().addContact({ ...mockContact, name: 'Maria' });
      useStore.getState().addContact({ ...mockContact, name: 'Sofia' });

      const { contacts } = useStore.getState();
      expect(contacts).toHaveLength(3);
    });

    it('updates a contact', () => {
      useStore.getState().addContact(mockContact);

      const { contacts } = useStore.getState();
      const contactId = contacts[0]!.id;

      useStore.getState().updateContact(contactId, { name: 'Anna Updated', age: 26 });

      const updatedContact = useStore.getState().contacts[0]!;
      expect(updatedContact.name).toBe('Anna Updated');
      expect(updatedContact.age).toBe(26);
    });

    it('updates selected contact when updating current selection', () => {
      useStore.getState().addContact(mockContact);

      const { contacts } = useStore.getState();
      const contactId = contacts[0]!.id;

      useStore.getState().updateContact(contactId, { name: 'Updated' });

      expect(useStore.getState().selectedContact?.name).toBe('Updated');
    });

    it('deletes a contact', () => {
      useStore.getState().addContact(mockContact);

      const { contacts } = useStore.getState();
      const contactId = contacts[0]!.id;

      useStore.getState().deleteContact(contactId);

      expect(useStore.getState().contacts).toHaveLength(0);
      expect(useStore.getState().selectedContact).toBeNull();
    });

    it('clears selected contact when deleting her', () => {
      useStore.getState().addContact(mockContact);

      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().deleteContact(contactId);

      expect(useStore.getState().selectedContact).toBeNull();
    });

    it('selects a contact', () => {
      useStore.getState().addContact(mockContact);

      const contact = useStore.getState().contacts[0]!;

      useStore.getState().selectContact(null);

      expect(useStore.getState().selectedContact).toBeNull();

      useStore.getState().selectContact(contact);

      expect(useStore.getState().selectedContact).toEqual(contact);
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
      useStore.getState().addContact({
        name: 'Anna',
        relationshipStage: 'talking',
      });
    });

    it('adds conversation entry', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Hey there!',
        suggestions: mockSuggestions,
        proTip: 'Be confident!',
      });

      const { conversationHistory } = useStore.getState();
      expect(conversationHistory).toHaveLength(1);
      expect(conversationHistory[0]!.theirMessage).toBe('Hey there!');
      expect(conversationHistory[0]!.id).toBeDefined();
      expect(conversationHistory[0]!.timestamp).toBeDefined();
    });

    it('increments contact message count', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 1',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 2',
        suggestions: mockSuggestions,
      });

      const contact = useStore.getState().contacts[0]!;
      expect(contact.messageCount).toBe(2);
    });

    it('gets conversations for contact', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 1',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 2',
        suggestions: mockSuggestions,
      });

      const conversations = useStore.getState().getConversationsForContact(contactId);
      expect(conversations).toHaveLength(2);
      // Verify both messages are present
      const messages = conversations.map((c) => c.theirMessage);
      expect(messages).toContain('Message 1');
      expect(messages).toContain('Message 2');
    });

    it('clears conversation history for specific contact', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Test message',
        suggestions: mockSuggestions,
      });
      useStore.getState().clearConversationHistory(contactId);

      const conversations = useStore.getState().getConversationsForContact(contactId);
      expect(conversations).toHaveLength(0);
    });

    it('clears all conversation history', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Test message',
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
      useStore.getState().addContact({
        name: 'Anna',
        relationshipStage: 'talking',
      });
    });

    it('caches suggestions', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().cacheSuggestions(contactId, 'Hello there', mockSuggestions, 'Pro tip');

      const cached = useStore.getState().getCachedSuggestions(contactId, 'Hello there');
      expect(cached).not.toBeNull();
      expect(cached?.suggestions).toEqual(mockSuggestions);
      expect(cached?.proTip).toBe('Pro tip');
    });

    it('returns null for non-existent cache', () => {
      const contactId = useStore.getState().contacts[0]!.id;
      const cached = useStore.getState().getCachedSuggestions(contactId, 'Non-existent message');
      expect(cached).toBeNull();
    });

    it('clears suggestions cache', () => {
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().cacheSuggestions(contactId, 'Hello', mockSuggestions);
      useStore.getState().clearSuggestionsCache();

      const cached = useStore.getState().getCachedSuggestions(contactId, 'Hello');
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
      useStore.getState().addContact({ name: 'Anna', relationshipStage: 'talking' });
      useStore.getState().setApiKey('sk-test');
      useStore.getState().setUserCulture('russian');
      useStore.getState().clearAllData();

      const state = useStore.getState();
      expect(state.user).toBeNull();
      expect(state.contacts).toHaveLength(0);
      expect(state.selectedContact).toBeNull();
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
      useStore.getState().addContact({ name: 'Anna', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Maria', relationshipStage: 'flirting' });
      useStore.getState().addContact({ name: 'Sofia', relationshipStage: 'talking' });
    });

    describe('selectContactById', () => {
      it('finds contact by ID', () => {
        const state = useStore.getState();
        const contactId = state.contacts[0]!.id;
        const contact = selectContactById(contactId)(state);
        expect(contact?.name).toBe('Anna');
      });

      it('returns undefined for non-existent ID', () => {
        const state = useStore.getState();
        const contact = selectContactById(99999)(state);
        expect(contact).toBeUndefined();
      });
    });

    describe('selectContactsSortedByRecent', () => {
      it('sorts contacts by recent activity', () => {
        // Update one contact with recent date
        const state = useStore.getState();
        const mariaId = state.contacts.find((g) => g.name === 'Maria')?.id;
        if (mariaId) {
          useStore.getState().updateContact(mariaId, {
            lastMessageDate: new Date().toISOString(),
          });
        }

        const sorted = selectContactsSortedByRecent(useStore.getState());
        // The one with lastMessageDate should be first
        expect(sorted[0]!.lastMessageDate).toBeDefined();
      });
    });

    describe('selectContactsByStage', () => {
      it('filters contacts by stage', () => {
        const state = useStore.getState();
        const talkingContacts = selectContactsByStage('talking')(state);
        expect(talkingContacts).toHaveLength(2);
        expect(talkingContacts.every((g) => g.relationshipStage === 'talking')).toBe(true);
      });
    });

    describe('selectTotalMessageCount', () => {
      it('sums all message counts', () => {
        // Clear and add fresh contact for this test
        useStore.getState().clearAllData();
        useStore.getState().addContact({ name: 'Test', relationshipStage: 'talking' });

        const initialCount = selectTotalMessageCount(useStore.getState());
        expect(initialCount).toBe(0);

        const contactId = useStore.getState().contacts[0]!.id;
        useStore.getState().addConversation({
          contactId,
          theirMessage: 'Test',
          suggestions: [{ type: 'safe', text: 'Hi', reason: '' }],
        });

        const total = selectTotalMessageCount(useStore.getState());
        expect(total).toBe(1);
      });
    });

    describe('selectContactsCount', () => {
      it('returns contacts count', () => {
        const count = selectContactsCount(useStore.getState());
        expect(count).toBe(3);
      });
    });

    describe('selectHasData', () => {
      it('returns true when has contacts', () => {
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

    describe('selectContactsBySearch', () => {
      it('searches by name', () => {
        const results = selectContactsBySearch('anna')(useStore.getState());
        expect(results).toHaveLength(1);
        expect(results[0]!.name).toBe('Anna');
      });

      it('searches case-insensitively', () => {
        const results = selectContactsBySearch('MARIA')(useStore.getState());
        expect(results).toHaveLength(1);
      });

      it('returns all for empty query', () => {
        const results = selectContactsBySearch('')(useStore.getState());
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
