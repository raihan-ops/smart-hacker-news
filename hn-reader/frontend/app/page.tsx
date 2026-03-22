'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StoryList from '@/components/StoryList';
import { StoryType } from '@/types';

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get story type from URL or default to 'top'
  const activeType = (searchParams.get('type') || 'top') as StoryType;

  const handleTypeChange = (type: StoryType) => {
    // Reset to page 1 when changing type
    router.push(`?type=${type}`, { scroll: false });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Hacker News</p>
              <h1 className="text-2xl font-bold leading-tight">Smart HN Reader</h1>
              <p className="text-sm text-slate-300 mt-1">Curated stories with fast navigation and AI context.</p>
            </div>
            <Link
              href="/bookmarks"
              className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-orange-100 transition-colors font-semibold shadow-sm"
            >
              Bookmarks
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {(['top', 'new', 'best'] as StoryType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`py-2 px-4 rounded-full text-sm transition-all capitalize whitespace-nowrap ${
                  activeType === type
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Story list */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <StoryList type={activeType} />
      </div>
    </main>
  );
}
