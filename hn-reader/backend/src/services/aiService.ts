import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { Comment, SummaryResult } from '../types';
import { flattenComments, stripHtml } from '../utils/helpers';

// Initialize AI clients based on provider
const aiProvider = config.ai.provider;

let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;

if (aiProvider === 'openai') {
  openai = new OpenAI({
    apiKey: config.ai.openai.apiKey,
  });
  console.log(`🤖 AI Provider: OpenAI (${config.ai.openai.model})`);
} else if (aiProvider === 'gemini') {
  gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  console.log(`🤖 AI Provider: Google Gemini (${config.ai.gemini.model})`);
}

const SYSTEM_PROMPT = `You are analyzing a Hacker News discussion. Based on the comments provided, generate:

1. A brief 2-3 sentence summary of the discussion
2. 3-5 key points or insights (as an array)
3. Overall sentiment: positive, negative, mixed, or neutral

Format your response as JSON:
{
  "summary": "...",
  "key_points": ["...", "...", "..."],
  "sentiment": "positive|negative|mixed|neutral"
}`;

const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10);
const SUMMARY_CHUNK_CHARS = parseInt(process.env.SUMMARY_CHUNK_CHARS || '9000', 10);
const MAX_SUMMARY_CHUNKS = parseInt(process.env.MAX_SUMMARY_CHUNKS || '24', 10);

function buildCommentLines(comments: Comment[]): string[] {
  const flatComments = flattenComments(comments);

  return flatComments
    .map((comment) => {
      const cleanText = stripHtml(comment.text);
      if (!cleanText) {
        return '';
      }
      const indent = '  '.repeat(comment.depth);
      return `${indent}${comment.author}: ${cleanText}`;
    })
    .filter(Boolean);
}

function chunkLines(lines: string[], maxChars: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    const candidate = current ? `${current}\n\n${line}` : line;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = line;
      continue;
    }

    // Very long single comment; split it safely.
    for (let i = 0; i < line.length; i += maxChars) {
      chunks.push(line.slice(i, i + maxChars));
    }
    current = '';
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function extractLikelyJsonObject(input: string): string {
  const text = input.trim();
  const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

function normalizeSummaryResult(raw: unknown): SummaryResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid response format from AI');
  }

  const data = raw as Record<string, unknown>;
  const summaryCandidates = [data.summary, data.overview, data.synopsis, data.abstract];
  const summary = summaryCandidates.find((value) => typeof value === 'string' && value.trim()) as string | undefined;

  const keyPointsRaw =
    data.key_points ??
    data.keyPoints ??
    data.keypoints ??
    data.points ??
    data.highlights;

  let keyPoints: string[] = [];
  if (Array.isArray(keyPointsRaw)) {
    keyPoints = keyPointsRaw.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  } else if (typeof keyPointsRaw === 'string' && keyPointsRaw.trim()) {
    keyPoints = keyPointsRaw
      .split(/\n|;|\u2022|\-/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (keyPointsRaw && typeof keyPointsRaw === 'object') {
    keyPoints = Object.values(keyPointsRaw)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // If the model omitted key points, derive a few from the summary instead of failing hard.
  if (keyPoints.length === 0 && summary) {
    keyPoints = summary
      .split(/[.!?]\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 3);
  }

  const sentimentRaw = typeof data.sentiment === 'string' ? data.sentiment.trim().toLowerCase() : 'neutral';
  const validSentiments: SummaryResult['sentiment'][] = ['positive', 'negative', 'mixed', 'neutral'];
  const sentiment: SummaryResult['sentiment'] = validSentiments.includes(sentimentRaw as SummaryResult['sentiment'])
    ? (sentimentRaw as SummaryResult['sentiment'])
    : 'neutral';

  if (!summary || !summary.trim()) {
    throw new Error('Invalid response format from AI');
  }

  return {
    summary: summary.trim(),
    key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : ['Discussion summary generated successfully.'],
    sentiment,
  };
}

async function parseGeminiSummaryResponse(responseText: string, modelName: string): Promise<SummaryResult> {
  const likelyJson = extractLikelyJsonObject(responseText);

  try {
    return normalizeSummaryResult(JSON.parse(likelyJson));
  } catch {
    if (!gemini) {
      throw new Error('Gemini client not initialized');
    }

    const repairModel = gemini.getGenerativeModel({ model: modelName });
    const repairPrompt = `Convert this content into STRICT JSON only with keys summary, key_points (array of strings), sentiment (positive|negative|mixed|neutral). Do not include markdown or extra text.\n\nContent:\n${responseText}`;
    const repairResult = await repairModel.generateContent(repairPrompt);
    const repairedText = repairResult.response.text();
    return normalizeSummaryResult(JSON.parse(extractLikelyJsonObject(repairedText)));
  }
}

/**
 * Summarize discussion using OpenAI
 */
async function summarizeWithOpenAI(commentsText: string): Promise<SummaryResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const completion = await openai.chat.completions.create({
    model: config.ai.openai.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Comments:\n\n${commentsText}` },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(responseText) as SummaryResult;
}

/**
 * Summarize discussion using Google Gemini
 */
async function summarizeWithGemini(commentsText: string): Promise<SummaryResult> {
  if (!gemini) {
    throw new Error('Gemini client not initialized');
  }

  const model = gemini.getGenerativeModel({ model: config.ai.gemini.model });

  const prompt = `${SYSTEM_PROMPT}\n\nComments:\n\n${commentsText}`;

  const generationPromise = model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 700,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('AI provider timeout')), GEMINI_TIMEOUT_MS);
  });

  const result = await Promise.race([generationPromise, timeoutPromise]);
  const response = (result as any).response;
  const responseText = response.text();

  if (!responseText) {
    throw new Error('No response from Gemini');
  }

  return parseGeminiSummaryResponse(responseText, config.ai.gemini.model);
}

async function summarizeText(commentsText: string): Promise<SummaryResult> {
  if (aiProvider === 'openai') {
    return summarizeWithOpenAI(commentsText);
  }

  if (aiProvider === 'gemini') {
    return summarizeWithGemini(commentsText);
  }

  throw new Error(`Unsupported AI provider: ${aiProvider}`);
}

async function summarizeHierarchically(comments: Comment[]): Promise<SummaryResult> {
  const lines = buildCommentLines(comments);

  if (lines.length === 0) {
    throw new Error('No valid comments to summarize');
  }

  const chunks = chunkLines(lines, SUMMARY_CHUNK_CHARS);

  if (chunks.length === 1) {
    return summarizeText(chunks[0]);
  }

  if (chunks.length > MAX_SUMMARY_CHUNKS) {
    throw new Error(
      `Discussion is too large to summarize in one pass (${chunks.length} chunks). Increase MAX_SUMMARY_CHUNKS.`
    );
  }

  const partials: SummaryResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const partial = await summarizeText(chunks[i]);
    partials.push(normalizeSummaryResult(partial));
  }

  const combinedText = partials
    .map((partial, index) => {
      const points = partial.key_points.map((point) => `- ${point}`).join('\n');
      return `Chunk ${index + 1}:\nSummary: ${partial.summary}\nKey Points:\n${points}\nSentiment: ${partial.sentiment}`;
    })
    .join('\n\n');

  const reducePrompt =
    'You are given summaries of all chunks from a single Hacker News discussion. Produce one final merged JSON summary that captures the full discussion and avoids repetition.\n\n' +
    combinedText;

  return summarizeText(reducePrompt);
}

/**
 * Summarize a discussion using the configured AI provider
 */
export async function summarizeDiscussion(comments: Comment[]): Promise<SummaryResult> {
  try {
    const result = await summarizeHierarchically(comments);

    return normalizeSummaryResult(result);
  } catch (error) {
    console.error('Error summarizing discussion:', error);

    if (error instanceof Error) {
      if (error.message.includes('No valid comments')) {
        throw error;
      }

      const providerErrorPattern = /api key|quota|rate limit|429|model|not found|unsupported|permission|forbidden/i;
      if (providerErrorPattern.test(error.message)) {
        throw new Error(error.message);
      }

      if (error instanceof SyntaxError || /JSON/i.test(error.message)) {
        throw new Error('AI provider returned an invalid summary format. Please retry.');
      }
    }

    throw new Error('Failed to generate summary. Please try again later.');
  }
}
