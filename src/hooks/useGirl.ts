/**
 * useGirl Hook (2.4.1)
 * Get a single girl by ID with memoization
 */

import { useMemo } from 'react';
import { useStore, selectGirlById } from '../stores/useStore';
import { Girl } from '../types';

interface UseGirlResult {
  girl: Girl | undefined;
  isSelected: boolean;
  select: () => void;
  update: (data: Partial<Girl>) => void;
  remove: () => void;
}

export const useGirl = (id: number | undefined): UseGirlResult => {
  const girl = useStore(useMemo(() => (id ? selectGirlById(id) : () => undefined), [id]));
  const selectedGirl = useStore((state) => state.selectedGirl);
  const selectGirl = useStore((state) => state.selectGirl);
  const updateGirl = useStore((state) => state.updateGirl);
  const deleteGirl = useStore((state) => state.deleteGirl);

  const isSelected = useMemo(
    () => !!girl && !!selectedGirl && girl.id === selectedGirl.id,
    [girl, selectedGirl]
  );

  const select = () => {
    if (girl) {
      selectGirl(girl);
    }
  };

  const update = (data: Partial<Girl>) => {
    if (id) {
      updateGirl(id, data);
    }
  };

  const remove = () => {
    if (id) {
      deleteGirl(id);
    }
  };

  return {
    girl,
    isSelected,
    select,
    update,
    remove,
  };
};

export default useGirl;
