// Database configuration for Cloudflare D1
import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  NODE_ENV?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_SERVICE_ACCOUNT_PATH?: string;
}

// Get database instance from context
export function getDatabase(env: Env): D1Database {
  return env.DB;
}

export const testConnection = async (db: D1Database): Promise<void> => {
  try {
    await db.exec('SELECT 1');
    console.log('✅ Successfully connected to D1 database');
  } catch (error) {
    console.error('❌ Failed to connect to D1 database:', (error as Error).message);
    throw error;
  }
};