import { pool } from './config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        firebase_uid VARCHAR(128) UNIQUE,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add firebase_uid column to existing users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
    `);

    // Make password_hash nullable for Firebase-only users
    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL;
    `);

    // Add role column to existing users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));
    `);

    // Create index on email
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    // Create boards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
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
    `);

    // Create columns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS columns (
        id SERIAL PRIMARY KEY,
        board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        UNIQUE(board_id, name) -- Prevent duplicate column names per board
      );
    `);

    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
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
    `);

    // Create tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create item_tags junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, tag_id)
      );
    `);

    // Create item_users junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS item_users (
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, user_id)
      );
    `);

    // Create board_users junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS board_users (
        board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        PRIMARY KEY (board_id, user_id)
      );
    `);

    // Create invalidated_tokens table for token blacklisting
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invalidated_tokens (
        id SERIAL PRIMARY KEY,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for invalidated_tokens
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_hash ON invalidated_tokens(token_hash);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_expires_at ON invalidated_tokens(expires_at);`);

    // Create refresh_tokens table for refresh token system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for refresh_tokens
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);`);

    // Update existing boards with NULL column_theme to 'light'
    await pool.query(`
      UPDATE boards
      SET column_theme = 'light'
      WHERE column_theme IS NULL;
    `);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations();