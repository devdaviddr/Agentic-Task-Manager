import 'dotenv/config';
import http from 'http';
import { testConnection, pool } from './config/database';
import app from './app';
import { getCorsOrigins } from './utils/environment';

const corsOrigins = getCorsOrigins();

async function runStartupMigrations() {
  console.log('🔄 Running startup migrations...');
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
  `);
  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;
  `);
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
      CHECK (role IN ('user', 'admin', 'superadmin'));
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`);
  console.log('✅ Startup migrations complete');
}

async function startServer() {
  try {
    // Test database connection
    await testConnection();
  } catch (error) {
    console.error('❌ Database connection failed, exiting...');
    process.exit(1);
  }

  try {
    await runStartupMigrations();
  } catch (error) {
    console.error('❌ Startup migrations failed:', error);
    process.exit(1);
  }

  const port = parseInt(process.env.PORT || '3001');
  const hostname = process.env.HOST || '0.0.0.0';

  const server = http.createServer(app);

  server.listen(port, hostname, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📚 Swagger UI available at http://localhost:${port}/docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS Origins: ${corsOrigins.join(', ')}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    // Close database connections
    try {
      const { closeConnection } = await import('./config/database');
      await closeConnection();
      console.log('✅ Database connections closed');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
    }

    // Close server
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  return server;
}

// Start server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
