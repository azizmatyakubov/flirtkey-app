/**
 * useContact Hook (2.4.1)
 * Get a single contact by ID with memoization
 */

import { useMemo } from 'react';
import { useStore, selectContactById } from '../stores/useStore';
import { Contact } from '../types';

interface UseGirlResult {
  contact: Contact | undefined;
  isSelected: boolean;
  select: () => void;
  update: (data: Partial<Contact>) => void;
  remove: () => void;
}

export const useContact = (id: number | undefined): UseGirlResult => {
  const contact = useStore(useMemo(() => (id ? selectContactById(id) : () => undefined), [id]));
  const selectedContact = useStore((state) => state.selectedContact);
  const selectContact = useStore((state) => state.selectContact);
  const updateContact = useStore((state) => state.updateContact);
  const deleteContact = useStore((state) => state.deleteContact);

  const isSelected = useMemo(
    () => !!contact && !!selectedContact && contact.id === selectedContact.id,
    [contact, selectedContact]
  );

  const select = () => {
    if (contact) {
      selectContact(contact);
    }
  };

  const update = (data: Partial<Contact>) => {
    if (id) {
      updateContact(id, data);
    }
  };

  const remove = () => {
    if (id) {
      deleteContact(id);
    }
  };

  return {
    contact,
    isSelected,
    select,
    update,
    remove,
  };
};

export default useContact;
