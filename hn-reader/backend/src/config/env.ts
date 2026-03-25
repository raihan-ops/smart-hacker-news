import dotenv from 'dotenv';

dotenv.config();

// Parse CORS origins - support comma-separated list
const parseCorsOrigins = (corsOriginEnv: string): string | string[] => {
  if (!corsOriginEnv) {
    return 'http://localhost:3000';
  }
  
  // If comma-separated, split into array
  if (corsOriginEnv.includes(',')) {
    return corsOriginEnv.split(',').map(origin => origin.trim());
  }
  
  return corsOriginEnv;
};

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini', // 'openai', 'gemini', 'mistral', 'groq', or 'auto'
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    mistral: {
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: process.env.MISTRAL_MODEL || 'open-mistral-7b',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    },
    // Auto mode: tries providers in order until one succeeds
    autoProviders: (process.env.AUTO_PROVIDERS || 'mistral,groq,gemini').split(',').map(p => p.trim()),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '8000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN || 'http://localhost:3000'),
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

// Check for AI provider API key based on selected provider
const aiProvider = process.env.AI_PROVIDER || 'gemini';

// For 'auto' mode, at least one provider must have an API key
if (aiProvider === 'auto') {
  const hasAnyProvider =
    process.env.MISTRAL_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY;

  if (!hasAnyProvider) {
    console.error('AUTO mode requires at least one AI provider API key (MISTRAL_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY)');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
} else {
  // Specific provider validation
  if (aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
    requiredEnvVars.push('OPENAI_API_KEY');
  } else if (aiProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
    requiredEnvVars.push('GEMINI_API_KEY');
  } else if (aiProvider === 'mistral' && !process.env.MISTRAL_API_KEY) {
    requiredEnvVars.push('MISTRAL_API_KEY');
  } else if (aiProvider === 'groq' && !process.env.GROQ_API_KEY) {
    requiredEnvVars.push('GROQ_API_KEY');
  }
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error(`Current AI Provider: ${aiProvider}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
