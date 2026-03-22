'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { BookmarkExistsResponse } from '@/types';

export function useBookmarkQuery(storyId: number) {
  return useQuery<BookmarkExistsResponse>({
    queryKey: queryKeys.bookmarks.status(storyId),
    queryFn: () => api.checkBookmark(storyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
