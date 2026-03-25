import app from './app';
import { config } from './config/env';

const PORT = config.server.port;

let server: ReturnType<typeof app.listen> | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let isStarting = false;

// Start server
function startServer() {
  if (isStarting || server) {
    return;
  }

  isStarting = true;
  const nextServer = app.listen(PORT);

  nextServer.once('listening', () => {
    isStarting = false;
    server = nextServer;

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.server.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`\n⚡ Ready to accept requests!`);
  });

  nextServer.once('error', (error: NodeJS.ErrnoException) => {
    isStarting = false;

    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Retrying in 5s...`);
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          startServer();
        }, 5000);
      }
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  if (server) {
    server.close(() => {
      server = null;
      console.log('Server closed.');
      process.exit(0);
    });
    // Force exit after 10s if server won't close
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after 10s');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  if (server) {
    server.close(() => {
      server = null;
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Uncaught exception handler (prevents immediate crash)
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  // Do not exit - let server continue, may recover
  if (config.server.nodeEnv === 'production') {
    // In production, log and exit for Docker to restart
    console.error('⚠️  Exiting due to uncaught exception in production');
    process.exit(1);
  }
});

// Unhandled promise rejection handler (prevents crash)
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  // Do not exit - requests will still be handled by error middleware
  if (config.server.nodeEnv === 'production') {
    console.error('⚠️  Unhandled rejection in production - may need attention');
  }
});

