'use client';

import { useBookmarkStatuses } from '@/hooks/useBookmarkStatuses';
import { useToggleBookmark } from '@/hooks/bookmarks/useToggleBookmark';
import { Star } from 'lucide-react';

interface BookmarkButtonProps {
  storyId: number;
}

export default function BookmarkButton({ storyId }: BookmarkButtonProps) {
  const { data: bookmarkIds = new Set<number>() } = useBookmarkStatuses([storyId]);
  const toggleMutation = useToggleBookmark();

  const bookmarked = bookmarkIds.has(storyId);
  const loading = toggleMutation.isPending;

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
      className="rounded-md px-1.5 py-1 text-lg leading-none transition-colors disabled:opacity-50"
      style={{ color: 'var(--brand)' }}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Star
        color="var(--brand)"
        fill={bookmarked ? 'var(--brand)' : 'none'}
        className="h-5 w-5"
      />
    </button>
  );
}
