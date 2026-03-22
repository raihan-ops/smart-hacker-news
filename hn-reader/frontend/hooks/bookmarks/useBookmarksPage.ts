'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { BookmarksResponse } from '@/types';

export function useBookmarksPage(search = '', page = 1, limit = 30) {
  return useQuery<BookmarksResponse>({
    queryKey: queryKeys.bookmarks.list(search, page),
    queryFn: () => api.getBookmarks(search, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}
