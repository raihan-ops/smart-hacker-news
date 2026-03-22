'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Story } from '@/types';

export function useStory(storyId: number) {
  return useQuery<Story>({
    queryKey: queryKeys.stories.detail(storyId),
    queryFn: () => api.getStory(storyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
