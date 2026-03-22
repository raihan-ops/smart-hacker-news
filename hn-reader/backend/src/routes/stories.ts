import { Router, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { assertStoryType, getReplies, getStoryById, getStoryComments, listStories } from '../services/storyService';
import { parseBoundedIntQuery, parseIntParam, parseNonNegativeIntQuery, readSingleValue } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * GET /api/stories
 * Get list of stories with pagination
 * Query params: type (top|new|best), page (number), limit (number)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const type = readSingleValue(req.query.type) ?? 'top';
    assertStoryType(type);

    const page = parseBoundedIntQuery(req.query.page, {
      defaultValue: 1,
      min: 1,
      max: 100,
      label: 'page',
    });
    const limit = parseBoundedIntQuery(req.query.limit, {
      defaultValue: 30,
      min: 1,
      max: 100,
      label: 'limit',
    });

    const result = await listStories({ type, page, limit });
    sendSuccess(res, result);
  })
);

/**
 * GET /api/stories/:id
 * Get a single story by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.id, 'story ID');
    const story = await getStoryById(storyId);
    sendSuccess(res, story);
  })
);

/**
 * GET /api/stories/:id/comments
 * Get comments for a story
 * Query params:
 *   - depth (number|'all') - 1 for top-level only, 'all' for full tree
 *   - limit (number) - Number of top-level comments to return (default: 20)
 *   - offset (number) - Skip first N comments (default: 0)
 */
router.get(
  '/:id/comments',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.id, 'story ID');

    const depthParam = readSingleValue(req.query.depth);
    let depth: number | undefined = 1;

    if (depthParam) {
      if (depthParam === 'all') {
        depth = undefined;
      } else {
        const parsedDepth = Number.parseInt(depthParam, 10);
        if (!Number.isInteger(parsedDepth) || parsedDepth < 0) {
          throw new AppError(400, 'Invalid depth parameter. Must be a positive number or "all"', 'INVALID_DEPTH');
        }
        depth = parsedDepth;
      }
    }

    const limit = parseBoundedIntQuery(req.query.limit, {
      defaultValue: 20,
      min: 1,
      max: 100,
      label: 'limit',
    });
    const offset = parseNonNegativeIntQuery(req.query.offset, 0, 'offset');

    const result = await getStoryComments({ storyId, depth, limit, offset });
    sendSuccess(res, result);
  })
);

/**
 * GET /api/stories/:id/comments/:commentId/replies
 * Get replies for a specific comment (lazy loading)
 */
router.get(
  '/:id/comments/:commentId/replies',
  asyncHandler(async (req: Request, res: Response) => {
    parseIntParam(req.params.id, 'story ID');
    const commentId = parseIntParam(req.params.commentId, 'comment ID');

    const depthParam = readSingleValue(req.query.depth);
    let depth = 1;

    if (depthParam) {
      if (depthParam === 'all') {
        depth = 999;
      } else {
        const parsedDepth = Number.parseInt(depthParam, 10);
        if (!Number.isInteger(parsedDepth) || parsedDepth < 0) {
          throw new AppError(400, 'Invalid depth parameter. Must be a positive number or "all"', 'INVALID_DEPTH');
        }
        depth = parsedDepth;
      }
    }

    const result = await getReplies({ commentId, depth });
    sendSuccess(res, result);
  })
);

export default router;
