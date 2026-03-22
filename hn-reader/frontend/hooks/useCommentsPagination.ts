'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Comment, Story } from '@/types';

interface CommentsResponse {
  story: Story;
  comments: Comment[];
  commentCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export function useCommentsPagination(storyId: number, depth: number | 'all' = 1, limit = 20) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get page from URL or default to 1
  const currentPage = parseInt(searchParams.get('commentPage') || '1', 10);
  const offset = (currentPage - 1) * limit;

  const query = useQuery<CommentsResponse>({
    queryKey: ['comments', storyId, depth, currentPage],
    queryFn: async () => {
      const data = await api.getCommentsPaginated(storyId, depth, limit, offset);
      return data as CommentsResponse;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('commentPage', page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const totalPages = query.data
    ? Math.ceil(query.data.commentCount / limit)
    : 1;

  return {
    ...query,
    currentPage,
    setPage,
    totalPages,
    totalComments: query.data?.commentCount || 0,
  };
}
