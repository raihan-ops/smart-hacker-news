# HN Reader - Engineering Assessment Submission

This repository is intentionally scoped for engineering quality in a small surface area, not for production hardening.

# Here is the link for env keys
https://docs.google.com/document/d/1w6KzCLKIDCOaAvRbKAN-lc91pwLnnYFHNANgCTHgKh8/edit?usp=sharing

## Submission Checklist

1. README requirements
- Setup instructions: included below.
- Approach and architecture decisions: included below.
- Tradeoffs: included below.
- Improvements with more time: included below.

2. Docker requirement
- First evaluation step:

```bash
docker-compose up
```

## Setup

Prerequisites:
- Docker Desktop (or Docker Engine + Docker Compose)

Steps:

```bash
git clone <repo-url>
cd hn-reader
```

Create backend environment file at backend/.env:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hn_reader"

# AI provider selection: openai | gemini | mistral | groq | auto
AI_PROVIDER="gemini"

# Configure keys for the provider(s) you use
GEMINI_API_KEY="your-key"
OPENAI_API_KEY=""
MISTRAL_API_KEY=""
GROQ_API_KEY=""

# Optional model and fallback controls
OPENAI_MODEL="gpt-4o-mini"
GEMINI_MODEL="gemini-2.5-flash"
MISTRAL_MODEL="open-mistral-7b"
GROQ_MODEL="llama-3.1-8b-instant"
AUTO_PROVIDERS="mistral,groq,gemini"

# Optional timeout/chunk controls
GEMINI_TIMEOUT_MS=60000
SUMMARY_CHUNK_CHARS=15000
MAX_SUMMARY_CHUNKS=50
```

Run:

```bash
docker-compose up
```

## Local Endpoints

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/api-docs
- Health: http://localhost:8000/health

## Deployed Endpoints

- **Frontend**: https://frontend-seven-woad-39.vercel.app
  - Bookmarks: https://frontend-seven-woad-39.vercel.app/bookmarks
- **Backend API**: https://smart-hacker-news-production.up.railway.app
- **API Documentation**: https://smart-hacker-news-production.up.railway.app/api-docs
- **Health Check**: https://smart-hacker-news-production.up.railway.app/health

## Problem Approach And Prioritization

Priorities used:
- Deliver core user value first: read stories, inspect comments, save bookmarks.
- Add AI summary as an enhancement with graceful degradation and caching.
- Keep architecture clean and layered so each concern is easy to reason about.
- Optimize for evaluator readability: clear routes, small services, typed responses.

Execution breakdown:
- Backend-first API contract and data model.
- Frontend integration with typed API client and React Query for server state.
- Reliability pass: input validation, structured errors, timeout handling, fallback behavior.

## Backend And API Design

Design decisions:
- Layering: routes for HTTP concerns, services for business logic, middleware for cross-cutting concerns.
- Validation and parsing: request helpers enforce numeric bounds and query normalization.
- Error model: custom AppError with status code and internal error code; centralized error middleware returns a consistent envelope.
- Data modeling: only persisted data is what is needed for product behavior and performance (bookmarks and summary cache).
- API style: stable REST endpoints with pagination and explicit query controls.

Main API endpoints:
- GET /api/stories?type=top|new|best&page=1&limit=30
- GET /api/stories/:id
- GET /api/stories/:id/comments?depth=1|all&limit=20&offset=0
- GET /api/stories/:id/comments/:commentId/replies?depth=1|all
- GET /api/bookmarks?search=&page=1&limit=30
- GET /api/bookmarks/ids
- POST /api/bookmarks
- DELETE /api/bookmarks/:storyId
- POST /api/summarize/:storyId
- GET /api/summarize/:storyId

API structure diagram:

```mermaid
flowchart LR
   UI[Next.js Frontend] --> API[Express API]
   API --> R1[Stories Routes]
   API --> R2[Bookmarks Routes]
   API --> R3[Summarize Routes]

   R1 --> S1[Story Service]
   R2 --> S2[Bookmark Service]
   R3 --> S3[Summary Service]

   S1 --> HN[Hacker News API]
   S3 --> HN
   S2 --> DB[(PostgreSQL)]
   S3 --> DB
   S3 --> AI[AI Service]
   AI --> P1[OpenAI]
   AI --> P2[Gemini]
   AI --> P3[Mistral]
   AI --> P4[Groq]
```

## AI Integration

Prompt design:
- Uses a structured system instruction requiring strict JSON output:
- summary (2-3 sentences)
- key_points (3-5 items)
- sentiment (positive, negative, mixed, neutral)

Edge-case handling:
- Provider abstraction supports OpenAI, Gemini, Mistral, and Groq.
- Auto mode tries providers in configured order until one succeeds.
- Handles malformed model output by extracting JSON and normalizing schema.
- Adds a repair step for Gemini output when JSON parsing fails.
- Applies timeout control for long requests.
- Maps rate-limit and quota errors to clear API responses.
- Summaries are cached in database by storyId to avoid repeated AI calls.
- Large comment trees are chunked and reduced hierarchically to stay within model limits.

## Frontend

Component and state approach:
- App Router based pages for list, story detail, and bookmarks.
- Feature-oriented components under components/features for stories, comments, bookmarks, search.
- React Query for server-state caching, stale time control, retries, and pagination.
- Typed Axios API client centralizes request and error handling.
- URL query parameters control story type and preserve navigation state.

Usability decisions:
- Fast top-level browsing with paginated/infinite data fetching.
- Comment exploration supports depth controls and lazy reply loading.
- Clear loading and error states for async operations.
- Summary generation endpoint supports longer timeout on the client side.

## ERD

```mermaid
erDiagram
   BOOKMARKS {
      int id PK
      int story_id UK
      string title
      string url
      string author
      int points
      int comment_count
      datetime created_at
      datetime bookmarked_at
   }

   SUMMARIES {
      int id PK
      int story_id UK
      text summary_text
      json key_points
      string sentiment
      datetime created_at
   }
```

Note:
- Stories and comments are sourced from Hacker News and not persisted locally.
- Bookmark and summary entities are related conceptually by shared story_id, without a strict foreign key because source-of-truth story data is external.

## Tradeoffs

- No authentication or multi-user ownership model was added to keep scope focused.
- Summary cache does not currently implement TTL or invalidation strategy.
- Relying on external Hacker News API can affect consistency and latency.
- Auto-provider fallback improves robustness but can increase complexity in failure analysis.
- Docker setup prioritizes fast local evaluation over production deployment patterns.

## What I Would Improve With More Time

- Add user accounts and per-user bookmarks.
- Add database container and migrations inside docker-compose for true one-command full stack bootstrap.
- Introduce observability (structured logs, metrics, tracing).
- Add stronger test coverage (integration tests for routes and AI service mocks).
- Add rate limiting and request budget controls for summary endpoints.
- Add summary TTL and background refresh strategy.
- Harden prompt and moderation rules for abusive or low-signal comment sets.
- Improve accessibility and keyboard navigation in UI components.

