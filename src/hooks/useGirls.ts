/**
 * useGirls Hook (2.4.2)
 * Get girls list with filtering and sorting
 */

import { useMemo, useState, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import { Girl, RelationshipStage } from '../types';

export type SortOption = 'name' | 'recent' | 'stage' | 'messageCount';
export type SortDirection = 'asc' | 'desc';

export interface GirlsFilter {
  search?: string;
  stage?: RelationshipStage | RelationshipStage[];
  minMessages?: number;
  hasAvatar?: boolean;
}

interface UseGirlsOptions {
  filter?: GirlsFilter;
  sort?: SortOption;
  sortDirection?: SortDirection;
  limit?: number;
}

interface UseGirlsResult {
  girls: Girl[];
  total: number;
  filtered: number;
  // Filter controls
  filter: GirlsFilter;
  setFilter: (filter: GirlsFilter) => void;
  clearFilter: () => void;
  // Sort controls
  sort: SortOption;
  sortDirection: SortDirection;
  setSort: (sort: SortOption, direction?: SortDirection) => void;
  // Actions
  refresh: () => void;
}

const stageOrder: Record<RelationshipStage, number> = {
  just_met: 0,
  talking: 1,
  flirting: 2,
  dating: 3,
  serious: 4,
};

export const useGirls = (options: UseGirlsOptions = {}): UseGirlsResult => {
  const allGirls = useStore((state) => state.girls);

  const [filter, setFilter] = useState<GirlsFilter>(options.filter || {});
  const [sort, setSort] = useState<SortOption>(options.sort || 'recent');
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    options.sortDirection || 'desc'
  );

  // Filter girls
  const filteredGirls = useMemo(() => {
    let result = [...allGirls];

    // Search filter
    if (filter.search) {
      const query = filter.search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.nickname?.toLowerCase().includes(query) ||
          g.interests?.toLowerCase().includes(query) ||
          g.personality?.toLowerCase().includes(query)
      );
    }

    // Stage filter
    if (filter.stage) {
      const stages = Array.isArray(filter.stage) ? filter.stage : [filter.stage];
      result = result.filter((g) => stages.includes(g.relationshipStage));
    }

    // Min messages filter
    if (filter.minMessages !== undefined) {
      result = result.filter((g) => g.messageCount >= (filter.minMessages || 0));
    }

    // Has avatar filter
    if (filter.hasAvatar !== undefined) {
      result = result.filter((g) => (filter.hasAvatar ? !!g.avatar : !g.avatar));
    }

    return result;
  }, [allGirls, filter]);

  // Sort girls
  const sortedGirls = useMemo(() => {
    const result = [...filteredGirls];
    const dir = sortDirection === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      switch (sort) {
        case 'name':
          return dir * a.name.localeCompare(b.name);

        case 'recent': {
          const aTime = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
          const bTime = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
          return dir * (bTime - aTime);
        }

        case 'stage':
          return dir * (stageOrder[a.relationshipStage] - stageOrder[b.relationshipStage]);

        case 'messageCount':
          return dir * (b.messageCount - a.messageCount);

        default:
          return 0;
      }
    });

    return result;
  }, [filteredGirls, sort, sortDirection]);

  // Apply limit
  const limitedGirls = useMemo(() => {
    if (options.limit && options.limit > 0) {
      return sortedGirls.slice(0, options.limit);
    }
    return sortedGirls;
  }, [sortedGirls, options.limit]);

  const handleSetSort = useCallback((newSort: SortOption, direction?: SortDirection) => {
    setSort(newSort);
    if (direction) {
      setSortDirection(direction);
    }
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const refresh = useCallback(() => {
    // Trigger re-render by updating filter to same value
    setFilter((f) => ({ ...f }));
  }, []);

  return {
    girls: limitedGirls,
    total: allGirls.length,
    filtered: filteredGirls.length,
    filter,
    setFilter,
    clearFilter,
    sort,
    sortDirection,
    setSort: handleSetSort,
    refresh,
  };
};

export default useGirls;
