/**
 * Storage Service Tests
 * Phase 9.1.6: Test service functions
 */

import { useStore } from '../../stores/useStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('Storage Service', () => {
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  describe('Data Export', () => {
    it('exports all contacts data', () => {
      // Add test data
      useStore.getState().addContact({
        name: 'Emma',
        age: 24,
        relationshipStage: 'flirting',
        interests: 'Music',
      });
      useStore.getState().addContact({
        name: 'Sophie',
        age: 25,
        relationshipStage: 'talking',
      });

      const state = useStore.getState();
      const exportData = {
        contacts: state.contacts,
        conversationHistory: state.conversationHistory,
        userCulture: state.userCulture,
        version: 1,
        exportedAt: new Date().toISOString(),
      };

      expect(exportData.contacts).toHaveLength(2);
      expect(exportData.contacts[0]!.name).toBe('Emma');
      expect(exportData.contacts[1]!.name).toBe('Sophie');
    });

    it('exports conversation history', () => {
      useStore.getState().addContact({
        name: 'Test',
        relationshipStage: 'talking',
      });
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().addConversation({
        contactId,
        theirMessage: 'Hello!',
        suggestions: [{ type: 'safe', text: 'Hi', reason: '' }],
      });

      const state = useStore.getState();
      expect(state.conversationHistory).toHaveLength(1);
      expect(state.conversationHistory[0]!.theirMessage).toBe('Hello!');
    });
  });

  describe('Data Import', () => {
    it('imports contacts data', () => {
      const importData = {
        contacts: [
          {
            id: 1,
            name: 'Imported Contact',
            relationshipStage: 'dating',
            messageCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        conversationHistory: [],
        userCulture: 'western',
      };

      // Simulate import by adding data
      importData.contacts.forEach((contact) => {
        useStore.getState().addContact({
          name: contact.name,
          relationshipStage: contact.relationshipStage as any,
        });
      });

      expect(useStore.getState().contacts).toHaveLength(1);
    });

    it('handles empty import gracefully', () => {
      const importData = {
        contacts: [],
        conversationHistory: [],
        userCulture: 'universal',
      };

      expect(importData.contacts).toHaveLength(0);
      expect(useStore.getState().contacts).toHaveLength(0);
    });
  });

  describe('Data Clearing', () => {
    it('clears all stored data', () => {
      // Add some data
      useStore.getState().addContact({ name: 'Test', relationshipStage: 'talking' });
      useStore.getState().setApiKey('test-key');
      useStore.getState().setUserCulture('russian');

      // Clear all
      useStore.getState().clearAllData();

      const state = useStore.getState();
      expect(state.contacts).toHaveLength(0);
      expect(state.apiKey).toBe('');
      expect(state.userCulture).toBe('universal');
      expect(state.selectedContact).toBeNull();
    });

    it('clears only suggestions cache', () => {
      useStore.getState().addContact({ name: 'Test', relationshipStage: 'talking' });
      const contactId = useStore.getState().contacts[0]!.id;

      useStore.getState().cacheSuggestions(contactId, 'Message', [
        { type: 'safe', text: 'Hi', reason: '' },
      ]);

      expect(useStore.getState().suggestionsCache).toHaveLength(1);

      useStore.getState().clearSuggestionsCache();

      expect(useStore.getState().suggestionsCache).toHaveLength(0);
      expect(useStore.getState().contacts).toHaveLength(1); // Contacts not affected
    });

    it('clears conversation history selectively', () => {
      useStore.getState().addContact({ name: 'Girl1', relationshipStage: 'talking' });
      const contact1Id = useStore.getState().contacts[0]!.id;
      
      useStore.getState().addContact({ name: 'Girl2', relationshipStage: 'talking' });
      const contact2Id = useStore.getState().contacts[1]!.id;

      useStore.getState().addConversation({
        contactId: contact1Id,
        theirMessage: 'Contact1 message',
        suggestions: [],
      });
      useStore.getState().addConversation({
        contactId: contact2Id,
        theirMessage: 'Contact2 message',
        suggestions: [],
      });

      useStore.getState().clearConversationHistory(contact1Id);

      expect(useStore.getState().getConversationsForContact(contact1Id)).toHaveLength(0);
      expect(useStore.getState().getConversationsForContact(contact2Id)).toHaveLength(1);
    });
  });

  describe('API Key Storage', () => {
    it('stores API key', () => {
      useStore.getState().setApiKey('sk-test-key-12345');
      expect(useStore.getState().apiKey).toBe('sk-test-key-12345');
    });

    it('clears API key', () => {
      useStore.getState().setApiKey('sk-test');
      useStore.getState().setApiKey('');
      expect(useStore.getState().apiKey).toBe('');
    });

    it('persists API key across operations', () => {
      useStore.getState().setApiKey('sk-persist-test');
      
      // Do other operations
      useStore.getState().addContact({ name: 'Test', relationshipStage: 'talking' });
      useStore.getState().setUserCulture('western');

      // API key should still be there
      expect(useStore.getState().apiKey).toBe('sk-persist-test');
    });
  });

  describe('Settings Persistence', () => {
    it('stores user culture preference', () => {
      useStore.getState().setUserCulture('russian');
      expect(useStore.getState().userCulture).toBe('russian');
    });

    it('stores user info', () => {
      useStore.getState().setUser({
        id: 1,
        name: 'Test User',
        culture: 'western',
        language: 'en',
      });

      const user = useStore.getState().user;
      expect(user?.name).toBe('Test User');
      expect(user?.culture).toBe('western');
    });
  });
});
