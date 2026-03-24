'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/lib/routes';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  // Sync query state with URL when navigating (e.g., back button)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== query) {
      setQuery(urlSearch);
    }
  }, [searchParams]);

  // Debounce search - trigger search after 300ms of no typing
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';

    // Only update URL if query is different from current URL
    if (currentSearch === query) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      // Reset to page 1 when searching
      params.delete('page');
      router.push(`${routes.bookmarks.index()}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
