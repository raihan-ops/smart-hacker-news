// Type-safe route configuration
// Single source of truth for all application routes

export const routes = {
  home: () => '/',

  bookmarks: {
    index: () => '/bookmarks',
    withSearch: (search: string, page = 1) =>
      `/bookmarks?search=${encodeURIComponent(search)}&page=${page}`,
    withPage: (page: number) => `/bookmarks?page=${page}`,
  },

  story: {
    detail: (id: number) => `/story/${id}`,
    detailWithCommentPage: (id: number, commentPage: number) =>
      `/story/${id}?commentPage=${commentPage}`,
  },
} as const;

// Query parameter keys (centralized)
export const queryParams = {
  type: 'type',
  page: 'page',
  search: 'search',
  commentPage: 'commentPage',
} as const;

// Helper to build query strings
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

// Type-safe route builder with query params
export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = buildQueryString(params);
  return query ? `${path}?${query}` : path;
}
