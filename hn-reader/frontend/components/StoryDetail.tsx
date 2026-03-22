'use client';

import { formatDistanceToNow } from 'date-fns';
import { Story } from '@/types';
import BookmarkButton from './BookmarkButton';

interface StoryDetailProps {
  story: Story;
}

export default function StoryDetail({ story }: StoryDetailProps) {
  const timeAgo = formatDistanceToNow(new Date(story.time * 1000), { addSuffix: true });
  const domain = story.url ? new URL(story.url).hostname.replace('www.', '') : null;

  return (
    <article className="card-surface p-4 sm:p-6">
      {/* Title */}
      <h1 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl">
        {story.url ? (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--brand)]"
          >
            {story.title}
          </a>
        ) : (
          story.title
        )}
        {domain && (
          <span className="ml-2 text-base text-gray-500 font-normal">({domain})</span>
        )}
      </h1>

      {/* Metadata */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span>{story.points} points</span>
        <span>by {story.author}</span>
        <span>{timeAgo}</span>
        <span>{story.commentCount} comments</span>
        <BookmarkButton storyId={story.id} />
      </div>

      {/* Story text (if exists) */}
      {story.text && (
        <div
          className="prose prose-sm max-w-none text-gray-800 mt-4 pt-4 border-t border-gray-200"
          dangerouslySetInnerHTML={{ __html: story.text }}
        />
      )}
    </article>
  );
}
