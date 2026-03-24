'use client';

import { StoryType } from '@/types';
import { useStoriesPagination } from '@/hooks/useStoriesPagination';
import { useBookmarkStatuses } from '@/hooks/useBookmarkStatuses';
import StoryCard from './StoryCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import Pagination from '../../common/Pagination';

interface StoryListProps {
  type?: StoryType;
}

export default function StoryList({ type = 'top' }: StoryListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    currentPage,
    setPage,
    totalPages,
  } = useStoriesPagination(type, 30);

  const stories = data?.stories ?? [];
  const storyIds = stories.map((story) => story.id);

  // Fetch all bookmark statuses in one call (efficient!)
  const { data: bookmarkStatuses = new Set<number>() } = useBookmarkStatuses(storyIds);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to fetch stories'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <div className="card-surface divide-y divide-slate-200 px-3 sm:px-4">
        {stories.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            rank={(currentPage - 1) * 30 + index + 1}
            isBookmarked={bookmarkStatuses.has(story.id)}
          />
        ))}
      </div>

      {/* Number pagination */}
      {stories.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
