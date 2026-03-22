'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SummaryResponse } from '@/types';

export function useGenerateSummary(storyId: number) {
  const queryClient = useQueryClient();

  return useMutation<SummaryResponse, Error, void>({
    mutationFn: () => api.generateSummary(storyId),
    onSuccess: (data) => {
      // Update the query cache with the new summary
      queryClient.setQueryData(queryKeys.summary.detail(storyId), data);
    },
  });
}
