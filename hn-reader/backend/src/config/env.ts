import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini', // 'openai' or 'gemini'
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '8000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

// Check for AI provider API key based on selected provider
const aiProvider = process.env.AI_PROVIDER || 'gemini';
if (aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
  requiredEnvVars.push('OPENAI_API_KEY');
} else if (aiProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
  requiredEnvVars.push('GEMINI_API_KEY');
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error(`Current AI Provider: ${aiProvider}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
