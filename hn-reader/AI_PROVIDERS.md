# AI Provider Configuration Guide

The Smart Hacker News Reader supports multiple AI providers for generating discussion summaries. You can easily switch between them by changing a single environment variable.

## Supported AI Providers

### 1. OpenAI (Default) 🤖
- **Models**: GPT-4o-mini (fast & cost-effective), GPT-4o, GPT-3.5-turbo
- **Cost**: ~$0.15-0.60 per 1M input tokens
- **Speed**: Very fast (1-3 seconds)
- **Quality**: Excellent, consistent JSON output

### 2. Google Gemini 🌟
- **Models**: Gemini 1.5 Flash (fast & free), Gemini 1.5 Pro
- **Cost**: FREE tier available! 15 requests/minute
- **Speed**: Very fast (1-2 seconds)
- **Quality**: Excellent, comparable to GPT-4

---

## How to Switch Providers

### Configuration Files

Update **one** of these files:
- **Docker**: Edit `hn-reader/.env` (root directory)
- **Local**: Edit `hn-reader/backend/.env`

### Option 1: Use OpenAI (Current Setup)

```env
# AI Provider
AI_PROVIDER=openai

# Required: Your OpenAI API Key
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxx"

# Optional: Choose model (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

**Get API Key**: https://platform.openai.com/api-keys

**Available Models**:
- `gpt-4o-mini` - Cheapest, fastest ✅ (recommended)
- `gpt-4o` - Most capable
- `gpt-3.5-turbo` - Legacy, still good

---

### Option 2: Use Google Gemini (FREE!)

```env
# AI Provider
AI_PROVIDER=gemini

# Required: Your Gemini API Key
GEMINI_API_KEY="AIzaSy-xxxxxxxxxxxxx"

# Optional: Choose model (default: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash
```

**Get API Key**: https://aistudio.google.com/app/apikey

**Available Models**:
- `gemini-2.5-flash` - Fast and broadly available ✅ (recommended)
- `gemini-1.5-pro` - More capable, still has free tier
- `gemini-2.0-flash-exp` - Experimental, cutting-edge

**Free Tier Limits**:
- 15 requests per minute
- 1,500 requests per day
- More than enough for personal use!

---

## Complete Setup Examples

### Example 1: Using OpenAI (Your Current Setup)

**File**: `hn-reader/backend/.env`
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

AI_PROVIDER=openai
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"
OPENAI_MODEL=gpt-4o-mini

PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Example 2: Switching to Gemini (FREE)

**File**: `hn-reader/backend/.env`
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

AI_PROVIDER=gemini
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
GEMINI_MODEL=gemini-2.5-flash

PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## How to Get Your Gemini API Key (Free!)

1. **Visit**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. Click **"Create API Key"**
4. **Copy** the generated key (starts with `AIzaSy...`)
5. **Paste** it into your `.env` file as `GEMINI_API_KEY`

That's it! No credit card required. 🎉

---

## Testing the Switch

### 1. Update your `.env` file

Change `AI_PROVIDER` to your desired provider.

### 2. Restart the backend

**If using Docker**:
```bash
cd c:/Users/pc/Documents/Project/hn-reader
docker-compose down
docker-compose up --build
```

**If running locally**:
```bash
cd c:/Users/pc/Documents/Project/hn-reader/backend
# Press Ctrl+C to stop
npm run dev
```

### 3. Check the console

You should see:
- `🤖 AI Provider: OpenAI (gpt-4o-mini)`
- OR `🤖 AI Provider: Google Gemini (gemini-2.5-flash)`

### 4. Test in the app

1. Visit http://localhost:3000
2. Click on any story
3. Click "Generate AI Summary"
4. Summary should appear in 1-3 seconds

---

## Comparison Table

| Feature | OpenAI (GPT-4o-mini) | Google Gemini (Flash) |
|---------|---------------------|----------------------|
| **Cost** | ~$0.15/1M tokens | **FREE** (15 req/min) |
| **Speed** | 1-3 seconds | 1-2 seconds |
| **Quality** | Excellent ⭐⭐⭐⭐⭐ | Excellent ⭐⭐⭐⭐⭐ |
| **JSON Format** | Native support | Requires parsing |
| **Rate Limits** | Depends on tier | 15/min free tier |
| **Setup** | Credit card required | No card needed |

---

## Troubleshooting

### Error: "OpenAI API key is invalid"
- Check your `OPENAI_API_KEY` is correct
- Ensure you have credits in your OpenAI account
- Verify the key starts with `sk-proj-` or `sk-`

### Error: "GEMINI API key is invalid"
- Check your `GEMINI_API_KEY` is correct
- Ensure the key starts with `AIzaSy`
- Verify the API is enabled at https://aistudio.google.com

### Backend won't start
- Check you set `AI_PROVIDER` correctly (`openai` or `gemini`)
- Ensure the corresponding API key is set
- Check the console for specific error messages

### Summary generation fails
- Check your rate limits (Gemini: 15/min free tier)
- Try generating summary for a different story
- Check backend logs for detailed error messages

---

## Adding More AI Providers

Want to add Claude, Llama, or other providers? The code is designed to be extensible:

1. Update `backend/src/config/env.ts` to add new provider config
2. Add provider client in `backend/src/services/aiService.ts`
3. Create a `summarizeWith[Provider]()` function
4. Add it to the switch statement in `summarizeDiscussion()`

---

## Recommendation

**For Production/Personal Use**:
- Start with **Gemini 1.5 Flash** (it's FREE!)
- If you exceed rate limits, switch to **OpenAI GPT-4o-mini**

**For High Volume**:
- Use **OpenAI GPT-4o-mini** with a paid account for best reliability

---

## Support

- Gemini Free Tier: https://ai.google.dev/pricing
- OpenAI Pricing: https://openai.com/api/pricing
- Issues: Check backend console logs for detailed error messages
