import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';

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
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/stories', storiesRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/summarize', summarizeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
