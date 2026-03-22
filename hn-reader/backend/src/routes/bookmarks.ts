import { Router, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  checkMultipleBookmarks,
  createBookmark,
  deleteBookmark,
  isBookmarked,
  listBookmarks,
} from '../services/bookmarkService';
import { parseBoundedIntQuery, parseIntParam, readSingleValue } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * GET /api/bookmarks
 * Get all bookmarks with optional search
 * Query params: search (string), page (number), limit (number)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const search = readSingleValue(req.query.search) ?? '';
    const page = parseBoundedIntQuery(req.query.page, {
      defaultValue: 1,
      min: 1,
      max: 1000,
      label: 'page',
    });
    const limit = parseBoundedIntQuery(req.query.limit, {
      defaultValue: 30,
      min: 1,
      max: 100,
      label: 'limit',
    });

    const result = await listBookmarks({ search, page, limit });
    sendSuccess(res, result);
  })
);

/**
 * GET /api/bookmarks/:storyId/exists
 * Check if a story is bookmarked
 */
router.get(
  '/:storyId/exists',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await isBookmarked(storyId);
    sendSuccess(res, result);
  })
);

/**
 * POST /api/bookmarks/check-multiple
 * Check multiple stories for bookmark status
 * Body: { storyIds: number[] }
 */
router.post(
  '/check-multiple',
  asyncHandler(async (req: Request, res: Response) => {
    const { storyIds } = req.body as { storyIds?: unknown };

    if (!Array.isArray(storyIds) || storyIds.some((id) => typeof id !== 'number')) {
      throw new AppError(400, 'Invalid request body. storyIds must be an array of numbers', 'INVALID_BODY');
    }

    const result = await checkMultipleBookmarks(storyIds as number[]);
    sendSuccess(res, result);
  })
);

/**
 * POST /api/bookmarks
 * Create a new bookmark
 * Body: { storyId: number }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { storyId } = req.body as { storyId?: unknown };

    if (typeof storyId !== 'number') {
      throw new AppError(400, 'Invalid request body. storyId is required and must be a number', 'INVALID_BODY');
    }

    const result = await createBookmark(storyId);
    sendSuccess(
      res,
      {
      message: result.message,
      bookmark: result.bookmark,
      },
      result.created ? 201 : 200
    );
  })
);

/**
 * DELETE /api/bookmarks/:storyId
 * Delete a bookmark by story ID
 */
router.delete(
  '/:storyId',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await deleteBookmark(storyId);
    sendSuccess(res, result);
  })
);

export default router;
