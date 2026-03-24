// Centralized query key factory for React Query
// Following TanStack Query best practices: https://tkdodo.eu/blog/effective-react-query-keys

export const queryKeys = {
  stories: {
    all: ['stories'] as const,
    lists: () => [...queryKeys.stories.all, 'list'] as const,
    list: (type: string, page: number) => [...queryKeys.stories.lists(), type, page] as const,
    infinite: (type: string) => [...queryKeys.stories.all, 'infinite', type] as const,
    details: () => [...queryKeys.stories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.stories.details(), id] as const,
  },

  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (storyId: number, depth: number | 'all', page: number) =>
      [...queryKeys.comments.lists(), storyId, depth, page] as const,
    infinite: (storyId: number, depth: number | 'all') =>
      [...queryKeys.comments.all, 'infinite', storyId, depth] as const,
  },

  bookmarks: {
    all: ['bookmarks'] as const,
    lists: () => [...queryKeys.bookmarks.all, 'list'] as const,
    list: (search: string, page: number) => [...queryKeys.bookmarks.lists(), search, page] as const,
    ids: () => [...queryKeys.bookmarks.all, 'ids'] as const,
  },

  summary: {
    all: ['summary'] as const,
    detail: (storyId: number) => [...queryKeys.summary.all, storyId] as const,
  },
} as const;
