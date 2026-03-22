'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

interface ToggleBookmarkParams {
  storyId: number;
  isBookmarked: boolean;
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, isBookmarked }: ToggleBookmarkParams) => {
      if (isBookmarked) {
        return api.deleteBookmark(storyId);
      } else {
        return api.createBookmark(storyId);
      }
    },
    onMutate: async ({ storyId, isBookmarked }) => {
      // Optimistic update - update UI immediately
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.statuses() });

      // Update single status
      queryClient.setQueryData(
        queryKeys.bookmarks.status(storyId),
        { exists: !isBookmarked, bookmark: null }
      );

      // Update bulk statuses if they exist
      const bulkQueries = queryClient.getQueriesData({ queryKey: queryKeys.bookmarks.statuses() });
      bulkQueries.forEach(([key, data]) => {
        if (data && typeof data === 'object' && storyId in data) {
          queryClient.setQueryData(key, { ...data, [storyId]: !isBookmarked });
        }
      });

      return { previousValue: isBookmarked };
    },
    onSuccess: () => {
      // Invalidate bookmarks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.lists() });
    },
    onError: (_error, _variables, context) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.statuses() });
    },
  });
}
