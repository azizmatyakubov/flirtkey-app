/**
 * useContacts Hook Tests
 * Phase 9.1.8: Test custom hooks
 */

import { renderHook, act } from '@testing-library/react-native';
import { useContacts } from '../../hooks/useContacts';
import { useStore } from '../../stores/useStore';

describe('useContacts', () => {
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  describe('basic functionality', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useContacts());
      expect(result.current.contacts).toEqual([]);
      expect(result.current.total).toBe(0);
    });

    it('returns all contacts from store', () => {
      // Add contacts to store
      useStore.getState().addContact({ name: 'Emma', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Sophie', relationshipStage: 'flirting' });

      const { result } = renderHook(() => useContacts());
      
      expect(result.current.contacts).toHaveLength(2);
      expect(result.current.total).toBe(2);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      useStore.getState().addContact({ name: 'Anna', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Emma', relationshipStage: 'flirting' });
      useStore.getState().addContact({ name: 'Sophie', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Maria', relationshipStage: 'dating' });
    });

    it('filters by relationship stage', () => {
      const { result } = renderHook(() => useContacts({ filter: { stage: 'talking' } }));
      
      expect(result.current.contacts).toHaveLength(2);
      expect(result.current.contacts.every(g => g.relationshipStage === 'talking')).toBe(true);
    });

    it('filters by search query', () => {
      const { result } = renderHook(() => useContacts({ filter: { search: 'emma' } }));
      
      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0]!.name).toBe('Emma');
    });

    it('filters case-insensitively', () => {
      const { result } = renderHook(() => useContacts({ filter: { search: 'ANNA' } }));
      
      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0]!.name).toBe('Anna');
    });

    it('returns all for empty search', () => {
      const { result } = renderHook(() => useContacts({ filter: { search: '' } }));
      
      expect(result.current.contacts).toHaveLength(4);
    });

    it('can set filter dynamically', () => {
      const { result } = renderHook(() => useContacts());

      expect(result.current.contacts).toHaveLength(4);

      act(() => {
        result.current.setFilter({ stage: 'dating' });
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0]!.name).toBe('Maria');
    });

    it('can clear filter', () => {
      const { result } = renderHook(() => useContacts({ filter: { stage: 'talking' } }));

      expect(result.current.contacts).toHaveLength(2);

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.contacts).toHaveLength(4);
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      useStore.getState().addContact({ name: 'Charlie', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Alpha', relationshipStage: 'flirting' });
      useStore.getState().addContact({ name: 'Bravo', relationshipStage: 'dating' });
    });

    it('sorts by name ascending', () => {
      const { result } = renderHook(() => useContacts({ sort: 'name', sortDirection: 'asc' }));
      
      expect(result.current.contacts[0]!.name).toBe('Alpha');
      expect(result.current.contacts[1]!.name).toBe('Bravo');
      expect(result.current.contacts[2]!.name).toBe('Charlie');
    });

    it('sorts by name descending', () => {
      const { result } = renderHook(() => useContacts({ sort: 'name', sortDirection: 'desc' }));
      
      expect(result.current.contacts[0]!.name).toBe('Charlie');
      expect(result.current.contacts[2]!.name).toBe('Alpha');
    });

    it('can change sort dynamically', () => {
      const { result } = renderHook(() => useContacts());

      act(() => {
        result.current.setSort('name', 'asc');
      });

      expect(result.current.contacts[0]!.name).toBe('Alpha');
    });
  });

  describe('limit', () => {
    beforeEach(() => {
      useStore.getState().addContact({ name: 'Contact 1', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Contact 2', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Contact 3', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Contact 4', relationshipStage: 'talking' });
      useStore.getState().addContact({ name: 'Contact 5', relationshipStage: 'talking' });
    });

    it('limits results', () => {
      const { result } = renderHook(() => useContacts({ limit: 3 }));
      
      expect(result.current.contacts).toHaveLength(3);
      expect(result.current.total).toBe(5);
    });
  });

  describe('integration with store', () => {
    it('reflects store changes', () => {
      const { result } = renderHook(() => useContacts());

      expect(result.current.contacts).toHaveLength(0);

      act(() => {
        useStore.getState().addContact({ name: 'New', relationshipStage: 'talking' });
      });

      expect(result.current.contacts).toHaveLength(1);
    });

    it('reflects contact deletion', () => {
      useStore.getState().addContact({ name: 'To Delete', relationshipStage: 'talking' });
      
      const { result } = renderHook(() => useContacts());
      const contactId = result.current.contacts[0]!.id;

      expect(result.current.contacts).toHaveLength(1);

      act(() => {
        useStore.getState().deleteContact(contactId);
      });

      expect(result.current.contacts).toHaveLength(0);
    });
  });
});
