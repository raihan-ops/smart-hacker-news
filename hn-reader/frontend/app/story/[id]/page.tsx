'use client';

import { useParams } from 'next/navigation';
import { useStory } from '@/hooks/stories/useStory';
import StoryDetail from '@/components/features/stories/StoryDetail';
import CommentList from '@/components/features/comments/CommentList';
import SummaryPanel from '@/components/common/SummaryPanel';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ButtonLink } from '@/components/ui/Button';
import { routes } from '@/lib/routes';

export default function StoryPage() {
  const params = useParams();
  const storyId = parseInt(params.id as string);

  const { data: story, isLoading: loading, error } = useStory(storyId);

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  if (loading) {
    return (
      <main className="page-shell">
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
          <div className="content-shell py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <ButtonLink href={routes.home()} variant="secondary" size="sm">
                ← Back
              </ButtonLink>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Story</p>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">Story Details</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="content-shell py-12">
          <LoadingSpinner size="lg" />
        </div>
      </main>
    );
  }

  if (errorMessage || !story) {
    return (
      <main className="page-shell">
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
          <div className="content-shell py-4 sm:py-5">
            <ButtonLink href="/" variant="secondary" size="sm">
              ← Back
            </ButtonLink>
          </div>
        </header>
        <div className="content-shell py-6">
          <ErrorMessage message={errorMessage || 'Failed to load story'} />
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="content-shell py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <ButtonLink href="/" variant="secondary" size="sm">
              ← Back
            </ButtonLink>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Story</p>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Story Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="content-shell py-6">
        {/* Story details */}
        <StoryDetail story={story} />

        {/* AI Summary */}
        <div className="mt-6">
          <SummaryPanel storyId={storyId} />
        </div>

        {/* Comments with pagination */}
        <div className="mt-6 card-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comments ({story.commentCount})
          </h2>
          <CommentList storyId={storyId} />
        </div>
      </div>
    </main>
  );
}
