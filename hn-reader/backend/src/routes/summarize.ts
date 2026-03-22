import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateSummary, getCachedSummary } from '../services/summaryService';
import { parseIntParam } from '../utils/request';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * POST /api/summarize/:storyId
 * Generate AI summary for a story's discussion
 */
router.post(
  '/:storyId',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await generateSummary(storyId);
    sendSuccess(res, result);
  })
);

/**
 * GET /api/summarize/:storyId
 * Get cached summary if it exists
 */
router.get(
  '/:storyId',
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseIntParam(req.params.storyId, 'story ID');
    const result = await getCachedSummary(storyId);
    sendSuccess(res, result);
  })
);

export default router;
