import app from './app';
import { config } from './config/env';

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n⚡ Ready to accept requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
