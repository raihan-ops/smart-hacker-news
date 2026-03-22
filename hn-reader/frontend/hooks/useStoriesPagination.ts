'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { queryParams } from '@/lib/routes';
import type { Story } from '@/types';

interface StoriesResponse {
  stories: Story[];
  page: number;
  limit: number;
  type: string;
  hasMore: boolean;
  totalFetched: number;
  totalCount: number;
  totalPages: number;
}

export function useStoriesPagination(type: 'top' | 'new' | 'best' = 'top', limit = 30) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get page from URL or default to 1
  const currentPage = parseInt(searchParams.get(queryParams.page) || '1', 10);
  const urlType = searchParams.get(queryParams.type) || 'top';

  // Reset page to 1 when type changes
  useEffect(() => {
    if (type.toString() !== urlType.toString()) {
      router.push(`?${queryParams.type}=${type}&${queryParams.page}=1`, { scroll: false });
    }
  }, [type, urlType, router]);

  const query = useQuery<StoriesResponse>({
    queryKey: queryKeys.stories.list(type, currentPage),
    queryFn: async () => {
      const data = await api.getStories(type, currentPage, limit);
      return data as StoriesResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(queryParams.page, page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return {
    ...query,
    currentPage,
    setPage,
    totalPages: query.data?.totalPages ?? 1,
  };
}
