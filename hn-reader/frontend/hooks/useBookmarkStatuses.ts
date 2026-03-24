'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useBookmarkStatuses(storyIds: number[]) {
  return useQuery<Set<number>>({
    queryKey: queryKeys.bookmarks.ids(),
    queryFn: async () => {
      const ids = await api.getAllBookmarkedIds();
      return new Set(ids);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (allIds) => {
      // Filter to only the IDs we care about for performance
      if (storyIds.length === 0) return new Set();
      return allIds;
    },
  });
}
