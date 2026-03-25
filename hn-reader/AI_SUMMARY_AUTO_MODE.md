# Large Comment Summary Handling (Auto Multi-Provider Mode)

This note explains how summaries are generated when discussions are large, and how failures are handled across providers.

## Problem

Large discussions can exceed model context and provider limits. Single-provider integration can fail due to:
- Quota and rate limits
- Timeouts
- Temporary upstream issues
- Invalid JSON response formatting

## Approach

1. Structured output contract
- Prompt requests strict JSON with summary, key_points, and sentiment.
- Response normalization accepts minor schema variation and repairs when possible.

2. Large-input chunking
- Comment tree is flattened and cleaned.
- Text is split into bounded chunks.
- Very long single comments are split safely.

3. Hierarchical reduction
- Each chunk is summarized.
- Partial summaries are recursively combined in batches.
- Final synthesis creates the final summary object.

4. Auto multi-provider fallback
- Auto mode tries providers in configured order.
- If one provider fails, system attempts the next provider.
- Supported providers: OpenAI, Gemini, Mistral, Groq.

5. Failure mapping and user-safe errors
- Rate-limit and quota errors are mapped to clear API responses.
- Invalid model output triggers a repair/normalization flow.

6. Summary caching
- Generated summary is upserted by storyId in database.
- Repeated requests return cached summary quickly.

## Configuration Knobs

- AI_PROVIDER=auto
- AUTO_PROVIDERS=mistral,groq,gemini
- SUMMARY_CHUNK_CHARS
- MAX_SUMMARY_CHUNKS
- GEMINI_TIMEOUT_MS

## Why This Works

- Can process discussions larger than one model call.
- Degrades gracefully when one provider is unavailable.
- Reduces cost and latency for repeat requests through cache.

## Tradeoff

Multi-step summarization and provider fallback increase orchestration complexity, but significantly improve reliability under real-world provider and payload constraints.
