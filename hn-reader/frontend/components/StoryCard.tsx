'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Story } from '@/types';
import BookmarkButton from './BookmarkButton';

interface StoryCardProps {
  story: Story;
  rank?: number;
  isBookmarked?: boolean;
}

export default function StoryCard({ story, rank, isBookmarked }: StoryCardProps) {
  const timeAgo = formatDistanceToNow(new Date(story.time * 1000), { addSuffix: true });
  const domain = story.url ? new URL(story.url).hostname.replace('www.', '') : null;

  return (
    <article className="border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {rank && (
          <span className="text-gray-400 font-mono text-sm w-6 flex-shrink-0">
            {rank}.
          </span>
        )}
        <div className="flex-1 min-w-0">
          {/* Title and URL */}
          <div className="flex items-start gap-2">
            <h2 className="text-base font-medium text-gray-900 flex-1">
              {story.url ? (
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-500 transition-colors"
                >
                  {story.title}
                </a>
              ) : (
                <Link href={`/story/${story.id}`} className="hover:text-orange-500">
                  {story.title}
                </Link>
              )}
              {domain && (
                <span className="ml-2 text-xs text-gray-500">({domain})</span>
              )}
            </h2>
            <BookmarkButton storyId={story.id} initialBookmarked={isBookmarked} />
          </div>

          {/* Metadata */}
          <div className="mt-1 text-sm text-gray-600 flex items-center gap-3 flex-wrap">
            <span>{story.points} points</span>
            <span>by {story.author}</span>
            <span>{timeAgo}</span>
            <Link
              href={`/story/${story.id}`}
              className="hover:text-orange-500 transition-colors"
            >
              {story.commentCount} comments
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
