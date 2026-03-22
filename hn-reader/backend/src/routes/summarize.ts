import { Router, Request, Response } from 'express';
import { getStoryWithComments } from '../services/hnClient';
import { summarizeDiscussion } from '../services/aiService';
import prisma from '../lib/prisma';

const router = Router();

/**
 * POST /api/summarize/:storyId
 * Generate AI summary for a story's discussion
 */
router.post('/:storyId', async (req: Request, res: Response) => {
  try {
    const storyIdParam = Array.isArray(req.params.storyId)
      ? req.params.storyId[0]
      : req.params.storyId;
    const storyId = parseInt(storyIdParam, 10);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    // Check if summary already exists in database
    const existingSummary = await prisma.summary.findUnique({
      where: { storyId },
    });

    if (existingSummary) {
      return res.json({
        storyId,
        summary: existingSummary.summaryText,
        key_points: existingSummary.keyPoints,
        sentiment: existingSummary.sentiment,
        cached: true,
        generatedAt: existingSummary.createdAt,
      });
    }

    // Fetch story and comments from HN API (with full depth for AI)
    const { story, comments } = await getStoryWithComments(storyId, undefined);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found on Hacker News',
      });
    }

    if (!comments || comments.length === 0) {
      return res.status(400).json({
        error: 'No comments found for this story',
        message: 'Cannot generate summary for a story without comments',
      });
    }

    // Generate summary using AI
    console.log(`Generating AI summary for story ${storyId}...`);
    const startTime = Date.now();

    const summaryResult = await summarizeDiscussion(comments);

    const duration = Date.now() - startTime;
    console.log(`Summary generated in ${duration}ms`);

    // Save summary to database so repeated requests do not hit AI provider again
    try {
      await prisma.summary.upsert({
        where: { storyId },
        update: {
          summaryText: summaryResult.summary,
          keyPoints: summaryResult.key_points,
          sentiment: summaryResult.sentiment,
        },
        create: {
          storyId,
          summaryText: summaryResult.summary,
          keyPoints: summaryResult.key_points,
          sentiment: summaryResult.sentiment,
        },
      });
      console.log(`Summary cached in database for story ${storyId}`);
    } catch (dbError) {
      console.error('Error saving summary to database:', dbError);
      // Continue anyway - we still have the summary
    }

    res.json({
      storyId,
      summary: summaryResult.summary,
      key_points: summaryResult.key_points,
      sentiment: summaryResult.sentiment,
      cached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating summary:', error);

    if (error instanceof Error) {
      if (error.message.includes('No valid comments')) {
        return res.status(400).json({
          error: 'Cannot summarize',
          message: error.message,
        });
      }

      if (error.message.includes('API key')) {
        return res.status(500).json({
          error: 'Configuration error',
          message: 'AI provider API is not properly configured',
        });
      }

      if (/quota|rate limit|429/i.test(error.message)) {
        return res.status(429).json({
          error: 'AI rate limit exceeded',
          message: 'You have reached the AI API daily quota. Please try again later or upgrade your API plan.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    }

    res.status(500).json({
      error: 'Failed to generate summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/summarize/:storyId
 * Get cached summary if it exists
 */
router.get('/:storyId', async (req: Request, res: Response) => {
  try {
    const storyIdParam = Array.isArray(req.params.storyId)
      ? req.params.storyId[0]
      : req.params.storyId;
    const storyId = parseInt(storyIdParam, 10);

    if (isNaN(storyId)) {
      return res.status(400).json({
        error: 'Invalid story ID',
      });
    }

    const summary = await prisma.summary.findUnique({
      where: { storyId },
    });

    if (!summary) {
      return res.status(404).json({
        error: 'Summary not found',
        message: 'Generate a summary first using POST request',
      });
    }

    res.json({
      storyId,
      summary: summary.summaryText,
      key_points: summary.keyPoints,
      sentiment: summary.sentiment,
      cached: true,
      generatedAt: summary.createdAt,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Failed to fetch summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
