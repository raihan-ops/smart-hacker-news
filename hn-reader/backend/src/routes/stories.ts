import { Router, Request, Response } from 'express';
import { getStories, getStory, getStoryWithComments, getCommentReplies } from '../services/hnClient';

const router = Router();

/**
 * GET /api/stories
 * Get list of stories with pagination
 * Query params: type (top|new|best), page (number), limit (number)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as 'top' | 'new' | 'best') || 'top';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    // Validate parameters
    if (!['top', 'new', 'best'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type parameter. Must be one of: top, new, best',
      });
    }

    if (page < 1 || page > 100) {
      return res.status(400).json({
        error: 'Invalid page parameter. Must be between 1 and 100',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 100',
      });
    }

    const stories = await getStories(type, page, limit);

    // HN API typically has around 500-1000 stories per category, but we cap at reasonable limit
    // Assume roughly 500 stories available per type
    const estimatedTotalStories = 500;
    const totalPages = Math.ceil(estimatedTotalStories / limit);

    res.json({
      stories,
      page,
      limit,
      type,
      hasMore: stories.length === limit,
      totalFetched: stories.length,
      totalCount: estimatedTotalStories,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      error: 'Failed to fetch stories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/stories/:id
 * Get a single story by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.id);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    const story = await getStory(storyId);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
      });
    }

    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      error: 'Failed to fetch story',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/stories/:id/comments
 * Get comments for a story
 * Query params:
 *   - depth (number|'all') - 1 for top-level only, 'all' for full tree
 *   - limit (number) - Number of top-level comments to return (default: 20)
 *   - offset (number) - Skip first N comments (default: 0)
 */
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.id);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    // Parse depth parameter
    let depth: number | undefined;
    const depthParam = req.query.depth as string;

    if (depthParam) {
      if (depthParam === 'all') {
        depth = undefined; // Use default MAX_DEPTH
      } else {
        depth = parseInt(depthParam);
        if (isNaN(depth) || depth < 0) {
          return res.status(400).json({
            error: 'Invalid depth parameter. Must be a positive number or "all"',
          });
        }
      }
    } else {
      depth = 1; // Default to top-level only for fast initial load
    }

    // Parse pagination parameters
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 100',
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        error: 'Invalid offset parameter. Must be >= 0',
      });
    }

    const { story, comments: allComments } = await getStoryWithComments(storyId, depth);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
      });
    }

    // Apply pagination to top-level comments
    const paginatedComments = allComments.slice(offset, offset + limit);
    const hasMore = offset + limit < allComments.length;

    res.json({
      story,
      comments: paginatedComments,
      commentCount: allComments.length,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/stories/:id/comments/:commentId/replies
 * Get replies for a specific comment (lazy loading)
 */
router.get('/:id/comments/:commentId/replies', async (req: Request, res: Response) => {
  try {
    const storyId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);

    if (isNaN(storyId) || isNaN(commentId)) {
      return res.status(400).json({
        error: 'Invalid story ID or comment ID',
      });
    }

    // Parse depth parameter for nested replies
    let depth = 1; // Default to immediate children only
    const depthParam = req.query.depth as string;

    if (depthParam) {
      if (depthParam === 'all') {
        depth = 999; // Effectively unlimited
      } else {
        depth = parseInt(depthParam);
        if (isNaN(depth) || depth < 0) {
          return res.status(400).json({
            error: 'Invalid depth parameter. Must be a positive number or "all"',
          });
        }
      }
    }

    const replies = await getCommentReplies(commentId, depth);

    res.json({
      commentId,
      replies,
      count: replies.length,
    });
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    res.status(500).json({
      error: 'Failed to fetch comment replies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
