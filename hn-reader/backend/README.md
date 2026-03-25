# Hacker News Reader - Backend API

Backend API service for the Hacker News Reader built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Story Management**: Fetch and display Hacker News stories (top, new, best)
- **Comments**: Retrieve nested comments with tree-based pagination
- **Bookmarks**: Save and manage bookmarks with persistent storage
- **AI Summaries**: Generate intelligent summaries using multiple AI providers (OpenAI, Gemini, Mistral, Groq)
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Documentation**: Swagger/OpenAPI 3.0
- **AI Providers**: OpenAI, Gemini, Mistral, Groq

## Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL 12+
- API keys for at least one AI provider

### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hn_reader"

# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# API URL for Swagger (production deployment)
API_URL=https://your-api-domain.com

# AI Provider Configuration
# Options: openai | gemini | mistral | groq | auto
AI_PROVIDER=gemini

# API Keys (configure for your selected provider(s))
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
MISTRAL_API_KEY=your-mistral-key
GROQ_API_KEY=your-groq-key

# Model Selection (optional)
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.5-flash
MISTRAL_MODEL=open-mistral-7b
GROQ_MODEL=llama-3.1-8b-instant

# Auto Mode (optional - fallback provider order)
AUTO_PROVIDERS=mistral,groq,gemini

# Timeouts & Limits (optional)
GEMINI_TIMEOUT_MS=60000
SUMMARY_CHUNK_CHARS=15000
MAX_SUMMARY_CHUNKS=50
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed
```

### Development

```bash
# Start development server with auto-reload
npm run dev

# Start production build
npm run build
npm run start
```

## API Endpoints

### Stories

- `GET /api/stories` - List stories with pagination
  - Query: `type` (top|new|best), `page`, `limit`
- `GET /api/stories/:id` - Get story details with metadata
- `GET /api/stories/:id/comments` - Get story comments
  - Query: `depth` (1|all), `limit`, `offset`

### Bookmarks

- `GET /api/bookmarks` - List user bookmarks with pagination
- `POST /api/bookmarks/:storyId` - Add bookmark
- `DELETE /api/bookmarks/:storyId` - Remove bookmark
- `GET /api/bookmarks/status/:storyIds` - Check bookmark status for multiple stories

### Summarization

- `POST /api/summarize/:storyId` - Generate AI summary
  - Optional: `force` parameter to bypass cache

## API Documentation

Interactive API documentation is available at:
- **Development**: http://localhost:8000/api-docs
- **Production**: https://smart-hacker-news-production.up.railway.app/api-docs

The Swagger UI allows you to:
- Browse all available endpoints
- View request/response schema definitions
- Test endpoints directly from the browser

## Design Decisions

### Architecture

- **Layering**: Routes handle HTTP concerns, services contain business logic, middleware manages cross-cutting concerns
- **Validation**: Request validation enforces type safety and numeric bounds
- **Error Handling**: Centralized error middleware returns consistent error envelopes with codes
- **Data Modeling**: Persists only essential data (bookmarks, summaries) for performance and product requirements

### Database Schema

- **stories**: Cached story metadata (indexed by HN ID)
- **bookmarks**: User bookmarks with timestamps
- **summaries**: Cached AI summaries with provider metadata

### AI Provider Strategy

- **Graceful Degradation**: Summaries fail gracefully if provider unavailable
- **Caching**: Summaries cached per story to reduce API costs
- **Auto Mode**: Fallback provider chain for reliability
- **Timeout Handling**: Configurable timeouts prevent hanging requests

## Performance Considerations

- Database queries use indexes on frequently filtered columns
- Comment fetching implements depth limiting to prevent deep recursion
- Summary caching reduces external API calls
- Pagination prevents loading full datasets into memory

## Error Handling

All API endpoints return consistent response envelopes:

```json
{
  "success": true/false,
  "data": {},
  "error": {
    "message": "Human-readable error",
    "code": "INTERNAL_ERROR_CODE"
  }
}
```

Error codes are used for programmatic error handling.

## Deployment

### Docker

```bash
# Build image
docker build -t hn-reader-backend .

# Run container
docker run -p 8000:8000 --env-file .env hn-reader-backend
```

### Railway/Vercel Deployment

Set environment variables in your deployment platform:

```
DATABASE_URL=postgresql://...
AI_PROVIDER=gemini
GEMINI_API_KEY=...
NODE_ENV=production
API_URL=https://your-api-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

## Frontend Integration

The backend serves a REST API consumed by the frontend at:
- **Development**: http://localhost:3000
- **Production**: https://frontend-seven-woad-39.vercel.app

CORS is configured to accept requests from the frontend domain.

## Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## License

MIT
