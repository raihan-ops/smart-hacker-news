'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Story } from '@/types';
import StoryDetail from '@/components/StoryDetail';
import CommentList from '@/components/CommentList';
import SummaryPanel from '@/components/SummaryPanel';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StoryPage() {
  const params = useParams();
  const storyId = parseInt(params.id as string);

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getStory(storyId);
        setStory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-sm"
              >
                ← Back
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Story</p>
                <h1 className="text-xl font-bold leading-tight">Story Details</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" />
        </div>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Link
              href="/"
              className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-sm inline-block"
            >
              ← Back
            </Link>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <ErrorMessage message={error || 'Failed to load story'} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-sm"
            >
              ← Back
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Story</p>
              <h1 className="text-xl font-bold leading-tight">Story Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Story details */}
        <StoryDetail story={story} />

        {/* AI Summary */}
        <div className="mt-6">
          <SummaryPanel storyId={storyId} />
        </div>

        {/* Comments with pagination */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comments ({story.commentCount})
          </h2>
          <CommentList storyId={storyId} />
        </div>
      </div>
    </main>
  );
}
