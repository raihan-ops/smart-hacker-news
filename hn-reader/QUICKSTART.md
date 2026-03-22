# 🚀 Quick Start Guide - Smart HN Reader

Your environment is **ready to go** with your credentials pre-configured!

---

## ✅ What's Already Set Up

- ✅ Database: Neon PostgreSQL connection configured
- ✅ AI Provider: OpenAI (GPT-4o-mini) configured
- ✅ Backend: All API endpoints ready
- ✅ Frontend: Complete React app built
- ✅ Docker: Fully configured

---

## 🎯 Choose Your Method

### Method 1: Docker (Easiest - One Command!) 🐳

```bash
cd c:/Users/pc/Documents/Project/hn-reader
docker-compose up --build
```

**That's it!** Wait 30-60 seconds for the build, then access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

To stop: Press `Ctrl+C`, then run `docker-compose down`

---

### Method 2: Local Development (Two Terminals) 💻

#### Terminal 1 - Backend
```bash
cd c:/Users/pc/Documents/Project/hn-reader/backend

# Install dependencies (first time only)
npm install

# Generate Prisma client (first time only)
npx prisma generate

# Push database schema (first time only)
npx prisma db push

# Start backend
npm run dev
```

✅ **Backend running on**: http://localhost:8000

#### Terminal 2 - Frontend
```bash
cd c:/Users/pc/Documents/Project/hn-reader/frontend

# Start frontend (dependencies already installed)
npm run dev
```

✅ **Frontend running on**: http://localhost:3000

---

## 🧪 Test the Application

### 1. Homepage
- Visit: http://localhost:3000
- You should see Hacker News stories loading
- Try the **Top / New / Best** tabs
- Click **"Load More"** to paginate

### 2. Story Details
- Click on any **story title** or **comment count**
- View the full discussion
- Try clicking **"Generate AI Summary"**
- Summary should appear in 2-5 seconds

### 3. Bookmarks
- Click the **☆ star icon** on any story (turns to ★)
- Click **"Bookmarks"** button in the header
- See your saved stories
- Try the **search box**
- Click ★ again to unbookmark

### 4. API Health Check
- Visit: http://localhost:8000/api/stories?type=top&limit=5
- Should see JSON response with stories

---

## 🌟 Want to Use FREE Gemini Instead?

Google Gemini offers **free AI summaries** (no credit card required)!

### Quick Switch (5 minutes):

1. **Get Gemini API Key** (FREE):
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with Google
   - Click "Create API Key"
   - Copy the key (starts with `AIzaSy...`)

2. **Update Backend .env**:
   ```bash
   # Edit: c:/Users/pc/Documents/Project/hn-reader/backend/.env

   # Change this line:
   AI_PROVIDER=gemini

   # Add this line:
   GEMINI_API_KEY="AIzaSy-YOUR-KEY-HERE"
   ```

3. **Restart Backend**:
   ```bash
   # If using Docker:
   docker-compose down && docker-compose up --build

   # If local:
   # Press Ctrl+C in backend terminal, then:
   npm run dev
   ```

4. **Verify**: Check console for `🤖 AI Provider: Google Gemini`

📖 **Full guide**: [AI_PROVIDERS.md](./AI_PROVIDERS.md)

---

## 📋 Available Features

✅ **Browse Stories**: Top, New, Best from Hacker News
✅ **Read Comments**: Nested discussion threads with collapse/expand
✅ **AI Summaries**: Generate summaries with OpenAI or Gemini
✅ **Bookmarks**: Save stories for later reading
✅ **Search**: Find bookmarked stories by keyword
✅ **Responsive**: Works on mobile and desktop

---

## 🛑 Stopping the App

### Docker:
```bash
# Press Ctrl+C, then:
docker-compose down
```

### Local:
```bash
# Press Ctrl+C in both terminals (backend + frontend)
```

---

## 🐛 Common Issues

### "Cannot connect to backend"
- Check backend is running on port 8000
- Check frontend .env.local has: `NEXT_PUBLIC_API_URL=http://localhost:8000`

### "Database error"
- Verify your Neon PostgreSQL connection string is correct
- Run: `cd backend && npx prisma db push`

### "AI summary fails"
- **OpenAI**: Check you have credits at https://platform.openai.com/usage
- **Gemini**: Get free API key at https://aistudio.google.com/app/apikey

### "Module not found"
```bash
# In backend:
cd backend && npm install

# In frontend:
cd frontend && npm install
```

---

## 📊 Environment Variables Reference

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://..."           # ✅ Already set
AI_PROVIDER=openai                        # openai or gemini
OPENAI_API_KEY="sk-proj-..."             # ✅ Already set
GEMINI_API_KEY="AIzaSy..."               # Optional (for Gemini)
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # ✅ Already set
```

---

## 🎉 You're Ready!

Your Smart Hacker News Reader is fully configured and ready to run.

**Recommended first run**:
```bash
cd c:/Users/pc/Documents/Project/hn-reader
docker-compose up --build
```

Then visit **http://localhost:3000** and start exploring! 🚀

---

## 📚 Additional Resources

- [AI Provider Configuration Guide](./AI_PROVIDERS.md) - Switch between OpenAI/Gemini
- [README.md](./README.md) - Full project documentation
- [Backend API Docs](./backend/README.md) - API endpoints reference

---

**Questions?** Check the console logs for detailed error messages.

**Enjoy your AI-powered Hacker News experience!** 🧡
