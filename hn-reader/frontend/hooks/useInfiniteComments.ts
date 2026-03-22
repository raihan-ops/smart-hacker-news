'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Comment, Story } from '@/types';

interface CommentsPage {
  story: Story;
  comments: Comment[];
  commentCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export function useInfiniteComments(storyId: number, depth: number | 'all' = 1, limit = 20) {
  return useInfiniteQuery<CommentsPage>({
    queryKey: queryKeys.comments.infinite(storyId, depth),
    queryFn: async ({ pageParam = 0 }) => {
      const data = await api.getCommentsPaginated(
        storyId,
        depth,
        limit,
        pageParam as number
      );
      return data as CommentsPage;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
