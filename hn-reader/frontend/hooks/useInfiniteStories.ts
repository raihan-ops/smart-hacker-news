'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Story } from '@/types';

interface StoriesPage {
  stories: Story[];
  page: number;
  limit: number;
  type: string;
  hasMore: boolean;
  totalFetched: number;
}

export function useInfiniteStories(type: 'top' | 'new' | 'best' = 'top', limit = 30) {
  return useInfiniteQuery<StoriesPage>({
    queryKey: queryKeys.stories.infinite(type),
    queryFn: async ({ pageParam = 1 }) => {
      const data = await api.getStories(type, pageParam as number, limit);
      return data as StoriesPage;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
