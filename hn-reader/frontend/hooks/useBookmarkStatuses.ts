'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBookmarkStatuses(storyIds: number[]) {
  return useQuery<Record<number, boolean>>({
    queryKey: ['bookmarks', 'bulk', ...storyIds.sort()],
    queryFn: async () => {
      if (storyIds.length === 0) return {};
      const data = await api.checkMultipleBookmarks(storyIds);
      return data || {};
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: storyIds.length > 0,
  });
}
