'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface BookmarkButtonProps {
  storyId: number;
  initialBookmarked?: boolean;
}

export default function BookmarkButton({ storyId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof initialBookmarked === 'boolean') {
      setBookmarked(initialBookmarked);
      return;
    }

    const checkBookmark = async () => {
      try {
        const { exists } = await api.checkBookmark(storyId);
        setBookmarked(exists);
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      }
    };

    checkBookmark();
  }, [storyId, initialBookmarked]);

  const toggleBookmark = async () => {
    try {
      setLoading(true);
      if (bookmarked) {
        await api.deleteBookmark(storyId);
        setBookmarked(false);
      } else {
        await api.createBookmark(storyId);
        setBookmarked(true);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className="text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50"
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  );
}
