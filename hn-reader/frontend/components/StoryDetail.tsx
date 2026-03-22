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
    <article className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
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
          story.title
        )}
        {domain && (
          <span className="ml-2 text-base text-gray-500 font-normal">({domain})</span>
        )}
      </h1>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
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
