import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Bookmark,
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

function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error.message, undefined, response.error);
  }

  return response.data;
}

function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown> | { error?: string; message?: string }>;

    if (axiosError.code === 'ECONNABORTED' || /timeout/i.test(axiosError.message)) {
      throw new ApiError(
        'Summary request timed out. Please wait a moment and try again.',
        axiosError.response?.status,
        error
      );
    }

    const envelope = axiosError.response?.data;
    if (envelope && typeof envelope === 'object' && 'success' in envelope && envelope.success === false) {
      throw new ApiError(envelope.error.message, axiosError.response?.status, envelope.error);
    }

    const message =
      (axiosError.response?.data as { message?: string; error?: string } | undefined)?.message ||
      (axiosError.response?.data as { message?: string; error?: string } | undefined)?.error ||
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
      const { data } = await apiClient.get<ApiResponse<StoriesResponse>>('/api/stories', {
        params: { type, page, limit },
      });
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getStory(id: number) {
    try {
      const { data } = await apiClient.get<ApiResponse<Story>>(`/api/stories/${id}`);
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getComments(storyId: number, depth: number | 'all' = 1) {
    try {
      const { data } = await apiClient.get<ApiResponse<CommentsResponse>>(
        `/api/stories/${storyId}/comments`,
        {
          params: { depth },
          timeout: 60000, // 60s for complex comment trees
        }
      );
      return unwrapApiResponse(data);
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
      const { data } = await apiClient.get<ApiResponse<CommentsResponse>>(
        `/api/stories/${storyId}/comments`,
        {
          params: { depth, limit, offset },
          timeout: 60000,
        }
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getCommentReplies(storyId: number, commentId: number, depth: number | 'all' = 1) {
    try {
      const { data } = await apiClient.get<ApiResponse<{ commentId: number; replies: Comment[]; count: number }>>(
        `/api/stories/${storyId}/comments/${commentId}/replies`,
        {
          params: { depth },
          timeout: 30000,
        }
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Bookmarks
  async getBookmarks(search = '', page = 1, limit = 30) {
    try {
      const { data } = await apiClient.get<ApiResponse<BookmarksResponse>>('/api/bookmarks', {
        params: { search, page, limit },
      });
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async checkBookmark(storyId: number) {
    try {
      const { data } = await apiClient.get<ApiResponse<BookmarkExistsResponse>>(
        `/api/bookmarks/${storyId}/exists`
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async checkMultipleBookmarks(storyIds: number[]) {
    try {
      const { data } = await apiClient.post<ApiResponse<Record<number, boolean>>>(
        '/api/bookmarks/check-multiple',
        { storyIds }
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async createBookmark(storyId: number) {
    try {
      const { data } = await apiClient.post<ApiResponse<{ message: string; bookmark: Bookmark }>>('/api/bookmarks', { storyId });
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteBookmark(storyId: number) {
    try {
      const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/bookmarks/${storyId}`);
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Summarization
  async generateSummary(storyId: number) {
    try {
      const { data } = await apiClient.post<ApiResponse<SummaryResponse>>(
        `/api/summarize/${storyId}`,
        undefined,
        {
          timeout: 120000,
        }
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getSummary(storyId: number) {
    try {
      const { data } = await apiClient.get<ApiResponse<SummaryResponse>>(
        `/api/summarize/${storyId}`
      );
      return unwrapApiResponse(data);
    } catch (error) {
      handleApiError(error);
    }
  },
};
