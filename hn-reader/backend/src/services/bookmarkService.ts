import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import prisma from '../lib/prisma';
import { getStory } from './hnClient';

export interface BookmarkListQuery {
  search: string;
  page: number;
  limit: number;
}

export async function listBookmarks(params: BookmarkListQuery) {
  const { search, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.BookmarkWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      orderBy: { bookmarkedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);

  return {
    bookmarks,
    page,
    limit,
    total,
    hasMore: page * limit < total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function isBookmarked(storyId: number) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { storyId },
  });

  return {
    exists: Boolean(bookmark),
    bookmark: bookmark ?? null,
  };
}

export async function checkMultipleBookmarks(storyIds: number[]) {
  if (storyIds.length === 0) {
    return {};
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      storyId: { in: storyIds },
    },
    select: { storyId: true },
  });

  const bookmarkedIds = new Set(bookmarks.map((bookmark) => bookmark.storyId));
  const result: Record<number, boolean> = {};

  for (const storyId of storyIds) {
    result[storyId] = bookmarkedIds.has(storyId);
  }

  return result;
}

export async function createBookmark(storyId: number) {
  const existing = await prisma.bookmark.findUnique({
    where: { storyId },
  });

  if (existing) {
    return {
      created: false,
      message: 'Story already bookmarked',
      bookmark: existing,
    };
  }

  const story = await getStory(storyId);
  if (!story) {
    throw new AppError(404, 'Story not found on Hacker News', 'STORY_NOT_FOUND');
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      storyId: story.id,
      title: story.title,
      url: story.url || null,
      author: story.author,
      points: story.points,
      commentCount: story.commentCount,
      createdAt: new Date(story.time * 1000),
    },
  });

  return {
    created: true,
    message: 'Bookmark created successfully',
    bookmark,
  };
}

export async function deleteBookmark(storyId: number) {
  const existing = await prisma.bookmark.findUnique({
    where: { storyId },
  });

  if (!existing) {
    throw new AppError(404, 'Bookmark not found', 'BOOKMARK_NOT_FOUND');
  }

  await prisma.bookmark.delete({
    where: { storyId },
  });

  return {
    message: 'Bookmark deleted successfully',
  };
}
