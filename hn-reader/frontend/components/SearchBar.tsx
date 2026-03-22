'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/bookmarks?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
