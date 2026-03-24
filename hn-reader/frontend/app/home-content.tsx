'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import StoryList from '@/components/features/stories/StoryList';
import { StoryType } from '@/types';
import { queryParams } from '@/lib/routes';

export default function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get story type from URL or default to 'top'
  const activeType = (searchParams.get(queryParams.type) || 'top') as StoryType;

  const handleTypeChange = (type: StoryType) => {
    // Reset to page 1 when changing type
    router.push(`?${queryParams.type}=${type}`, { scroll: false });
  };

  return (
    <main className="page-shell">
      {/* Navigation tabs */}
      <nav className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="content-shell py-3">
          <div className="ml-auto flex w-full items-center justify-end">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Filter Stories</p>
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
            {(['top', 'new', 'best'] as StoryType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                  activeType === type
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Story list */}
      <div className="content-shell py-6">
        <StoryList type={activeType} />
      </div>
    </main>
  );
}
