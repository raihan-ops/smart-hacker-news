import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

// Build servers array based on environment
const servers: Array<{ url: string; description: string }> = [];

// Add development server for local testing
servers.push({
  url: `http://localhost:${config.server.port}`,
  description: 'Development server',
});

// Add production server URL if provided via environment variable
const prodApiUrl = process.env.API_URL;
if (prodApiUrl) {
  servers.push({
    url: prodApiUrl,
    description: 'Production server',
  });
}

// Fallback: if no API_URL provided but in production, derive from request
if (servers.length === 1 && config.server.nodeEnv === 'production') {
  servers.push({
    url: 'https://smart-hacker-news-production.up.railway.app',
    description: 'Production server',
  });
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hacker News Reader API',
      version: '1.0.0',
      description: 'API for reading and managing Hacker News stories with bookmarks and AI summaries',
      contact: {
        name: 'API Support',
      },
    },
    servers: servers,
    tags: [
      {
        name: 'Stories',
        description: 'Hacker News stories endpoints',
      },
      {
        name: 'Bookmarks',
        description: 'Bookmark management endpoints',
      },
      {
        name: 'Summarize',
        description: 'AI-powered story summarization',
      },
      {
        name: 'Health',
        description: 'Health check endpoint',
      },
    ],
    components: {
      schemas: {
        Story: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Story ID' },
            title: { type: 'string', description: 'Story title' },
            url: { type: 'string', nullable: true, description: 'Story URL' },
            author: { type: 'string', description: 'Story author' },
            points: { type: 'number', description: 'Story points' },
            commentCount: { type: 'number', description: 'Number of comments' },
            time: { type: 'number', description: 'Unix timestamp' },
            text: { type: 'string', nullable: true, description: 'Story text (for Ask HN, etc.)' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Comment ID' },
            author: { type: 'string', description: 'Comment author' },
            text: { type: 'string', description: 'Comment text (HTML)' },
            time: { type: 'number', description: 'Unix timestamp' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Comment' },
              description: 'Nested child comments',
            },
            hasUnloadedChildren: {
              type: 'boolean',
              description: 'Whether comment has unloaded child comments',
            },
          },
        },
        Bookmark: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Bookmark ID' },
            storyId: { type: 'number', description: 'Story ID' },
            title: { type: 'string', description: 'Story title' },
            url: { type: 'string', nullable: true, description: 'Story URL' },
            author: { type: 'string', description: 'Story author' },
            points: { type: 'number', description: 'Story points' },
            commentCount: { type: 'number', description: 'Number of comments' },
            createdAt: { type: 'string', format: 'date-time', description: 'Story creation time' },
            bookmarkedAt: { type: 'string', format: 'date-time', description: 'Bookmark creation time' },
          },
        },
        Summary: {
          type: 'object',
          properties: {
            storyId: { type: 'number', description: 'Story ID' },
            summary: { type: 'string', description: 'AI-generated summary text' },
            key_points: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key discussion points',
            },
            sentiment: {
              type: 'string',
              enum: ['positive', 'negative', 'mixed', 'neutral'],
              description: 'Overall sentiment',
            },
            cached: { type: 'boolean', description: 'Whether summary was from cache' },
            generatedAt: { type: 'string', format: 'date-time', description: 'Generation timestamp' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Request success status' },
            data: { type: 'object', description: 'Response data' },
            error: {
              type: 'object',
              nullable: true,
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'Error message' },
                code: { type: 'string', description: 'Error code' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
