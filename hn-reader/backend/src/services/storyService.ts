import { AppError } from '../errors/AppError';
import { getCommentReplies, getStories, getStory, getStoryIdsByType, getStoryWithComments } from './hnClient';

type StoryType = 'top' | 'new' | 'best';

export interface StoriesQuery {
  type: StoryType;
  page: number;
  limit: number;
}

export interface StoryCommentsQuery {
  storyId: number;
  depth?: number;
  limit: number;
  offset: number;
}

export interface StoryRepliesQuery {
  commentId: number;
  depth: number;
}

export function assertStoryType(type: string): asserts type is StoryType {
  if (!['top', 'new', 'best'].includes(type)) {
    throw new AppError(400, 'Invalid type parameter. Must be one of: top, new, best', 'INVALID_STORY_TYPE');
  }
}

export async function listStories(params: StoriesQuery) {
  const { type, page, limit } = params;

  const [stories, allStoryIds] = await Promise.all([getStories(type, page, limit), getStoryIdsByType(type)]);

  const totalCount = allStoryIds.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    stories,
    page,
    limit,
    type,
    hasMore: page * limit < totalCount,
    totalFetched: stories.length,
    totalCount,
    totalPages,
  };
}

export async function getStoryById(storyId: number) {
  const story = await getStory(storyId);

  if (!story) {
    throw new AppError(404, 'Story not found', 'STORY_NOT_FOUND');
  }

  return story;
}

export async function getStoryComments(params: StoryCommentsQuery) {
  const { storyId, depth, limit, offset } = params;

  const { story, comments: allComments } = await getStoryWithComments(storyId, depth);

  if (!story) {
    throw new AppError(404, 'Story not found', 'STORY_NOT_FOUND');
  }

  const paginatedComments = allComments.slice(offset, offset + limit);
  const totalCount = allComments.length;

  return {
    story,
    comments: paginatedComments,
    commentCount: totalCount,
    hasMore: offset + limit < totalCount,
    offset,
    limit,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    nextOffset: offset + limit < totalCount ? offset + limit : null,
  };
}

export async function getReplies(params: StoryRepliesQuery) {
  const { commentId, depth } = params;
  const replies = await getCommentReplies(commentId, depth);

  return {
    commentId,
    replies,
    count: replies.length,
  };
}
