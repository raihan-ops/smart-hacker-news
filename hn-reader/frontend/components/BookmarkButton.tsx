'use client';

import { useBookmarkQuery } from '@/hooks/bookmarks/useBookmarkQuery';
import { useToggleBookmark } from '@/hooks/bookmarks/useToggleBookmark';

interface BookmarkButtonProps {
  storyId: number;
  initialBookmarked?: boolean;
}

export default function BookmarkButton({ storyId, initialBookmarked }: BookmarkButtonProps) {
  const { data, isLoading: isChecking } = useBookmarkQuery(storyId);
  const toggleMutation = useToggleBookmark();

  // Use initialBookmarked if provided, otherwise use query data
  const bookmarked = initialBookmarked ?? data?.exists ?? false;
  const loading = isChecking || toggleMutation.isPending;

  const toggleBookmark = () => {
    toggleMutation.mutate({ storyId, isBookmarked: bookmarked });
  };

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        toggleBookmark();
      }}
      disabled={loading}
      className="rounded-md px-1.5 py-1 text-lg leading-none text-gray-400 transition-colors hover:text-[var(--brand)] disabled:opacity-50"
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  );
}
