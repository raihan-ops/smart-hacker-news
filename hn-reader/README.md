# Smart Hacker News Reader

AI-powered Hacker News client with discussion summaries using OpenAI.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Neon PostgreSQL account (free): https://neon.tech
- OpenAI API key: https://platform.openai.com/api-keys

### Setup Instructions

1. **Clone the repository** (or you're already here!)

2. **Get your Neon PostgreSQL connection string**:
   - Go to https://neon.tech
   - Sign up (free, no credit card)
   - Create a new project named `hn-reader`
   - Copy your connection string (looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/hn_reader?sslmode=require`)

3. **Create environment files**:

   Backend (`.env`):
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `backend/.env` and add:
   - Your Neon `DATABASE_URL`
   - Your `OPENAI_API_KEY`

   Frontend (`.env.local`):
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

4. **Run the application**:
   ```bash
   docker-compose up --build
   ```

5. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Health Check: http://localhost:8000/health

### Alternative: Local Development Without Docker

**Backend**:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push  # Creates tables in Neon
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Tech Stack

### Backend
- **Express.js** with TypeScript
- **Prisma** ORM for database access
- **PostgreSQL** (Neon cloud database)
- **OpenAI API** (GPT-4o-mini) for AI summaries
- **Axios** for HTTP requests
- **Zod** for validation

### Frontend
- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls
- **date-fns** for time formatting

### Infrastructure
- **Docker Compose** for orchestration
- **Neon PostgreSQL** (serverless cloud database)

---

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │─────▶│   Express   │─────▶│  Hacker     │
│   Frontend  │      │   Backend   │      │  News API   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ├─────────▶ Neon PostgreSQL
                            │
                            └─────────▶ OpenAI API
```

### Key Design Decisions

1. **Neon PostgreSQL (Cloud)**:
   - No local database setup needed
   - Serverless, auto-scaling
   - Free tier sufficient for development
   - Easy connection string management

2. **Separate Backend + Frontend**:
   - Clean separation of concerns
   - Backend handles business logic, AI calls, database
   - Frontend focuses on UI/UX
   - Easy to scale independently

3. **Prisma ORM**:
   - Type-safe database access
   - Auto-generated TypeScript types
   - Easy migrations
   - Excellent developer experience

4. **OpenAI GPT-4o-mini**:
   - Cost-effective ($0.150/1M input tokens)
   - Fast response times
   - Excellent summarization quality
   - Better error handling than local models

---

## 🔌 API Endpoints

### Stories
- `GET /api/stories?type=top&page=1&limit=30` - List stories
- `GET /api/stories/:id` - Get single story
- `GET /api/stories/:id/comments` - Get story comments

### Bookmarks
- `POST /api/bookmarks` - Save bookmark
- `GET /api/bookmarks?search=&page=1` - List bookmarks
- `DELETE /api/bookmarks/:storyId` - Remove bookmark
- `GET /api/bookmarks/:storyId/exists` - Check if bookmarked

### AI Summarization
- `POST /api/summarize/:storyId` - Generate AI summary

---

## ⚠️ Tradeoffs

### What Was Prioritized:
- **Speed of development**: Chose familiar technologies
- **Type safety**: TypeScript everywhere
- **Cloud database**: No local setup hassle
- **Simple architecture**: Easy to understand and modify

### What Was Simplified:
- **Caching**: Not implemented (future: Redis)
- **Rate limiting**: Basic implementation
- **Authentication**: Not required for this project
- **Tests**: Not included (time constraint)
- **Advanced features**: Comment collapsing, pagination could be improved

---

## 🚧 Future Improvements

If I had more time, I would add:

- **Caching Layer**: Redis for HN API responses and AI summaries
- **Queue System**: Bull/BullMQ for async AI processing
- **Better Search**: Full-text search with PostgreSQL `tsvector`
- **Summary Persistence**: Cache AI summaries in database
- **Rate Limiting**: express-rate-limit for API protection
- **Error Monitoring**: Sentry integration
- **Analytics**: Track popular stories, summary requests
- **Comment Threading**: Better UI for nested comments
- **Dark Mode**: System-aware theme switching
- **PWA Support**: Offline functionality
- **Real-time Updates**: WebSocket for new stories
- **User Preferences**: Customizable summary length, detail level
- **Export Feature**: Export bookmarks as JSON/CSV
- **Tests**: Unit and integration tests

---

## 🐛 Troubleshooting

### Database Connection Error
- Verify your `DATABASE_URL` in `backend/.env`
- Check Neon dashboard that database is active
- Ensure connection string includes `?sslmode=require`

### OpenAI API Error
- Verify your `OPENAI_API_KEY` is correct
- Check you have credits in your OpenAI account
- Rate limiting: Wait a few seconds and try again

### Docker Issues
- Ensure Docker Desktop is running
- Try: `docker-compose down -v && docker-compose up --build`
- Check logs:  `docker-compose logs backend` or `docker-compose logs frontend`

### Port Already in Use
- Change ports in `docker-compose.yml` if 3000 or 8000 are taken
- Or stop conflicting services

---

## 📝 Notes

- **First run**: Prisma will automatically create database tables when backend starts
- **AI costs**: GPT-4o-mini is very cheap (~$0.15 per million tokens)
- **HN API**: No rate limiting, completely free
- **Docker**: Volumes are mounted for hot-reload during development

---

## 👤 Author

Built with ❤️ using Claude Code

---

## 📄 License

MIT
