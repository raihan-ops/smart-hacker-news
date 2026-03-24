import { Router, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { assertStoryType, getReplies, getStoryById, getStoryComments, listStories } from '../services/storyService';
import { parseBoundedIntQuery, parseIntParam, parseNonNegativeIntQuery, readSingleValue } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * @openapi
 * /api/stories:
 *   get:
 *     tags:
 *       - Stories
 *     summary: Get list of stories
 *     description: Retrieve a paginated list of Hacker News stories
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [top, new, best]
 *           default: top
 *         description: Type of stories to fetch
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *           maximum: 100
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
 *                     stories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Story'
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     type:
 *                       type: string
 *                       enum: [top, new, best]
 *                     hasMore:
 *                       type: boolean
 *                     totalFetched:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @openapi
 * /api/stories/{id}:
 *   get:
 *     tags:
 *       - Stories
 *     summary: Get a single story
 *     description: Retrieve a specific story by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Story'
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @openapi
 * /api/stories/{id}/comments:
 *   get:
 *     tags:
 *       - Stories
 *     summary: Get comments for a story
 *     description: Retrieve comments for a specific story with pagination and depth control
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *       - in: query
 *         name: depth
 *         schema:
 *           oneOf:
 *             - type: integer
 *               minimum: 0
 *             - type: string
 *               enum: [all]
 *           default: 1
 *         description: Comment nesting depth (1 for top-level only, 'all' for full tree)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 10000
 *         description: Number of top-level comments to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Skip first N comments for pagination
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                     story:
 *                       $ref: '#/components/schemas/Story'
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     commentCount:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *                     offset:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Invalid parameters
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
      max: 10000,
      label: 'limit',
    });
    const offset = parseNonNegativeIntQuery(req.query.offset, 0, 'offset');

    const result = await getStoryComments({ storyId, depth, limit, offset });
    sendSuccess(res, result);
  })
);

/**
 * @openapi
 * /api/stories/{id}/comments/{commentId}/replies:
 *   get:
 *     tags:
 *       - Stories
 *     summary: Get replies for a specific comment
 *     description: Lazy load replies for a comment (used for infinite scroll)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *       - in: query
 *         name: depth
 *         schema:
 *           oneOf:
 *             - type: integer
 *               minimum: 0
 *             - type: string
 *               enum: [all]
 *           default: 1
 *         description: Reply nesting depth
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
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
 *                     commentId:
 *                       type: integer
 *                     replies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     count:
 *                       type: integer
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
