import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import Groq from 'groq-sdk';
import { config } from '../config/env';
import { Comment, SummaryResult } from '../types';
import { flattenComments, stripHtml } from '../utils/helpers';

// Initialize AI clients based on provider
const aiProvider = config.ai.provider;

let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;
let mistral: Mistral | null = null;
let groq: Groq | null = null;

// Initialize all available providers for auto mode
const initializeProviders = () => {
  if (config.ai.openai.apiKey) {
    openai = new OpenAI({ apiKey: config.ai.openai.apiKey });
  }
  if (config.ai.gemini.apiKey) {
    gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  }
  if (config.ai.mistral.apiKey) {
    mistral = new Mistral({ apiKey: config.ai.mistral.apiKey });
  }
  if (config.ai.groq.apiKey) {
    groq = new Groq({ apiKey: config.ai.groq.apiKey });
  }
};

// Initialize based on provider mode
if (aiProvider === 'auto') {
  initializeProviders();
  console.log(`🤖 AI Provider: AUTO mode (${config.ai.autoProviders.join(' → ')})`);
} else if (aiProvider === 'openai') {
  openai = new OpenAI({ apiKey: config.ai.openai.apiKey });
  console.log(`🤖 AI Provider: OpenAI (${config.ai.openai.model})`);
} else if (aiProvider === 'gemini') {
  gemini = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  console.log(`🤖 AI Provider: Google Gemini (${config.ai.gemini.model})`);
} else if (aiProvider === 'mistral') {
  mistral = new Mistral({ apiKey: config.ai.mistral.apiKey });
  console.log(`🤖 AI Provider: Mistral AI (${config.ai.mistral.model})`);
} else if (aiProvider === 'groq') {
  groq = new Groq({ apiKey: config.ai.groq.apiKey });
  console.log(`🤖 AI Provider: Groq (${config.ai.groq.model})`);
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
// Optimized chunking: larger chunks = fewer API calls while processing ALL comments
const SUMMARY_CHUNK_CHARS = parseInt(process.env.SUMMARY_CHUNK_CHARS || '15000', 10); // Increased from 9000
const MAX_SUMMARY_CHUNKS = parseInt(process.env.MAX_SUMMARY_CHUNKS || '50', 10); // Increased from 24

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

  const rawResponse = JSON.parse(responseText);
  return normalizeSummaryResult(rawResponse);
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

/**
 * Summarize discussion using Mistral AI
 */
async function summarizeWithMistral(commentsText: string): Promise<SummaryResult> {
  if (!mistral) {
    throw new Error('Mistral client not initialized');
  }

  const completion = await mistral.chat.complete({
    model: config.ai.mistral.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Comments:\n\n${commentsText}` },
    ],
    temperature: 0.7,
    maxTokens: 500,
    responseFormat: { type: 'json_object' },
  });

  const responseText = completion.choices?.[0]?.message?.content;

  if (!responseText || typeof responseText !== 'string') {
    throw new Error('No response from Mistral');
  }

  const rawResponse = JSON.parse(extractLikelyJsonObject(responseText));
  return normalizeSummaryResult(rawResponse);
}

/**
 * Summarize discussion using Groq
 */
async function summarizeWithGroq(commentsText: string): Promise<SummaryResult> {
  if (!groq) {
    throw new Error('Groq client not initialized');
  }

  const completion = await groq.chat.completions.create({
    model: config.ai.groq.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Comments:\n\n${commentsText}` },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices?.[0]?.message?.content;

  if (!responseText) {
    throw new Error('No response from Groq');
  }

  const rawResponse = JSON.parse(extractLikelyJsonObject(responseText));
  return normalizeSummaryResult(rawResponse);
}

async function summarizeText(commentsText: string): Promise<SummaryResult> {
  // Auto mode: try providers in order until one succeeds
  if (aiProvider === 'auto') {
    return summarizeWithAutoFallback(commentsText);
  }

  // Single provider mode
  if (aiProvider === 'openai') {
    return summarizeWithOpenAI(commentsText);
  }

  if (aiProvider === 'gemini') {
    return summarizeWithGemini(commentsText);
  }

  if (aiProvider === 'mistral') {
    return summarizeWithMistral(commentsText);
  }

  if (aiProvider === 'groq') {
    return summarizeWithGroq(commentsText);
  }

  throw new Error(`Unsupported AI provider: ${aiProvider}`);
}

/**
 * Auto mode: Try providers in order with automatic fallback
 */
async function summarizeWithAutoFallback(commentsText: string): Promise<SummaryResult> {
  const providers = config.ai.autoProviders;
  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of providers) {
    try {
      console.log(`🔄 Attempting provider: ${provider}`);

      let result: SummaryResult;

      switch (provider) {
        case 'mistral':
          if (!mistral) throw new Error('Mistral not configured');
          result = await summarizeWithMistral(commentsText);
          break;
        case 'groq':
          if (!groq) throw new Error('Groq not configured');
          result = await summarizeWithGroq(commentsText);
          break;
        case 'gemini':
          if (!gemini) throw new Error('Gemini not configured');
          result = await summarizeWithGemini(commentsText);
          break;
        case 'openai':
          if (!openai) throw new Error('OpenAI not configured');
          result = await summarizeWithOpenAI(commentsText);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      console.log(`✅ Success with provider: ${provider}`);
      return result;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.warn(`⚠️ ${provider} failed: ${errorMsg}`);
      errors.push({ provider, error: errorMsg });

      // If it's a rate limit or quota error, try next provider
      if (
        errorMsg.includes('rate limit') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('429') ||
        errorMsg.includes('503')
      ) {
        continue;
      }

      // If provider is not configured, try next
      if (errorMsg.includes('not configured') || errorMsg.includes('not initialized')) {
        continue;
      }

      // For other errors (invalid response, timeout, etc.), try next provider
      continue;
    }
  }

  // All providers failed
  const errorSummary = errors.map((e) => `${e.provider}: ${e.error}`).join('; ');
  throw new Error(`All AI providers failed. Errors: ${errorSummary}`);
}

async function summarizeHierarchically(comments: Comment[]): Promise<SummaryResult> {
  const lines = buildCommentLines(comments);

  if (lines.length === 0) {
    throw new Error('No valid comments to summarize');
  }

  console.log(`📊 Processing ${lines.length} comment lines from ${comments.length} comments`);

  const chunks = chunkLines(lines, SUMMARY_CHUNK_CHARS);
  console.log(`📦 Split into ${chunks.length} chunks for processing`);

  if (chunks.length === 1) {
    return summarizeText(chunks[0]);
  }

  if (chunks.length > MAX_SUMMARY_CHUNKS) {
    throw new Error(
      `Discussion is too large to summarize (${chunks.length} chunks, max ${MAX_SUMMARY_CHUNKS}). Consider increasing MAX_SUMMARY_CHUNKS or SUMMARY_CHUNK_CHARS.`
    );
  }

  // Tree-based reduction: summarize in batches to reduce API calls
  const BATCH_SIZE = 4; // Combine 4 summaries at a time
  let currentLevel = chunks;

  while (currentLevel.length > 1) {
    console.log(`🔄 Processing level with ${currentLevel.length} items...`);
    const nextLevel: string[] = [];

    // Process in batches
    for (let i = 0; i < currentLevel.length; i += BATCH_SIZE) {
      const batch = currentLevel.slice(i, i + BATCH_SIZE);

      if (batch.length === 1) {
        // If single chunk, summarize directly
        const partial = await summarizeText(batch[0]);
        nextLevel.push(formatPartialSummary(partial));
      } else {
        // Combine batch and summarize together
        const combinedBatch = batch.join('\n\n---\n\n');
        const partial = await summarizeText(combinedBatch);
        nextLevel.push(formatPartialSummary(partial));
      }
    }

    currentLevel = nextLevel;
  }

  // Final summary from the last level
  // currentLevel[0] is now a formatted summary string
  const finalPrompt =
    'You are given a summary of a Hacker News discussion. Produce a final polished JSON summary.\n\n' +
    currentLevel[0];
  return summarizeText(finalPrompt);
}

function formatPartialSummary(partial: SummaryResult): string {
  const points = partial.key_points.map((point) => `- ${point}`).join('\n');
  return `Summary: ${partial.summary}\nKey Points:\n${points}\nSentiment: ${partial.sentiment}`;
}

/**
 * Summarize a discussion using the configured AI provider
 */
export async function summarizeDiscussion(comments: Comment[]): Promise<SummaryResult> {
  try {
    const result = await summarizeHierarchically(comments);

    return result;
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
