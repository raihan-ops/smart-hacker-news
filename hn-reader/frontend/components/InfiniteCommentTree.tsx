'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteComments } from '@/hooks/useInfiniteComments';
import Comment from './Comment';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface InfiniteCommentTreeProps {
  storyId: number;
  totalComments: number;
}

export default function InfiniteCommentTree({ storyId, totalComments }: InfiniteCommentTreeProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteComments(storyId, 1, 20);

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Start fetching when 200px from bottom
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="md" />
        <p className="text-center text-sm text-gray-600 mt-3">Loading comments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load comments'}
        onRetry={() => refetch()}
      />
    );
  }

  const allComments = data?.pages.flatMap((page) => page.comments) ?? [];

  if (allComments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No comments yet.
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-200">
        {allComments.map((comment) => (
          <Comment key={comment.id} comment={comment} storyId={storyId} />
        ))}
      </div>

      {/* Intersection observer target */}
      <div ref={observerTarget} className="mt-6 flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="text-center">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-500 mt-2">Loading more comments...</p>
          </div>
        )}
        {!hasNextPage && allComments.length > 0 && (
          <p className="text-gray-500 text-sm">
            All comments loaded ({allComments.length} of {totalComments})
          </p>
        )}
      </div>
    </div>
  );
}
