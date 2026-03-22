import { Router, Request, Response } from 'express';
import { getStory } from '../services/hnClient';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/bookmarks
 * Get all bookmarks with optional search
 * Query params: search (string), page (number), limit (number)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { author: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get bookmarks with pagination
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        orderBy: { bookmarkedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({ where }),
    ]);

    res.json({
      bookmarks,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      error: 'Failed to fetch bookmarks',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/bookmarks/:storyId/exists
 * Check if a story is bookmarked
 */
router.get('/:storyId/exists', async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.storyId);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { storyId },
    });

    res.json({
      exists: !!bookmark,
      bookmark: bookmark || null,
    });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({
      error: 'Failed to check bookmark',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/bookmarks/check-multiple
 * Check multiple stories for bookmark status
 * Body: { storyIds: number[] }
 */
router.post('/check-multiple', async (req: Request, res: Response) => {
  try {
    const { storyIds } = req.body;

    if (!Array.isArray(storyIds) || storyIds.some((id) => typeof id !== 'number')) {
      return res.status(400).json({
        error: 'Invalid request body. storyIds must be an array of numbers',
      });
    }

    // Fetch all bookmarks for the given story IDs
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        storyId: { in: storyIds },
      },
      select: { storyId: true },
    });

    // Create a Set of bookmarked story IDs for fast lookup
    const bookmarkedIds = new Set(bookmarks.map((b) => b.storyId));

    // Return object mapping storyId -> isBookmarked
    const result: Record<number, boolean> = {};
    storyIds.forEach((id) => {
      result[id] = bookmarkedIds.has(id);
    });

    res.json(result);
  } catch (error) {
    console.error('Error checking multiple bookmarks:', error);
    res.status(500).json({
      error: 'Failed to check bookmarks',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/bookmarks
 * Create a new bookmark
 * Body: { storyId: number }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { storyId } = req.body;

    if (!storyId || typeof storyId !== 'number') {
      return res.status(400).json({
        error: 'Invalid request body. storyId is required and must be a number',
      });
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: { storyId },
    });

    if (existing) {
      return res.json({
        message: 'Story already bookmarked',
        bookmark: existing,
      });
    }

    // Fetch story details from HN API
    const story = await getStory(storyId);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found on Hacker News',
      });
    }

    // Create bookmark
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

    res.status(201).json({
      message: 'Bookmark created successfully',
      bookmark,
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({
      error: 'Failed to create bookmark',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/bookmarks/:storyId
 * Delete a bookmark by story ID
 */
router.delete('/:storyId', async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.storyId);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    // Check if exists
    const existing = await prisma.bookmark.findUnique({
      where: { storyId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Bookmark not found',
      });
    }

    // Delete bookmark (cascade delete summary if exists)
    await prisma.bookmark.delete({
      where: { storyId },
    });

    res.json({
      message: 'Bookmark deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({
      error: 'Failed to delete bookmark',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
