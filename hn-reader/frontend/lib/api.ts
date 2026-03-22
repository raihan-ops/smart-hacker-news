import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  Story,
  Comment,
  StoriesResponse,
  CommentsResponse,
  BookmarksResponse,
  BookmarkExistsResponse,
  SummaryResponse,
} from '@/types';

// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (AI summaries can take time)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling utility
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    if (axiosError.code === 'ECONNABORTED' || /timeout/i.test(axiosError.message)) {
      throw new ApiError(
        'Summary request timed out. Please wait a moment and try again.',
        axiosError.response?.status,
        error
      );
    }

    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message;
    throw new ApiError(message, axiosError.response?.status, error);
  }
  throw new ApiError('An unexpected error occurred', undefined, error);
}

// API methods
export const api = {
  // Stories
  async getStories(type: 'top' | 'new' | 'best' = 'top', page = 1, limit = 30) {
    try {
      const { data } = await apiClient.get<StoriesResponse>('/api/stories', {
        params: { type, page, limit },
      });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getStory(id: number) {
    try {
      const { data } = await apiClient.get<Story>(`/api/stories/${id}`);
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getComments(storyId: number, depth: number | 'all' = 1) {
    try {
      const { data } = await apiClient.get<CommentsResponse>(
        `/api/stories/${storyId}/comments`,
        {
          params: { depth },
          timeout: 60000, // 60s for complex comment trees
        }
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getCommentsPaginated(
    storyId: number,
    depth: number | 'all' = 1,
    limit = 20,
    offset = 0
  ) {
    try {
      const { data } = await apiClient.get(
        `/api/stories/${storyId}/comments`,
        {
          params: { depth, limit, offset },
          timeout: 60000,
        }
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getCommentReplies(storyId: number, commentId: number, depth: number | 'all' = 1) {
    try {
      const { data } = await apiClient.get<{ commentId: number; replies: Comment[]; count: number }>(
        `/api/stories/${storyId}/comments/${commentId}/replies`,
        {
          params: { depth },
          timeout: 30000,
        }
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Bookmarks
  async getBookmarks(search = '', page = 1, limit = 30) {
    try {
      const { data } = await apiClient.get<BookmarksResponse>('/api/bookmarks', {
        params: { search, page, limit },
      });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async checkBookmark(storyId: number) {
    try {
      const { data } = await apiClient.get<BookmarkExistsResponse>(
        `/api/bookmarks/${storyId}/exists`
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async checkMultipleBookmarks(storyIds: number[]) {
    try {
      const { data } = await apiClient.post<Record<number, boolean>>(
        '/api/bookmarks/check-multiple',
        { storyIds }
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async createBookmark(storyId: number) {
    try {
      const { data } = await apiClient.post('/api/bookmarks', { storyId });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteBookmark(storyId: number) {
    try {
      const { data } = await apiClient.delete(`/api/bookmarks/${storyId}`);
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Summarization
  async generateSummary(storyId: number) {
    try {
      const { data } = await apiClient.post<SummaryResponse>(
        `/api/summarize/${storyId}`,
        undefined,
        {
          timeout: 120000,
        }
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getSummary(storyId: number) {
    try {
      const { data } = await apiClient.get<SummaryResponse>(
        `/api/summarize/${storyId}`
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
