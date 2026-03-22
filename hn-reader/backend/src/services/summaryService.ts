import prisma from '../lib/prisma';
import { summarizeDiscussion } from './aiService';
import { getStoryWithComments } from './hnClient';
import { AppError } from '../errors/AppError';
import { config } from '../config/env';

function mapSummaryError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw new AppError(500, 'Failed to generate summary', 'SUMMARY_FAILED');
  }

  if (error.message.includes('No valid comments')) {
    throw new AppError(400, error.message, 'NO_VALID_COMMENTS');
  }

  if (error.message.includes('API key')) {
    throw new AppError(500, 'AI provider API is not properly configured', 'AI_CONFIG_ERROR');
  }

  if (/quota|rate limit|429/i.test(error.message)) {
    throw new AppError(429, 'You have reached the AI API daily quota. Please try again later or upgrade your API plan.', 'AI_RATE_LIMIT', config.server.nodeEnv === 'development' ? error.message : undefined);
  }

  throw new AppError(500, error.message, 'SUMMARY_FAILED');
}

export async function generateSummary(storyId: number) {
  const existingSummary = await prisma.summary.findUnique({
    where: { storyId },
  });

  if (existingSummary) {
    return {
      storyId,
      summary: existingSummary.summaryText,
      key_points: existingSummary.keyPoints,
      sentiment: existingSummary.sentiment,
      cached: true,
      generatedAt: existingSummary.createdAt,
    };
  }

  const { story, comments } = await getStoryWithComments(storyId, undefined);

  if (!story) {
    throw new AppError(404, 'Story not found on Hacker News', 'STORY_NOT_FOUND');
  }

  if (!comments || comments.length === 0) {
    throw new AppError(400, 'Cannot generate summary for a story without comments', 'NO_COMMENTS');
  }

  const summaryResult = await summarizeDiscussion(comments).catch(mapSummaryError);

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
  } catch (dbError) {
    console.error('Error saving summary to database:', dbError);
  }

  return {
    storyId,
    summary: summaryResult.summary,
    key_points: summaryResult.key_points,
    sentiment: summaryResult.sentiment,
    cached: false,
    generatedAt: new Date().toISOString(),
  };
}

export async function getCachedSummary(storyId: number) {
  const summary = await prisma.summary.findUnique({
    where: { storyId },
  });

  if (!summary) {
    throw new AppError(404, 'Generate a summary first using POST request', 'SUMMARY_NOT_FOUND');
  }

  return {
    storyId,
    summary: summary.summaryText,
    key_points: summary.keyPoints,
    sentiment: summary.sentiment,
    cached: true,
    generatedAt: summary.createdAt,
  };
}
