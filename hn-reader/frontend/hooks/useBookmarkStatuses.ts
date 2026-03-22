'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useBookmarkStatuses(storyIds: number[]) {
  return useQuery<Record<number, boolean>>({
    queryKey: queryKeys.bookmarks.bulkStatus(storyIds),
    queryFn: async () => {
      if (storyIds.length === 0) return {};
      const data = await api.checkMultipleBookmarks(storyIds);
      return data || {};
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: storyIds.length > 0,
  });
}
