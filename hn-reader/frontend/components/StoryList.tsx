'use client';

import { StoryType } from '@/types';
import { useStoriesPagination } from '@/hooks/useStoriesPagination';
import { useBookmarkStatuses } from '@/hooks/useBookmarkStatuses';
import StoryCard from './StoryCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Pagination from './Pagination';

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
  const { data: bookmarkStatuses = {} } = useBookmarkStatuses(storyIds);

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
      <div className="divide-y divide-gray-200">
        {stories.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            rank={(currentPage - 1) * 30 + index + 1}
            isBookmarked={bookmarkStatuses[story.id] || false}
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
