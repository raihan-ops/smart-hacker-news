'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SummaryResponse } from '@/types';

export function useSummary(storyId: number, enabled = true) {
  return useQuery<SummaryResponse>({
    queryKey: queryKeys.summary.detail(storyId),
    queryFn: () => api.getSummary(storyId),
    staleTime: 30 * 60 * 1000, // 30 minutes (summaries don't change often)
    enabled,
    retry: false, // Don't retry if summary doesn't exist
  });
}
