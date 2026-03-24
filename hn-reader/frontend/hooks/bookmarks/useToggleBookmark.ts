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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.ids() });

      // Snapshot the previous value
      const previousIds = queryClient.getQueryData<Set<number>>(queryKeys.bookmarks.ids());

      // Optimistically update the Set
      queryClient.setQueryData<Set<number>>(queryKeys.bookmarks.ids(), (old) => {
        const newSet = new Set(old || []);
        if (isBookmarked) {
          newSet.delete(storyId);
        } else {
          newSet.add(storyId);
        }
        return newSet;
      });

      return { previousIds };
    },
    onSuccess: () => {
      // Refetch bookmarks list and IDs to ensure data consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.ids() });
    },
    onError: (_error, _variables, context) => {
      // Revert optimistic update on error
      if (context?.previousIds) {
        queryClient.setQueryData(queryKeys.bookmarks.ids(), context.previousIds);
      }
    },
  });
}
