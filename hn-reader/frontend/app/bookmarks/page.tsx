'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Bookmark } from '@/types';
import SearchBar from '@/components/SearchBar';
import StoryCard from '@/components/StoryCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';
import { useState } from 'react';

function BookmarksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookmarks = async (pageNum: number, searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getBookmarks(searchQuery, pageNum, 30);
      setBookmarks(response.bookmarks);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks(page, search);
  }, [page, search]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

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
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/"
                className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-sm"
              >
                ← Home
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Saved</p>
                <h1 className="text-2xl font-bold leading-tight">My Bookmarks</h1>
              </div>
            </div>
          </div>
          <SearchBar />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={() => fetchBookmarks(page, search)} />}

        {!loading && !error && bookmarkStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {search ? 'No bookmarks match your search.' : 'No bookmarks yet.'}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Stories
            </Link>
          </div>
        )}

        {!loading && !error && bookmarkStories.length > 0 && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
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
