import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateSummary, getCachedSummary } from '../services/summaryService';
import { parseIntParam } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * @openapi
 * /api/summarize/{storyId}:
 *   post:
 *     tags:
 *       - Summarize
 *     summary: Generate AI summary for a story
 *     description: Generate an AI-powered summary of a story's discussion using Google's Gemini AI
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID to summarize
 *     responses:
 *       200:
 *         description: Summary generated successfully (may be cached or newly generated)
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
 *                     storyId:
 *                       type: integer
 *                     summary:
 *                       type: string
 *                       description: AI-generated summary text
 *                     key_points:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Key discussion points
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, mixed, neutral]
 *                       description: Overall sentiment of the discussion
 *                     cached:
 *                       type: boolean
 *                       description: Whether this summary was retrieved from cache
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the summary was generated
 *       404:
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: AI generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags:
 *       - Summarize
 *     summary: Get cached summary
 *     description: Retrieve a previously generated summary from cache (does not generate new summary)
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Cached summary found
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
 *                     storyId:
 *                       type: integer
 *                     summary:
 *                       type: string
 *                     key_points:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, mixed, neutral]
 *                     cached:
 *                       type: boolean
 *                       example: true
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Summary not found in cache
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:storyId',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await generateSummary(storyId);
    sendSuccess(res, result);
  })
);

router.get(
  '/:storyId',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await getCachedSummary(storyId);
    sendSuccess(res, result);
  })
);

export default router;
