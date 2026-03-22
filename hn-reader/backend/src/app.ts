import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';

// Import routes (will be created next)
import storiesRouter from './routes/stories';
import bookmarksRouter from './routes/bookmarks';
import summarizeRouter from './routes/summarize';

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: config.server.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/stories', storiesRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/summarize', summarizeRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: config.server.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

export default app;
