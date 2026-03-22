'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Story } from '@/types';
import { routes } from '@/lib/routes';
import BookmarkButton from './BookmarkButton';

interface StoryCardProps {
  story: Story;
  rank?: number;
  isBookmarked?: boolean;
}

export default function StoryCard({ story, rank, isBookmarked }: StoryCardProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(story.time * 1000), { addSuffix: true });
  const domain = story.url ? new URL(story.url).hostname.replace('www.', '') : null;

  return (
    <article
      className="mt-2 cursor-pointer rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-slate-200 hover:bg-slate-200/40"
      onClick={() => router.push(routes.story.detail(story.id))}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(routes.story.detail(story.id));
        }
      }}
      aria-label={`Open story ${story.title}`}
    >
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
              <Link href={routes.story.detail(story.id)} className="hover:text-orange-500 transition-colors" onClick={(event) => event.stopPropagation()}>
                {story.title}
              </Link>
              {domain && (
                <span className="ml-2 text-xs text-gray-500">({domain})</span>
              )}
            </h2>
            <div onClick={(event) => event.stopPropagation()}>
              <BookmarkButton storyId={story.id} initialBookmarked={isBookmarked} />
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-1 text-sm text-gray-600 flex items-center gap-3 flex-wrap">
            <span>{story.points} points</span>
            <span>by {story.author}</span>
            <span>{timeAgo}</span>
            <Link
              href={routes.story.detail(story.id)}
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
