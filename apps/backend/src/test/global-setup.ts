import { Pool } from 'pg';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

dotenv.config();

// Set environment variables globally BEFORE any test code runs
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/taskmanager_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';

// Test PostgreSQL container configuration
const TEST_POSTGRES_CONTAINER_NAME = 'taskmanager-test-postgres';
const TEST_POSTGRES_PORT = '5432'; // Use the default port to avoid conflicts
const TEST_POSTGRES_PASSWORD = 'password';

async function isPostgresRunning(): Promise<boolean> {
  try {
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
      connectionTimeoutMillis: 2000,
    });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function startTestPostgres(): Promise<void> {
  console.log('🐳 Starting test PostgreSQL container...');

  try {
    // Stop and remove any existing test container
    await execAsync(`docker stop ${TEST_POSTGRES_CONTAINER_NAME} 2>/dev/null || true`);
    await execAsync(`docker rm ${TEST_POSTGRES_CONTAINER_NAME} 2>/dev/null || true`);

    // Start new PostgreSQL container
    const dockerCommand = `docker run -d --name ${TEST_POSTGRES_CONTAINER_NAME} -e POSTGRES_PASSWORD=${TEST_POSTGRES_PASSWORD} -p ${TEST_POSTGRES_PORT}:5432 postgres:15`;

    const { stdout, stderr } = await execAsync(dockerCommand);
    const containerId = stdout.trim();

    console.log(`✅ PostgreSQL container started: ${containerId.substring(0, 12)}`);

    // Wait for PostgreSQL to be ready
    console.log('⏳ Waiting for PostgreSQL to be ready...');
    let retries = 30; // 30 seconds max
    while (retries > 0) {
      try {
        const testPool = new Pool({
          connectionString: `postgresql://postgres:${TEST_POSTGRES_PASSWORD}@localhost:${TEST_POSTGRES_PORT}/postgres`,
          connectionTimeoutMillis: 2000,
        });
        await testPool.query('SELECT 1');
        await testPool.end();
        console.log('✅ PostgreSQL is ready!');
        return;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('PostgreSQL failed to start within timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('❌ Failed to start PostgreSQL container:', error);
    throw error;
  }
}

async function stopTestPostgres(): Promise<void> {
  console.log('🛑 Stopping test PostgreSQL container...');
  try {
    await execAsync(`docker stop ${TEST_POSTGRES_CONTAINER_NAME} 2>/dev/null || true`);
    await execAsync(`docker rm ${TEST_POSTGRES_CONTAINER_NAME} 2>/dev/null || true`);
    console.log('✅ Test PostgreSQL container stopped');
  } catch (error) {
    console.warn('⚠️  Could not stop test PostgreSQL container:', error);
  }
}

export default async function globalSetup() {
  try {
    // Check if PostgreSQL is already running on the default port
    const postgresRunning = await isPostgresRunning();

    if (!postgresRunning) {
      console.log('📡 PostgreSQL not running, starting test instance...');
      await startTestPostgres();

      // Update connection strings to use the test container
      process.env.DATABASE_URL = `postgresql://postgres:${TEST_POSTGRES_PASSWORD}@localhost:${TEST_POSTGRES_PORT}/taskmanager_test`;
    } else {
      console.log('✅ PostgreSQL already running on port 5432');
      // Use the existing PostgreSQL instance
      process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/taskmanager_test';
    }

    // Connect to the default 'postgres' database to create/drop the test database
    const adminConnectionString = postgresRunning
      ? 'postgresql://postgres:password@localhost:5432/postgres'
      : `postgresql://postgres:${TEST_POSTGRES_PASSWORD}@localhost:${TEST_POSTGRES_PORT}/postgres`;

    const adminPool = new Pool({
      connectionString: adminConnectionString,
    });

    try {
      console.log('🔧 Global setup: Preparing test database...');

      // Drop existing test database with FORCE (don't terminate connections here as they may be from current runs)
      try {
        // Terminate all connections to the test database first
        await adminPool.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = 'taskmanager_test'
          AND pid <> pg_backend_pid();
        `).catch(() => {
          // If this fails, it's okay
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        await adminPool.query('DROP DATABASE IF EXISTS taskmanager_test WITH (FORCE)');
      } catch (error) {
        console.log('Note: Could not drop existing test database:', (error as Error).message);
      }

      // Wait to ensure database is fully dropped
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create fresh test database
      await adminPool.query('CREATE DATABASE taskmanager_test');

      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Test database created');

      // Now run migrations
      const testDatabaseUrl = process.env.DATABASE_URL;
      const testPool = new Pool({
        connectionString: testDatabaseUrl,
      });

      try {
        // Drop all tables first (shouldn't exist yet, but just in case)
        await testPool.query(`
          DROP TABLE IF EXISTS item_tags CASCADE;
          DROP TABLE IF EXISTS item_users CASCADE;
          DROP TABLE IF EXISTS board_users CASCADE;
          DROP TABLE IF EXISTS invalidated_tokens CASCADE;
          DROP TABLE IF EXISTS refresh_tokens CASCADE;
          DROP TABLE IF EXISTS items CASCADE;
          DROP TABLE IF EXISTS tasks CASCADE;
          DROP TABLE IF EXISTS columns CASCADE;
          DROP TABLE IF EXISTS tags CASCADE;
          DROP TABLE IF EXISTS boards CASCADE;
          DROP TABLE IF EXISTS users CASCADE;
        `).catch(() => {
          // Tables don't exist yet
        });

        const migrations = [
          `
            CREATE TABLE users (
              id SERIAL PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255),
              firebase_uid VARCHAR(128) UNIQUE,
              name VARCHAR(255),
              role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `CREATE INDEX idx_users_email ON users(email);`,
          `
            CREATE TABLE boards (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              background VARCHAR(255) DEFAULT 'bg-gray-50',
              column_theme VARCHAR(255) DEFAULT 'light',
              archived BOOLEAN NOT NULL DEFAULT FALSE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `
            CREATE TABLE columns (
              id SERIAL PRIMARY KEY,
              board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
              name VARCHAR(100) NOT NULL,
              position INTEGER NOT NULL DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(board_id, name)
            );
          `,
          `
            CREATE TABLE items (
              id SERIAL PRIMARY KEY,
              column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              position INTEGER NOT NULL DEFAULT 0,
              start_date TIMESTAMP WITH TIME ZONE,
              end_date TIMESTAMP WITH TIME ZONE,
              effort INTEGER CHECK (effort >= 0 AND effort <= 10),
              label TEXT,
              priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')),
              archived BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `
            CREATE TABLE tasks (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              completed BOOLEAN NOT NULL DEFAULT FALSE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `CREATE INDEX idx_tasks_completed ON tasks(completed);`,
          `CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);`,
          `CREATE INDEX idx_tasks_user_id ON tasks(user_id);`,
          `
            CREATE TABLE tags (
              id SERIAL PRIMARY KEY,
              name VARCHAR(50) NOT NULL UNIQUE,
              color VARCHAR(7) DEFAULT '#3B82F6',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `
            CREATE TABLE item_tags (
              item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
              PRIMARY KEY (item_id, tag_id)
            );
          `,
          `
            CREATE TABLE item_users (
              item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              PRIMARY KEY (item_id, user_id)
            );
          `,
          `
            CREATE TABLE board_users (
              board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              role VARCHAR(20) DEFAULT 'member',
              PRIMARY KEY (board_id, user_id)
            );
          `,
          `
            CREATE TABLE invalidated_tokens (
              id SERIAL PRIMARY KEY,
              token_hash VARCHAR(128) NOT NULL UNIQUE,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `CREATE INDEX idx_invalidated_tokens_hash ON invalidated_tokens(token_hash);`,
          `CREATE INDEX idx_invalidated_tokens_expires_at ON invalidated_tokens(expires_at);`,
          `
            CREATE TABLE refresh_tokens (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              token_hash VARCHAR(128) NOT NULL UNIQUE,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
          `CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);`,
          `CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);`,
          `CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);`,
        ];

        for (const migration of migrations) {
          await testPool.query(migration);
        }

        console.log('✅ Migrations completed');
      } finally {
        await testPool.end();
      }
    } finally {
      await adminPool.end();
    }
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Try to clean up on failure
    if (!await isPostgresRunning()) {
      await stopTestPostgres();
    }
    throw error;
  }
}

// Cleanup function for after tests complete
export async function globalTeardown() {
  console.log('🧹 Global teardown: Cleaning up test environment...');

  // Only stop the container if we started it
  if (!await isPostgresRunning()) {
    await stopTestPostgres();
  }

  console.log('✅ Test environment cleaned up');
}
