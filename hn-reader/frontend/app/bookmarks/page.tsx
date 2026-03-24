'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBookmarksPage } from '@/hooks/bookmarks/useBookmarksPage';
import SearchBar from '@/components/features/search/SearchBar';
import StoryCard from '@/components/features/stories/StoryCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import Pagination from '@/components/common/Pagination';
import { ButtonLink } from '@/components/ui/Button';
import { routes } from '@/lib/routes';

function BookmarksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading: loading, error, refetch } = useBookmarksPage(search, page, 30);

  const bookmarks = data?.bookmarks ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  // Convert bookmarks to story format for StoryCard
  const bookmarkStories = bookmarks.map(b => ({
    id: b.storyId,
    title: b.title,
    url: b.url,
    author: b.author,
    points: b.points,
    commentCount: b.commentCount,
    time: new Date(b.createdAt).getTime() / 1000,
  }));

  return (
    <main className="page-shell">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="content-shell py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <ButtonLink href={routes.home()} variant="secondary" size="sm">
                ← Home
              </ButtonLink>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Saved</p>
                <h1 className="text-xl font-bold leading-tight">My Bookmarks</h1>
              </div>
            </div>
          </div>
          <SearchBar />
        </div>
      </header>

      <div className="content-shell py-6">
        {loading && (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => refetch()} />}

        {!loading && !error && bookmarkStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {search ? 'No bookmarks match your search.' : 'No bookmarks yet.'}
            </p>
            <ButtonLink href={routes.home()} className="mt-4">
              Browse Stories
            </ButtonLink>
          </div>
        )}

        {!loading && !error && bookmarkStories.length > 0 && (
          <>
            <div className="card-surface divide-y divide-gray-200 px-3 sm:px-4">
              {bookmarkStories.map((story) => (
                <StoryCard key={story.id} story={story} isBookmarked={true} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function BookmarksPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <BookmarksContent />
    </Suspense>
  );
}
