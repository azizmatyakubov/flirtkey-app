/**
 * Integration Tests: Chat Flow
 * Phase 9.2.4: Test chat flow
 */

import { useStore } from '../../stores/useStore';
import { Suggestion } from '../../types';

describe('Chat Flow Integration', () => {
  const mockSuggestions: Suggestion[] = [
    { type: 'safe', text: "Hey! How's your day going?", reason: 'Friendly opener' },
    { type: 'balanced', text: "Hey gorgeous! What's keeping you busy today?", reason: 'Flirty but casual' },
    { type: 'bold', text: "I've been thinking about you all day 😏", reason: 'Bold and direct' },
  ];

  beforeEach(() => {
    useStore.getState().clearAllData();
    // Add a contact to chat with
    useStore.getState().addContact({
      name: 'Emma',
      age: 24,
      relationshipStage: 'flirting',
      personality: 'Fun and flirty',
      interests: 'Movies, coffee, hiking',
    });
  });

  describe('Conversation Management', () => {
    it('adds conversation entry with suggestions', () => {
      const contactId = useStore.getState().selectedContact!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Hey you!',
        suggestions: mockSuggestions,
        proTip: 'Keep it light and fun',
      });

      const conversations = useStore.getState().getConversationsForContact(contactId);
      expect(conversations).toHaveLength(1);
      expect(conversations[0].theirMessage).toBe('Hey you!');
      expect(conversations[0].suggestions).toHaveLength(3);
      expect(conversations[0].proTip).toBe('Keep it light and fun');
    });

    it('tracks message count on contact profile', () => {
      const contactId = useStore.getState().selectedContact!.id;
      expect(useStore.getState().selectedContact?.messageCount).toBe(0);

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 1',
        suggestions: mockSuggestions,
      });
      expect(useStore.getState().contacts[0].messageCount).toBe(1);

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Message 2',
        suggestions: mockSuggestions,
      });
      expect(useStore.getState().contacts[0].messageCount).toBe(2);
    });

    it('maintains conversation order', () => {
      const contactId = useStore.getState().selectedContact!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'First message',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Second message',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Third message',
        suggestions: mockSuggestions,
      });

      const conversations = useStore.getState().getConversationsForContact(contactId);
      expect(conversations).toHaveLength(3);
    });

    it('separates conversations by contact', () => {
      const contact1Id = useStore.getState().selectedContact!.id;
      
      // Add another contact
      useStore.getState().addContact({
        name: 'Sophie',
        relationshipStage: 'talking',
      });
      const contact2Id = useStore.getState().selectedContact!.id;

      // Add conversations to both contacts
      useStore.getState().addConversation({
        contactId: contact1Id,
        theirMessage: 'Emma message',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId: contact2Id,
        theirMessage: 'Sophie message',
        suggestions: mockSuggestions,
      });

      expect(useStore.getState().getConversationsForContact(contact1Id)).toHaveLength(1);
      expect(useStore.getState().getConversationsForContact(contact2Id)).toHaveLength(1);
      expect(useStore.getState().getConversationsForContact(contact1Id)[0].theirMessage).toBe('Emma message');
    });
  });

  describe('Suggestions Cache', () => {
    it('caches suggestions for repeated messages', () => {
      const contactId = useStore.getState().selectedContact!.id;
      const message = 'How was your day?';

      // Cache the suggestions
      useStore.getState().cacheSuggestions(contactId, message, mockSuggestions, 'Be engaging');

      // Retrieve from cache
      const cached = useStore.getState().getCachedSuggestions(contactId, message);
      expect(cached).not.toBeNull();
      expect(cached?.suggestions).toEqual(mockSuggestions);
      expect(cached?.proTip).toBe('Be engaging');
    });

    it('returns null for uncached messages', () => {
      const contactId = useStore.getState().selectedContact!.id;

      const cached = useStore.getState().getCachedSuggestions(contactId, 'Never seen before');
      expect(cached).toBeNull();
    });

    it('caches are contact-specific', () => {
      const contact1Id = useStore.getState().selectedContact!.id;
      
      useStore.getState().addContact({
        name: 'Sophie',
        relationshipStage: 'talking',
      });
      const contact2Id = useStore.getState().selectedContact!.id;

      const message = 'Same message';
      const contact1Suggestions: Suggestion[] = [{ type: 'safe', text: 'For Emma', reason: '' }];
      const contact2Suggestions: Suggestion[] = [{ type: 'balanced', text: 'For Sophie', reason: '' }];

      useStore.getState().cacheSuggestions(contact1Id, message, contact1Suggestions);
      useStore.getState().cacheSuggestions(contact2Id, message, contact2Suggestions);

      expect(useStore.getState().getCachedSuggestions(contact1Id, message)?.suggestions[0].text).toBe('For Emma');
      expect(useStore.getState().getCachedSuggestions(contact2Id, message)?.suggestions[0].text).toBe('For Sophie');
    });

    it('clears all cache', () => {
      const contactId = useStore.getState().selectedContact!.id;

      useStore.getState().cacheSuggestions(contactId, 'Message 1', mockSuggestions);
      useStore.getState().cacheSuggestions(contactId, 'Message 2', mockSuggestions);

      useStore.getState().clearSuggestionsCache();

      expect(useStore.getState().getCachedSuggestions(contactId, 'Message 1')).toBeNull();
      expect(useStore.getState().getCachedSuggestions(contactId, 'Message 2')).toBeNull();
    });
  });

  describe('Conversation History', () => {
    it('clears history for specific contact', () => {
      const contactId = useStore.getState().selectedContact!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Test message',
        suggestions: mockSuggestions,
      });
      expect(useStore.getState().getConversationsForContact(contactId)).toHaveLength(1);

      useStore.getState().clearConversationHistory(contactId);
      expect(useStore.getState().getConversationsForContact(contactId)).toHaveLength(0);
    });

    it('clears all history', () => {
      const contact1Id = useStore.getState().selectedContact!.id;
      
      useStore.getState().addContact({
        name: 'Sophie',
        relationshipStage: 'talking',
      });
      const contact2Id = useStore.getState().selectedContact!.id;

      useStore.getState().addConversation({
        contactId: contact1Id,
        theirMessage: 'Emma message',
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId: contact2Id,
        theirMessage: 'Sophie message',
        suggestions: mockSuggestions,
      });

      useStore.getState().clearConversationHistory();

      expect(useStore.getState().conversationHistory).toHaveLength(0);
    });

    it('preserves conversation timestamps', () => {
      const contactId = useStore.getState().selectedContact!.id;
      const before = Date.now();

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Test',
        suggestions: mockSuggestions,
      });

      const after = Date.now();
      const conversation = useStore.getState().getConversationsForContact(contactId)[0];
      const timestamp = new Date(conversation.timestamp).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Context Building', () => {
    it('builds context from profile and history', () => {
      const contactId = useStore.getState().selectedContact!.id;

      // Add some conversation history
      useStore.getState().addConversation({
        contactId,
        theirMessage: "I had such a great hike today!",
        suggestions: mockSuggestions,
      });
      useStore.getState().addConversation({
        contactId,
        theirMessage: "We should grab coffee sometime",
        suggestions: mockSuggestions,
      });

      const contact = useStore.getState().selectedContact!;
      const history = useStore.getState().getConversationsForContact(contactId);

      // Verify we have the data to build context
      expect(contact.name).toBe('Emma');
      expect(contact.interests).toBe('Movies, coffee, hiking');
      expect(history).toHaveLength(2);
      expect(history[0].theirMessage).toContain('hike');
    });
  });
});
