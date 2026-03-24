import { Router, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createBookmark,
  deleteBookmark,
  getAllBookmarkedIds,
  listBookmarks,
} from '../services/bookmarkService';
import { parseBoundedIntQuery, parseIntParam, readSingleValue } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * @openapi
 * /api/bookmarks:
 *   get:
 *     tags:
 *       - Bookmarks
 *     summary: Get all bookmarks
 *     description: Retrieve a paginated list of bookmarks with optional search
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for title or author
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookmarks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bookmark'
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *                     totalPages:
 *                       type: integer
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
 * @openapi
 * /api/bookmarks/ids:
 *   get:
 *     tags:
 *       - Bookmarks
 *     summary: Get all bookmarked story IDs
 *     description: Returns an array of all bookmarked story IDs
 *     responses:
 *       200:
 *         description: Array of bookmarked story IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: integer
 */
router.get(
  '/ids',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getAllBookmarkedIds();
    sendSuccess(res, result);
  })
);

/**
 * @openapi
 * /api/bookmarks:
 *   post:
 *     tags:
 *       - Bookmarks
 *     summary: Create a bookmark
 *     description: Create a new bookmark for a story
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *             properties:
 *               storyId:
 *                 type: integer
 *                 description: Story ID to bookmark
 *     responses:
 *       201:
 *         description: Bookmark created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     bookmark:
 *                       $ref: '#/components/schemas/Bookmark'
 *       200:
 *         description: Story already bookmarked
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @openapi
 * /api/bookmarks/{storyId}:
 *   delete:
 *     tags:
 *       - Bookmarks
 *     summary: Delete a bookmark
 *     description: Delete a bookmark by story ID
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID to unbookmark
 *     responses:
 *       200:
 *         description: Bookmark deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       404:
 *         description: Bookmark not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
