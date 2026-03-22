// Core data types (aligned with backend)
export interface Story {
  id: number;
  title: string;
  url?: string;
  author: string;
  points: number;
  commentCount: number;
  time: number; // Unix timestamp
  text?: string; // For text/Ask HN posts
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  time: number; // Unix timestamp
  children: Comment[]; // Nested structure
  hasUnloadedChildren?: boolean; // Whether comment has children that haven't been loaded yet
}

export interface Bookmark {
  id: number;
  storyId: number;
  title: string;
  url?: string;
  author: string;
  points: number;
  commentCount: number;
  createdAt: Date | string; // Story creation time
  bookmarkedAt: Date | string; // When user bookmarked
}

export interface Summary {
  id?: number;
  storyId: number;
  summary: string;
  key_points: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  cached?: boolean;
  generatedAt: Date | string;
}

// API response types
export interface StoriesResponse {
  stories: Story[];
  page: number;
  limit: number;
  type: 'top' | 'new' | 'best';
  hasMore: boolean;
  totalFetched: number;
  totalCount: number;
  totalPages: number;
}

export interface CommentsResponse {
  story: Story;
  comments: Comment[];
  commentCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookmarkExistsResponse {
  exists: boolean;
  bookmark: Bookmark | null;
}

export interface SummaryResponse {
  storyId: number;
  summary: string;
  key_points: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  cached: boolean;
  generatedAt: string;
}

// Component prop types
export type StoryType = 'top' | 'new' | 'best';
