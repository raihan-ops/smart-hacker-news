'use client';

import { useCommentsPagination } from '@/hooks/useCommentsPagination';
import Comment from './Comment';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Pagination from './Pagination';

interface CommentListProps {
  storyId: number;
}

export default function CommentList({ storyId }: CommentListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    currentPage,
    setPage,
    totalPages,
    totalComments,
  } = useCommentsPagination(storyId, 1, 20);

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

  const comments = data?.comments ?? [];

  if (totalComments === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No comments yet.
      </div>
    );
  }

  return (
    <div>
      {/* Comment count and page info */}
      <div className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-gray-700">
        Showing {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, totalComments)} of {totalComments} comments
      </div>

      {/* Comments */}
      <div className="space-y-1">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} storyId={storyId} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
